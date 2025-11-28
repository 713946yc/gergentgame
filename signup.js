// signup.js
import { supabase, signUp } from "./supabaseClient.js";

document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();

    try {
        const user = await signUp(email, password);

        alert("Account created! Check your email for confirmation.");
        window.location.href = "login.html";
    } catch (error) {
        alert(error.message);
    }
});
