// recoil.js OR recoil.js OR any other case file
let skinsData = null;

async function loadSkins() {
    try {
        const response = await fetch('skins.json');
        const data = await response.json();
        skinsData = data.recoil;        // ← change to data.recoil for recoil case, etc.
    } catch (e) {
        console.error("Error loading skins:", e);
        alert("Could not load case data!");
    }
}
loadSkins();

const RARITIES = [
    { name: 'mil_spec',         weight: 79.92, color: '#4a90e2' },
    { name: 'restricted',       weight: 15.98, color: '#9b59b6' },
    { name: 'classified',       weight: 3.20,  color: '#ff4dafff' },
    { name: 'covert',           weight: 0.64,  color: '#e9331fff' },
    { name: 'exceedingly_rare', weight: 0.26,  color: '#f1c40f' }
];

const TOTAL_WEIGHT = RARITIES.reduce((s, r) => s + r.weight, 0);
const MYSTERY_IMAGE = 'images/mystery.png';

const openBtn = document.getElementById('openBtn');
const skipBtn = document.getElementById('skipBtn');
const strip = document.getElementById('strip');
const centerLine = document.getElementById('centerLine');
const resultEl = document.getElementById('result');
const CASE_COST = 2.25; // 2.25 for recoil

const TILE_WIDTH = 86, TILE_GAP = 4, TILE_TOTAL = TILE_WIDTH + TILE_GAP;
const STRIP_LENGTH = 100, WINNER_INDEX = 80;
const CENTER_OFFSET = () => (document.getElementById('stripWrap').offsetWidth / 2) - (TILE_WIDTH / 2);
const DURATION = 7000, EASING = 'cubic-bezier(0.0, 0.5, 0.2, 1)';

let skip = false, winnerData = null;

// Function to get a skin that is NOT exceedingly rare (for filler)
function getRandomNonGoldSkin() {
    if (!skinsData) return null;
    
    // Filter out the 'exceedingly_rare' entry
    const nonGoldRarities = RARITIES.filter(r => r.name !== 'exceedingly_rare');
    const nonGoldTotalWeight = nonGoldRarities.reduce((s, r) => s + r.weight, 0);
    
    if (nonGoldTotalWeight === 0) return getRandomSkin(); // Fallback if no non-gold exists

    let roll = Math.random() * nonGoldTotalWeight;
    let rarity = nonGoldRarities[0];
    
    for (const r of nonGoldRarities) { 
        roll -= r.weight; 
        if (roll < 0) { 
            rarity = r; 
            break; 
        } 
    }
    
    const pool = skinsData[rarity.name];
    if (!pool || pool.length === 0) return null;
    const skin = pool[Math.floor(Math.random() * pool.length)];
    return { ...skin, color: rarity.color, rarity: rarity.name };
}


function getRandomSkin() {
    if (!skinsData) return null;
    let roll = Math.random() * TOTAL_WEIGHT;
    let rarity = RARITIES[0];
    for (const r of RARITIES) { roll -= r.weight; if (roll < 0) { rarity = r; break; } }
    const pool = skinsData[rarity.name];
    if (!pool || pool.length === 0) return null;
    const skin = pool[Math.floor(Math.random() * pool.length)];
    return { ...skin, color: rarity.color, rarity: rarity.name };
}

function refreshMoney() {
    const el = document.getElementById('moneyAmount');
    if (el) el.textContent = Money.format(Money.get());
}
Money.onChange(refreshMoney);
refreshMoney();

openBtn.addEventListener('click', () => {
    if (Money.get() < CASE_COST) { alert("Not enough money!"); return; }
    Money.sub(CASE_COST);
    refreshMoney();
    openBtn.style.display = 'none';
    skipBtn.style.display = 'inline-block';
    centerLine.style.display = 'block';
    resultEl.style.opacity = 0;
    startSpin();
});

skipBtn.addEventListener('click', () => { skip = true; if (winnerData) skipSpin(winnerData); });

function resetStrip() {
    strip.style.transition = 'none';
    strip.style.transform = 'translateX(0px)';
    strip.innerHTML = '';
    void strip.offsetWidth;
}

function startSpin() {
    resetStrip();
    skip = false;
    const winner = getRandomSkin();
    if (!winner) return;
    winnerData = winner;

    for (let i = 0; i < STRIP_LENGTH; i++) {
        let skin;

        // 1. Determine the skin for the tile
        if (i === WINNER_INDEX) {
            skin = winner;
        } else {
            // Use a filler skin that CANNOT be Exceedingly Rare (Gold)
            skin = getRandomNonGoldSkin();
            if (!skin) { // Safety check
                skin = getRandomSkin(); 
            }
        }
        
        let img = skin.image;
        let color = skin.color;
        
        // 2. Hide the actual winner's image behind the MYSTERY_IMAGE if it's Exceedingly Rare (Gold).
        // This makes the Gold item a surprise, which is the desired CS2 behavior.
        if (i === WINNER_INDEX && winner.rarity === 'exceedingly_rare') {
            img = MYSTERY_IMAGE;
            // The color remains the gold color of the winner
        }

        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.backgroundImage = `url(${img})`;
        tile.style.backgroundColor = color;
        strip.appendChild(tile);
    }

    // --- 👇 THIS IS THE NEW LOGIC FOR RANDOM TILE ENDING 👇 ---
    // 1. Calculate the initial target position (center of the winning tile)
    const centerTarget = -(WINNER_INDEX * TILE_TOTAL) + CENTER_OFFSET();

    // 2. Calculate a random offset within the width of a single tile (TILE_WIDTH)
    // The offset should be from the left edge of the winning tile to the right edge.
    // We subtract half the tile width (TILE_WIDTH / 2) from the random value (0 to TILE_WIDTH) 
    // because the `centerTarget` is already positioning the strip relative to the center of the tile.
    const randomOffset = (Math.random() * TILE_WIDTH) - (TILE_WIDTH / 2);

    // 3. Apply the random offset to the center target
    const finalTargetX = centerTarget + randomOffset;
    // --- 👆 END OF NEW LOGIC 👆 ---

    strip.style.transition = `transform ${DURATION}ms ${EASING}`;
    strip.style.transform = `translateX(${finalTargetX}px)`; // Use finalTargetX
    strip.ontransitionend = () => { if (!skip) stopSpin(winnerData); };
}

function skipSpin(winner) {
    // SPEED-UP instead of instant skip
    const FAST_DURATION = 200; // super fast (0.3 sec)
    
    strip.style.transition = `transform ${FAST_DURATION}ms linear`;

    // Move to the same final target as normal spin
    const centerTarget = -(WINNER_INDEX * TILE_TOTAL) + CENTER_OFFSET();
    const randomOffset = (Math.random() * TILE_WIDTH) - (TILE_WIDTH / 2);
    const finalTargetX = centerTarget + randomOffset;

    strip.style.transform = `translateX(${finalTargetX}px)`;

    strip.ontransitionend = () => stopSpin(winner);
}

function stopSpin(winnerSkin) {
    skipBtn.style.display = 'none';
    // REMOVE THIS LINE:
    // centerLine.style.display = 'none'; 

    const [min, max] = winnerSkin.float_range.split('-').map(parseFloat);
    const float = (Math.random() * (max - min) + min).toFixed(5);

    let wear = 'Battle-Scarred', wearKey = 'BS';
    if (float <= 0.07)  { wear = 'Factory New';     wearKey = 'FN'; }
    else if (float <= 0.15) { wear = 'Minimal Wear';    wearKey = 'MW'; }
    else if (float <= 0.38) { wear = 'Field-Tested';   wearKey = 'FT'; }
    else if (float <= 0.45) { wear = 'Well-Worn';       wearKey = 'WW'; }

    const price = parseFloat(winnerSkin.price?.[wearKey]) || 0;

    // StatTrak logic: only allow if the JSON says it is available
    const isStatTrak =
        winnerSkin.stattrak_available === false
            ? false
            : Math.random() < 0.10;


    const star = (winnerSkin.rarity === 'exceedingly_rare') ? '★ ' : '';
    const nameHTML = isStatTrak
        ? `<span style="color:${winnerSkin.color}">${star}</span><span style="color:#e67e22;">StatTrak™</span> <span style="color:${winnerSkin.color}">${winnerSkin.name}</span>`
        : `<span style="color:${winnerSkin.color}">${star}${winnerSkin.name}</span>`;

    resultEl.innerHTML = `
        <div class="title">
            ${nameHTML}
        </div>
        <div>Wear: <b>${wear}</b> | Float: <b>${float}</b> | Value: <b>${Money.format(price)}</b></div>
        <img src="${winnerSkin.image}" alt="${winnerSkin.name}" style="border:4px solid ${winnerSkin.color}">
    `;

    resultEl.style.opacity = 1;

    const inv = JSON.parse(localStorage.getItem('inventory')) || [];
    inv.push({
        name: winnerSkin.name,
        image: winnerSkin.image,
        wear, float: parseFloat(float),
        price, color: winnerSkin.color,
        stattrak: isStatTrak,
        rarity: winnerSkin.rarity
    });
    localStorage.setItem('inventory', JSON.stringify(inv));

    openBtn.style.display = 'inline-block';
}