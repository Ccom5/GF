/**
 * Sistema de Texto a Voz para el sitio web
 * Características:
 * - Lectura de capítulos completos en cronicas.html
 * - Lectura de contenido de blog por bloques
 * - Lectura de tarjetas al hacer clic
 * - Control de reproducción (play/pause/stop)
 * - Indicadores visuales de estado
 * - Soporte para móvil y desktop
 */

class TextToSpeechSystem {
    constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.isPlaying = false;
        this.currentIcon = null;
        this.currentText = '';
        this.voices = [];
        this.preferredVoice = null;
        this.currentSentenceIndex = 0;
        this.sentences = [];
        this.fragmentedReading = localStorage.getItem('tts_fragmented_reading') !== 'false'; // Por defecto true
        
        this.init();
    }

    init() {
        // Cargar voces disponibles
        this.loadVoices();
        
        // Evento para cuando las voces estén disponibles
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
        
        // Inicializar iconos de voz para capítulos
        this.setupChapterIcons();
        
        // Eventos de control global
        this.addGlobalControls();
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
        
        // Cargar voz preferida guardada o buscar una automáticamente
        const savedVoiceName = localStorage.getItem('tts_preferred_voice');
        
        if (savedVoiceName) {
            this.preferredVoice = this.voices.find(voice => voice.name === savedVoiceName);
        }
        
        // Si no hay voz guardada o no se encuentra, buscar automáticamente una en español
        if (!this.preferredVoice) {
            // Prioridad: español local > español remoto > primera disponible
            this.preferredVoice = this.voices.find(voice => 
                voice.lang.startsWith('es-') && voice.localService
            ) || this.voices.find(voice => 
                voice.lang.startsWith('es')
            ) || this.voices[0];
            
            // Guardar la voz seleccionada automáticamente
            if (this.preferredVoice) {
                localStorage.setItem('tts_preferred_voice', this.preferredVoice.name);
            }
        }
        
        console.log('Voz TTS seleccionada:', this.preferredVoice?.name || 'Ninguna disponible');
    }

    setupChapterIcons() {
        // Solo ejecutar en la página de crónicas
        if (!window.location.pathname.includes('cronicas.html')) return;

        // Agregar iconos de voz a los enlaces de capítulos en el menú lateral
        const chapterLinks = document.querySelectorAll('.book-sidebar a[href^="#"], .chapter-index a[href^="#"]');
        
        chapterLinks.forEach(link => {
            const targetId = link.getAttribute('href').substring(1); // Remover el #
            this.addVoiceIcon(link, targetId, 'chapter');
        });

        // Agregar iconos a elementos con contenido específico si existen
        const contentElements = document.querySelectorAll('[data-tts-content]');
        contentElements.forEach(element => {
            const targetId = element.id || `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            element.id = targetId;
            this.addVoiceIcon(element, targetId, 'content');
        });
    }

    addVoiceIcon(element, targetId, type) {
        // Crear icono de voz
        const voiceIcon = document.createElement('button');
        voiceIcon.className = 'voice-icon';
        voiceIcon.innerHTML = '🔊';
        voiceIcon.setAttribute('aria-label', 'Reproducir con voz');
        voiceIcon.setAttribute('title', 'Reproducir con voz');
        voiceIcon.dataset.targetId = targetId;
        voiceIcon.dataset.type = type;

        // Estilos del icono
        Object.assign(voiceIcon.style, {
            border: 'none',
            background: 'transparent',
            fontSize: '16px',
            cursor: 'pointer',
            marginLeft: '8px',
            padding: '4px',
            borderRadius: '4px',
            transition: 'all 0.3s ease',
            opacity: '0.7'
        });

        // Efectos hover
        voiceIcon.addEventListener('mouseenter', () => {
            voiceIcon.style.opacity = '1';
            voiceIcon.style.transform = 'scale(1.1)';
            voiceIcon.style.backgroundColor = 'rgba(0,0,0,0.1)';
        });

        voiceIcon.addEventListener('mouseleave', () => {
            if (!voiceIcon.classList.contains('playing')) {
                voiceIcon.style.opacity = '0.7';
                voiceIcon.style.transform = 'scale(1)';
                voiceIcon.style.backgroundColor = 'transparent';
            }
        });

        // Evento click
        voiceIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleVoiceIconClick(voiceIcon, targetId, type);
        });

        // Insertar el icono según el tipo
        if (type === 'chapter' && element.tagName === 'A') {
            element.appendChild(voiceIcon);
        } else if (type === 'content') {
            // Crear contenedor para el icono si no existe
            let container = element.querySelector('.voice-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'voice-container';
                element.style.position = 'relative';
                element.appendChild(container);
            }
            container.appendChild(voiceIcon);
        }
    }

    handleVoiceIconClick(icon, targetId, type) {
        // Establecer el icono actual
        this.currentIcon = icon;

        // Si ya está reproduciendo este elemento, pausar
        if (this.isPlaying && this.currentText === this.getCleanedTextForTarget(targetId, type)) {
            this.pauseReading();
            return;
        }

        // Si está reproduciendo otro elemento, detener
        if (this.isPlaying) {
            this.stopReading();
        }

        // Obtener el texto a leer
        let textToRead = this.getCleanedTextForTarget(targetId, type);

        if (textToRead) {
            this.startReading(textToRead);
        }
    }

    getCleanedTextForTarget(targetId, type) {
        let text = '';
        if (type === 'chapter') {
            text = this.getChapterText(targetId);
        } else if (type === 'content') {
            const originalElement = document.getElementById(targetId);
            if (originalElement) {
                const clonedElement = originalElement.cloneNode(true);
                // Remover elementos de UI que no deben leerse
                const uiElements = clonedElement.querySelectorAll('.tts-icon-placeholder, .voice-container, .voice-icon, .tts-active-indicator');
                uiElements.forEach(el => el.remove());
                text = this.cleanText(clonedElement.textContent);
            }
        }
        return text;
    }

    getChapterText(chapterId) {
        const chapterElement = document.getElementById(chapterId);
        if (!chapterElement) return '';

        // Obtener todo el texto del capítulo hasta el siguiente h2
        let text = '';
        let currentElement = chapterElement;
        
        // Incluir el título del capítulo
        if (currentElement.tagName === 'H2') {
            text += currentElement.textContent + '. ';
            currentElement = currentElement.nextElementSibling;
        }

        // Leer hasta encontrar el siguiente capítulo (h2) o fin del contenido
        while (currentElement && currentElement.tagName !== 'H2') {
            if (currentElement.textContent.trim()) {
                text += currentElement.textContent + ' ';
            }
            currentElement = currentElement.nextElementSibling;
        }

        return this.cleanText(text);
    }

    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')  // Múltiples espacios a uno solo
            .replace(/[—–]/g, ', ')  // Em dash y en dash a comas
            .replace(/\n/g, ' ')  // Saltos de línea a espacios
            .replace(/\.\s*\./g, '.')  // Múltiples puntos
            .replace(/[­​﻿]/g, '')  // Caracteres invisibles
            .replace(/ /g, ' ')  // Espacios no separables
            .replace(/…/g, '...')  // Elipsis Unicode
            .replace(/[""]/g, '"')  // Comillas tipográficas
            .replace(/[‘’]/g, "'")  // Apóstrofes tipográficos
            .replace(/<[^>]*>/g, '')  // Etiquetas HTML
            .replace(/\s+([.,;:!?¿¡])/g, '$1')  // Espacios antes de puntuación
            .replace(/([.,;:!?¿¡])([A-ZÁÉÍÓÚÑ])/g, '$1 $2')  // Espacios después de puntuación
            .trim();
    }

    startReading(text) {
        this.currentText = text;
        
        if (this.fragmentedReading) {
            this.startFragmentedReading(text);
        } else {
            this.startSingleReading(text);
        }
    }
    
    splitTextIntoSentences(text) {
        // Dividir texto en oraciones, títulos y párrafos
        let sentences = [];
        
        // Limpiar el texto primero
        text = this.cleanText(text);
        
        // Dividir por dobles saltos de línea (párrafos)
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
        
        paragraphs.forEach(paragraph => {
            const trimmed = paragraph.trim();
            if (!trimmed) return;
            
            // Detectar títulos y encabezados
            const isTitle = /^(\d+\.|[IVXLCDM]+\.|Capítulo|Sección|Parte)/i.test(trimmed) || 
                          trimmed.length < 80 || 
                          /^[A-ZÁÉÍÓÚÑ][^.!?]*$/.test(trimmed);
            
            if (isTitle) {
                sentences.push(trimmed + (trimmed.endsWith('.') ? '' : '.'));
            } else {
                // Dividir párrafo en oraciones respetando abreviaciones comunes
                const sentenceRegex = /([.!?]+)\s+(?=[A-ZÁÉÍÓÚÑ¿¡]|$)/g;
                const parts = trimmed.split(sentenceRegex).filter(part => part.trim());
                
                let currentSentence = '';
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i].trim();
                    if (/^[.!?]+$/.test(part)) {
                        // Es puntuación final
                        currentSentence += part;
                        if (currentSentence.trim()) {
                            sentences.push(currentSentence.trim());
                        }
                        currentSentence = '';
                    } else {
                        // Es contenido de oración
                        currentSentence += (currentSentence ? ' ' : '') + part;
                        
                        // Si no hay puntuación siguiente y no es la última parte
                        if (i === parts.length - 1 && currentSentence.trim()) {
                            if (!currentSentence.match(/[.!?]$/)) {
                                currentSentence += '.';
                            }
                            sentences.push(currentSentence.trim());
                        }
                    }
                }
            }
        });
        
        // Filtrar oraciones muy cortas o vacías
        return sentences.filter(s => s.length > 3 && s.trim() !== '.');
    }
    
    startFragmentedReading(text) {
        this.sentences = this.splitTextIntoSentences(text);
        this.currentSentenceIndex = 0;
        this.readNextSentence();
    }
    
    readNextSentence() {
        if (this.currentSentenceIndex >= this.sentences.length) {
            this.finishReading();
            return;
        }
        
        const sentence = this.sentences[this.currentSentenceIndex];
        this.utterance = new SpeechSynthesisUtterance(sentence);
        
        // Configurar voz
        if (this.preferredVoice) {
            this.utterance.voice = this.preferredVoice;
        }
        
        // Configurar parámetros con velocidad pausada
        this.utterance.rate = 0.85;
        this.utterance.pitch = 1;
        this.utterance.volume = 1;
        
        // Eventos del utterance
        this.utterance.onstart = () => {
            if (this.currentSentenceIndex === 0) {
                this.isPlaying = true;
                if (this.currentIcon) {
                    this.updateIconState(this.currentIcon, 'playing');
                }
                document.dispatchEvent(new CustomEvent('tts-started'));
            }
        };
        
        this.utterance.onend = () => {
            this.currentSentenceIndex++;
            // Pausa breve entre oraciones (más larga para mejor comprensión)
            setTimeout(() => {
                if (this.isPlaying) {
                    this.readNextSentence();
                }
            }, 500);
        };
        
        this.utterance.onerror = (event) => {
            console.error('Error en síntesis de voz:', event);
            this.finishReading(true);
        };
        
        this.synth.speak(this.utterance);
    }
    
    startSingleReading(text) {
        // Crear utterance
        this.utterance = new SpeechSynthesisUtterance(text);
        
        // Configurar voz
        if (this.preferredVoice) {
            this.utterance.voice = this.preferredVoice;
        }
        
        // Configurar parámetros con velocidad pausada
        this.utterance.rate = 0.85;
        this.utterance.pitch = 1;
        this.utterance.volume = 1;

        // Eventos del utterance
        this.utterance.onstart = () => {
            this.isPlaying = true;
            if (this.currentIcon) {
                this.updateIconState(this.currentIcon, 'playing');
            }
            document.dispatchEvent(new CustomEvent('tts-started'));
        };

        this.utterance.onend = () => {
            this.finishReading();
        };

        this.utterance.onerror = (event) => {
            console.error('Error en síntesis de voz:', event);
            this.finishReading(true);
        };

        // Comenzar reproducción
        this.synth.speak(this.utterance);
    }
    
    finishReading(isError = false) {
        this.isPlaying = false;
        this.currentSentenceIndex = 0;
        this.sentences = [];
        
        if (this.currentIcon) {
            if (isError) {
                this.updateIconState(this.currentIcon, 'error');
            } else {
                this.updateIconState(this.currentIcon, 'stopped');
            }
            this.currentIcon = null;
        }
        document.dispatchEvent(new CustomEvent('tts-stopped'));
    }

    pauseReading() {
        if (this.synth.speaking) {
            this.synth.cancel();
            this.isPlaying = false;
            if (this.currentIcon) {
                this.updateIconState(this.currentIcon, 'paused');
            }
            document.dispatchEvent(new CustomEvent('tts-stopped'));
        }
    }

    stopReading() {
        if (this.synth.speaking) {
            this.synth.cancel();
        }
        this.isPlaying = false;
        this.currentSentenceIndex = 0;
        this.sentences = [];
        if (this.currentIcon) {
            this.updateIconState(this.currentIcon, 'stopped');
        }
        this.currentIcon = null;
        this.utterance = null;
        this.currentText = '';
        document.dispatchEvent(new CustomEvent('tts-stopped'));
    }

    updateIconState(icon, state) {
        // Remover clases previas
        icon.classList.remove('playing', 'paused', 'stopped', 'error');
        
        // Agregar nueva clase
        icon.classList.add(state);
        
        // Actualizar icono y estilos
        switch (state) {
            case 'playing':
                icon.innerHTML = '⏸️';
                icon.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                icon.style.transform = 'scale(1.1)';
                icon.setAttribute('title', 'Pausar reproducción');
                break;
            case 'paused':
            case 'stopped':
                icon.innerHTML = '🔊';
                icon.style.backgroundColor = 'transparent';
                icon.style.transform = 'scale(1)';
                icon.setAttribute('title', 'Reproducir con voz');
                break;
            case 'error':
                icon.innerHTML = '❌';
                icon.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                icon.setAttribute('title', 'Error en reproducción');
                setTimeout(() => {
                    this.updateIconState(icon, 'stopped');
                }, 2000);
                break;
        }
    }

    addGlobalControls() {
        // Tecla ESC para detener reproducción
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPlaying) {
                this.stopReading();
            }
        });

        // Detener al cambiar de página
        window.addEventListener('beforeunload', () => {
            if (this.isPlaying) {
                this.stopReading();
            }
        });
    }

    // Método público para leer cualquier texto (usado por main.js para las tarjetas)
    readText(text) {
        if (this.isPlaying) {
            this.stopReading();
        }
        this.currentIcon = null; // No hay icono específico para las tarjetas
        this.startReading(this.cleanText(text));
    }

    // Método público para detener desde otros scripts
    stopAll() {
        this.stopReading();
    }
    
    // Método para obtener todas las voces en español disponibles
    getSpanishVoices() {
        return this.voices.filter(voice => voice.lang.startsWith('es'));
    }
    
    // Método para cambiar la voz preferida
    setPreferredVoice(voiceName) {
        const voice = this.voices.find(v => v.name === voiceName);
        if (voice) {
            this.preferredVoice = voice;
            localStorage.setItem('tts_preferred_voice', voiceName);
            console.log('Voz TTS cambiada a:', voiceName);
            return true;
        }
        return false;
    }
    
    // Método para obtener la voz actual
    getCurrentVoice() {
        return this.preferredVoice;
    }
    
    // Método para alternar entre lectura fragmentada y completa
    toggleFragmentedReading() {
        this.fragmentedReading = !this.fragmentedReading;
        localStorage.setItem('tts_fragmented_reading', this.fragmentedReading.toString());
        console.log('Lectura fragmentada:', this.fragmentedReading ? 'Activada' : 'Desactivada');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si el navegador soporta síntesis de voz
    if ('speechSynthesis' in window) {
        window.ttsSystem = new TextToSpeechSystem();
        console.log('Sistema de texto a voz inicializado');
    } else {
        console.warn('Síntesis de voz no soportada en este navegador');
    }
});

// Exportar para uso global
window.TextToSpeechSystem = TextToSpeechSystem;
