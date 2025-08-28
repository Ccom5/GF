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
        const cards = document.querySelectorAll('.work-card, .guide-card, .blog-card, .work-detail, .blog-entry-card');
        cards.forEach(card => {
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
        this.currentText = text;
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
            this.currentSentenceIndex++;
            if (this.isPlaying) {
                this.readNextSentence();
            }
        };
        
        this.utterance.onerror = (event) => {
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
        return text.match(/[^.!?]+[.!?]+/g) || [text];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if ('speechSynthesis' in window) {
        window.ttsSystem = new TextToSpeechSystem();
    } else {
        console.warn('Síntesis de voz no soportada en este navegador');
    }
});