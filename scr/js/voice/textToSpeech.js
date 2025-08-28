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
        this.currentChapterLink = null;
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
        // Ejecutar en páginas de libros (cronicas.html y saber.html)
        if (!window.location.pathname.includes('cronicas.html') && !window.location.pathname.includes('saber.html')) return;

        // Agregar funcionalidad de voz directamente a los enlaces de capítulos
        const chapterLinks = document.querySelectorAll('.book-sidebar a[href^="#"], .chapter-index a[href^="#"]');
        
        chapterLinks.forEach(link => {
            const targetId = link.getAttribute('href').substring(1); // Remover el #
            this.addChapterClickHandler(link, targetId);
        });

        // Agregar iconos a elementos con contenido específico si existen
        const contentElements = document.querySelectorAll('[data-tts-content]');
        contentElements.forEach(element => {
            const targetId = element.id || `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            element.id = targetId;
            this.addVoiceIcon(element, targetId, 'content');
        });
    }

    addChapterClickHandler(link, targetId) {
        // Agregar clase para identificar enlaces con voz
        link.classList.add('tts-enabled');
        
        // Añadir estilos visuales para indicar que tiene funcionalidad de voz
        link.style.transition = 'all 0.3s ease';
        
        // Evento hover para indicar funcionalidad
        link.addEventListener('mouseenter', () => {
            if (!link.classList.contains('tts-playing') && !link.classList.contains('tts-paused')) {
                link.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                link.style.borderRadius = '4px';
                link.style.padding = '2px 6px';
                link.style.transform = 'translateX(2px)';
            }
            link.setAttribute('title', 'Click para leer este capítulo con voz');
        });
        
        link.addEventListener('mouseleave', () => {
            if (!link.classList.contains('tts-playing') && !link.classList.contains('tts-paused')) {
                link.style.backgroundColor = '';
                link.style.padding = '';
                link.style.transform = '';
            }
        });
        
        // Evento click principal
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleChapterClick(link, targetId);
        });
    }
    
    handleChapterClick(link, targetId) {
        // Si ya está reproduciendo este capítulo, pausar
        if (this.isPlaying && this.currentChapterLink === link) {
            this.stopReading();
            return;
        }
        
        // Si está reproduciendo otro capítulo, detener
        if (this.isPlaying) {
            this.stopReading();
        }
        
        // Establecer el enlace actual
        this.currentChapterLink = link;
        
        // Obtener el texto del capítulo
        const textToRead = this.getCleanedTextForTarget(targetId, 'chapter');
        
        if (textToRead) {
            // Navegar al capítulo
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Iniciar lectura
            this.startReading(textToRead);
        }
    }

    addVoiceIcon(element, targetId, type) {
        // Crear icono de voz
        const voiceIcon = document.createElement('button');
        voiceIcon.className = 'voice-icon';
        voiceIcon.innerHTML = '';
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
            text += '@@PAUSE@@' + currentElement.textContent.trim() + '. ';
            currentElement = currentElement.nextElementSibling;
        }

        // Leer hasta encontrar el siguiente capítulo (h2) o fin del contenido
        while (currentElement && currentElement.tagName !== 'H2') {
            // Excluir elementos de navegación y UI
            if (currentElement.textContent.trim() && 
                !currentElement.classList.contains('voice-container') &&
                !currentElement.classList.contains('voice-icon') &&
                !currentElement.classList.contains('tts-icon-placeholder')) {
                
                // Añadir pausas naturales para diferentes tipos de elementos
                const tagName = currentElement.tagName.toLowerCase();
                let elementText = currentElement.textContent.trim();
                
                if (['h1', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                    text += '@@PAUSE@@' + elementText + '. ';
                } else if (tagName === 'p' || tagName === 'blockquote') {
                    text += elementText + ' ';
                } else if (tagName === 'li') {
                    text += elementText + '. ';
                } else {
                    text += elementText + ' ';
                }
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
        
        let sentence = this.sentences[this.currentSentenceIndex];
        const isHeading = sentence.startsWith('@@PAUSE@@');

        if (isHeading) {
            sentence = sentence.replace('@@PAUSE@@', '').trim();
        }

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
                if (this.currentChapterLink) {
                    this.updateChapterLinkState(this.currentChapterLink, 'playing');
                }
                document.dispatchEvent(new CustomEvent('tts-started'));
            }
        };
        
        this.utterance.onend = () => {
            this.currentSentenceIndex++;
            // Pausa breve entre oraciones (más larga para mejor comprensión)
            const pauseDuration = isHeading ? 1200 : 500;
            setTimeout(() => {
                if (this.isPlaying) {
                    this.readNextSentence();
                }
            }, pauseDuration);
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
            if (this.currentChapterLink) {
                this.updateChapterLinkState(this.currentChapterLink, 'playing');
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
        
        if (this.currentChapterLink) {
            if (isError) {
                this.updateChapterLinkState(this.currentChapterLink, 'error');
            } else {
                this.updateChapterLinkState(this.currentChapterLink, 'stopped');
            }
            this.currentChapterLink = null;
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
            if (this.currentChapterLink) {
                this.updateChapterLinkState(this.currentChapterLink, 'paused');
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
        if (this.currentChapterLink) {
            this.updateChapterLinkState(this.currentChapterLink, 'stopped');
        }
        this.currentIcon = null;
        this.currentChapterLink = null;
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
                icon.innerHTML = '';
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
    
    updateChapterLinkState(link, state) {
        // Remover clases previas
        link.classList.remove('tts-playing', 'tts-paused', 'tts-stopped', 'tts-error');
        
        // Agregar nueva clase
        link.classList.add(`tts-${state}`);
        
        // Actualizar estilos visuales
        switch (state) {
            case 'playing':
                link.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                link.style.borderRadius = '4px';
                link.style.padding = '2px 6px';
                link.style.fontWeight = 'bold';
                link.setAttribute('title', 'Reproduciendo... Click para pausar');
                break;
            case 'paused':
                link.style.backgroundColor = 'rgba(255, 193, 7, 0.2)';
                link.style.borderRadius = '4px';
                link.style.padding = '2px 6px';
                link.style.fontWeight = 'bold';
                link.setAttribute('title', 'Pausado - Click para continuar');
                break;
            case 'stopped':
                link.style.backgroundColor = '';
                link.style.padding = '';
                link.style.fontWeight = '';
                link.setAttribute('title', 'Click para leer este capítulo');
                break;
            case 'error':
                link.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                link.style.borderRadius = '4px';
                link.style.padding = '2px 6px';
                link.setAttribute('title', 'Error en reproducción');
                setTimeout(() => {
                    this.updateChapterLinkState(link, 'stopped');
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
        this.currentChapterLink = null; // No hay enlace de capítulo para las tarjetas
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
