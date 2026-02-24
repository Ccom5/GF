async function loadHTML(id, url) {
    const res = await fetch(url);
    document.getElementById(id).innerHTML = await res.text();
}

Promise.all([
    loadHTML("header", "/includes/header.html"),
    loadHTML("side-menu", "/includes/side-menu.html")
]).then(() => {
    if (window.app && typeof window.app.initMenu === "function") {
        window.app.initMenu();
    }
});