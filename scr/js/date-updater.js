document.addEventListener("DOMContentLoaded", function () {
    const articles = document.querySelectorAll(".blog-entry-card");

    articles.forEach((article) => {
        const dateElement = article.querySelector(".post-meta time, .entry-date");

        if (dateElement) {
            const dateString = dateElement.getAttribute("datetime") || dateElement.textContent.trim();
            const date = new Date(dateString);

            if (!isNaN(date.getTime())) {
    // Static date as requested
    const formattedDate = "jueves, 22 de enero de 2026";

                let displayElement = article.querySelector(".entry-date");
                if (!displayElement) {
                    // Si no hay un elemento específico para la fecha, la actualizamos donde la encontramos
                    dateElement.textContent = `📅 ${formattedDate}`;
                } else {
                    displayElement.textContent = `📅 ${formattedDate}`;
                }
            }
        }
    });
});
