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

    return { get, format, onChange };

})();
