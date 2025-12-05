import { signupAccount, loginAccount } from "./supabaseClient.js"; 

const user = document.getElementById("username");
const pass = document.getElementById("password");
const msg = document.getElementById("notif");

function notify(t, ok=false) {
    msg.textContent = t;
    msg.style.color = ok ? "green" : "red";
}

// Validation functions
function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9]{3,}$/; // letters and numbers only, min 3 chars
    return usernameRegex.test(username);
}

function isValidPassword(password) {
    return password.length >= 8; // min 8 chars for signup only
}

// SIGN UP
document.getElementById("signupBtn").onclick = async () => {
    const username = user.value.trim();
    const password = pass.value;

    if (!isValidUsername(username)) {
        notify("Username must be at least 3 characters and contain only letters and numbers.");
        return;
    }

    if (!isValidPassword(password)) {
        notify("Password must be at least 8 characters.");
        return;
    }

    try {
        await signupAccount(username, password);
        notify("Account created!", true);
        setTimeout(() => location.href = "index.html", 600);
    } catch (e) {
        notify(e.message);
    }
};

// LOGIN
document.getElementById("loginBtn").onclick = async () => {
    const username = user.value.trim();
    const password = pass.value;

    if (!isValidUsername(username)) {
        notify("Username must be at least 3 characters and contain only letters and numbers.");
        return;
    }

    // No password length check for login — allow existing accounts
    try {
        await loginAccount(username, password);
        notify("Logged in!", true);
        setTimeout(() => location.href = "index.html", 600);
    } catch {
        notify("Invalid username or password");
    }
};
