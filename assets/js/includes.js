async function loadHTML(id, url) {
  // Añadimos un parámetro de tiempo para burlar la caché del navegador
  const cacheBuster = `?v=${new Date().getTime()}`;
  const res = await fetch(url + cacheBuster);
  if (res.ok) {
    document.getElementById(id).innerHTML = await res.text();
  }
}

Promise.all([
  loadHTML("header", "/includes/header.html"),
  loadHTML("side-menu", "/includes/side-menu.html"),
]).then(() => {
  if (window.app && typeof window.app.initMenu === "function") {
    window.app.initMenu();
  }
});
