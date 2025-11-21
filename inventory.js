// inventory.js
import { Money } from "./money.js";
import { getInventory, deleteInventoryItem } from "./inventory_api.js";

// --- UID check ---
const uid = localStorage.getItem("uid");
if (!uid) {
    window.location.href = "login.html";
}

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
let totalAllValue = 0;

// --- Money display ---
function refreshTopBarMoney(balance) {
    if (moneyAmountEl) moneyAmountEl.textContent = Money.format(balance);
}
Money.onChange(refreshTopBarMoney);
Money.get(uid).then(refreshTopBarMoney);

// ------------------------------------------------------------------------------------------------
// NAME + RARITY FORMATTING
// ------------------------------------------------------------------------------------------------

function formatRarityLabel(rarity) {
    if (!rarity) return "";
    switch (rarity.toLowerCase()) {
        case "consumer_grade":    return "Consumer Grade";
        case "industrial_grade":  return "Industrial Grade";
        case "mil_spec":          return "Mil-Spec";
        case "restricted":        return "Restricted";
        case "classified":        return "Classified";
        case "covert":            return "Covert";
        case "exceedingly_rare":  return "Exceedingly Rare";
        default: return rarity;
    }
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
// FILTER + SORTING LOGIC
// ------------------------------------------------------------------------------------------------

function filterAndSortItems() {
    const search = (searchInput?.value || "").toLowerCase();
    const rarityFilter = rarityFilterEl?.value || "";
    const sortOrder = sortOrderEl?.value || "newest";

    let items = allItems.slice();

    if (search) {
        items = items.filter(item =>
            (item.name || "").toLowerCase().includes(search)
        );
    }

    if (rarityFilter) {
        items = items.filter(item =>
            (item.rarity || "").toLowerCase() === rarityFilter.toLowerCase()
        );
    }

    items.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : 0;
        const dateB = b.created_at ? new Date(b.created_at) : 0;

        switch (sortOrder) {
            case "oldest":
                return dateA - dateB;
            case "price_asc":
                return (a.price || 0) - (b.price || 0);
            case "price_desc":
                return (b.price || 0) - (a.price || 0);
            case "float_asc":
                return (a.float || 0) - (b.float || 0);
            case "float_desc":
                return (b.float || 0) - (a.float || 0);
            default:
            case "newest":
                return dateB - dateA;
        }
    });

    return items;
}

// ------------------------------------------------------------------------------------------------
// SELECTION UI
// ------------------------------------------------------------------------------------------------

function updateSellSelectedButton() {
    const count = selectedIds.size;
    if (count === 0) {
        sellSelectedBtn.style.display = "none";
        sellSelectedBtn.textContent = "Sell Selected (0)";
    } else {
        sellSelectedBtn.style.display = "inline-block";
        sellSelectedBtn.textContent = `Sell Selected (${count})`;
    }
    updateSelectAllLabel();
}

function updateSelectAllLabel() {
    if (!selectAllBtn) return;

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

    if (items.length === 0) {
        gridEl.innerHTML = `<p style="color:white;">No items match your filters.</p>`;
        return;
    }

    selectedIds.forEach(id => {
        if (!allItems.find(it => it.id === id)) selectedIds.delete(id);
    });

    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "inventory-item";
        if (selectedIds.has(item.id)) card.classList.add("selected");

        card.style.borderColor = item.color || "transparent";
        card.dataset.itemId = item.id;

        const nameHTML = formatSkinName(item);
        const rarityLabel = formatRarityLabel(item.rarity);

        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="name">${nameHTML}</div>
            <div class="rarity-text">${rarityLabel}</div>
            <div class="details">Wear: ${item.wear} | Float: ${(item.float || 0).toFixed(9)}</div>
            <span class="price">${Money.format(item.price || 0)}</span>
            <button class="sell-btn">Sell</button>
        `;

        card.addEventListener("click", (e) => {
            if (e.target.classList.contains("sell-btn")) return;
            const id = item.id;
            if (selectedIds.has(id)) selectedIds.delete(id);
            else selectedIds.add(id);
            renderInventory();
            updateSellSelectedButton();
        });

        const sellBtn = card.querySelector(".sell-btn");
        sellBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            await sellItems([item]);
        });

        gridEl.appendChild(card);
    });

    updateSellSelectedButton();
}

// ------------------------------------------------------------------------------------------------
// SELL LOGIC (NO CONFIRM)
// ------------------------------------------------------------------------------------------------

async function sellItems(itemsToSell) {
    if (!itemsToSell.length) return;

    const total = itemsToSell.reduce((sum, i) => sum + Number(i.price || 0), 0);

    await Money.add(uid, total);
    await Promise.all(itemsToSell.map(it => deleteInventoryItem(uid, it.id)));

    selectedIds.clear();
    await loadInventory();
}

// ------------------------------------------------------------------------------------------------
// LOAD INVENTORY
// ------------------------------------------------------------------------------------------------

async function loadInventory() {
    allItems = await getInventory(uid);
    totalAllValue = allItems.reduce((s, it) => s + Number(it.price || 0), 0);
    totalValueEl.textContent = Money.format(totalAllValue);
    renderInventory();
}

// ------------------------------------------------------------------------------------------------
// EVENT LISTENERS
// ------------------------------------------------------------------------------------------------

searchInput.addEventListener("input", renderInventory);
rarityFilterEl.addEventListener("change", renderInventory);
sortOrderEl.addEventListener("change", renderInventory);

sellAllBtn.addEventListener("click", async () => {
    if (!allItems.length) return;
    await sellItems(allItems.slice());
});

sellSelectedBtn.addEventListener("click", async () => {
    const selected = allItems.filter(i => selectedIds.has(i.id));
    await sellItems(selected);
});

selectAllBtn.addEventListener("click", () => {
    if (selectedIds.size === allItems.length) {
        selectedIds.clear();
    } else {
        selectedIds = new Set(allItems.map(i => i.id));
    }
    renderInventory();
    updateSellSelectedButton();
});

// INIT
loadInventory();
