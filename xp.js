// xp.js
import { supabase } from "./supabaseClient.js";

export const Xp = (function () {
  const listeners = new Set();

  // Notify all registered listeners of XP changes
  function notify(xp) {
    listeners.forEach((fn) => {
      try {
        fn(xp);
      } catch (e) {
        console.error("XP listener error:", e);
      }
    });
  }

  // Get current XP for a user
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
    notify(xp);
    return xp;
  }

  // Set XP for a user (overwrites)
  async function set(uid, xpAmount) {
    if (!uid) return 0;

    const cleaned = Number(xpAmount) || 0;

    const { error } = await supabase
      .from("user_xp")
      .upsert({ user_id: uid, xp: cleaned });

    if (error) {
      console.error("Error setting XP:", error.message);
      return cleaned;
    }

    notify(cleaned);
    return cleaned;
  }

  // Add XP incrementally
  async function add(uid, xpAmount) {
    if (!uid) return 0;

    const current = await get(uid);
    const newTotal = current + Number(xpAmount || 0);
    return set(uid, newTotal);
  }

  // Register a listener function that runs on XP changes
  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return { get, set, add, onChange };
})();
