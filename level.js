// level.js
import { Xp } from "./xp.js";

const BASE_XP = 100;
const MULTIPLIER = 1.5;

// Compute the current level from total XP
export function getLevel(xp) {
    let level = 1;
    let xpNeeded = BASE_XP;

    while (xp >= xpNeeded) {
        xp -= xpNeeded;
        level++;
        xpNeeded = Math.floor(xpNeeded * MULTIPLIER);
    }

    return { level, currentXp: xp, xpToNextLevel: xpNeeded };
}

// Optional: display level on the page
export function showLevel(uid, elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Listen for XP changes
    Xp.onChange(xp => {
        const { level, currentXp, xpToNextLevel } = getLevel(xp);
        el.textContent = `Level: ${level} | XP: ${currentXp} / ${xpToNextLevel}`;
    });

    // Fetch initial XP
    Xp.get(uid).then(xp => {
        const { level, currentXp, xpToNextLevel } = getLevel(xp);
        el.textContent = `Level: ${level} | XP: ${currentXp} / ${xpToNextLevel}`;
    });
}
