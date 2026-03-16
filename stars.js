document.addEventListener("DOMContentLoaded", () => {
    // Generate Stars
    const numStars = 150;
    const body = document.body;
    for (let i = 0; i < numStars; i++) {
        const star = document.createElement("div");
        star.classList.add("star");
        star.style.width = Math.random() * 3 + "px";
        star.style.height = star.style.width;
        star.style.left = Math.random() * 100 + "vw";
        star.style.top = Math.random() * 100 + "vh";
        star.style.setProperty("--duration", (Math.random() * 3 + 2) + "s");
        body.appendChild(star);
    }

    // Custom Cursor
    const cursor = document.createElement("div");
    cursor.classList.add("cursor-dot");
    body.appendChild(cursor);

    document.addEventListener("mousemove", (e) => {
        cursor.style.left = e.clientX + "px";
        cursor.style.top = e.clientY + "px";
    });

    // Cursor hover effect using event delegation
    document.addEventListener("mouseover", (e) => {
        const target = e.target;
        if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button') || target.classList.contains('glass') || target.closest('.glass')) {
            cursor.style.transform = "translate(-50%, -50%) scale(1.5)";
            cursor.style.backgroundColor = "transparent";
            cursor.style.border = "2px solid var(--pink)";
            cursor.style.boxShadow = "0 0 15px var(--pink)";
        }
    });

    document.addEventListener("mouseout", (e) => {
        const target = e.target;
        if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button') || target.classList.contains('glass') || target.closest('.glass')) {
            cursor.style.transform = "translate(-50%, -50%) scale(1)";
            cursor.style.backgroundColor = "var(--cyan)";
            cursor.style.border = "none";
            cursor.style.boxShadow = "0 0 15px var(--cyan), 0 0 30px var(--cyan)";
        }
    });
});
