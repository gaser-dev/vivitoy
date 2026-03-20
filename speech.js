// ===== Text-to-Speech & Speech Recognition =====

class ToyVoice {
    constructor() {
        this.synth = window.speechSynthesis;
        this.recognition = null;
        this.isMuted = false;
        this.isSpeaking = false;
        this.isListening = false;
        this.onSpeakStart = null;
        this.onSpeakEnd = null;
        this.onTranscript = null;
        this.voiceConfig = { pitch: 1.1, rate: 1.0 };
        this._selectedVoice = null;

        // Initialize voices
        this._loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this._loadVoices();
        }

        // Set up speech recognition if available
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (this.onTranscript) this.onTranscript(transcript);
            };

            this.recognition.onend = () => {
                this.isListening = false;
            };

            this.recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                this.isListening = false;
            };
        }
    }

    _loadVoices() {
        const voices = this.synth.getVoices();
        // Prefer a natural English voice
        this._selectedVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
                              voices.find(v => v.lang.startsWith('en-US')) ||
                              voices.find(v => v.lang.startsWith('en')) ||
                              voices[0] || null;
    }

    /**
     * Configure voice based on character personality.
     */
    setVoiceForCharacter(character) {
        const style = (character.voice_style || '').toLowerCase();

        if (style.includes('high') || style.includes('excited') || style.includes('squeaky')) {
            this.voiceConfig = { pitch: 1.4, rate: 1.1 };
        } else if (style.includes('deep') || style.includes('calm') || style.includes('wise')) {
            this.voiceConfig = { pitch: 0.8, rate: 0.9 };
        } else if (style.includes('playful') || style.includes('warm')) {
            this.voiceConfig = { pitch: 1.15, rate: 1.0 };
        } else {
            this.voiceConfig = { pitch: 1.1, rate: 1.0 };
        }
    }

    /**
     * Speak text aloud.
     */
    speak(text) {
        if (this.isMuted || !text) return Promise.resolve();

        // Cancel any current speech
        this.synth.cancel();

        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this._selectedVoice;
            utterance.pitch = this.voiceConfig.pitch;
            utterance.rate = this.voiceConfig.rate;
            utterance.volume = 0.9;

            utterance.onstart = () => {
                this.isSpeaking = true;
                if (this.onSpeakStart) this.onSpeakStart();
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                if (this.onSpeakEnd) this.onSpeakEnd();
                resolve();
            };

            utterance.onerror = (e) => {
                this.isSpeaking = false;
                if (this.onSpeakEnd) this.onSpeakEnd();
                console.warn('Speech error:', e);
                resolve();
            };

            this.synth.speak(utterance);
        });
    }

    /**
     * Toggle mute.
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.synth.cancel();
            this.isSpeaking = false;
            if (this.onSpeakEnd) this.onSpeakEnd();
        }
        return this.isMuted;
    }

    /**
     * Start listening for voice input.
     */
    startListening() {
        if (!this.recognition) return false;
        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            return false;
        }

        try {
            this.recognition.start();
            this.isListening = true;
            return true;
        } catch (e) {
            console.warn('Could not start speech recognition:', e);
            return false;
        }
    }

    /**
     * Stop speech.
     */
    stop() {
        this.synth.cancel();
        this.isSpeaking = false;
        if (this.onSpeakEnd) this.onSpeakEnd();
    }

    /**
     * Check if speech recognition is supported.
     */
    hasRecognition() {
        return !!this.recognition;
    }
}

// Global instance
const toyVoice = new ToyVoice();
