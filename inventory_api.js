// inventory_api.js
// Clean rewritten version.
// Ensures every inventory item gets a proper created_at timestamp
// so newest/oldest sorting works correctly.

import { supabase } from "./supabaseClient.js";

// Add a new inventory item for a given uid.
export async function addInventoryItem(uid, item) {
    if (!uid) throw new Error("addInventoryItem: uid is required");

    const payload = {
        uid,
        name: item.name,
        image: item.image,
        wear: item.wear,
        float: item.float,
        price: item.price,
        color: item.color,
        stattrak: item.stattrak,
        rarity: item.rarity,

        // ⭐ FIX: Always store a created_at timestamp
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from("inventory")
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error("[inventory_api] Error inserting inventory item:", error);
        throw error;
    }

    return data;
}

// Get all inventory items for a given uid.
export async function getInventory(uid) {
    if (!uid) return [];

    const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("uid", uid)
        .order("created_at", { ascending: false }); // newest first

    if (error) {
        console.error("[inventory_api] Error fetching inventory:", error);
        throw error;
    }

    // ⭐ Safety: If some old items had null created_at,
    // give them a fallback zero date so sorting still works.
    return (data || []).map(item => ({
        ...item,
        created_at: item.created_at || "1970-01-01T00:00:00.000Z"
    }));
}

// Delete one item
export async function deleteInventoryItem(uid, id) {
    if (!uid || !id) throw new Error("deleteInventoryItem: uid and id are required");

    const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("uid", uid)
        .eq("id", id);

    if (error) {
        console.error("[inventory_api] Error deleting inventory item:", error);
        throw error;
    }

    return true;
}
