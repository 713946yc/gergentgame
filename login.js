import { signupAccount, loginAccount } from "./supabaseClient.js";

const user = document.getElementById("username");
const pass = document.getElementById("password");
const msg = document.getElementById("notif");

function notify(t, ok=false) {
    msg.textContent = t;
    msg.style.color = ok ? "green" : "red";
}

// SIGN UP
document.getElementById("signupBtn").onclick = async () => {
    try {
        await signupAccount(user.value.trim(), pass.value);
        notify("Account created!", true);
        setTimeout(() => location.href = "index.html", 600);
    } catch (e) {
        notify(e.message);
    }
};

// LOGIN
document.getElementById("loginBtn").onclick = async () => {
    try {
        await loginAccount(user.value.trim(), pass.value);
        notify("Logged in!", true);
        setTimeout(() => location.href = "index.html", 600);
    } catch {
        notify("Invalid username or password");
    }
};
