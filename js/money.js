// money.js
import { supabase } from "./supabaseClient.js";

export const Money = (function () {
    const listeners = new Set();

    function notify(balance) {
        listeners.forEach(fn => {
            try { fn(balance); } catch (e) {}
        });
    }

    // -------------------------------
    // GET BALANCE
    // -------------------------------
    async function get(uid) {
        if (!uid) return 0;

        const { data, error } = await supabase
            .from("money")
            .select("balance")
            .eq("user_id", uid)
            .maybeSingle();

        if (error) {
            console.error("Error fetching balance:", error.message);
            return 0;
        }

        const balance = data?.balance ?? 0;

        // 🔥 Notify UI
        notify(balance);

        return balance;
    }

    // -------------------------------
    // SET BALANCE (UI + DB)
    // -------------------------------
    async function set(uid, newBalance) {
        if (!uid) return;

        const { error } = await supabase
            .from("money")
            .update({ balance: newBalance })
            .eq("user_id", uid);

        if (error) {
            console.error("Money.set DB error:", error.message);
            return;
        }

        // 🔥 Notify UI instantly
        notify(newBalance);
    }

    // -------------------------------
    // ADD MONEY (UI + DB)
    // -------------------------------
    async function add(uid, amount) {
        if (!uid || amount === 0) return;

        const current = await get(uid);
        const updated = current + amount;

        await set(uid, updated);
    }

    // -------------------------------
    // FORMAT
    // -------------------------------
    function format(n) {
        return "$" + Number(n || 0).toFixed(2);
    }

    // -------------------------------
    // LISTENER
    // -------------------------------
    function onChange(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    }

    return { get, set, add, format, onChange };
})();
