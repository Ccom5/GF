document.addEventListener("DOMContentLoaded", function () {
    const articles = document.querySelectorAll(".blog-entry-card");

    articles.forEach((article) => {
        const dateElement = article.querySelector(".post-meta time, .entry-date");

        if (dateElement) {
            const dateString = dateElement.getAttribute("datetime") || dateElement.textContent.trim();
            const date = new Date(dateString);

            if (!isNaN(date.getTime())) {
                const formattedDate = window.ResonanciasUtils.formatDate(date);

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
