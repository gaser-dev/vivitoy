// ===== Main App Controller =====

(function() {
    'use strict';

    // ===== STATE =====
    let currentImage = null;
    let toyAnalysis = null;
    let character = null;
    let conversationHistory = [];
    let cameraStream = null;
    let facingMode = 'environment'; // back camera by default on mobile

    // ===== DOM =====
    const $ = (sel) => document.querySelector(sel);
    const screens = {
        upload: $('#screen-upload'),
        loading: $('#screen-loading'),
        character: $('#screen-character')
    };

    const els = {
        apiModal: $('#api-modal'),
        apiKeyInput: $('#api-key-input'),
        saveApiKey: $('#save-api-key'),
        toggleKeyVis: $('#toggle-key-visibility'),
        settingsBtn: $('#settings-btn'),

        dropZone: $('#drop-zone'),
        fileInput: $('#file-input'),
        cameraBtn: $('#camera-btn'),
        previewArea: $('#preview-area'),
        previewImg: $('#preview-img'),
        toyDescription: $('#toy-description'),
        charCount: $('#char-count'),
        changeImage: $('#change-image'),
        bringToLife: $('#bring-to-life'),
        particles: $('#particles'),

        // Camera
        cameraModal: $('#camera-modal'),
        cameraVideo: $('#camera-video'),
        cameraCanvas: $('#camera-canvas'),
        capturePhoto: $('#capture-photo'),
        switchCamera: $('#switch-camera'),
        closeCamera: $('#close-camera'),

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
        toyAnimations.createUploadParticles(els.particles);

        if (!toyAPI.hasKey()) showModal();

        toyAnimations.init(els.characterImageWrapper, els.sparkles);

        toyVoice.onSpeakStart = () => toyAnimations.startTalking();
        toyVoice.onSpeakEnd = () => toyAnimations.stopTalking();
        toyVoice.onTranscript = (transcript) => {
            els.chatInput.value = transcript;
            sendMessage();
        };

        if (!toyVoice.hasRecognition()) {
            els.voiceInputBtn.classList.add('hidden');
        }

        // Detect if camera is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            els.cameraBtn.classList.add('hidden');
        }

        bindEvents();

        // Handle mobile viewport height (fixes 100vh issue on mobile browsers)
        setAppHeight();
        window.addEventListener('resize', setAppHeight);
        window.addEventListener('orientationchange', () => {
            setTimeout(setAppHeight, 100);
        });
    }

    function setAppHeight() {
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    }

    // ===== EVENTS =====
    function bindEvents() {
        // API Key
        els.saveApiKey.addEventListener('click', saveApiKey);
        els.apiKeyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveApiKey(); });
        els.toggleKeyVis.addEventListener('click', () => {
            const inp = els.apiKeyInput;
            inp.type = inp.type === 'password' ? 'text' : 'password';
            els.toggleKeyVis.textContent = inp.type === 'password' ? '👁️' : '🙈';
        });
        els.settingsBtn.addEventListener('click', showModal);

        // Drop zone — click only on the zone itself, not the buttons inside
        els.dropZone.addEventListener('click', (e) => {
            if (e.target.closest('#browse-btn') || e.target.closest('#camera-btn')) return;
            els.fileInput.click();
        });
        els.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            els.dropZone.classList.add('drag-over');
        });
        els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('drag-over'));
        els.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            els.dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) handleImage(file);
        });
        els.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleImage(file);
        });

        // Camera
        els.cameraBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openCamera();
        });
        els.capturePhoto.addEventListener('click', capturePhoto);
        els.switchCamera.addEventListener('click', switchCamera);
        els.closeCamera.addEventListener('click', closeCamera);

        // Description char count
        els.toyDescription.addEventListener('input', () => {
            els.charCount.textContent = els.toyDescription.value.length;
        });

        // Preview
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

        // Voice
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

        // Prevent zoom on double-tap for iOS
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - (window._lastTouch || 0) < 300) {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                }
            }
            window._lastTouch = now;
        }, { passive: false });
    }

    // ===== SCREENS =====
    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[name].classList.add('active');
    }

    // ===== MODAL =====
    function showModal() {
        els.apiModal.classList.remove('hidden');
        els.apiKeyInput.value = toyAPI.apiKey || '';
        setTimeout(() => els.apiKeyInput.focus(), 100);
    }
    function hideModal() { els.apiModal.classList.add('hidden'); }

    function saveApiKey() {
        const key = els.apiKeyInput.value.trim();
        if (!key) { showToast('Please enter an API key', 'error'); return; }
        toyAPI.setKey(key);
        hideModal();
        showToast('API key saved!');
    }

    // ===== CAMERA =====
    async function openCamera() {
        try {
            els.cameraModal.classList.remove('hidden');
            await startCameraStream();
        } catch (err) {
            console.error('Camera error:', err);
            els.cameraModal.classList.add('hidden');

            if (err.name === 'NotAllowedError') {
                showToast('Camera permission denied. Please allow camera access.', 'error');
            } else {
                showToast('Could not access camera. Try uploading a file instead.', 'error');
            }
        }
    }

    async function startCameraStream() {
        // Stop any existing stream
        stopCameraStream();

        const constraints = {
            video: {
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 960 }
            },
            audio: false
        };

        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        els.cameraVideo.srcObject = cameraStream;
    }

    function stopCameraStream() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            cameraStream = null;
        }
        els.cameraVideo.srcObject = null;
    }

    function capturePhoto() {
        const video = els.cameraVideo;
        const canvas = els.cameraCanvas;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        currentImage = canvas.toDataURL('image/jpeg', 0.85);
        els.previewImg.src = currentImage;

        closeCamera();
        els.dropZone.classList.add('hidden');
        els.previewArea.classList.remove('hidden');
    }

    async function switchCamera() {
        facingMode = facingMode === 'environment' ? 'user' : 'environment';
        try {
            await startCameraStream();
        } catch (err) {
            // If switching fails, revert
            facingMode = facingMode === 'environment' ? 'user' : 'environment';
            showToast('Could not switch camera', 'error');
        }
    }

    function closeCamera() {
        stopCameraStream();
        els.cameraModal.classList.add('hidden');
    }

    // ===== IMAGE HANDLING =====
    function handleImage(file) {
        // Compress large images for mobile performance
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Resize if too large (max 1200px on longest side)
                const MAX = 1200;
                let w = img.width, h = img.height;
                if (w > MAX || h > MAX) {
                    if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                    else { w = Math.round(w * MAX / h); h = MAX; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                currentImage = canvas.toDataURL('image/jpeg', 0.85);
                els.previewImg.src = currentImage;
                els.dropZone.classList.add('hidden');
                els.previewArea.classList.remove('hidden');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function resetUpload() {
        currentImage = null;
        els.fileInput.value = '';
        els.toyDescription.value = '';
        els.charCount.textContent = '0';
        els.dropZone.classList.remove('hidden');
        els.previewArea.classList.add('hidden');
    }

    // ===== BRING TO LIFE =====
    async function bringToLife() {
        if (!currentImage) return;
        if (!toyAPI.hasKey()) { showModal(); return; }

        const userDescription = els.toyDescription.value.trim();

        els.loadingImg.src = currentImage;
        showScreen('loading');

        try {
            updateLoading('Studying your toy...', 20);
            toyAnalysis = await toyAPI.analyzeToy(currentImage, userDescription);
            updateLoading('Understanding its personality...', 50);

            updateLoading('Bringing it to life...', 75);
            character = await toyAPI.createCharacter(toyAnalysis);
            updateLoading('Almost there... ✨', 95);

            await setupCharacterScreen();
            updateLoading('Done!', 100);

            await sleep(500);
            showScreen('character');
            await toyAnimations.playEntrance();

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

    // ===== CHARACTER SCREEN =====
    async function setupCharacterScreen() {
        els.characterImg.src = currentImage;
        els.characterName.textContent = character.name;
        els.characterPersonality.textContent = character.personality;
        els.chatCharacterName.textContent = character.name;

        els.characterTraits.innerHTML = '';
        (character.traits || []).forEach(trait => {
            const tag = document.createElement('span');
            tag.classList.add('trait-tag');
            tag.textContent = trait;
            els.characterTraits.appendChild(tag);
        });

        els.chatMessages.innerHTML = '';
        conversationHistory = [];
        toyVoice.setVoiceForCharacter(character);
    }

    // ===== CHAT =====
    async function sendMessage() {
        const text = els.chatInput.value.trim();
        if (!text) return;

        els.chatInput.value = '';
        els.chatInput.disabled = true;
        els.sendBtn.disabled = true;

        addUserMessage(text);
        conversationHistory.push({ role: 'user', content: text });

        const typingEl = addTypingIndicator();

        try {
            const response = await toyAPI.chat(character, toyAnalysis, conversationHistory, text);
            conversationHistory.push({ role: 'assistant', content: response });
            typingEl.remove();
            addBotMessage(response);
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
        requestAnimationFrame(() => {
            els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
        });
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

    // ===== TOAST =====
    function showToast(message, type = '') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.classList.add('toast');
        if (type) toast.classList.add(type);
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }

    function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    // ===== BOOT =====
    document.addEventListener('DOMContentLoaded', init);

})();
