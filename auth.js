(function() {
    const uid = localStorage.getItem("uid");
    const username = localStorage.getItem("username");

    // If not logged in, redirect to login page
    if (!uid || !username) {
        window.location.href = "login.html";
    }
})();
