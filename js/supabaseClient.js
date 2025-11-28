import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Put your own project details here
const supabaseUrl = "https://idmjyvjcfulgiyscpfis.supabase.co";
const supabaseKey = "sb_publishable_ryeKvlBtxGXQICpQyRAeoQ_mLskN6mZ";

export const supabase = createClient(supabaseUrl, supabaseKey);

// SIGN UP
export async function signupAccount(username, password) {
    const { data, error } = await supabase
        .from("useraccounts")
        .insert({ username, password })
        .select()
        .single();

    if (error) throw error;

    localStorage.setItem("uid", data.id);
    localStorage.setItem("username", data.username);

    return data;
}

// LOGIN
export async function loginAccount(username, password) {
    const { data, error } = await supabase
        .from("useraccounts")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single();

    if (error || !data) throw new Error("Invalid username or password");

    localStorage.setItem("uid", data.id);
    localStorage.setItem("username", data.username);

    return data;
}
