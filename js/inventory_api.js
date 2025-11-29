// inventory_api.js
// All inventory <-> Supabase helpers

import { supabase } from "./supabaseClient.js";

/**
 * Fetch all inventory items for a given user.
 */
export async function getInventory(uid) {
  if (!uid) return [];

  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("uid", uid)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading inventory:", error.message);
    return [];
  }

  return data || [];
}

/**
 * Add a new inventory item for a given user.
 * `item` can include:
 *  - name, image, price, float, rarity, wear, color, stattrak
 *  - pattern (number 1–999)
 *  - pattern_note (string)
 */
export async function addInventoryItem(uid, item) {
  if (!uid) return;

  const payload = {
    uid,
    name: item.name,
    image: item.image,
    price: item.price,
    float: item.float,
    rarity: item.rarity,
    wear: item.wear,
    color: item.color,
    stattrak: item.stattrak ?? false,
    pattern: item.pattern ?? null,
    pattern_note: item.pattern_note ?? null,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("inventory").insert(payload);

  if (error) {
    console.error("Error adding inventory item:", error.message);
  }
}
