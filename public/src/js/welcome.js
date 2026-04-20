const WELCOME_KEY = "nocturne-welcome-shown";

export function initWelcome() {
    const welcomeBanner = document.getElementById("welcomeBanner");
    const closeBtn = document.querySelector(".welcome-close");

    if (!welcomeBanner || !closeBtn) return;

    const hasShownWelcome = localStorage.getItem(WELCOME_KEY) === "true";

    if (hasShownWelcome) {
        welcomeBanner.classList.add("hidden");
    }

    closeBtn.addEventListener("click", () => {
        welcomeBanner.classList.add("hidden");
        localStorage.setItem(WELCOME_KEY, "true");
    });

    welcomeBanner.addEventListener("click", (e) => {
        if (e.target === welcomeBanner) {
            welcomeBanner.classList.add("hidden");
            localStorage.setItem(WELCOME_KEY, "true");
        }
    });
}
