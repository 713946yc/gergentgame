// inventory_api.js
// Clean rewritten version.
// Ensures every inventory item gets a proper created_at timestamp
// so newest/oldest sorting works correctly.

import { supabase } from "./supabaseClient.js";


export async function addInventoryItem(uid, item) {
  const { error } = await supabase
    .from("inventory")
    .insert({
      uid,
      name: item.name,
      image: item.image,
      price: item.price,
      float: item.float,
      rarity: item.rarity,
      wear: item.wear,
      color: item.color,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error("Failed to add item to inventory:", error);
    throw error;
  }
}

// Add a new inventory item for a given uid.

// Get all inventory items for a given uid.
export async function getInventory(uid) {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("uid", uid)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading inventory:", error);
    return [];
  }

  return data;
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
