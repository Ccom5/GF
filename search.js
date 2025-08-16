// Funcionalidad de búsqueda del sitio
class SiteSearch {
    constructor() {
        // Detectar la base URL del sitio
        this.baseUrl = this.getBaseUrl();
        
        this.searchData = [
            {
                title: "El Regalo Escondido",
                page: "Inicio",
                url: "index.html",
                excerpt: "Entre las sombras y la luz existe un hilo invisible. Une tus pasos con algo más grande que tú.",
                content: "regalo escondido manuscrito destello hilo invitación tiempo murmullo simple extraordinario cotidiano obsequio llave mirar vivir palabras tesoro oculto"
            },
            {
                title: "Tu Voz Importa",
                page: "Inicio", 
                url: "index.html",
                excerpt: "Si te apasionan las historias que no solo entretienen, sino que también hacen pensar, estas en el lugar correcto",
                content: "voz importa historias entretienen pensar lugar correcto imaginar futuros posibles cambiar presente únete comparte experiencias explora obras narrativas reflexión imaginación"
            },
            {
                title: "Libros y Obras",
                page: "Libros",
                url: "page/obras.html", 
                excerpt: "Descubre mis obras literarias, ensayos, relatos y reflexiones sobre la palabra, la imaginación y el futuro.",
                content: "libros obras literarias ensayos relatos reflexiones palabra imaginación futuro literatura ficción ética filosófica"
            },
            {
                title: "Blog y Entradas",
                page: "Blog",
                url: "page/blog-entradas.html",
                excerpt: "Reflexiones, artículos y pensamientos sobre escritura, filosofía y vida.",
                content: "blog entradas reflexiones artículos pensamientos escritura filosofía vida posts publicaciones"
            },
            {
                title: "Quién soy",
                page: "Quién soy", 
                url: "page/definiciones.html",
                excerpt: "Conoce más sobre mi trayectoria como escritor y filósofo.",
                content: "quien soy biografia trayectoria escritor filósofo autor perfil personal historia vida"
            },
            {
                title: "Contacto",
                page: "Contacto",
                url: "page/form.html",
                excerpt: "Ponte en contacto conmigo para comentarios, consultas o colaboraciones.",
                content: "contacto formulario email correo consultas comentarios colaboraciones comunicación"
            },
            {
                title: "Crónicas",
                page: "Crónicas",
                url: "page/Cronicas.html",
                excerpt: "Crónicas y relatos sobre experiencias y reflexiones de vida.",
                content: "cronicas relatos experiencias reflexiones vida historias personales"
            },
            {
                title: "Saber",
                page: "Saber",
                url: "page/saber.html", 
                excerpt: "Reflexiones sobre el conocimiento, la sabiduría y el aprendizaje.",
                content: "saber conocimiento sabiduría aprendizaje filosofía educación reflexiones"
            },
            {
                title: "Entrada 1",
                page: "Blog",
                url: "page/entrada-1.html",
                excerpt: "Primera entrada del blog con reflexiones sobre escritura.",
                content: "entrada blog reflexiones escritura primera post artículo"
            },
            {
                title: "Entrada 2", 
                page: "Blog",
                url: "page/entrada-2.html",
                excerpt: "Segunda entrada del blog con pensamientos sobre filosofía.",
                content: "entrada blog pensamientos filosofía segunda post artículo"
            },
            {
                title: "Carousel",
                page: "Galería",
                url: "page/carousel.html",
                excerpt: "Galería visual de obras y proyectos.",
                content: "carousel galería visual obras proyectos imágenes"
            }
        ];

        this.init();
    }

    // Método para detectar la base URL del sitio
    getBaseUrl() {
        const currentPath = window.location.pathname;
        
        // Detectar si estamos en un subdirectorio
        // Buscar hasta encontrar donde está index.html
        const pathSegments = currentPath.split('/').filter(segment => segment !== '');
        
        // Si el path actual termina en .html, quitar el archivo
        if (currentPath.endsWith('.html')) {
            pathSegments.pop();
        }
        
        // Construir la base URL
        if (pathSegments.length === 0) {
            return '/'; // Raíz del dominio
        } else {
            // Si hay un directorio como 'GFerre' en la ruta
            const basePath = '/' + pathSegments[0] + '/';
            return basePath;
        }
    }

    // Método para construir URL correcta
    buildUrl(relativePath) {
        // Si la URL ya es absoluta o comienza con /, devolverla tal como está
        if (relativePath.startsWith('http') || relativePath.startsWith('/')) {
            return relativePath;
        }
        
        // Obtener el directorio actual
        const currentPath = window.location.pathname;
        const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
        
        // Si estamos en el directorio raíz del sitio (donde está index.html)
        if (currentDir.endsWith('/GFerre/') || (currentDir === '/' && !currentPath.includes('/page/'))) {
            // Estamos en la raíz del sitio, usar la ruta relativa directamente
            return relativePath;
        } else {
            // Estamos en un subdirectorio, necesitamos volver a la raíz
            return '../' + relativePath;
        }
    }

    init() {
        this.createSearchElements();
        this.bindEvents();
    }

    createSearchElements() {
        // Crear el modal de búsqueda si no existe
        if (!document.getElementById('searchModal')) {
            const modalHTML = `
                <div id="searchModal" class="search-modal">
                    <div class="search-modal-content">
                        <div class="search-modal-header">
                            <h2>Buscar en el sitio</h2>
                            <button class="search-close" id="closeSearch">×</button>
                        </div>
                        <div class="search-input-container">
                            <input 
                                type="text" 
                                id="searchInput" 
                                class="search-input" 
                                placeholder="Escribe para buscar..."
                                autocomplete="off"
                            >
                        </div>
                        <div id="searchResults" class="search-results">
                            <div class="no-results">
                                Escribe algo para comenzar la búsqueda...
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    bindEvents() {
        // Evento para abrir búsqueda
        const searchToggle = document.getElementById('searchToggle');
        if (searchToggle) {
            searchToggle.addEventListener('click', () => this.openSearch());
        }

        // Evento para cerrar búsqueda
        const closeSearch = document.getElementById('closeSearch');
        if (closeSearch) {
            closeSearch.addEventListener('click', () => this.closeSearch());
        }

        // Cerrar con escape o click fuera
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSearch();
            }
        });

        const modal = document.getElementById('searchModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeSearch();
                }
            });
        }

        // Evento de búsqueda en tiempo real
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.performSearch(e.target.value);
            });
        }
    }

    openSearch() {
        const modal = document.getElementById('searchModal');
        const input = document.getElementById('searchInput');
        
        if (modal && input) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus en el input después de un pequeño delay para que la animación se vea bien
            setTimeout(() => {
                input.focus();
            }, 100);
        }
    }

    closeSearch() {
        const modal = document.getElementById('searchModal');
        const input = document.getElementById('searchInput');
        
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        if (input) {
            input.value = '';
            this.clearResults();
        }
    }

    performSearch(query) {
        const resultsContainer = document.getElementById('searchResults');
        
        if (!query.trim()) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    Escribe algo para comenzar la búsqueda...
                </div>
            `;
            return;
        }

        const results = this.search(query);
        this.displayResults(results, query);
    }

    search(query) {
        const searchTerm = query.toLowerCase().trim();
        const words = searchTerm.split(/\s+/);
        
        return this.searchData
            .map(item => {
                let score = 0;
                const titleLower = item.title.toLowerCase();
                const contentLower = item.content.toLowerCase();
                const excerptLower = item.excerpt.toLowerCase();
                
                // Búsqueda exacta en título (puntuación alta)
                if (titleLower.includes(searchTerm)) {
                    score += 10;
                }
                
                // Búsqueda por palabras en título
                words.forEach(word => {
                    if (titleLower.includes(word)) {
                        score += 5;
                    }
                });
                
                // Búsqueda en contenido
                words.forEach(word => {
                    if (contentLower.includes(word)) {
                        score += 2;
                    }
                });
                
                // Búsqueda en excerpt
                words.forEach(word => {
                    if (excerptLower.includes(word)) {
                        score += 3;
                    }
                });
                
                return { ...item, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score);
    }

    displayResults(results, query) {
        const resultsContainer = document.getElementById('searchResults');
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    No se encontraron resultados para "<strong>${this.escapeHtml(query)}</strong>"
                </div>
            `;
            return;
        }

        const resultsHTML = results.map(result => {
            const highlightedTitle = this.highlightTerms(result.title, query);
            const highlightedExcerpt = this.highlightTerms(result.excerpt, query);
            // Construir la URL correcta basándonos en la ubicación actual
            let correctUrl = result.url;
            
            // Si no es una URL absoluta, construirla correctamente
            if (!result.url.startsWith('http') && !result.url.startsWith('/')) {
                const currentPath = window.location.pathname;
                
                // Si estamos en una página dentro del directorio /page/
                if (currentPath.includes('/page/')) {
                    correctUrl = '../' + result.url;
                } else {
                    // Estamos en la raíz del sitio
                    correctUrl = result.url;
                }
            }
            
            return `
                <div class="search-result-item">
                    <a href="${correctUrl}">
                        <div class="search-result-title">${highlightedTitle}</div>
                        <div class="search-result-page">${result.page}</div>
                        <div class="search-result-excerpt">${highlightedExcerpt}</div>
                    </a>
                </div>
            `;
        }).join('');

        resultsContainer.innerHTML = resultsHTML;
    }

    highlightTerms(text, query) {
        const words = query.toLowerCase().trim().split(/\s+/);
        let highlightedText = text;
        
        words.forEach(word => {
            if (word.length > 2) { // Solo resaltar palabras de más de 2 caracteres
                const regex = new RegExp(`(${this.escapeRegExp(word)})`, 'gi');
                highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
            }
        });
        
        return highlightedText;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    clearResults() {
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    Escribe algo para comenzar la búsqueda...
                </div>
            `;
        }
    }
}

// Inicializar la búsqueda cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.siteSearch = new SiteSearch();
});
