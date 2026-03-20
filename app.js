// ===== Main App Controller =====

(function() {
    'use strict';

    // ===== STATE =====
    let currentImage = null;       // Base64 data URL of uploaded image
    let toyAnalysis = null;        // Result from vision model
    let character = null;          // Generated character object
    let conversationHistory = [];  // Chat history for API context

    // ===== DOM REFS =====
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const screens = {
        upload: $('#screen-upload'),
        loading: $('#screen-loading'),
        character: $('#screen-character')
    };

    const els = {
        // Modal
        apiModal: $('#api-modal'),
        apiKeyInput: $('#api-key-input'),
        saveApiKey: $('#save-api-key'),
        toggleKeyVis: $('#toggle-key-visibility'),
        settingsBtn: $('#settings-btn'),

        // Upload
        dropZone: $('#drop-zone'),
        fileInput: $('#file-input'),
        previewArea: $('#preview-area'),
        previewImg: $('#preview-img'),
        changeImage: $('#change-image'),
        bringToLife: $('#bring-to-life'),
        particles: $('#particles'),

        // Loading
        loadingImg: $('#loading-img'),
        loadingStatus: $('#loading-status'),
        loadingBarFill: $('#loading-bar-fill'),

        // Character
        characterImg: $('#character-img'),
        characterImageWrapper: $('#character-image-wrapper'),
        characterName: $('#character-name'),
        characterPersonality: $('#character-personality'),
        characterTraits: $('#character-traits'),
        chatCharacterName: $('#chat-character-name'),
        chatMessages: $('#chat-messages'),
        chatInput: $('#chat-input'),
        sendBtn: $('#send-btn'),
        voiceInputBtn: $('#voice-input-btn'),
        muteBtn: $('#mute-btn'),
        newToyBtn: $('#new-toy-btn'),
        sparkles: $('#sparkles')
    };

    // ===== INIT =====
    function init() {
        // Create upload particles
        toyAnimations.createUploadParticles(els.particles);

        // Check API key
        if (!toyAPI.hasKey()) {
            showModal();
        }

        // Init animations
        toyAnimations.init(els.characterImageWrapper, els.sparkles);

        // Wire up speech callbacks
        toyVoice.onSpeakStart = () => toyAnimations.startTalking();
        toyVoice.onSpeakEnd = () => toyAnimations.stopTalking();

        // Voice input transcript callback
        toyVoice.onTranscript = (transcript) => {
            els.chatInput.value = transcript;
            sendMessage();
        };

        // Hide voice input button if not supported
        if (!toyVoice.hasRecognition()) {
            els.voiceInputBtn.classList.add('hidden');
        }

        bindEvents();
    }

    // ===== EVENT BINDING =====
    function bindEvents() {
        // API Key Modal
        els.saveApiKey.addEventListener('click', saveApiKey);
        els.apiKeyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveApiKey();
        });
        els.toggleKeyVis.addEventListener('click', () => {
            const input = els.apiKeyInput;
            input.type = input.type === 'password' ? 'text' : 'password';
            els.toggleKeyVis.textContent = input.type === 'password' ? '👁️' : '🙈';
        });
        els.settingsBtn.addEventListener('click', showModal);

        // Drop zone
        els.dropZone.addEventListener('click', () => els.fileInput.click());
        els.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            els.dropZone.classList.add('drag-over');
        });
        els.dropZone.addEventListener('dragleave', () => {
            els.dropZone.classList.remove('drag-over');
        });
        els.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            els.dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleImage(file);
            }
        });
        els.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleImage(file);
        });

        // Preview actions
        els.changeImage.addEventListener('click', resetUpload);
        els.bringToLife.addEventListener('click', bringToLife);

        // Chat
        els.sendBtn.addEventListener('click', sendMessage);
        els.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Voice input
        els.voiceInputBtn.addEventListener('click', () => {
            const listening = toyVoice.startListening();
            els.voiceInputBtn.classList.toggle('listening', listening);
        });

        // Mute
        els.muteBtn.addEventListener('click', () => {
            const muted = toyVoice.toggleMute();
            els.muteBtn.textContent = muted ? '🔇' : '🔊';
        });

        // New toy
        els.newToyBtn.addEventListener('click', resetAll);
    }

    // ===== SCREEN MANAGEMENT =====
    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[name].classList.add('active');
    }

    // ===== API KEY MODAL =====
    function showModal() {
        els.apiModal.classList.remove('hidden');
        els.apiKeyInput.value = toyAPI.apiKey || '';
        setTimeout(() => els.apiKeyInput.focus(), 100);
    }

    function hideModal() {
        els.apiModal.classList.add('hidden');
    }

    function saveApiKey() {
        const key = els.apiKeyInput.value.trim();
        if (!key) {
            showToast('Please enter an API key', 'error');
            return;
        }
        toyAPI.setKey(key);
        hideModal();
        showToast('API key saved!');
    }

    // ===== IMAGE HANDLING =====
    function handleImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentImage = e.target.result;
            els.previewImg.src = currentImage;
            els.dropZone.classList.add('hidden');
            els.previewArea.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    function resetUpload() {
        currentImage = null;
        els.fileInput.value = '';
        els.dropZone.classList.remove('hidden');
        els.previewArea.classList.add('hidden');
    }

    // ===== BRING TO LIFE FLOW =====
    async function bringToLife() {
        if (!currentImage) return;

        if (!toyAPI.hasKey()) {
            showModal();
            return;
        }

        // Switch to loading screen
        els.loadingImg.src = currentImage;
        showScreen('loading');

        try {
            // Step 1: Analyze toy
            updateLoading('Studying your toy...', 20);
            toyAnalysis = await toyAPI.analyzeToy(currentImage);
            updateLoading('Understanding its personality...', 50);

            // Step 2: Create character
            updateLoading('Bringing it to life...', 75);
            character = await toyAPI.createCharacter(toyAnalysis);
            updateLoading('Almost there... ✨', 95);

            // Step 3: Set up character screen
            await setupCharacterScreen();
            updateLoading('Done!', 100);

            // Small delay for the loading bar to fill visually
            await sleep(500);

            // Switch to character screen
            showScreen('character');

            // Play entrance animation
            await toyAnimations.playEntrance();

            // Say greeting
            await sleep(300);
            addBotMessage(character.greeting);
            await toyVoice.speak(character.greeting);

        } catch (err) {
            console.error('Bring to life error:', err);
            showToast(err.message || 'Something went wrong. Please try again.', 'error');
            showScreen('upload');
        }
    }

    function updateLoading(status, percent) {
        els.loadingStatus.textContent = status;
        els.loadingBarFill.style.width = `${percent}%`;
    }

    // ===== CHARACTER SCREEN SETUP =====
    async function setupCharacterScreen() {
        els.characterImg.src = currentImage;
        els.characterName.textContent = character.name;
        els.characterPersonality.textContent = character.personality;
        els.chatCharacterName.textContent = character.name;

        // Traits
        els.characterTraits.innerHTML = '';
        (character.traits || []).forEach(trait => {
            const tag = document.createElement('span');
            tag.classList.add('trait-tag');
            tag.textContent = trait;
            els.characterTraits.appendChild(tag);
        });

        // Clear chat
        els.chatMessages.innerHTML = '';
        conversationHistory = [];

        // Configure voice
        toyVoice.setVoiceForCharacter(character);
    }

    // ===== CHAT =====
    async function sendMessage() {
        const text = els.chatInput.value.trim();
        if (!text) return;

        // Disable input during processing
        els.chatInput.value = '';
        els.chatInput.disabled = true;
        els.sendBtn.disabled = true;

        // Add user message
        addUserMessage(text);
        conversationHistory.push({ role: 'user', content: text });

        // Show typing indicator
        const typingEl = addTypingIndicator();

        try {
            const response = await toyAPI.chat(character, toyAnalysis, conversationHistory, text);
            conversationHistory.push({ role: 'assistant', content: response });

            // Remove typing indicator and add real message
            typingEl.remove();
            addBotMessage(response);

            // Speak the response
            await toyVoice.speak(response);

        } catch (err) {
            typingEl.remove();
            console.error('Chat error:', err);
            addBotMessage("*yawns* Oops, I got a bit tongue-tied! Can you try again?");
            showToast(err.message || 'Failed to get response', 'error');
        } finally {
            els.chatInput.disabled = false;
            els.sendBtn.disabled = false;
            els.chatInput.focus();
        }
    }

    function addUserMessage(text) {
        const msg = document.createElement('div');
        msg.classList.add('message', 'user');
        msg.textContent = text;
        els.chatMessages.appendChild(msg);
        scrollChat();
    }

    function addBotMessage(text) {
        const msg = document.createElement('div');
        msg.classList.add('message', 'bot');
        msg.textContent = text;
        els.chatMessages.appendChild(msg);
        scrollChat();
    }

    function addTypingIndicator() {
        const msg = document.createElement('div');
        msg.classList.add('message', 'bot', 'typing');
        msg.textContent = `${character.name} is thinking...`;
        els.chatMessages.appendChild(msg);
        scrollChat();
        return msg;
    }

    function scrollChat() {
        els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
    }

    // ===== RESET =====
    function resetAll() {
        toyVoice.stop();
        toyAnimations.stopTalking();
        currentImage = null;
        toyAnalysis = null;
        character = null;
        conversationHistory = [];
        resetUpload();
        showScreen('upload');
    }

    // ===== TOAST NOTIFICATIONS =====
    function showToast(message, type = '') {
        // Remove existing toast
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.classList.add('toast');
        if (type) toast.classList.add(type);
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }

    // ===== UTILS =====
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===== BOOT =====
    document.addEventListener('DOMContentLoaded', init);

})();
