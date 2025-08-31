/**
 * RESONANCIAS - Funciones de Accesibilidad
 * Incluye: Lectura por voz, ajustes de fuente, alto contraste, etc.
 */

class AccessibilityManager {
    constructor() {
        this.isVoiceEnabled = false;
        this.currentUtterance = null;
        this.speechSynthesis = window.speechSynthesis;
        this.currentFontSize = 1;
        this.isHighContrast = false;
        this.selectedVoice = null;
        this.selectedVoiceIndex = 0;

        // Bindeamos los manejadores de eventos para poder añadirlos y quitarlos correctamente
        this.handleHover = this.handleHover.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.clearHoverTimeout = this.clearHoverTimeout.bind(this);
        this.hoverTimeout = null;

        this.init();
    }

    init() {
        this.loadSettings();
        this.setupVoiceControls();
        this.setupFontControls();
        this.setupContrastControls();
        this.setupTTSControls();
        this.setupVoiceSelection();
        this.setupKeyboardShortcuts();

        console.log("Accessibility Manager cargado");
    }

    /**
     * Cargar configuraciones guardadas
     */
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem("resonancias-accessibility") || "{}");

            this.currentFontSize = settings.fontSize || 1;
            this.isHighContrast = settings.highContrast || false;
            this.isVoiceEnabled = settings.voiceEnabled || false;
            this.selectedVoiceIndex = settings.selectedVoice || 0;

            this.applyFontSize();
            this.applyHighContrast();
            this.updateButtonStates();
        } catch (error) {
            console.warn("Error cargando configuraciones de accesibilidad:", error);
        }
    }

    /**
     * Guardar configuraciones
     */
    saveSettings() {
        try {
            const settings = {
                fontSize: this.currentFontSize,
                highContrast: this.isHighContrast,
                voiceEnabled: this.isVoiceEnabled,
                selectedVoice: this.selectedVoiceIndex
            };

            localStorage.setItem("resonancias-accessibility", JSON.stringify(settings));
        } catch (error) {
            console.warn("Error guardando configuraciones de accesibilidad:", error);
        }
    }

    /**
     * Configurar controles de voz
     */
    setupVoiceControls() {
        const toggleVoiceBtn = document.getElementById("toggle-voice");

        if (toggleVoiceBtn) {
            toggleVoiceBtn.addEventListener("click", () => this.toggleVoice());
        }

        // Detectar cuando las voces están disponibles
        if (this.speechSynthesis) {
            if (this.speechSynthesis.onvoiceschanged !== undefined) {
                this.speechSynthesis.onvoiceschanged = () => this.setupVoices();
            }
            this.setupVoices();
        }
    }

    /**
     * Configurar voces disponibles
     */
    setupVoices() {
        const voices = this.speechSynthesis.getVoices();

        // Priorizar voces en español
        const spanishVoices = voices.filter((voice) => voice.lang.startsWith("es") || voice.lang.startsWith("ES"));

        if (spanishVoices.length > 0) {
            this.selectedVoice = spanishVoices[this.selectedVoiceIndex] || spanishVoices[0];
        } else {
            this.selectedVoice = voices[0] || null;
        }

        console.log("Voces disponibles:", voices.length);
        console.log("Voz seleccionada:", this.selectedVoice?.name);
    }

    /**
     * Configurar selección de voz
     */
    setupVoiceSelection() {
        // Crear selector de voz dinámicamente
        this.createVoiceSelector();
    }

    /**
     * Crear selector de voz mejorado
     */
    createVoiceSelector() {
        const accessibilityControls = document.getElementById("accessibility-controls");
        if (!accessibilityControls) return;

        // Verificar si ya existe el selector para evitar duplicados
        const existingSelector = document.getElementById("voice-selector-container");
        if (existingSelector) {
            existingSelector.remove();
        }

        // Crear contenedor para el selector
        const selectorContainer = document.createElement("div");
        selectorContainer.id = "voice-selector-container";
        selectorContainer.style.cssText = `
            position: relative;
            display: inline-block;
            margin-left: 0.5rem;
        `;

        // Crear botón activador del selector
        const voiceButton = document.createElement("button");
        voiceButton.innerHTML = "🎤";
        voiceButton.className = "accessibility-btn voice-selector-btn";
        voiceButton.title = "Seleccionar voz para lectura";
        voiceButton.setAttribute("aria-label", "Abrir selector de voz");

        // Crear el selector desplegable
        const voiceSelector = document.createElement("select");
        voiceSelector.id = "voice-selector";
        voiceSelector.title = "Seleccionar voz";
        voiceSelector.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            margin-top: 0.25rem;
            padding: 0.5rem;
            border: 1px solid var(--color-mid);
            border-radius: 6px;
            font-size: 0.8rem;
            background: white;
            color: black;
            min-width: 200px;
            max-width: 250px;
            z-index: 1000;
            display: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
        `;

        // Función para poblar las voces
        const populateVoices = () => {
            const voices = this.speechSynthesis.getVoices();
            voiceSelector.innerHTML = "";

            console.log(`Intentando cargar ${voices.length} voces`);

            if (voices.length === 0) {
                const defaultOption = document.createElement("option");
                defaultOption.value = "";
                defaultOption.textContent = "Cargando voces...";
                voiceSelector.appendChild(defaultOption);
                return;
            }

            // Agregar opción por defecto
            const defaultOption = document.createElement("option");
            defaultOption.value = "-1";
            defaultOption.textContent = " Voz del sistema";
            voiceSelector.appendChild(defaultOption);

            // Separar voces en español y otras
            const spanishVoices = [];
            const otherVoices = [];

            voices.forEach((voice, index) => {
                const voiceData = { voice, index };
                if (voice.lang.toLowerCase().startsWith("es")) {
                    spanishVoices.push(voiceData);
                } else {
                    otherVoices.push(voiceData);
                }
            });

            // Agregar voces en español primero
            if (spanishVoices.length > 0) {
                const spanishGroup = document.createElement("optgroup");
                spanishGroup.label = "🇪🇸 Voces en Español";
                spanishVoices.forEach(({ voice, index }) => {
                    const option = document.createElement("option");
                    option.value = index;
                    option.textContent = voice.name;
                    spanishGroup.appendChild(option);
                });
                voiceSelector.appendChild(spanishGroup);
            }

            // Agregar otras voces
            if (otherVoices.length > 0) {
                const otherGroup = document.createElement("optgroup");
                otherGroup.label = "🌐 Otras voces";
                otherVoices.forEach(({ voice, index }) => {
                    const option = document.createElement("option");
                    option.value = index;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    otherGroup.appendChild(option);
                });
                voiceSelector.appendChild(otherGroup);
            }

            // Establecer la voz seleccionada
            if (this.selectedVoiceIndex !== undefined && this.selectedVoiceIndex >= 0) {
                voiceSelector.value = this.selectedVoiceIndex;
            } else {
                voiceSelector.value = "-1";
            }

            console.log(`✅ Cargadas ${voices.length} voces (${spanishVoices.length} en español)`);
        };

        // Manejador de cambio de voz
        voiceSelector.addEventListener("change", (e) => {
            const selectedIndex = parseInt(e.target.value);

            if (selectedIndex === -1) {
                this.selectedVoiceIndex = -1;
                this.selectedVoice = null;
            } else {
                this.selectedVoiceIndex = selectedIndex;
                this.selectedVoice = this.speechSynthesis.getVoices()[selectedIndex];
            }

            this.saveSettings();

            // Ocultar selector después de la selección
            voiceSelector.style.display = "none";

            // Feedback de voz
            if (this.isVoiceEnabled) {
                const voiceName = this.selectedVoice ? this.selectedVoice.name : "voz del sistema";
                setTimeout(() => {
                    this.speak(`Voz cambiada a: ${voiceName}`);
                }, 100);
            }
        });

        // Manejador para mostrar/ocultar el selector
        voiceButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isVisible = voiceSelector.style.display === "block";

            // Cerrar otros selectores abiertos
            document.querySelectorAll(".voice-selector-dropdown").forEach((dropdown) => {
                if (dropdown !== voiceSelector) {
                    dropdown.style.display = "none";
                }
            });

            voiceSelector.style.display = isVisible ? "none" : "block";

            if (!isVisible) {
                populateVoices();
            }
        });

        // Cerrar selector al hacer click fuera
        document.addEventListener("click", (e) => {
            if (!selectorContainer.contains(e.target)) {
                voiceSelector.style.display = "none";
            }
        });

        // Intentar cargar voces de múltiples maneras
        const loadVoices = () => {
            const voices = this.speechSynthesis.getVoices();
            if (voices.length > 0) {
                populateVoices();
                return true;
            }
            return false;
        };

        // Cargar inmediatamente si están disponibles
        if (!loadVoices()) {
            // Esperar al evento de voces cargadas
            this.speechSynthesis.onvoiceschanged = () => {
                loadVoices();
            };

            // Reintentos con delays
            setTimeout(() => loadVoices(), 500);
            setTimeout(() => loadVoices(), 1500);
            setTimeout(() => loadVoices(), 3000);
        }

        // Ensamblar el componente
        selectorContainer.appendChild(voiceButton);
        selectorContainer.appendChild(voiceSelector);
        accessibilityControls.appendChild(selectorContainer);
    }

    /**
     * Alternar lectura por voz
     */
    toggleVoice() {
        if (!this.speechSynthesis) {
            alert("La síntesis de voz no está disponible en este navegador");
            return;
        }

        this.isVoiceEnabled = !this.isVoiceEnabled;

        if (this.isVoiceEnabled) {
            this.startVoiceMode();
        } else {
            this.stopVoiceMode();
        }

        this.updateButtonStates();
        this.saveSettings();
    }

    /**
     * Iniciar modo de voz
     */
    startVoiceMode() {
        console.log("Modo de voz activado");

        // Leer el título de la página
        this.speak("Modo de lectura por voz activado. " + document.title);

        // Agregar listeners para elementos clickeables
        this.addAutoReaderListeners();

        // Mostrar indicador visual
        this.showVoiceIndicator("🎤 Modo de voz activado");
    }

    /**
     * Detener modo de voz
     */
    stopVoiceMode() {
        console.log("Modo de voz desactivado");

        // Detener cualquier lectura en curso
        this.stopSpeaking();

        // Eliminar listeners
        this.removeAutoReaderListeners();

        // Ocultar indicador visual
        this.hideVoiceIndicator();
    }

    /**
     * Leer texto en voz alta
     */
    speak(text, options = {}) {
        if (!this.speechSynthesis || !this.isVoiceEnabled) {
            console.warn("Síntesis de voz no disponible o desactivada");
            return;
        }

        // Detener cualquier lectura anterior
        this.stopSpeaking();

        // Limpiar y preparar el texto
        const cleanText = this.cleanTextForSpeech(text);

        if (!cleanText.trim()) {
            console.warn("Texto vacío para síntesis");
            return;
        }

        // Verificar que hay voces disponibles
        const voices = this.speechSynthesis.getVoices();
        if (voices.length === 0) {
            console.warn("No hay voces disponibles");
            setTimeout(() => this.speak(text, options), 100);
            return;
        }

        // Crear utterance
        this.currentUtterance = new SpeechSynthesisUtterance(cleanText);

        // Configurar parámetros
        this.currentUtterance.rate = options.rate || 0.8;
        this.currentUtterance.pitch = options.pitch || 1;
        this.currentUtterance.volume = options.volume || 0.9;
        this.currentUtterance.lang = "es-ES";

        // Seleccionar voz
        if (this.selectedVoice) {
            this.currentUtterance.voice = this.selectedVoice;
        } else {
            // Buscar voz en español como fallback
            const spanishVoice = voices.find((voice) => voice.lang.includes("es"));
            if (spanishVoice) {
                this.currentUtterance.voice = spanishVoice;
            }
        }

        // Eventos
        this.currentUtterance.onstart = () => {
            console.log("Iniciando lectura:", cleanText.substring(0, 50) + "...");
        };

        this.currentUtterance.onend = () => {
            console.log("Lectura completada");
            this.currentUtterance = null;
        };

        this.currentUtterance.onerror = (event) => {
            console.error("Error en síntesis de voz:", event.error);
            this.currentUtterance = null;
        };

        // Iniciar lectura
        try {
            this.speechSynthesis.speak(this.currentUtterance);
        } catch (error) {
            console.error("Error al iniciar síntesis:", error);
        }
    }

    /**
     * Detener lectura
     */
    stopSpeaking() {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
        this.currentUtterance = null;
    }

    /**
     * Limpiar texto para síntesis de voz
     */
    cleanTextForSpeech(text) {
        return text
            .replace(/\s+/g, " ") // Múltiples espacios a uno
            .replace(/[^\w\s\.,;:!?¡¿áéíóúñüÁÉÍÓÚÑÜ]/g, "") // Caracteres especiales
            .replace(/\b(https?:\/\/[^\s]+)/g, "enlace") // URLs
            .replace(/\b(\w+@\w+\.\w+)/g, "correo electrónico") // Emails
            .replace(/(\d+)/g, (match) => match.split("").join(" ")) // Números separados
            .trim();
    }

    /**
     * Agregar listeners para lectura automática
     */
    addAutoReaderListeners() {
        document.addEventListener("mouseover", this.handleHover);
        document.addEventListener("mouseout", this.clearHoverTimeout);
        document.addEventListener("click", this.handleClick);
        document.addEventListener("focusin", this.handleFocus);
    }

    /**
     * Eliminar listeners de lectura automática
     */
    removeAutoReaderListeners() {
        document.removeEventListener("mouseover", this.handleHover);
        document.removeEventListener("mouseout", this.clearHoverTimeout);
        document.removeEventListener("click", this.handleClick);
        document.removeEventListener("focusin", this.handleFocus);
    }

    /**
     * Manejar hover sobre elementos
     */
    handleHover(e) {
        if (!this.isVoiceEnabled) return;
        const hoverableElements = "h1, h2, h3, p, a, button, .work-content, .guide-content";
        const target = e.target.closest(hoverableElements);
        if (!target) return;

        this.clearHoverTimeout();
        this.hoverTimeout = setTimeout(() => {
            const text = this.getElementText(target);
            if (text) {
                this.speak(text, { rate: 1.1 });
            }
        }, 500); // Esperar 500ms antes de leer
    }

    /**
     * Limpiar timeout de hover
     */
    clearHoverTimeout() {
        clearTimeout(this.hoverTimeout);
    }

    /**
     * Manejar click sobre elementos
     */
    handleClick(e) {
        if (!this.isVoiceEnabled) return;
        
        // Si es una tarjeta con data-tts-card, no procesar aquí
        const ttsCard = e.target.closest('[data-tts-card]');
        if (ttsCard) {
            // Dejar que el sistema TTS maneje las tarjetas
            return;
        }
        
        const target = e.target;
        const text = this.getElementText(target);

        if (text) {
            this.speak(`Clickeado: ${text}`);
        }
    }

    /**
     * Manejar focus sobre elementos
     */
    handleFocus(e) {
        if (!this.isVoiceEnabled) return;
        const target = e.target;
        const text = this.getElementText(target);

        if (text) {
            this.speak(`Enfocado en: ${text}`);
        }
    }

    /**
     * Obtener texto legible de un elemento
     */
    getElementText(element) {
        if (!element) return "";

        // Priorizar texto alternativo para imágenes
        if (element.tagName === "IMG") {
            return element.alt || element.title || "Imagen sin descripción";
        }

        // Para elementos con aria-label
        if (element.getAttribute("aria-label")) {
            return element.getAttribute("aria-label");
        }

        // Para elementos con title
        if (element.title) {
            return element.title;
        }

        // Texto del elemento (solo el texto directo, no de hijos)
        let text = "";
        for (let node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent.trim() + " ";
            }
        }

        // Si no hay texto directo, usar textContent completo
        if (!text.trim()) {
            text = element.textContent || element.innerText || "";
        }

        return text.trim().substring(0, 200); // Limitar longitud
    }

    /**
     * Mostrar indicador visual de voz activa
     */
    showVoiceIndicator() {
        let indicator = document.getElementById("voice-indicator");

        if (!indicator) {
            indicator = document.createElement("div");
            indicator.id = "voice-indicator";
            indicator.innerHTML = "🎤 Modo de voz activo";
            indicator.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--color-secondary);
                color: var(--color-light);
                padding: 1rem 2rem;
                border-radius: 25px;
                z-index: 9999;
                font-weight: bold;
                box-shadow: var(--shadow-lg);
                animation: fadeInOut 3s ease-in-out;
                pointer-events: none;
            `;

            document.body.appendChild(indicator);

            // Remover después de 3 segundos
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 3000);
        }
    }

    /**
     * Ocultar indicador visual
     */
    hideVoiceIndicator() {
        const indicator = document.getElementById("voice-indicator");
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Configurar controles de fuente
     */
    setupFontControls() {
        const increaseFontBtn = document.getElementById("increase-font");
        const decreaseFontBtn = document.getElementById("decrease-font");

        if (increaseFontBtn) {
            increaseFontBtn.addEventListener("click", () => this.increaseFontSize());
        }

        if (decreaseFontBtn) {
            decreaseFontBtn.addEventListener("click", () => this.decreaseFontSize());
        }
    }

    /**
     * Aumentar tamaño de fuente
     */
    increaseFontSize() {
        if (this.currentFontSize < 1.6) {
            this.currentFontSize += 0.2;
            this.applyFontSize();
            this.saveSettings();

            if (this.isVoiceEnabled) {
                this.speak("Tamaño de fuente aumentado");
            }
        }
    }

    /**
     * Disminuir tamaño de fuente
     */
    decreaseFontSize() {
        if (this.currentFontSize > 0.8) {
            this.currentFontSize -= 0.2;
            this.applyFontSize();
            this.saveSettings();

            if (this.isVoiceEnabled) {
                this.speak("Tamaño de fuente disminuido");
            }
        }
    }

    /**
     * Aplicar tamaño de fuente
     */
    applyFontSize() {
        document.documentElement.style.fontSize = `${this.currentFontSize}rem`;
        document.body.classList.remove(
            "font-size-small",
            "font-size-normal",
            "font-size-large",
            "font-size-extra-large"
        );

        if (this.currentFontSize <= 0.9) {
            document.body.classList.add("font-size-small");
        } else if (this.currentFontSize <= 1.1) {
            document.body.classList.add("font-size-normal");
        } else if (this.currentFontSize <= 1.3) {
            document.body.classList.add("font-size-large");
        } else {
            document.body.classList.add("font-size-extra-large");
        }
    }

    /**
     * Configurar controles de contraste
     */
    setupContrastControls() {
        const highContrastBtn = document.getElementById("high-contrast");

        if (highContrastBtn) {
            highContrastBtn.addEventListener("click", () => this.toggleHighContrast());
        }
    }

    /**
     * Alternar alto contraste
     */
    toggleHighContrast() {
        this.isHighContrast = !this.isHighContrast;
        this.applyHighContrast();
        this.saveSettings();

        if (this.isVoiceEnabled) {
            this.speak(this.isHighContrast ? "Alto contraste activado" : "Alto contraste desactivado");
        }
    }

    /**
     * Aplicar alto contraste
     */
    applyHighContrast() {
        if (this.isHighContrast) {
            document.body.classList.add("high-contrast");
        } else {
            document.body.classList.remove("high-contrast");
        }
    }

    /**
     * Configurar controles de TTS (Text-to-Speech)
     */
    setupTTSControls() {
        const ttsPauseBtn = document.getElementById("tts-pause");

        if (ttsPauseBtn) {
            ttsPauseBtn.addEventListener("click", () => this.toggleTTSPause());

            // Actualizar estado del botón basado en eventos del sistema TTS
            document.addEventListener("tts-started", () => {
                this.updateTTSButtonState(ttsPauseBtn, "playing");
            });

            document.addEventListener("tts-stopped", () => {
                this.updateTTSButtonState(ttsPauseBtn, "stopped");
            });
        }
    }

    /**
     * Alternar pausa del sistema TTS
     */
    toggleTTSPause() {
        if (window.ttsSystem) {
            if (window.ttsSystem.isPlaying) {
                if (window.ttsSystem.isPaused) {
                    window.ttsSystem.resumeReading();
                    if (this.isVoiceEnabled) {
                        this.speak("Reanudando lectura");
                    }
                } else {
                    window.ttsSystem.pauseReading();
                    if (this.isVoiceEnabled) {
                        this.speak("Lectura pausada");
                    }
                }
            }
        }
    }

    /**
     * Actualizar estado visual del botón TTS
     */
    updateTTSButtonState(button, state) {
        if (!button) return;

        // Remover clases de estado previas
        button.classList.remove("tts-playing", "tts-paused", "tts-stopped");

        switch (state) {
            case "playing":
                button.classList.add("tts-playing");
                button.innerHTML = "⏸️"; // Pausa
                button.setAttribute("title", "Pausar lectura (Alt + P)");
                button.style.backgroundColor = "rgba(34, 197, 94, 0.2)";
                break;
            case "paused":
            case "stopped":
            default:
                button.classList.add("tts-stopped");
                button.innerHTML = "⏸️"; // Pausa
                button.setAttribute("title", "Pausa suave (Alt + P)");
                button.style.backgroundColor = "";
                break;
        }
    }

    /**
     * Restablecer configuraciones
     */
    resetSettings() {
        this.currentFontSize = 1;
        this.isHighContrast = false;
        this.isVoiceEnabled = false;

        this.applyFontSize();
        this.applyHighContrast();
        this.stopVoiceMode();
        this.updateButtonStates();
        this.saveSettings();

        if (this.isVoiceEnabled) {
            this.speak("Configuraciones restablecidas");
        }
    }

    /**
     * Configurar atajos de teclado
     */
    setupKeyboardShortcuts() {
        document.addEventListener("keydown", (e) => {
            // Alt + V: Alternar voz
            if (e.altKey && e.code === "KeyV") {
                e.preventDefault();
                this.toggleVoice();
            }

            // Alt + Plus: Aumentar fuente
            if (e.altKey && (e.code === "Equal" || e.code === "NumpadAdd")) {
                e.preventDefault();
                this.increaseFontSize();
            }

            // Alt + Minus: Disminuir fuente
            if (e.altKey && (e.code === "Minus" || e.code === "NumpadSubtract")) {
                e.preventDefault();
                this.decreaseFontSize();
            }

            // Alt + C: Alternar contraste
            if (e.altKey && e.code === "KeyC") {
                e.preventDefault();
                this.toggleHighContrast();
            }

            // Alt + P: Pausar/reanudar TTS
            if (e.altKey && e.code === "KeyP") {
                e.preventDefault();
                this.toggleTTSPause();
            }

            // Alt + R: Restablecer
            if (e.altKey && e.code === "KeyR") {
                e.preventDefault();
                this.resetSettings();
            }

            // Escape: Detener lectura
            if (e.code === "Escape" && this.currentUtterance) {
                this.stopSpeaking();
            }
        });
    }

    /**
     * Actualizar estados de botones
     */
    updateButtonStates() {
        const toggleVoiceBtn = document.getElementById("toggle-voice");
        const highContrastBtn = document.getElementById("high-contrast");
        const resetBtn = document.getElementById("reset-settings");

        if (toggleVoiceBtn) {
            toggleVoiceBtn.style.backgroundColor = this.isVoiceEnabled
                ? "var(--color-accent)"
                : "var(--color-secondary)";
            toggleVoiceBtn.setAttribute("aria-pressed", this.isVoiceEnabled);
        }

        if (highContrastBtn) {
            highContrastBtn.style.backgroundColor = this.isHighContrast
                ? "var(--color-accent)"
                : "var(--color-secondary)";
            highContrastBtn.setAttribute("aria-pressed", this.isHighContrast);
        }

        if (resetBtn) {
            resetBtn.addEventListener("click", () => this.resetSettings());
        }
    }
}

// Inicializar el gestor de accesibilidad
document.addEventListener("DOMContentLoaded", () => {
    window.accessibilityManager = new AccessibilityManager();
});

// Agregar estilos para animaciones
const style = document.createElement("style");
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }

    .keyboard-navigation *:focus {
        outline: 3px solid var(--color-accent) !important;
        outline-offset: 2px !important;
    }

    .speaking-element {
        background-color: var(--color-accent) !important;
        color: var(--color-dark) !important;
        transition: all 0.3s ease !important;
    }

    .high-contrast {
        filter: contrast(1.5) brightness(1.1) !important;
    }

    .high-contrast img {
        filter: contrast(1.2) brightness(0.9) !important;
    }
`;

document.head.appendChild(style);
