// case_engine.js
// Fully stable CSGORoll-style case engine
// Features:
// - 6.5s smooth spin animation
// - Skip button fast-forward
// - Random stop anywhere inside winner tile
// - No spam clicks
// - No second-spin freeze bug
// - Inventory saving via Supabase

import { addInventoryItem } from "./inventory_api.js";

/* ---------------------------------------------------------
   NAME FORMATTING
--------------------------------------------------------- */
function formatFormattedName(skin, isStatTrak) {
    const rarity = skin.rarity || "";
    let name = skin.name || "";
    const parts = [];

    // ★ for Exceedingly Rare
    if (rarity === "exceedingly_rare") {
        parts.push(`<span style="color:#f1c40f;">★</span>`);
    }

    // Souvenir prefix
    if (name.startsWith("Souvenir ")) {
        name = name.slice("Souvenir ".length);
        parts.push(`<span style="color:#f1c40f;">Souvenir</span>`);
    }

    // StatTrak prefix
    if (isStatTrak) {
        parts.push(`<span style="color:#ff9900;">StatTrak™</span>`);
    }

    // Main name
    parts.push(`<span style="color:${skin.color || "#fff"}">${name}</span>`);

    return parts.join(" ");
}

/* ---------------------------------------------------------
   FLOAT & WEAR ROLLS
--------------------------------------------------------- */
const WEAR_TIERS = [
    { code: "FN", label: "Factory New",    min: 0.00, max: 0.07 },
    { code: "MW", label: "Minimal Wear",   min: 0.07, max: 0.15 },
    { code: "FT", label: "Field-Tested",   min: 0.15, max: 0.38 },
    { code: "WW", label: "Well-Worn",      min: 0.38, max: 0.45 },
    { code: "BS", label: "Battle-Scarred", min: 0.45, max: 1.00 }
];

function parseRange(str) {
    if (!str) return [0, 1];
    const [a, b] = str.split("-").map(Number);
    return [Math.min(a, b), Math.max(a, b)];
}

function rollWearFloat(skin) {
    const [minF, maxF] = parseRange(skin.float_range);
    const allowed = WEAR_TIERS.filter(t => t.max > minF && t.min < maxF);
    const tier = allowed[Math.floor(Math.random() * allowed.length)];

    const low = Math.max(tier.min, minF);
    const high = Math.min(tier.max, maxF);

    const floatVal = low + Math.random() * (high - low);

    return {
        wearLabel: tier.label,
        wearCode: tier.code,

        // 9 decimal places, accurate, CS2 style
        floatValue: floatVal.toFixed(9)
    };

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
        onBalanceChange
    } = options;

    const openBtn  = document.getElementById(elements.openBtnId);
    const skipBtn  = document.getElementById(elements.skipBtnId);
    const strip    = document.getElementById(elements.stripId);
    const wrap     = document.getElementById(elements.stripWrapId);
    const resultEl = document.getElementById(elements.resultId);

    let skinsData = null;
    let currentWinner = null;

    let isSpinning = false;
    let actionLocked = false;
    let skipped = false;
    let spinTimeout = null;

    let lastOffset = 0;

    /* Load Skins */
    (async () => {
        const res = await fetch("skins.json");
        const json = await res.json();
        skinsData = json[skinsJsonKey];
    })();

    /* ---------------- Random Skin Picking ---------------- */
    function pickRarity(includeGold = true) {
        let pool = includeGold ? rarities : rarities.filter(r => r.name !== goldRarityName);
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
            color: rarity.color
        };
    }

    function buildStrip(winnerSkin) {
        strip.innerHTML = "";

        // Default mystery image
        let mysteryImg = "images/mystery.png";

        // Case-specific mystery images
        if (skinsJsonKey === "kilowatt") {
            mysteryImg = "images/mystery_kukri.png";
        } 
        else if (skinsJsonKey === "fever") {
            mysteryImg = "images/mystery_fever.png";
        }

        for (let i = 0; i < stripLength; i++) {
            const tile = document.createElement("div");
            tile.className = "tile";

            const isWinner = i === winnerIndex;
            const skin = isWinner ? winnerSkin : pickSkin(false);

            tile.style.backgroundColor = skin.color;

            // Exceedingly rare winner → show mystery image (custom per case)
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

        // random landing anywhere inside tile
        lastOffset = (Math.random() * step) - (step / 2);

        const targetX =
            (-winnerIndex * step) +
            (wrap.offsetWidth / 2 - step / 2) +
            lastOffset;

        strip.style.transition = "transform 6500ms cubic-bezier(0.0, 0.52, 0.22, 1)";
        strip.style.transform  = `translateX(${targetX}px)`;

        spinTimeout = setTimeout(() => finalizeSpin(), 6550);
    }

    /* ---------------- Finalize Spin ---------------- */
    function computePrice(skin, wearCode, stattrak) {
        const base = Number(skin.price?.[wearCode] || 0);
        return Number((stattrak ? base * 1.5 : base).toFixed(2));
    }

    function finalizeSpin() {
        isSpinning = false;
        actionLocked = false;
        skipped = false;

        skipBtn.style.display = "none";
        openBtn.style.display = "inline-block";

        const { wearLabel, wearCode, floatValue } = rollWearFloat(currentWinner);
        const isST = currentWinner.stattrak_available && Math.random() < 0.10;
        const price = computePrice(currentWinner, wearCode, isST);

        const nameHTML = formatFormattedName(currentWinner, isST);

        resultEl.innerHTML = `
            <div class="title">${nameHTML}</div>
            <div>
                Wear: <b>${wearLabel}</b> |
                Float: <b>${floatValue}</b> |
                Value: <b>${Money.format(price)}</b>
            </div>
            <img src="${currentWinner.image}"
                style="border:3px solid ${currentWinner.color};
                       border-radius:6px; margin-top:10px;">
        `;
        resultEl.style.opacity = 1;

        addInventoryItem(uid, {
            name: currentWinner.name,
            image: currentWinner.image,
            wear: wearLabel,
            float: floatValue,
            price,
            color: currentWinner.color,
            stattrak: isST,
            rarity: currentWinner.rarity
        });
    }

    /* ---------------------------------------------------------
       BUTTON HANDLERS
    --------------------------------------------------------- */
    openBtn.addEventListener("click", async () => {
        if (isSpinning || actionLocked || !skinsData) return;

        actionLocked = true;

        const balance = await Money.get(uid);
        if (balance < caseCost) {
            actionLocked = false;
            return alert("Not enough funds!");
        }

        await Money.sub(uid, caseCost);
        if (onBalanceChange) onBalanceChange();

        // pick winner
        currentWinner = pickSkin(true);

        // *** IMPORTANT: FULL SPIN RESET ***
        strip.style.transition = "none";
        strip.style.transform  = "translateX(0px)";
        void strip.offsetWidth;

        buildStrip(currentWinner);

        // reset again after tiles exist
        strip.style.transition = "none";
        strip.style.transform  = "translateX(0px)";
        void strip.offsetWidth;

        resultEl.style.opacity = 0;

        openBtn.style.display = "none";
        skipBtn.style.display = "inline-block";

        isSpinning = true;
        animateStrip();
    });

    skipBtn.addEventListener("click", () => {
        if (!isSpinning || skipped) return;
        skipped = true;

        clearTimeout(spinTimeout);

        const step = getTileStep();
        const targetX =
            (-winnerIndex * step) +
            (wrap.offsetWidth / 2 - step / 2) +
            lastOffset;

        // get current position
        const computed = window.getComputedStyle(strip).transform;
        let currentX = 0;
        if (computed !== "none") {
            const matrix = new DOMMatrixReadOnly(computed);
            currentX = matrix.m41;
        }

        // force stop at current frame
        strip.style.transition = "none";
        strip.style.transform  = `translateX(${currentX}px)`;
        void strip.offsetWidth;

        // fast-forward to final target
        strip.style.transition = "transform 300ms linear";
        strip.style.transform  = `translateX(${targetX}px)`;

        setTimeout(() => finalizeSpin(), 320);
    });
}
