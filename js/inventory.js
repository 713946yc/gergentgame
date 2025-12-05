// inventory.js
import { Money } from "./money.js";
import { getInventory } from "./inventory_api.js";
import { supabase } from "./supabaseClient.js";
import { handleSellItems, initQuestsUI } from "./quests.js";

// --- UID check ---
const uid = localStorage.getItem("uid");
if (!uid) window.location.href = "login.html";

// Quests / achievements awareness
await initQuestsUI(uid);

// --- DOM Elements ---
const gridEl = document.getElementById("inventoryGrid");
const moneyAmountEl = document.getElementById("moneyAmount");
const totalValueEl = document.querySelector("#totalValue b");

const searchInput = document.getElementById("searchBar");
const rarityFilterEl = document.getElementById("rarityFilter");
const sortOrderEl = document.getElementById("sortOrder");

const sellAllBtn = document.getElementById("sellAllBtn");
const sellSelectedBtn = document.getElementById("sellSelectedBtn");
const selectAllBtn = document.getElementById("selectAllBtn");

// --- In-memory state ---
let allItems = [];
let selectedIds = new Set();
let isSelling = false;

// --- MONEY DISPLAY ---
function refreshTopBarMoney(balance) {
  if (moneyAmountEl) moneyAmountEl.textContent = Money.format(balance);
}
Money.onChange(refreshTopBarMoney);
Money.get(uid).then(refreshTopBarMoney);

// ------------------------------------------------------------------------------------------------
// NAME + RARITY FORMATTERS
// ------------------------------------------------------------------------------------------------

function formatRarityLabel(rarity) {
  if (!rarity) return "";
  return rarity
    .replace("consumer_grade", "Consumer Grade")
    .replace("industrial_grade", "Industrial Grade")
    .replace("mil_spec", "Mil-Spec")
    .replace("restricted", "Restricted")
    .replace("classified", "Classified")
    .replace("covert", "Covert")
    .replace("exceedingly_rare", "Exceedingly Rare");
}

function rarityClassName(rarity) {
  return `rarity-${(rarity || "").toLowerCase()}`;
}

function formatSkinName(item) {
  const rarity = (item.rarity || "").toLowerCase();
  let name = item.name || "";
  const parts = [];

  if (rarity === "exceedingly_rare") {
    parts.push(`<span style="color:#f1c40f;">★</span>`);
  }
  if (name.startsWith("Souvenir ")) {
    name = name.slice("Souvenir ".length);
    parts.push(`<span style="color:#f1c40f;">Souvenir</span>`);
  }
  if (item.stattrak) {
    parts.push(`<span style="color:#ff9900;">StatTrak™</span>`);
  }

  parts.push(`<span style="color:${item.color || "#ffffff"}">${name}</span>`);
  return parts.join(" ");
}

// ------------------------------------------------------------------------------------------------
// FILTER & SORT
// ------------------------------------------------------------------------------------------------

function filterAndSortItems() {
  const search = (searchInput?.value || "").toLowerCase();
  const rarityFilter = rarityFilterEl?.value || "";
  const sortOrder = sortOrderEl?.value || "newest";

  let items = allItems.slice();

  if (search) {
    items = items.filter((item) =>
      (item.name || "").toLowerCase().includes(search)
    );
  }

  if (rarityFilter) {
    items = items.filter(
      (item) => (item.rarity || "").toLowerCase() === rarityFilter
    );
  }

  items.sort((a, b) => {
    const da = new Date(a.created_at || 0);
    const db = new Date(b.created_at || 0);

    switch (sortOrder) {
      case "oldest":
        return da - db;
      case "price_asc":
        return (a.price || 0) - (b.price || 0);
      case "price_desc":
        return (b.price || 0) - (a.price || 0);
      case "float_asc":
        return (a.float || 0) - (b.float || 0);
      case "float_desc":
        return (b.float || 0) - (a.float || 0);
      default:
        return db - da;
    }
  });

  return items;
}

// ------------------------------------------------------------------------------------------------
// BUTTON UI HELPERS
// ------------------------------------------------------------------------------------------------

function updateSellSelectedButton() {
  const count = selectedIds.size;
  sellSelectedBtn.style.display = count ? "inline-block" : "none";
  sellSelectedBtn.textContent = `Sell Selected (${count})`;
  updateSelectAllLabel();
}

function updateSelectAllLabel() {
  if (selectedIds.size === allItems.length && allItems.length > 0) {
    selectAllBtn.textContent = "Clear Selection";
  } else {
    selectAllBtn.textContent = "Select All";
  }
}

// ------------------------------------------------------------------------------------------------
// RENDER INVENTORY
// ------------------------------------------------------------------------------------------------

function renderInventory() {
  const items = filterAndSortItems();
  gridEl.innerHTML = "";

  if (!items.length) {
    gridEl.innerHTML = `<p style="color:white;">No items match your filters.</p>`;
    return;
  }

  items.forEach((item) => {
    const price = Number(item.price || 0);

    const card = document.createElement("div");
    card.className = "inventory-item";
    if (selectedIds.has(item.id)) card.classList.add("selected");

    const rarityClass = rarityClassName(item.rarity);
    const hasWearInfo = !item.name.includes("Vanilla");

    const patternNumber = item.pattern ?? null;
    const patternNote = item.pattern_note || "";
    const patternColor = item.pattern_color || "#ffd700";

    // Pretty exterior
    const exterior = hasWearInfo ? item.wear : "";

    // Build detail lines
    const floatText = hasWearInfo
      ? (item.float ?? 0).toFixed(9)
      : null;

    card.innerHTML = `
      <div class="inv-image-wrapper ${rarityClass}">
        <img src="${item.image}" alt="${item.name}">
      </div>

      <div class="inv-content">

        <div class="inv-name">${formatSkinName(item)}</div>

        <div class="inv-rarity-pill ${rarityClass}">
          ${formatRarityLabel(item.rarity)}
        </div>

        <div class="inv-meta-row">
          ${exterior ? `<span>Exterior: ${exterior}</span>` : ""}
          ${floatText ? `<span>Float: ${floatText}</span>` : ""}
        </div>

        ${
          patternNumber
            ? `
            <div class="inv-pattern-row">
                <span>Pattern: #${patternNumber}</span>
                ${
                  patternNote
                    ? `<span class="pattern-tag-badge" style="color:${patternColor}">
                        ${patternNote}
                      </span>`
                    : ""
                }
            </div>`
            : ""
        }

        <div class="inv-bottom-row">
          <span class="inv-price">${Money.format(price)}</span>
          <button class="sell-btn">Sell</button>
        </div>

      </div>
    `;


    // click = select
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("sell-btn")) return;
      if (selectedIds.has(item.id)) {
        selectedIds.delete(item.id);
      } else {
        selectedIds.add(item.id);
      }

      renderInventory();
      updateSellSelectedButton();
    });

    // sell single item
    const sellBtn = card.querySelector(".sell-btn");
    sellBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (isSelling) return;

      sellBtn.textContent = "Selling...";
      isSelling = true;
      disableAllSellButtons();
      await sellItems([item]);
    });

    gridEl.appendChild(card);
  });

  updateSellSelectedButton();
}

// ------------------------------------------------------------------------------------------------
// DISABLE / ENABLE ACTION BUTTONS
// ------------------------------------------------------------------------------------------------

function disableAllSellButtons() {
  document.querySelectorAll(".sell-btn").forEach((btn) => {
    btn.disabled = true;
  });
  sellAllBtn.disabled = true;
  sellSelectedBtn.disabled = true;
}

function enableAllSellButtons() {
  document.querySelectorAll(".sell-btn").forEach((btn) => {
    btn.disabled = false;
  });
  sellAllBtn.disabled = false;
  sellSelectedBtn.disabled = false;
}

// ------------------------------------------------------------------------------------------------
// SAFE SELL — Duplication-proof + achievement hook
// ------------------------------------------------------------------------------------------------

async function sellItems(items) {
  if (!items.length) return;

  const countSold = items.length; // capture BEFORE loop

  try {
    for (const item of items) {
      const { error } = await supabase.rpc("safe_sell", {
        p_uid: uid,
        p_item_id: item.id,
      });

      if (error) {
        console.error("Sell RPC error:", error.message);
        alert(error.message);
        break;
      }
    }
  } catch (err) {
    console.error("Sell RPC failed:", err);
  }

  // Achievement: sell 100+ items in one go
  await handleSellItems(countSold);

  // refresh money
  refreshTopBarMoney(await Money.get(uid));

  selectedIds.clear();
  await loadInventory();

  enableAllSellButtons();
  isSelling = false;

  // Restore button text
  sellAllBtn.textContent = "Sell All";
  updateSellSelectedButton();
}

// ------------------------------------------------------------------------------------------------
// LOAD INVENTORY
// ------------------------------------------------------------------------------------------------

async function loadInventory() {
  allItems = await getInventory(uid);

  const totalValue = allItems.reduce(
    (s, it) => s + Number(it.price || 0),
    0
  );
  totalValueEl.textContent = Money.format(totalValue);

  renderInventory();
}

// ------------------------------------------------------------------------------------------------
// EVENT LISTENERS
// ------------------------------------------------------------------------------------------------

searchInput.addEventListener("input", renderInventory);
rarityFilterEl.addEventListener("change", renderInventory);
sortOrderEl.addEventListener("change", renderInventory);

sellAllBtn.addEventListener("click", () => {
  if (!allItems.length || isSelling) return;

  isSelling = true;

  // UI Feedback
  sellAllBtn.textContent = "Selling...";
  sellSelectedBtn.style.display = "none";
  disableAllSellButtons();

  sellItems(allItems.slice());
});

sellSelectedBtn.addEventListener("click", () => {
  if (isSelling) return;

  const selected = allItems.filter((i) => selectedIds.has(i.id));
  if (!selected.length) return;

  isSelling = true;

  // UI Feedback
  sellSelectedBtn.textContent = "Selling...";
  disableAllSellButtons();

  sellItems(selected);
});

selectAllBtn.addEventListener("click", () => {
  if (selectedIds.size === allItems.length) {
    selectedIds.clear();
  } else {
    selectedIds = new Set(allItems.map((i) => i.id));
  }

  renderInventory();
  updateSellSelectedButton();
});

// INIT
loadInventory();
