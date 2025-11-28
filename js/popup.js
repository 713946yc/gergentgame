export function showPopup(type, title, desc = "") {
    const container = document.getElementById("popupContainer");
    if (!container) return;

    const el = document.createElement("div");
    el.className = `popup ${type}`;
    el.innerHTML = `
        <div class="popup-title">${title}</div>
        ${desc ? `<div class="popup-desc">${desc}</div>` : ""}
    `;

    container.appendChild(el);

    // Force animation
    requestAnimationFrame(() => {
        el.classList.add("show");
    });

    // Auto-remove after 4 seconds
    setTimeout(() => {
        el.classList.remove("show");
        setTimeout(() => el.remove(), 400);
    }, 4000);
}