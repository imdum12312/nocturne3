const WELCOME_KEY = "nocturne-welcome-shown";

export function initWelcome() {
    const welcomeBanner = document.getElementById("welcomeBanner");
    const closeBtn = document.querySelector(".welcome-close");

    if (!welcomeBanner || !closeBtn) return;

    const hasShownWelcome = localStorage.getItem(WELCOME_KEY) === "true";

    if (hasShownWelcome) {
        welcomeBanner.classList.add("hidden");
    }

    function closeWelcome() {
        welcomeBanner.style.animation = "slideDown 0.3s var(--ease) reverse forwards";
        setTimeout(() => {
            welcomeBanner.classList.add("hidden");
            localStorage.setItem(WELCOME_KEY, "true");
        }, 300);
    }

    closeBtn.addEventListener("click", closeWelcome);
    welcomeBanner.addEventListener("click", (e) => {
        if (e.target === welcomeBanner) closeWelcome();
    });
}
