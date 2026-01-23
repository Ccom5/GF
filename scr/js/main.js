/**
 * RESONANCIAS - JavaScript Principal
 * Funcionalidades: Menú, búsqueda, acordeón, responsive, interactividad
 */

class ResonanciasApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMobileMenu();
        this.setupAccordion();
        this.setupSearch();
        this.setupShareButtons();
        this.setupScrollEffects();
        this.setupKeyboardNavigation();
        this.setupCardTTS(); // Initialize card TTS functionality
        this.setupChapterHighlighting(); // Setup chapter highlighting
        console.log('RESONANCIAS - Sitio cargado correctamente');
    }

    /**
     * Configurar event listeners principales
     */
    setupEventListeners() {
        // Menú móvil
        const hamburgerBtn = document.querySelector('.hamburger-btn');
        const sideMenu = document.querySelector('.side-menu');
        const menuOverlay = document.querySelector('.menu-overlay');
        const closeBtn = document.querySelector('.close-btn');

        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', () => { console.log('Hamburger button clicked!'); this.toggleMobileMenu(); });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeMobileMenu());
        }

        if (menuOverlay) {
            menuOverlay.addEventListener('click', () => this.closeMobileMenu());
        }

        // Búsqueda
        const searchToggle = document.querySelector('#searchToggle');

        if (searchToggle) {
            searchToggle.addEventListener('click', () => this.openSearch());
        }

        // Escape key para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
                this.closeSearch();
            }
        });

        // Resize handler
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Configurar menú móvil
     */
    setupMobileMenu() {
        const sideMenu = document.querySelector('.side-menu');
        const menuOverlay = document.querySelector('.menu-overlay');

        // Prevenir scroll del body cuando el menú está abierto
        this.preventBodyScroll = (prevent) => {
            if (prevent) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        };
    }

    /**
     * Alternar menú móvil
     */
    toggleMobileMenu() {
        const hamburgerBtn = document.querySelector('.hamburger-btn');
        const sideMenu = document.querySelector('.side-menu');
        const menuOverlay = document.querySelector('.menu-overlay');
        
        const isOpen = sideMenu.classList.contains('active');
        
        if (isOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    /**
     * Abrir menú móvil
     */
    openMobileMenu() {
        const hamburgerBtn = document.querySelector('.hamburger-btn');
        const sideMenu = document.querySelector('.side-menu');
        const menuOverlay = document.querySelector('.menu-overlay');

        if (sideMenu) sideMenu.classList.add('active');
        if (menuOverlay) menuOverlay.classList.add('active');
        if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'true');
        
        this.preventBodyScroll(true);

        // Focus en el primer elemento del menú
        setTimeout(() => {
            const firstMenuItem = sideMenu.querySelector('a, button');
            if (firstMenuItem) firstMenuItem.focus();
        }, 300);
    }

    /**
     * Cerrar menú móvil
     */
    closeMobileMenu() {
        const hamburgerBtn = document.querySelector('.hamburger-btn');
        const sideMenu = document.querySelector('.side-menu');
        const menuOverlay = document.querySelector('.menu-overlay');

        if (sideMenu) sideMenu.classList.remove('active');
        if (menuOverlay) menuOverlay.classList.remove('active');
        if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
        
        this.preventBodyScroll(false);

        // Devolver focus al botón hamburguesa
        if (hamburgerBtn) hamburgerBtn.focus();
    }

    /**
     * Configurar acordeón del menú
     */
    setupAccordion() {
        const accordionToggles = document.querySelectorAll('.accordion-toggle');

        accordionToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                this.toggleAccordion(toggle);
            });
        });
    }

    /**
     * Alternar acordeón
     */
    toggleAccordion(toggle) {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        const content = toggle.parentElement.nextElementSibling;

        // Cerrar otros acordeones
        document.querySelectorAll('.accordion-toggle').forEach(otherToggle => {
            if (otherToggle !== toggle) {
                otherToggle.setAttribute('aria-expanded', 'false');
                const otherContent = otherToggle.parentElement.nextElementSibling;
                if (otherContent) otherContent.classList.remove('active');
            }
        });

        // Alternar el acordeón actual
        toggle.setAttribute('aria-expanded', !isExpanded);
        if (content) {
            content.classList.toggle('active', !isExpanded);
        }
    }

    /**
     * Configurar búsqueda
     */
    setupSearch() {
        this.searchData = this.createSearchIndex();
        // Crear modal de búsqueda si no existe
        this.createSearchModal();
    }

    /**
     * Crear modal de búsqueda
     */
    createSearchModal() {
        // Verificar si ya existe
        if (document.querySelector('#searchModal')) return;

        const searchModal = document.createElement('div');
        searchModal.id = 'searchModal';
        searchModal.className = 'search-modal';
        searchModal.setAttribute('aria-hidden', 'true');
        searchModal.innerHTML = `
            <div class="search-modal-content">
                <div class="search-header">
                    <h2>Buscar en RESONANCIAS</h2>
                    <button class="search-close" aria-label="Cerrar búsqueda">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="search-input-container">
                    <input type="text" id="searchInput" placeholder="¿Qué estás buscando?" autocomplete="off">
                    <button id="searchButton" aria-label="Buscar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="M21 21L16.65 16.65"></path>
                        </svg>
                    </button>
                </div>
                <div id="searchResults" class="search-results"></div>
            </div>
        `;

        // Agregar estilos para el modal
        const modalStyles = document.createElement('style');
        modalStyles.textContent = `
            .search-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .search-modal.active {
                opacity: 1;
                visibility: visible;
            }
            
            .search-modal-content {
                background: var(--color-light);
                border-radius: 12px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            
            .search-modal.active .search-modal-content {
                transform: scale(1);
            }
            
            .search-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid var(--color-mid);
            }
            
            .search-header h2 {
                margin: 0;
                color: var(--color-dark);
            }
            
            .search-close {
                background: none;
                border: none;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .search-close:hover {
                background: var(--color-mid);
            }
            
            .search-input-container {
                display: flex;
                padding: 1.5rem;
                border-bottom: 1px solid var(--color-mid);
            }
            
            #searchInput {
                flex: 1;
                padding: 0.75rem;
                border: 2px solid var(--color-mid);
                border-radius: 8px;
                font-size: 1rem;
                margin-right: 0.5rem;
            }
            
            #searchInput:focus {
                outline: none;
                border-color: var(--color-secondary);
            }
            
            #searchButton {
                padding: 0.75rem;
                background: var(--color-secondary);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            #searchButton:hover {
                background: var(--color-primary);
            }
            
            .search-results {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .search-result-item:hover {
                background: var(--color-mid);
            }
        `;

        document.head.appendChild(modalStyles);
        document.body.appendChild(searchModal);

        // Configurar eventos del modal
        const searchClose = searchModal.querySelector('.search-close');
        const searchInput = searchModal.querySelector('#searchInput');
        const searchButton = searchModal.querySelector('#searchButton');

        if (searchClose) {
            searchClose.addEventListener('click', () => this.closeSearch());
        }

        if (searchModal) {
            searchModal.addEventListener('click', (e) => {
                if (e.target === searchModal) this.closeSearch();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
        }

        if (searchButton) {
            searchButton.addEventListener('click', () => this.performSearch());
        }

        this.searchResults = searchModal.querySelector('#searchResults');
    }

    /**
     * Crear índice de búsqueda
     */
    createSearchIndex() {
        return [
            {
                title: 'Inicio',
                content: 'Imagina Crea Comparte Descubre la Ficción Ética Filosófica',
                url: '../../index.html',
                type: 'página'
            },
            {
                title: 'Crónicas de la Expiación',
                content: 'sentimientos mercancía dolor transa activo financiero alegoría inquietante ética memoria resistencia',
                url: 'cronicas.html',
                type: 'obra'
            },
            {
                title: 'Blog',
                content: 'Pensamiento notas investigaciones ensayos literatura sin filtro lenguaje identidad cultura',
                url: '../blog.html',
                type: 'página'
            },
            {
                title: 'Literatura sin filtro',
                content: 'categorizado cuantificado vendido algoritmos recomendaciones géneros diseñados satisfacer nichos',
                url: '../blog-literatura.html',
                type: 'entrada'
            },
            {
                title: 'Lenguaje, identidad y cultura social',
                content: 'palabras herramientas comunicarnos ladrillos construyendo realidad habitamos charla signos',
                url: '../blog-lenguaje.html',
                type: 'entrada'
            },
            {
                title: 'Quién soy',
                content: 'Gabriel Ferré autor escritor filosofía literatura ética pensamiento libre',
                url: '../quien-soy.html',
                type: 'página'
            },
            {
                title: 'Contacto',
                content: 'formulario contacto comunicarse autor escribir mensaje consulta',
                url: '../contacto.html',
                type: 'página'
            }
        ];
    }

    /**
     * Abrir búsqueda
     */
    openSearch() {
        const searchModal = document.querySelector('#searchModal');
        const searchInput = document.querySelector('#searchInput');
        const searchToggle = document.querySelector('#searchToggle');

        if (searchModal) {
            searchModal.classList.add('active');
            searchModal.setAttribute('aria-hidden', 'false');
            if (searchToggle) searchToggle.setAttribute('aria-expanded', 'true');
        }

        // Focus en el input de búsqueda
        setTimeout(() => {
            if (searchInput) searchInput.focus();
        }, 300);

        this.preventBodyScroll(true);
    }

    /**
     * Cerrar búsqueda
     */
    closeSearch() {
        const searchModal = document.querySelector('#searchModal');
        const searchToggle = document.querySelector('#searchToggle');

        if (searchModal) {
            searchModal.classList.remove('active');
            searchModal.setAttribute('aria-hidden', 'true');
            if (searchToggle) searchToggle.setAttribute('aria-expanded', 'false');
        }

        this.preventBodyScroll(false);

        // Devolver focus al botón de búsqueda
        if (searchToggle) searchToggle.focus();
    }

    /**
     * Manejar búsqueda en tiempo real
     */
    handleSearch(query) {
        if (!query.trim()) {
            this.showNoResults();
            return;
        }

        if (query.length < 2) {
            this.showNoResults('Escribe al menos 2 caracteres...');
            return;
        }

        const results = this.performSearchQuery(query);
        this.displaySearchResults(results, query);
    }

    /**
     * Realizar búsqueda
     */
    performSearch() {
        const searchInput = document.querySelector('#searchInput');
        if (searchInput) {
            this.handleSearch(searchInput.value);
        }
    }

    /**
     * Ejecutar consulta de búsqueda
     */
    performSearchQuery(query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
        
        return this.searchData.filter(item => {
            const searchableText = `${item.title} ${item.content}`.toLowerCase();
            return searchTerms.some(term => searchableText.includes(term));
        }).sort((a, b) => {
            // Priorizar coincidencias en el título
            const aInTitle = a.title.toLowerCase().includes(query.toLowerCase());
            const bInTitle = b.title.toLowerCase().includes(query.toLowerCase());
            
            if (aInTitle && !bInTitle) return -1;
            if (!aInTitle && bInTitle) return 1;
            return 0;
        });
    }

    /**
     * Mostrar resultados de búsqueda
     */
    displaySearchResults(results, query) {
        if (!this.searchResults) return;

        if (results.length === 0) {
            this.showNoResults(`No se encontraron resultados para "${query}"`);
            return;
        }

        const resultsHTML = results.map(result => `
            <div class="search-result-item" style="padding: 1rem; border-bottom: 1px solid var(--color-mid); cursor: pointer;" 
                 onclick="window.location.href='${result.url}'">
                <h4 style="margin-bottom: 0.5rem; color: var(--color-secondary);">${result.title}</h4>
                <p style="margin-bottom: 0.5rem; color: var(--color-dark); font-size: 0.9rem;">
                    ${this.highlightSearchTerms(result.content.substring(0, 150), query)}...
                </p>
                <span style="font-size: 0.8rem; color: var(--color-warm); text-transform: uppercase;">
                    ${result.type}
                </span>
            </div>
        `).join('');

        this.searchResults.innerHTML = `
            <div style="padding: 1rem; background: var(--color-primary); margin-bottom: 1rem; border-radius: 8px;">
                <strong>${results.length} resultado${results.length !== 1 ? 's' : ''} para "${query}"</strong>
            </div>
            ${resultsHTML}
        `;
    }

    /**
     * Resaltar términos de búsqueda
     */
    highlightSearchTerms(text, query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
        let highlightedText = text;

        searchTerms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark style="background: var(--color-accent); padding: 0 2px;">$1</mark>');
        });

        return highlightedText;
    }

    /**
     * Mostrar mensaje sin resultados
     */
    showNoResults(message = 'Escribe algo para comenzar la búsqueda...') {
        if (this.searchResults) {
            this.searchResults.innerHTML = `
                <div class="no-results" style="text-align: center; color: var(--color-warm); padding: 2rem;">
                    ${message}
                </div>
            `;
        }
    }

    /**
     * Configurar botones de compartir
     */
    setupShareButtons() {
        const shareButtons = document.querySelectorAll('.share-btn');
        const currentUrl = encodeURIComponent(window.location.href);
        const currentTitle = encodeURIComponent(document.title);

        shareButtons.forEach(btn => {
            const href = btn.getAttribute('href');
            
            if (btn.classList.contains('facebook')) {
                btn.setAttribute('href', `${href}${currentUrl}`);
            } else if (btn.classList.contains('twitter')) {
                btn.setAttribute('href', `${href}${currentUrl}&text=${currentTitle}`);
            } else if (btn.classList.contains('whatsapp')) {
                btn.setAttribute('href', `${href}${currentTitle} ${currentUrl}`);
            } else if (btn.classList.contains('telegram')) {
                btn.setAttribute('href', `${href}${currentUrl}&text=${currentTitle}`);
            }
        });
    }

    /**
     * Configurar efectos de scroll
     */
    setupScrollEffects() {
        // Observador de intersección para animaciones
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observar elementos animables
        document.querySelectorAll('.work-card, .guide-card, .welcome-section, .featured-works').forEach(el => {
            observer.observe(el);
        });

        // Header transparente/sólido según scroll
        let lastScrollTop = 0;
        const header = document.querySelector('.header');

        if (header) {
            window.addEventListener('scroll', () => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                if (scrollTop > 100) {
                    header.style.background = 'rgba(34, 31, 28, 0.98)';
                } else {
                    header.style.background = 'rgba(34, 31, 28, 0.95)';
                }

                lastScrollTop = scrollTop;
            }, { passive: true });
        }
    }

    /**
     * Configurar navegación por teclado
     */
    setupKeyboardNavigation() {
        // Navegación por Tab mejorada
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Focus trap para modales
        this.setupFocusTrap();
    }

    /**
     * Configurar focus trap para modales
     */
    setupFocusTrap() {
        const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

        const trapFocus = (modal) => {
            const focusableContent = modal.querySelectorAll(focusableElements);
            const firstFocusableElement = focusableContent[0];
            const lastFocusableElement = focusableContent[focusableContent.length - 1];

            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstFocusableElement) {
                            lastFocusableElement.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastFocusableElement) {
                            firstFocusableElement.focus();
                            e.preventDefault();
                        }
                    }
                }
            });
        };

        // Aplicar focus trap a modales
        const searchModal = document.querySelector('#searchModal');
        const sideMenu = document.querySelector('.side-menu');

        if (searchModal) trapFocus(searchModal);
        if (sideMenu) trapFocus(sideMenu);
    }

    /**
     * Manejar redimensionamiento de ventana
     */
    handleResize() {
        // Cerrar menú móvil si la ventana se hace más grande
        if (window.innerWidth > 768) {
            this.closeMobileMenu();
        }

        // Ajustar altura del hero en móviles
        this.adjustMobileViewport();
    }

    /**
     * Ajustar viewport en móviles
     */
    adjustMobileViewport() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    /**
     * Limpiar texto para TTS
     */
    cleanCardText(text) {
        // Crear div temporal para parsear HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;

        // Remover scripts y estilos
        tempDiv.querySelectorAll('script, style, .voice-icon, .voice-container, .tts-active-indicator').forEach(el => el.remove());

        // Obtener texto limpio
        let cleanedText = tempDiv.textContent;

        return cleanedText
            .replace(/\s+/g, ' ')
            .replace(/—/g, ', ')
            .replace(/\n/g, ' ')
            .replace(/\.\s*\./g, '.')
            .replace(/[–—]/g, '-')
            .replace(/[­​﻿]/g, '')
            .replace(/ /g, ' ')
            .trim();
    }

    /**
     * Configurar TTS para tarjetas
     */
    setupCardTTS() {
        const cards = document.querySelectorAll('article.work-card, div.guide-card, article.work-detail, article.blog-entry-card, .book-content > div, blockquote, .contact-info > div, .contact-info details, .obra');
        let activeCardIndicator = null;

        cards.forEach(card => {
            // Agregar indicador de lectura activa
            const indicator = document.createElement('div');
            indicator.className = 'tts-active-indicator';
            card.style.position = 'relative';
            card.appendChild(indicator);

            card.addEventListener('click', (event) => {
                // Evitar que clicks en links/botones activen TTS
                let targetElement = event.target;
                let isLinkOrButton = false;
                
                while (targetElement && targetElement !== card) {
                    if (targetElement.tagName === 'A' || 
                        targetElement.tagName === 'BUTTON' || 
                        targetElement.classList.contains('voice-icon') ||
                        targetElement.classList.contains('tts-active-indicator')) {
                        isLinkOrButton = true;
                        break;
                    }
                    targetElement = targetElement.parentElement;
                }

                if (isLinkOrButton) {
                    return;
                }

                // Verificar que el sistema TTS esté disponible
                if (!window.ttsSystem) {
                    console.warn('Sistema de texto a voz no disponible');
                    return;
                }

                const cardText = this.cleanCardText(card.textContent);

                if (window.ttsSystem.isPlaying && activeCardIndicator === card) {
                    // Si esta tarjeta está hablando, detenerla
                    window.ttsSystem.stopReading();
                } else {
                    // Si otra tarjeta está hablando, detenerla primero
                    if (window.ttsSystem.isPlaying) {
                        window.ttsSystem.stopReading();
                    }
                    
                    // Iniciar lectura de esta tarjeta
                    if (cardText.trim()) {
                        window.ttsSystem.readText(cardText);
                        
                        // Actualizar indicador visual
                        if (activeCardIndicator) {
                            activeCardIndicator.querySelector('.tts-active-indicator').classList.remove('active');
                        }
                        card.querySelector('.tts-active-indicator').classList.add('active');
                        activeCardIndicator = card;
                    }
                }
            });
        });

        // Escuchar evento global de parada de TTS
        document.addEventListener('tts-stopped', () => {
            if (activeCardIndicator) {
                activeCardIndicator.querySelector('.tts-active-indicator').classList.remove('active');
                activeCardIndicator = null;
            }
        });
    }

    /**
     * Configurar el resaltado del capítulo activo en el índice lateral.
     */
    setupChapterHighlighting() {
        const chapterSections = document.querySelectorAll('.book-content .chapter');
        const chapterLinks = document.querySelectorAll('.chapter-list a');

        if (chapterSections.length === 0 || chapterLinks.length === 0) {
            return; // No hay capítulos o índice para resaltar
        }

        const observerOptions = {
            root: null, // viewport
            rootMargin: '0px 0px -50% 0px', // Cuando el 50% del elemento está visible
            threshold: 0 // Dispara cuando el elemento entra o sale del viewport
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const currentChapterId = entry.target.id;
                    chapterLinks.forEach(link => {
                        if (link.getAttribute('href') === `#${currentChapterId}`) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                }
            });
        }, observerOptions);

        chapterSections.forEach(section => {
            observer.observe(section);
        });

        // Resaltar el capítulo inicial al cargar la página
        // Esto es útil si la página se carga con un hash en la URL o si el primer capítulo ya está visible
        const highlightInitialChapter = () => {
            let foundActive = false;
            for (let i = 0; i < chapterSections.length; i++) {
                const section = chapterSections[i];
                const rect = section.getBoundingClientRect();
                // Si el capítulo está al menos parcialmente visible en la parte superior de la ventana
                if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                    const currentChapterId = section.id;
                    chapterLinks.forEach(link => {
                        if (link.getAttribute('href') === `#${currentChapterId}`) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                    foundActive = true;
                    break;
                }
            }
            // Si no se encontró ningún capítulo activo (ej. al inicio de la página), activar el primero
            if (!foundActive && chapterLinks.length > 0) {
                chapterLinks[0].classList.add('active');
            }
        };

        // Ejecutar al cargar la página para establecer el estado inicial
        window.addEventListener('load', highlightInitialChapter);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ResonanciasApp();
});

// Funciones globales de utilidad
window.ResonanciasUtils = {
    /**
     * Formatear fecha
     */
    formatDate: (date) => {
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    },

    /**
     * Debounce function
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Smooth scroll to element
     */
    scrollTo: (element, offset = 0) => {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (target) {
            const targetPosition = target.offsetTop - offset - 80; // 80px para el header
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    },

    /**
     * Copy text to clipboard
     */
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Error al copiar al portapapeles:', err);
            return false;
        }
    }
};
