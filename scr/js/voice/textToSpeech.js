class TextToSpeechSystem {
    constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentIcon = null;
        this.currentChapterLink = null;
        this.currentText = '';
        this.voices = [];
        this.preferredVoice = null;
        this.currentSentenceIndex = 0;
        this.sentences = [];
        this.fragmentedReading = localStorage.getItem('tts_fragmented_reading') !== 'false'; // Por defecto true
        
        this.rate = parseFloat(localStorage.getItem('tts_rate')) || 0.85;
        this.pitch = parseFloat(localStorage.getItem('tts_pitch')) || 1;

        this.init();
    }

    init() {
        this.loadVoices();
        
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
        
        this.setupChapterIcons();
        this.addGlobalControls();
        this.setupCardReaders();

        window.ttsSystem = this;
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
        
        const savedVoiceName = localStorage.getItem('tts_preferred_voice');
        
        if (savedVoiceName) {
            this.preferredVoice = this.voices.find(voice => voice.name === savedVoiceName);
        }
        
        if (!this.preferredVoice) {
            this.preferredVoice = this.voices.find(voice => 
                voice.lang.startsWith('es-') && voice.localService
            ) || this.voices.find(voice => 
                voice.lang.startsWith('es')
            ) || this.voices[0];
            
            if (this.preferredVoice) {
                localStorage.setItem('tts_preferred_voice', this.preferredVoice.name);
            }
        }
    }

    setupChapterIcons() {
        if (!window.location.pathname.includes('cronicas.html') && !window.location.pathname.includes('saber.html')) return;

        const chapterLinks = document.querySelectorAll('.book-sidebar a[href^="#"], .chapter-index a[href^="#"]');
        
        chapterLinks.forEach(link => {
            const targetId = link.getAttribute('href').substring(1);
            this.addChapterClickHandler(link, targetId);
        });

        const contentElements = document.querySelectorAll('[data-tts-content]');
        contentElements.forEach(element => {
            const targetId = element.id || `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            element.id = targetId;
            this.addVoiceIcon(element, targetId, 'content');
        });
    }

    setupCardReaders() {
        // Configurar lectura para tarjetas de obras con data-tts-card
        const workCards = document.querySelectorAll('[data-tts-card]');
        workCards.forEach(card => {
            card.style.cursor = 'pointer';
            card.setAttribute('title', 'Hacer clic para escuchar descripción completa');
            
            card.addEventListener('click', (e) => {
                // Solo activar si no se hizo clic en un enlace o botón
                if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON' && !e.target.closest('a, button')) {
                    e.stopPropagation();
                    const fullText = card.getAttribute('data-tts-card');
                    if (fullText) {
                        this.readText(fullText);
                    }
                }
            });
        });
        
        // Mantener funcionalidad existente para otras tarjetas
        const otherCards = document.querySelectorAll('.work-card, .guide-card, .blog-card, .blog-entry-card');
        otherCards.forEach(card => {
            // Solo procesar si no tiene data-tts-card
            if (!card.hasAttribute('data-tts-card')) {
                const textElement = card.querySelector('h2, h3, h4, p');
                if (textElement) {
                    const text = textElement.textContent;
                    const readButton = card.querySelector('.tts-icon-placeholder');
                    if (readButton) {
                        readButton.addEventListener('click', (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            this.readText(text);
                        });
                    }
                }
            }
        });
    }

    addChapterClickHandler(link, targetId) {
        link.classList.add('tts-enabled');
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleChapterClick(link, targetId);
        });
    }
    
    handleChapterClick(link, targetId) {
        if (this.isPlaying && this.currentChapterLink === link) {
            this.stopReading();
            return;
        }
        
        if (this.isPlaying) {
            this.stopReading();
        }
        
        this.currentChapterLink = link;
        
        const textToRead = this.getChapterText(targetId);
        
        if (textToRead) {
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
            
            this.startReading(textToRead);
        }
    }

    getChapterText(chapterId) {
        let chapterElement = document.getElementById(chapterId);
        if (!chapterElement) return '';

        if (chapterElement.tagName === 'A') {
            chapterElement = chapterElement.parentElement;
        }

        let text = '';
        let currentElement = chapterElement;
        
        if (currentElement.tagName === 'H2') {
            text += currentElement.textContent.trim() + '. ';
            currentElement = currentElement.nextElementSibling;
        }

        while (currentElement && currentElement.tagName !== 'H2') {
            if (currentElement.textContent.trim() && 
                !currentElement.classList.contains('voice-container') &&
                !currentElement.classList.contains('voice-icon') &&
                !currentElement.classList.contains('tts-icon-placeholder')) {
                
                text += currentElement.textContent.trim() + ' ';
            }
            currentElement = currentElement.nextElementSibling;
        }

        return this.cleanText(text);
    }

    cleanText(text) {
        return text.replace(/\s+/g, ' ').trim();
    }

    startReading(text) {
        console.log('Iniciando lectura completa. Texto:', text.substring(0, 100) + '...');
        console.log('Longitud total del texto:', text.length);
        
        this.currentText = text;
        this.sentences = this.splitTextIntoSentences(text);
        
        console.log('Número de segmentos a leer:', this.sentences.length);
        
        this.currentSentenceIndex = 0;
        this.readNextSentence();
    }
    
    readNextSentence() {
        if (this.currentSentenceIndex >= this.sentences.length) {
            console.log('Lectura completada. Total de segmentos leídos:', this.currentSentenceIndex);
            this.finishReading();
            return;
        }
        
        let sentence = this.sentences[this.currentSentenceIndex];
        console.log(`Leyendo segmento ${this.currentSentenceIndex + 1}/${this.sentences.length}:`, sentence.substring(0, 50) + '...');
        
        this.utterance = new SpeechSynthesisUtterance(sentence);
        
        if (this.preferredVoice) {
            this.utterance.voice = this.preferredVoice;
        }
        
        this.utterance.rate = this.rate;
        this.utterance.pitch = this.pitch;
        
        this.utterance.onstart = () => {
            if (this.currentSentenceIndex === 0) {
                this.isPlaying = true;
                this.isPaused = false;
                document.dispatchEvent(new CustomEvent('tts-started'));
            }
        };
        
        this.utterance.onend = () => {
            console.log(`Segmento ${this.currentSentenceIndex + 1} completado`);
            this.currentSentenceIndex++;
            if (this.isPlaying) {
                this.readNextSentence();
            }
        };
        
        this.utterance.onerror = (event) => {
            console.error('Error en lectura:', event.error);
            this.finishReading(true);
        };
        
        this.synth.speak(this.utterance);
    }
    
    finishReading(isError = false) {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentSentenceIndex = 0;
        this.sentences = [];
        document.dispatchEvent(new CustomEvent('tts-stopped'));
    }

    pauseReading() {
        if (this.synth.speaking && !this.isPaused) {
            this.synth.pause();
            this.isPaused = true;
        }
    }

    resumeReading() {
        if (this.isPaused) {
            this.synth.resume();
            this.isPaused = false;
        }
    }

    stopReading() {
        if (this.synth.speaking) {
            this.synth.cancel();
        }
        this.finishReading();
    }

    readText(text) {
        if (this.isPlaying) {
            this.stopReading();
        }
        
        console.log('Iniciando lectura de texto completo:', text.substring(0, 100) + '...');
        this.startReading(this.cleanText(text));
    }
    
    getSpanishVoices() {
        return this.voices.filter(voice => voice.lang.startsWith('es'));
    }
    
    setPreferredVoice(voiceName) {
        const voice = this.voices.find(v => v.name === voiceName);
        if (voice) {
            this.preferredVoice = voice;
            localStorage.setItem('tts_preferred_voice', voiceName);
            return true;
        }
        return false;
    }
    
    getCurrentVoice() {
        return this.preferredVoice;
    }

    getRate() {
        return this.rate;
    }

    setRate(rate) {
        this.rate = parseFloat(rate);
        localStorage.setItem('tts_rate', this.rate);
    }

    getPitch() {
        return this.pitch;
    }

    setPitch(pitch) {
        this.pitch = parseFloat(pitch);
        localStorage.setItem('tts_pitch', this.pitch);
    }

    splitTextIntoSentences(text) {
        // Dividir por oraciones, manteniendo puntuación
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        
        // Si no hay oraciones reconocidas, dividir por longitud
        if (sentences.length === 0) {
            const words = text.split(' ');
            const chunks = [];
            let currentChunk = '';
            
            words.forEach(word => {
                if ((currentChunk + word).length > 100) {
                    if (currentChunk) chunks.push(currentChunk.trim());
                    currentChunk = word + ' ';
                } else {
                    currentChunk += word + ' ';
                }
            });
            
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
            }
            
            return chunks.length > 0 ? chunks : [text];
        }
        
        return sentences.map(s => s.trim()).filter(s => s.length > 0);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if ('speechSynthesis' in window) {
        window.ttsSystem = new TextToSpeechSystem();
    } else {
        console.warn('Síntesis de voz no soportada en este navegador');
    }
});
