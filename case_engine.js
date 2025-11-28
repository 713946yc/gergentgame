// case_engine.js
// Fully stable CSGORoll-style case engine with XP system
// Features:
// - 6.5s smooth spin animation
// - Skip button fast-forward
// - Random stop anywhere inside winner tile
// - No spam clicks
// - No second-spin freeze bug
// - Inventory saving via Supabase
// - XP/Level system

import { addInventoryItem } from "./inventory_api.js";
import { Xp } from "./xp.js";
import { supabase } from "./supabaseClient.js";
import { handleCaseOpened } from "./quests.js";

/* ---------------------------------------------------------
   NAME FORMATTING
--------------------------------------------------------- */
function formatFormattedName(skin, isStatTrak) {
  const rarity = skin.rarity || "";
  let name = skin.name || "";
  const parts = [];

  if (rarity === "exceedingly_rare") {
    parts.push(`<span style="color:#f1c40f;">★</span>`);
  }

  if (name.startsWith("Souvenir ")) {
    name = name.slice("Souvenir ".length);
    parts.push(`<span style="color:#f1c40f;">Souvenir</span>`);
  }

  if (isStatTrak) {
    parts.push(`<span style="color:#ff9900;">StatTrak™</span>`);
  }

  parts.push(`<span style="color:${skin.color || "#fff"}">${name}</span>`);

  return parts.join(" ");
}

/* ---------------------------------------------------------
   FLOAT & WEAR ROLLS
--------------------------------------------------------- */
const WEAR_TIERS = [
  { code: "FN", label: "Factory New", min: 0.0, max: 0.07 },
  { code: "MW", label: "Minimal Wear", min: 0.07, max: 0.15 },
  { code: "FT", label: "Field-Tested", min: 0.15, max: 0.38 },
  { code: "WW", label: "Well-Worn", min: 0.38, max: 0.45 },
  { code: "BS", label: "Battle-Scarred", min: 0.45, max: 1.0 },
];

function parseRange(str) {
  if (!str) return [0, 1];
  const [a, b] = str.split("-").map(Number);
  return [Math.min(a, b), Math.max(a, b)];
}

function rollWearFloat(skin) {
  const [minF, maxF] = parseRange(skin.float_range);
  const allowed = WEAR_TIERS.filter((t) => t.max > minF && t.min < maxF);
  const tier = allowed[Math.floor(Math.random() * allowed.length)];

  const low = Math.max(tier.min, minF);
  const high = Math.min(tier.max, maxF);

  const floatVal = low + Math.random() * (high - low);

  return {
    wearLabel: tier.label,
    wearCode: tier.code,
    floatValue: floatVal.toFixed(9),
  };
}

/* ---------------------------------------------------------
   XP CALCULATION
--------------------------------------------------------- */
function computeXp(skin, caseCost) {
  let xp = caseCost * 0.1;
  if (skin.rarity === "classified") xp += 2;
  if (skin.rarity === "covert") xp += 15;
  if (skin.rarity === "exceedingly_rare") xp += 50;
  return xp;
}

/* ---------------------------------------------------------
   MAIN CASE ENGINE
--------------------------------------------------------- */
export function initCasePage(options) {
  const {
    uid,
    Money,
    caseCost,
    skinsJsonKey,
    rarities,
    elements,
    stripLength = 100,
    winnerIndex = 80,
    goldRarityName = "exceedingly_rare",
    onBalanceChange,
  } = options;

  // Use skinsJsonKey as a "case name" for quests/achievements
  // e.g. "kilowatt", "cs20", "fever", "dreamsandnightmares",
  // "dreamhack_2014_cobblestone_souvenir", "snakebite", "recoil", "revolution", "glove"
  const caseName = skinsJsonKey;

  const openBtn = document.getElementById(elements.openBtnId);
  const skipBtn = document.getElementById(elements.skipBtnId);
  const strip = document.getElementById(elements.stripId);
  const wrap = document.getElementById(elements.stripWrapId);
  const resultEl = document.getElementById(elements.resultId);

  let skinsData = null;
  let currentWinner = null;
  let isSpinning = false;
  let actionLocked = false;
  let skipped = false;
  let spinTimeout = null;
  let lastOffset = 0;

  // Disable button until skins are loaded
  openBtn.disabled = true;

  /* Load Skins */
  (async () => {
    const res = await fetch("skins.json");
    const json = await res.json();
    skinsData = json[skinsJsonKey];
    openBtn.disabled = false; // enable button
  })();

  /* ---------------- Random Skin Picking ---------------- */
  function pickRarity(includeGold = true) {
    let pool = includeGold
      ? rarities
      : rarities.filter((r) => r.name !== goldRarityName);
    let total = pool.reduce((s, r) => s + r.weight, 0);

    let roll = Math.random() * total;
    for (const r of pool) {
      roll -= r.weight;
      if (roll <= 0) return r;
    }
    return pool[pool.length - 1];
  }

  function pickSkin(includeGold = true) {
    const rarity = pickRarity(includeGold);
    const pool = skinsData[rarity.name];
    const base = pool[Math.floor(Math.random() * pool.length)];

    return {
      ...base,
      rarity: rarity.name,
      color: rarity.color,
    };
  }

  function buildStrip(winnerSkin) {
    strip.innerHTML = "";

    let mysteryImg = "images/mystery.png";

    if (skinsJsonKey === "kilowatt")
      mysteryImg = "images/mystery_kukri.png";
    else if (skinsJsonKey === "fever")
      mysteryImg = "images/mystery_fever.png";
    else if (skinsJsonKey === "cs20")
      mysteryImg = "images/mystery_classic.webp";

    for (let i = 0; i < stripLength; i++) {
      const tile = document.createElement("div");
      tile.className = "tile";

      const isWinner = i === winnerIndex;
      const skin = isWinner ? winnerSkin : pickSkin(false);

      tile.style.backgroundColor = skin.color;

      if (isWinner && skin.rarity === goldRarityName) {
        tile.style.backgroundImage = `url('${mysteryImg}')`;
      } else {
        tile.style.backgroundImage = `url(${skin.image})`;
      }

      strip.appendChild(tile);
    }
  }

  function getTileStep() {
    const t = strip.querySelector(".tile");
    if (!t) return 90;
    const cs = getComputedStyle(t);
    return t.offsetWidth + parseFloat(cs.marginRight);
  }

  /* ---------------- Spin Animation ---------------- */
  function animateStrip() {
    const step = getTileStep();

    const safeMargin = 0.05 * step;
    lastOffset =
      Math.random() * (step - 2 * safeMargin) -
      (step / 2 - safeMargin);

    const targetX =
      -winnerIndex * step +
      (wrap.offsetWidth / 2 - step / 2) +
      lastOffset;

    strip.style.transition =
      "transform 6500ms cubic-bezier(0.0, 0.52, 0.22, 1)";
    strip.style.transform = `translateX(${targetX}px)`;

    spinTimeout = setTimeout(
      () => finalizeSpin().catch(console.error),
      6550
    );
  }

  /* ---------------- Finalize Spin ---------------- */
  function computePrice(skin, wearCode, stattrak) {
    if (skin.name.includes("Vanilla")) {
      const base = Number(skin.fixed_price || 0);
      return Number(base.toFixed(2));
    }
    const base = Number(skin.price?.[wearCode] || 0);
    return Number(
      (stattrak ? base * 1.5 : base).toFixed(2)
    );
  }

  async function finalizeSpin() {
    isSpinning = false;
    actionLocked = false;
    skipped = false;

    skipBtn.style.display = "none";
    openBtn.style.display = "inline-block";

    let wearLabel = "No Wear";
    let wearCode = "NONE";
    let floatValue = "0.000000000";
    let isST = false;

    if (!currentWinner.name.includes("Vanilla")) {
      const roll = rollWearFloat(currentWinner);
      wearLabel = roll.wearLabel;
      wearCode = roll.wearCode;
      floatValue = roll.floatValue;

      isST =
        currentWinner.stattrak_available &&
        Math.random() < 0.1;
    }

    const price = computePrice(
      currentWinner,
      wearCode,
      isST
    );
    const nameHTML = formatFormattedName(
      currentWinner,
      isST
    );

    if (currentWinner.name.includes("Vanilla")) {
      resultEl.innerHTML = `
                <div class="title">${nameHTML}</div>
                <div>Value: <b>${Money.format(
                  price
                )}</b></div>
                <img src="${
                  currentWinner.image
                }"
                    style="border:3px solid ${
                      currentWinner.color
                    };
                           border-radius:6px; margin-top:10px;">
            `;
    } else {
      resultEl.innerHTML = `
                <div class="title">${nameHTML}</div>
                <div>Wear: <b>${wearLabel}</b> | Float: <b>${floatValue}</b> | Value: <b>${Money.format(
        price
      )}</b></div>
                <img src="${
                  currentWinner.image
                }"
                    style="border:3px solid ${
                      currentWinner.color
                    };
                           border-radius:6px; margin-top:10px;">
            `;
    }

    resultEl.style.opacity = 1;

    // Add to inventory
    addInventoryItem(uid, {
      name: currentWinner.name,
      image: currentWinner.image,
      wear: wearLabel,
      float: floatValue,
      price,
      color: currentWinner.color,
      stattrak: isST,
      rarity: currentWinner.rarity,
    });

    // Add XP
    try {
      const xpGained = computeXp(currentWinner, caseCost);
      await Xp.add(uid, xpGained);
      console.log(`User ${uid} gained ${xpGained} XP!`);
    } catch (err) {
      console.error("XP addition failed:", err);
    }

    try {
      // Detect if this drop is some kind of gloves / hand wraps
      const name = (currentWinner.name || "").toLowerCase();
      const isGloves =
        name.includes("gloves") || name.includes("hand wraps");

      console.log("QUEST HOOK FIRED", {
        caseName,
        casePrice: Number(caseCost),
        itemRarity: currentWinner.rarity,
        itemValue: price,
        isGloves,
      });

      await handleCaseOpened({
        caseId: caseName,        // add this line
        caseName: caseName,
        casePrice: Number(caseCost),
        itemRarity: currentWinner.rarity,
        itemValue: price,
        isGloves,
      });

    } catch (err) {
      console.error("Quest tracking failed:", err);
    }



  }

  /* ---------------------------------------------------------
     BUTTON HANDLERS
  --------------------------------------------------------- */
  openBtn.addEventListener("click", async () => {
    if (isSpinning || actionLocked || !skinsData) return;

    actionLocked = true;

    try {
      const balance = await Money.get(uid);
      if (balance < caseCost) {
        actionLocked = false;
        return alert("Not enough funds!");
      }

      const { error } = await supabase.rpc(
        "safe_withdraw",
        {
          p_uid: uid,
          p_amount: caseCost,
        }
      );

      if (error) {
        console.error(
          "Withdrawal failed:",
          error.message
        );
        alert(
          "Unable to open case — insufficient funds."
        );
        actionLocked = false;
        return;
      }

      // ✅ Update UI balance correctly
      if (onBalanceChange) {
        const newBalance = await Money.get(uid);
        onBalanceChange(newBalance);
      }

      currentWinner = pickSkin(true);

      // Reset spin
      strip.style.transition = "none";
      strip.style.transform = "translateX(0px)";
      void strip.offsetWidth;

      buildStrip(currentWinner);

      strip.style.transition = "none";
      strip.style.transform = "translateX(0px)";
      void strip.offsetWidth;

      resultEl.style.opacity = 0;
      openBtn.style.display = "none";
      skipBtn.style.display = "inline-block";

      isSpinning = true;
      animateStrip();
    } catch (err) {
      console.error("Error opening case:", err);
      actionLocked = false;
    }
  });

  skipBtn.addEventListener("click", () => {
    if (!isSpinning || skipped) return;
    skipped = true;

    clearTimeout(spinTimeout);

    const step = getTileStep();
    const targetX =
      -winnerIndex * step +
      (wrap.offsetWidth / 2 - step / 2) +
      lastOffset;

    const computed =
      window.getComputedStyle(strip).transform;
    let currentX = 0;
    if (computed !== "none") {
      const matrix = new DOMMatrixReadOnly(computed);
      currentX = matrix.m41;
    }

    strip.style.transition = "none";
    strip.style.transform = `translateX(${currentX}px)`;
    void strip.offsetWidth;

    strip.style.transition = "transform 300ms linear";
    strip.style.transform = `translateX(${targetX}px)`;

    setTimeout(
      () => finalizeSpin().catch(console.error),
      320
    );
  });
}
