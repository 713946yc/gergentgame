import { Money } from "./money.js";
import { getInventory } from "./inventory_api.js";
import { supabase } from "./supabaseClient.js";

const uid = localStorage.getItem("uid");
if (!uid) window.location.href = "login.html";

// --------- CONFIG ---------

// You already have prices on items. We'll use:
// passive = price / 1000
// click   = price / 100
const PASSIVE_DIVISOR = 1000;
const CLICK_DIVISOR = 100;

// buildings like cursors / grandmas / factories:
const BUILDINGS = [
  {
    id: "case_clicker",
    name: "Case Clicker",
    baseCost: 50,
    baseCps: 0.02,
    description: "Automatically clicks your sacrificed items.",
  },
  {
    id: "case_opener",
    name: "Case Opener",
    baseCost: 250,
    baseCps: 0.15,
    description: "Steady passive earnings.",
  },
  {
    id: "case_factory",
    name: "Case Factory",
    baseCost: 1500,
    baseCps: 1.0,
    description: "Serious case money.",
  },
];

// golden-cookie style powerups:
const POWERUPS = [
  {
    id: "frenzy",
    name: "Click Frenzy",
    description: "×7 click value for 30 seconds.",
    durationMs: 30000,
    clickMult: 7,
    passiveMult: 1,
  },
  {
    id: "rain",
    name: "Case Rain",
    description: "×3 passive income for 30 seconds.",
    durationMs: 30000,
    clickMult: 1,
    passiveMult: 3,
  },
  {
    id: "storm",
    name: "Case Storm",
    description: "×2 passive and ×2 click for 20 seconds.",
    durationMs: 20000,
    clickMult: 2,
    passiveMult: 2,
  },
];

// rarity → css class for circle colour:
function rarityClass(rarity) {
  if (!rarity) return "";
  return rarity.toLowerCase();
}

// --------- DOM ---------

const balanceEl = document.getElementById("idleBalance");
const passiveEl = document.getElementById("idlePassive");
const clickEl = document.getElementById("idleClickValue");
const invListEl = document.getElementById("idleInventoryList");
const sacrificedGridEl = document.getElementById("sacrificedGrid");
const buildingListEl = document.getElementById("buildingList");
const powerupListEl = document.getElementById("powerupList");
const powerupToastEl = document.getElementById("powerupToast");
const mysteryOrbEl = document.getElementById("mysteryOrb");

// --------- STATE ---------

let inventoryItems = [];
let sacrificedItems = []; // {id, name, price, rarity, image}

let buildingsState = {}; // {id: count}
let clickMultiplier = 1;
let passiveMultiplier = 1;

// --------- UTIL ---------

function formatMoney(n) {
  return Money.format(n);
}

function showToast(text) {
  powerupToastEl.textContent = text;
  powerupToastEl.classList.remove("hidden");
  powerupToastEl.classList.add("show");
  setTimeout(() => {
    powerupToastEl.classList.remove("show");
    setTimeout(() => powerupToastEl.classList.add("hidden"), 250);
  }, 2500);
}

// simply store building counts in localStorage for now
function loadBuildingsState() {
  const raw = localStorage.getItem(`idle_buildings_${uid}`);
  if (!raw) {
    buildingsState = {};
    return;
  }
  try {
    buildingsState = JSON.parse(raw) || {};
  } catch {
    buildingsState = {};
  }
}

function saveBuildingsState() {
  localStorage.setItem(
    `idle_buildings_${uid}`,
    JSON.stringify(buildingsState)
  );
}

function getBuildingCount(id) {
  return buildingsState[id] || 0;
}

function getBuildingCost(building) {
  const count = getBuildingCount(building.id);
  // standard idle formula: cost grows ~15% per buy
  return building.baseCost * Math.pow(1.15, count);
}

function totalBuildingsCps() {
  return BUILDINGS.reduce((sum, b) => {
    const count = getBuildingCount(b.id);
    return sum + count * b.baseCps;
  }, 0);
}

// --------- MONEY UI ---------

Money.onChange((bal) => {
  if (balanceEl) balanceEl.textContent = formatMoney(bal);
});

Money.get(uid); // initial

// --------- INVENTORY + SACRIFICES PERSISTENCE ---------

// We'll store sacrificed items in a Supabase table "idle_sacrifices"
// Schema suggestion:
// user_id (uuid), item_id (bigint), name (text), price (numeric), rarity (text), image (text)
async function loadSacrificedItems() {
  const { data, error } = await supabase
    .from("idle_sacrifices")
    .select("item_id, name, price, rarity, image")
    .eq("user_id", uid);

  if (error) {
    console.error("loadSacrificedItems error", error.message);
    sacrificedItems = [];
    return;
  }

  sacrificedItems = data.map((row) => ({
    id: row.item_id,
    name: row.name,
    price: Number(row.price || 0),
    rarity: row.rarity,
    image: row.image,
  }));
}

// Sacrifice = remove from inventory + insert into idle_sacrifices table.
// You need a Supabase RPC or transaction that:
// 1) removes the item from the player's normal inventory
// 2) inserts it into idle_sacrifices
async function sacrificeItem(item) {

    if (sacrificedItems.length >= 1) {
        alert("You can only sacrifice ONE item.");
        return;
    }

    const confirmed = confirm(
        `Sacrifice "${item.name}" forever?\nThis cannot be undone.`
    );
    if (!confirmed) return;

    const { error } = await supabase.rpc("sacrifice_item", {
        p_uid: uid,
        p_item_id: item.id
    });

    if (error) {
        alert(error.message);
        return;
    }

    // Add to local memory
    sacrificedItems = [{
        id: item.id,
        name: item.name,
        price: Number(item.price || 0),
        rarity: item.rarity,
        image: item.image,
    }];

    // Switch UI mode
    document.getElementById("sacrificeArea").classList.add("hidden");
    document.getElementById("sacrificedDisplay").classList.remove("hidden");

    document.getElementById("sacrificedImage").src = item.image;
    document.getElementById("sacrificedCircle").className =
        "rarity-circle " + item.rarity.toLowerCase();

    document.getElementById("sacrificeLabel").textContent = item.name;

    updateRatesUI();
}


// --------- RATES CALCULATION ---------

function computePassiveFromSacrifices() {
  return sacrificedItems.reduce((sum, item) => {
    const price = Number(item.price || 0);
    return sum + price / PASSIVE_DIVISOR;
  }, 0);
}

function computeClickBaseFromSacrifices() {
  return sacrificedItems.reduce((sum, item) => {
    const price = Number(item.price || 0);
    return sum + price / CLICK_DIVISOR;
  }, 0);
}

function updateRatesUI() {
  const passiveBase =
    computePassiveFromSacrifices() + totalBuildingsCps();
  const clickBase = computeClickBaseFromSacrifices();

  const passiveFinal = passiveBase * passiveMultiplier;
  const clickFinal = clickBase * clickMultiplier;

  if (passiveEl) passiveEl.textContent = `${passiveFinal.toFixed(3)} $/s`;
  if (clickEl) clickEl.textContent = `${clickFinal.toFixed(3)} / click`;
}

// --------- RENDER INVENTORY (LEFT) ---------

function renderInventoryList() {
  invListEl.innerHTML = "";

  if (!inventoryItems.length) {
    invListEl.innerHTML =
      `<p style="font-size:0.8rem; opacity:0.7;">No items available to sacrifice.</p>`;
    return;
  }

  inventoryItems.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "idle-inv-item";

    const thumb = document.createElement("div");
    thumb.className = "idle-inv-thumb";
    thumb.innerHTML = `<img src="${item.image}" alt="${item.name}">`;

    const main = document.createElement("div");
    main.className = "idle-inv-main";
    main.innerHTML = `
      <div class="idle-inv-name">${item.name}</div>
      <div class="idle-inv-meta">
        ${item.rarity || "Unknown rarity"} • ${formatMoney(item.price || 0)}
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "idle-inv-actions";

    const earnPerSec = (item.price / PASSIVE_DIVISOR).toFixed(4);
    const earnPerClick = (item.price / CLICK_DIVISOR).toFixed(4);

    const info = document.createElement("div");
    info.textContent = `+${earnPerSec}/s, +${earnPerClick}/click`;

    const btn = document.createElement("button");
    btn.className = "btn-sacrifice";
    btn.textContent = "Sacrifice";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      sacrificeItem(item);
    });

    actions.appendChild(info);
    actions.appendChild(btn);

    wrapper.appendChild(thumb);
    wrapper.appendChild(main);
    wrapper.appendChild(actions);

    invListEl.appendChild(wrapper);
  });
}

// --------- RENDER SACRIFICED (MIDDLE) ---------

function renderSacrificedGrid() {
  sacrificedGridEl.innerHTML = "";

  if (!sacrificedItems.length) {
    sacrificedGridEl.innerHTML =
      `<p style="font-size:0.8rem; opacity:0.7;">Sacrifice an item to start earning.</p>`;
    return;
  }

  sacrificedItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = "sacrifice-card";

    const circle = document.createElement("div");
    circle.className =
      "rarity-circle " + rarityClass(item.rarity);

    circle.innerHTML = `<img src="${item.image}" alt="${item.name}">`;

    // clicking the circle = active click reward
    circle.addEventListener("click", async () => {
      const base = item.price / CLICK_DIVISOR;
      const totalClickMult = clickMultiplier;
      const gain = base * totalClickMult;
      await Money.add(uid, gain);
    });

    const nameEl = document.createElement("div");
    nameEl.textContent = item.name;

    const valuesEl = document.createElement("div");
    valuesEl.className = "sacrifice-values";
    const passiveBase = item.price / PASSIVE_DIVISOR;
    const clickBase = item.price / CLICK_DIVISOR;
    valuesEl.innerHTML = `
      <div>+${passiveBase.toFixed(4)}/s</div>
      <div>+${clickBase.toFixed(4)}/click</div>
    `;

    card.appendChild(circle);
    card.appendChild(nameEl);
    card.appendChild(valuesEl);
    sacrificedGridEl.appendChild(card);
  });
}

// --------- BUILDINGS (RIGHT) ---------

function renderBuildings() {
  buildingListEl.innerHTML = "";

  BUILDINGS.forEach((b) => {
    const card = document.createElement("div");
    card.className = "building-card";

    const main = document.createElement("div");
    main.className = "building-card-main";

    const nameEl = document.createElement("div");
    nameEl.className = "building-name";
    nameEl.textContent = `${b.name} x${getBuildingCount(b.id)}`;

    const metaEl = document.createElement("div");
    metaEl.className = "building-meta";
    metaEl.textContent = `${b.description} • +${b.baseCps.toFixed(
      3
    )} $/s each`;

    main.appendChild(nameEl);
    main.appendChild(metaEl);

    const btn = document.createElement("button");
    btn.className = "btn-buy";

    const cost = getBuildingCost(b);
    btn.textContent = `Buy (${formatMoney(cost)})`;

    btn.addEventListener("click", async () => {
      const currentBalance = await Money.get(uid);
      if (currentBalance < cost) {
        showToast("Not enough money!");
        return;
      }

      await Money.set(uid, currentBalance - cost);
      buildingsState[b.id] = getBuildingCount(b.id) + 1;
      saveBuildingsState();
      renderBuildings();
      updateRatesUI();
      showToast(`Bought 1 ${b.name}`);
    });

    card.appendChild(main);
    card.appendChild(btn);
    buildingListEl.appendChild(card);
  });
}

// --------- POWERUPS ---------

let activePowerups = [];

function renderPowerups() {
  powerupListEl.innerHTML = "";

  if (!activePowerups.length) {
    powerupListEl.innerHTML =
      `<span style="opacity:0.7;">No active powerups</span>`;
    return;
  }

  activePowerups.forEach((p) => {
    const tag = document.createElement("span");
    tag.className = "powerup-active-tag";
    const secsLeft = Math.max(
      0,
      Math.ceil((p.endsAt - Date.now()) / 1000)
    );
    tag.textContent = `${p.name} (${secsLeft}s)`;
    powerupListEl.appendChild(tag);
  });
}

function applyPowerup(pDef) {
  const instance = {
    ...pDef,
    startsAt: Date.now(),
    endsAt: Date.now() + pDef.durationMs,
  };
  activePowerups.push(instance);

  // recalc multipliers
  clickMultiplier = 1;
  passiveMultiplier = 1;
  activePowerups.forEach((p) => {
    clickMultiplier *= p.clickMult;
    passiveMultiplier *= p.passiveMult;
  });

  showToast(`${pDef.name}: ${pDef.description}`);
  renderPowerups();
  updateRatesUI();
}

function tickPowerups() {
  const now = Date.now();
  const before = activePowerups.length;
  activePowerups = activePowerups.filter((p) => p.endsAt > now);

  if (activePowerups.length !== before) {
    // recalc multipliers
    clickMultiplier = 1;
    passiveMultiplier = 1;
    activePowerups.forEach((p) => {
      clickMultiplier *= p.clickMult;
      passiveMultiplier *= p.passiveMult;
    });
    renderPowerups();
    updateRatesUI();
  }
}

// --------- MYSTERY ORB (GOLDEN COOKIE) ---------

function scheduleMysteryOrb() {
  const delay =
    30000 + Math.random() * 60000; // 30–90 seconds
  setTimeout(() => {
    mysteryOrbEl.classList.remove("hidden");
  }, delay);
}

mysteryOrbEl.addEventListener("click", () => {
  // choose a random powerup
  const pDef =
    POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
  applyPowerup(pDef);

  mysteryOrbEl.classList.add("hidden");
  scheduleMysteryOrb();
});

// --------- PASSIVE TICK ---------

async function passiveLoop() {
  setInterval(async () => {
    tickPowerups();

    const passiveBase =
      computePassiveFromSacrifices() + totalBuildingsCps();
    const passiveFinal = passiveBase * passiveMultiplier;

    if (passiveFinal > 0) {
      await Money.add(uid, passiveFinal);
    }
  }, 1000);
}

// --------- INIT ---------

async function init() {
  loadBuildingsState();

  // 1) load inventory
  inventoryItems = await getInventory(uid);

  // 2) load sacrificed items from Supabase table
  await loadSacrificedItems();

  renderInventoryList();
  renderSacrificedGrid();
  renderBuildings();
  renderPowerups();
  updateRatesUI();
  passiveLoop();
  scheduleMysteryOrb();
}

init();
