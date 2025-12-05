// case_engine.js
// Case engine with:
// - Smooth 6.5s animation
// - Skip button
// - Randomized end offset
// - Spam-click lock
// - Inventory saving
// - XP / Quests
// - Pattern system (FIXED)
// - Sounds
// - CS:GO-style inspect panel result UI (pattern formatting FIXED)

import { addInventoryItem } from "./inventory_api.js";
import { Xp } from "./xp.js";
import { supabase } from "./supabaseClient.js";
import { handleCaseOpened } from "./quests.js";
import { rollPattern, evaluatePattern } from "./patterns.js";

/* ---------------------------------------------------------
   NAME FORMATTING
--------------------------------------------------------- */
function formatFormattedName(skin, isStatTrak) {
  const rarity = skin.rarity || "";
  let name = skin.name || "";
  const parts = [];

  if (rarity === "exceedingly_rare")
    parts.push(`<span style="color:#f1c40f;">★</span>`);

  if (name.startsWith("Souvenir ")) {
    name = name.slice("Souvenir ".length);
    parts.push(`<span style="color:#f1c40f;">Souvenir</span>`);
  }

  if (isStatTrak)
    parts.push(`<span style="color:#ff9900;">StatTrak™</span>`);

  parts.push(`<span style="color:${skin.color || "#fff"}">${name}</span>`);

  return parts.join(" ");
}

/* ---------------------------------------------------------
   WEAR SYSTEM
--------------------------------------------------------- */
const WEAR_TIERS = [
  { code: "FN", label: "Factory New", min: 0.0, max: 0.07 },
  { code: "MW", label: "Minimal Wear", min: 0.07, max: 0.15 },
  { code: "FT", label: "Field-Tested", min: 0.15, max: 0.38 },
  { code: "WW", label: "Well-Worn", min: 0.38, max: 0.45 },
  { code: "BS", label: "Battle-Scarred", min: 0.45, max: 1.0 },
];

function parseRange(r) {
  if (!r) return [0, 1];
  const [a, b] = r.split("-").map(Number);
  return [Math.min(a, b), Math.max(a, b)];
}

function rollWearFloat(skin) {
  const [min, max] = parseRange(skin.float_range);

  const allowed = WEAR_TIERS.filter(t => t.max > min && t.min < max);
  const tier = allowed[Math.floor(Math.random() * allowed.length)];

  const low = Math.max(tier.min, min);
  const high = Math.min(tier.max, max);

  const fv = low + Math.random() * (high - low);

  return {
    wearLabel: tier.label,
    wearCode: tier.code,
    floatValue: fv.toFixed(9)
  };
}

/* ---------------------------------------------------------
   XP
--------------------------------------------------------- */
function computeXp(skin, caseCost) {
  let xp = caseCost * 0.5;
  if (skin.rarity === "classified") xp += 20;
  if (skin.rarity === "covert") xp += 100;
  if (skin.rarity === "exceedingly_rare") xp += 500;
  return xp;
}

/* ---------------------------------------------------------
   SOUNDS
--------------------------------------------------------- */
const sounds = {
  open: new Audio("sounds/case_open_whoosh.mp3"),
  tick: new Audio("sounds/case_tick.mp3"),
  land: new Audio("sounds/case_land.mp3"),
  rare: new Audio("sounds/case_rare.mp3"),
  stattrak: new Audio("sounds/case_stattrak.mp3"),
};

function safePlay(a) {
  if (!a) return;
  try { a.currentTime = 0; a.play().catch(()=>{}); } catch(e){}
}

/* ---------------------------------------------------------
   MAIN ENGINE
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

  const openBtn = document.getElementById(elements.openBtnId);
  const skipBtn = document.getElementById(elements.skipBtnId);
  const strip = document.getElementById(elements.stripId);
  const wrap = document.getElementById(elements.stripWrapId);
  const resultEl = document.getElementById(elements.resultId);

  let skinsData = null;
  let currentWinner = null;
  let isSpinning = false;
  let locked = false;
  let skipped = false;
  let spinTimeout = null;
  let tickInterval = null;
  let lastOffset = 0;

  openBtn.disabled = true;

  /* LOAD SKINS */
  (async () => {
    const res = await fetch("skins.json");
    const data = await res.json();
    skinsData = data[skinsJsonKey];
    openBtn.disabled = false;
  })();

  /* PICK RARITY & SKIN */
  function pickRarity(includeGold = true) {
    const pool = includeGold ? rarities : rarities.filter(r => r.name !== goldRarityName);
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
    const list = skinsData[rarity.name];
    const base = list[Math.floor(Math.random() * list.length)];

    return { ...base, rarity: rarity.name, color: rarity.color };
  }

  /* STRIP BUILD */
  function buildStrip(winner) {
    strip.innerHTML = "";

    let mystery = "images/mystery.png";
    if (skinsJsonKey === "kilowatt") mystery = "images/mystery_kukri.png";
    if (skinsJsonKey === "fever") mystery = "images/mystery_fever.png";
    if (skinsJsonKey === "cs20") mystery = "images/mystery_classic.webp";
    if (skinsJsonKey === "gallery") mystery = "images/mystery_kukri.webp";

    for (let i = 0; i < stripLength; i++) {
      const tile = document.createElement("div");
      tile.className = "tile";

      const isWin = i === winnerIndex;
      const skin = isWin ? winner : pickSkin(false);

      tile.style.backgroundColor = skin.color;
      tile.style.backgroundImage =
        isWin && skin.rarity === goldRarityName
          ? `url('${mystery}')`
          : `url(${skin.image})`;

      strip.appendChild(tile);
    }
  }

  function getTileStep() {
    const t = strip.querySelector(".tile");
    if (!t) return 90;
    const cs = getComputedStyle(t);
    return t.offsetWidth + parseFloat(cs.marginRight);
  }

  /* SPIN SOUND */
  function startTicks() {
    stopTicks();
    tickInterval = setInterval(() => {
      if (!isSpinning) return;
      safePlay(sounds.tick);
    }, 80);
  }

  function stopTicks() {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  }

  /* ANIMATION */
  function animateStrip() {
    const step = getTileStep();

    const safe = 0.05 * step;
    lastOffset = Math.random() * (step - 2 * safe) - (step / 2 - safe);

    const target =
      -winnerIndex * step +
      (wrap.offsetWidth / 2 - step / 2) +
      lastOffset;

    strip.classList.add("strip-rolling");
    isSpinning = true;
    startTicks();

    strip.style.transition = "transform 6500ms cubic-bezier(0.0,0.52,0.22,1)";
    strip.style.transform = `translateX(${target}px)`;

    spinTimeout = setTimeout(() => finalizeSpin().catch(console.error), 6550);
  }

  /* PRICE */
  function computePrice(skin, wearCode, st) {
    if (skin.name.includes("Vanilla"))
      return Number((skin.fixed_price || 0).toFixed(2));

    const base = Number(skin.price?.[wearCode] || 0);
    return Number((st ? base * 1.5 : base).toFixed(2));
  }

  /* FINALIZE */
  async function finalizeSpin() {
    isSpinning = false;
    locked = false;
    skipped = false;

    stopTicks();
    strip.classList.remove("strip-rolling");

    skipBtn.style.display = "none";
    openBtn.style.display = "inline-block";

    /* WEAR */
    let wearLabel = "No Wear";
    let wearCode = "NONE";
    let floatValue = "0.000000000";
    let isST = false;

    const isVanilla = currentWinner.name.toLowerCase().includes("vanilla");

    if (!isVanilla) {
      const w = rollWearFloat(currentWinner);
      wearLabel = w.wearLabel;
      wearCode = w.wearCode;
      floatValue = w.floatValue;

      isST = currentWinner.stattrak_available && Math.random() < 0.1;
      if (isST) safePlay(sounds.stattrak);
    }

    /* ----- PATTERN SYSTEM (no patterns for Vanilla) ----- */
    let pattern = null;
    let patternTag = null;
    let patternColor = null;
    let patternMultiplier = 1;

    if (!isVanilla) {
      pattern = rollPattern();

      const patternData = evaluatePattern(currentWinner.name, pattern);

      patternTag = patternData.tag;
      patternColor = patternData.color || "#ffd700";
      patternMultiplier = patternData.multiplier || 1;  // ✔ ALWAYS correct
    }


    /* PRICE */
    const basePrice = computePrice(currentWinner, wearCode, isST);
    const finalPrice = Number((basePrice * patternMultiplier).toFixed(2));

    /* SOUND */
    const isGold = currentWinner.rarity === "exceedingly_rare";
    const isSpecialPattern = !!patternTag;

    safePlay(isGold || isSpecialPattern ? sounds.rare : sounds.land);

    /* NAME + RARITY */
    const nameHTML = formatFormattedName(currentWinner, isST);

    const rarityText = currentWinner.rarity
      .replace("consumer", "Consumer")
      .replace("industrial", "Industrial")
      .replace("mil_spec", "Mil-Spec")
      .replace("restricted", "Restricted")
      .replace("classified", "Classified")
      .replace("covert", "Covert")
      .replace("exceedingly_rare", "Exceedingly Rare");

    const rClass = `rarity-pill rarity-${currentWinner.rarity}`;

    /* INSPECT PANEL — FIXED PATTERN FORMAT */
    let patternLines = "";

    if (!isVanilla && pattern) {
      if (patternTag) {
      patternLines = `
        <div class="inspect-stat-line">
          <span class="label">Pattern Index</span>
          <span class="pattern-val">
            <span class="pattern-tag" style="color:${patternColor};">
              ${patternTag}
            </span>
            <span class="pattern-bullet">•</span>
            <span class="pattern-number">#${pattern}</span>
          </span>
        </div>
      `;

      } else {
        patternLines = `
          <div class="inspect-stat-line">
            <span class="label">Pattern Index</span>
            <span>#${pattern}</span>
          </div>
        `;
      }
    }

    const exteriorLine = !isVanilla
      ? `<div class="inspect-stat-line"><span class="label">Exterior</span><span>${wearLabel}</span></div>`
      : "";

    const floatLine = !isVanilla
      ? `<div class="inspect-stat-line"><span class="label">Float Value</span><span>${floatValue}</span></div>`
      : "";

    const valueLine = `
      <div class="inspect-stat-line">
        <span class="label">Estimated Value</span>
        <span class="inspect-price">${Money.format(finalPrice)}</span>
      </div>
    `;

    /* RENDER RESULT */
    resultEl.innerHTML = `
      <div class="inspect-card">
        <div class="inspect-header">
          <div class="inspect-title">${nameHTML}</div>
          <div class="${rClass}">${rarityText}</div>
        </div>

        <div class="inspect-body">
          <div class="inspect-image-wrapper rarity-frame-${currentWinner.rarity}">
            <img src="${currentWinner.image}">
          </div>

          <div class="inspect-stats">
            ${exteriorLine}
            ${floatLine}
            ${patternLines}
            ${valueLine}
          </div>
        </div>
      </div>
    `;

    resultEl.style.opacity = 1;

    /* SAVE INVENTORY ITEM */
    addInventoryItem(uid, {
      name: currentWinner.name,
      image: currentWinner.image,
      wear: wearLabel,
      float: floatValue,
      price: finalPrice,
      color: currentWinner.color,
      stattrak: isST,
      rarity: currentWinner.rarity,
      pattern,
      pattern_note: patternTag || null,
      pattern_color: patternColor
    });

    /* XP */
    try {
      const gained = computeXp(currentWinner, caseCost);
      await Xp.add(uid, gained);
    } catch (e) {}

    /* QUESTS */
    try {
      const isGloves = currentWinner.name.toLowerCase().includes("gloves");
      await handleCaseOpened({
        caseId: skinsJsonKey,
        caseName: skinsJsonKey,
        casePrice: Number(caseCost),
        itemRarity: currentWinner.rarity,
        itemValue: finalPrice,
        isGloves,
      });
    } catch (e) {}
  }

  /* BUTTON HANDLERS */
  openBtn.addEventListener("click", async () => {
    if (isSpinning || locked || !skinsData) return;
    locked = true;

    try {
      const balance = await Money.get(uid);
      if (balance < caseCost) {
        locked = false;
        return alert("Not enough funds!");
      }

      const { error } = await supabase.rpc("safe_withdraw", {
        p_uid: uid,
        p_amount: caseCost,
      });

      if (error) {
        locked = false;
        return alert("Unable to open case.");
      }

      if (onBalanceChange) {
        const newB = await Money.get(uid);
        onBalanceChange(newB);
      }

      safePlay(sounds.open);

      currentWinner = pickSkin(true);

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
    } catch (e) {
      locked = false;
    }
  });

  skipBtn.addEventListener("click", () => {
    if (!isSpinning || skipped) return;
    skipped = true;

    clearTimeout(spinTimeout);

    const step = getTileStep();
    const target =
      -winnerIndex * step +
      (wrap.offsetWidth / 2 - step / 2) +
      lastOffset;

    const matrix = new DOMMatrixReadOnly(window.getComputedStyle(strip).transform);
    const currentX = matrix.m41;

    strip.style.transition = "none";
    strip.style.transform = `translateX(${currentX}px)`;
    void strip.offsetWidth;

    strip.style.transition = "transform 300ms linear";
    strip.style.transform = `translateX(${target}px)`;

    setTimeout(() => finalizeSpin().catch(console.error), 320);
  });
}
