import { Money } from "./money.js";

const uid = localStorage.getItem("uid");
if (!uid) {
    alert("You must be logged in!");
    window.location.href = "login.html";
}

// DOM Elements
const balanceEl = document.getElementById("moneyAmount");
const addBtn = document.getElementById("addMoneyBtn");
const subBtn = document.getElementById("subtractMoneyBtn");
const addInput = document.getElementById("addAmount");
const subInput = document.getElementById("subAmount");

// Update balance display
async function refreshBalance() {
    const balance = await Money.get(uid);
    if (balanceEl) balanceEl.textContent = Money.format(balance);
}

// Listen for Money changes
Money.onChange(refreshBalance);
refreshBalance();

// --- Add Money ---
addBtn.addEventListener("click", async () => {
    const amount = parseFloat(addInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert("Enter a valid positive number to add.");
        return;
    }
    await Money.add(uid, amount);
    addInput.value = "";
    refreshBalance();
});

// --- Subtract Money ---
subBtn.addEventListener("click", async () => {
    const amount = parseFloat(subInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert("Enter a valid positive number to subtract.");
        return;
    }

    const current = await Money.get(uid);
    if (current < amount) {
        alert("Not enough balance!");
        return;
    }

    await Money.sub(uid, amount);
    subInput.value = "";
    refreshBalance();
});
