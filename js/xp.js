// xp.js
import { supabase } from "./supabaseClient.js";
import { showPopup } from "./popup.js";
import { getLevel } from "./level.js";

export const Xp = (function () {
  const listeners = new Set();
  let initialized = false;      // prevents false level-up popups on page load
  let lastXp = null;            // store previous XP to detect real level-ups

  // Notify all registered listeners of XP changes
  function notify(xp) {
    listeners.forEach((fn) => {
      try { fn(xp); } catch (e) { console.error("XP listener error:", e); }
    });
  }

  // Read XP from DB
  async function get(uid) {
    if (!uid) return 0;

    const { data, error } = await supabase
      .from("user_xp")
      .select("xp")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) {
      console.error("Error fetching XP:", error.message);
      return 0;
    }

    const xp = data?.xp ?? 0;
    lastXp = xp;           // store starting XP
    notify(xp);

    initialized = true;    // NOW popups are allowed
    return xp;
  }

  // Write XP directly
  async function set(uid, amount) {
    if (!uid) return 0;
    const newXp = Number(amount) || 0;

    const { error } = await supabase
      .from("user_xp")
      .upsert({ user_id: uid, xp: newXp });

    if (error) {
      console.error("Error setting XP:", error.message);
      return newXp;
    }

    // Fire XP listeners
    notify(newXp);

    return newXp;
  }

  // Add XP and detect level-up correctly
  async function add(uid, gain) {
    if (!uid) return 0;

    const beforeXp = lastXp === null ? await get(uid) : lastXp;
    const afterXp = beforeXp + Number(gain || 0);

    const before = getLevel(beforeXp);   // uses your EXACT scaling
    const after = getLevel(afterXp);

    await set(uid, afterXp);

    // Store new XP for next comparison
    lastXp = afterXp;

    // REAL level-up detection:
    if (initialized && after.level > before.level) {
      showPopup("levelup", "Level Up!", `You reached level ${after.level}!`);
    }

    return afterXp;
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return { get, set, add, onChange };
})();
