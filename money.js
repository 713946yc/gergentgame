// money.js
import { supabase } from "./supabaseClient.js";

export const Money = (function() {
    const listeners = new Set();

    // Notify all registered listeners of balance changes
    function notify(balance) {
        listeners.forEach(fn => {
            try { fn(balance); } catch (e) {}
        });
    }

    // Get current balance for a specific user
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
        notify(balance);
        return balance;
    }

    // Set balance for a specific user
    async function set(uid, amount) {
        if (!uid) return 0;

        const cleaned = Number(amount.toFixed(2));

        const { error } = await supabase
            .from("money")
            .upsert({ user_id: uid, balance: cleaned });

        if (error) {
            console.error("Error setting balance:", error.message);
            return cleaned;
        }

        notify(cleaned);
        return cleaned;
    }

    // Add amount to balance
    async function add(uid, amount) {
        if (!uid) return 0;

        const current = await get(uid);
        const newTotal = current + Number(amount || 0);
        return set(uid, newTotal);
    }

    // Subtract amount from balance
    async function sub(uid, amount) {
        if (!uid) return 0;

        const current = await get(uid);
        const newTotal = Math.max(0, current - Number(amount || 0));
        return set(uid, newTotal);
    }

    // Format a number as currency
    function format(n) {
        if (n === undefined || n === null) return "$0.00";
        return "$" + Number(n).toFixed(2);
    }

    // Register a listener function that runs on balance changes
    function onChange(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    }

    return { get, set, add, sub, format, onChange };
})();
