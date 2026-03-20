// ===== Animations Controller =====

class ToyAnimations {
    constructor() {
        this.wrapper = null;
        this.sparklesContainer = null;
        this.sparkleInterval = null;
    }

    /**
     * Initialize with DOM references.
     */
    init(wrapperEl, sparklesEl) {
        this.wrapper = wrapperEl;
        this.sparklesContainer = sparklesEl;
    }

    /**
     * Start talking animation.
     */
    startTalking() {
        if (!this.wrapper) return;
        this.wrapper.classList.add('talking');
        this._startSparkles();
    }

    /**
     * Stop talking animation.
     */
    stopTalking() {
        if (!this.wrapper) return;
        this.wrapper.classList.remove('talking');
        this._stopSparkles();
    }

    /**
     * Play the "come to life" entrance animation.
     */
    async playEntrance() {
        if (!this.wrapper) return;

        const img = this.wrapper.querySelector('img');
        if (!img) return;

        // Initial state
        img.style.transform = 'scale(0) rotate(-20deg)';
        img.style.opacity = '0';
        this.wrapper.querySelector('.glow-ring').style.opacity = '0';

        // Force reflow
        img.offsetHeight;

        // Animate in
        img.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease';
        img.style.transform = 'scale(1) rotate(0deg)';
        img.style.opacity = '1';

        // Flash glow
        await this._sleep(300);
        const glow = this.wrapper.querySelector('.glow-ring');
        glow.style.transition = 'opacity 0.5s ease';
        glow.style.opacity = '1';

        // Burst of sparkles
        this._burstSparkles(12);

        await this._sleep(600);
        glow.style.opacity = '0';

        // Reset transitions
        img.style.transition = 'transform 0.3s';
    }

    /**
     * Spawn sparkles continuously while talking.
     */
    _startSparkles() {
        this._stopSparkles();
        this.sparkleInterval = setInterval(() => {
            this._spawnSparkle();
        }, 300);
    }

    _stopSparkles() {
        if (this.sparkleInterval) {
            clearInterval(this.sparkleInterval);
            this.sparkleInterval = null;
        }
    }

    /**
     * Spawn a single sparkle at a random position.
     */
    _spawnSparkle() {
        if (!this.sparklesContainer) return;

        const sparkle = document.createElement('div');
        sparkle.classList.add('sparkle');

        const angle = Math.random() * Math.PI * 2;
        const radius = 80 + Math.random() * 40;
        const x = Math.cos(angle) * radius + 120;
        const y = Math.sin(angle) * radius + 120;

        sparkle.style.left = `${x}px`;
        sparkle.style.top = `${y}px`;
        sparkle.style.animationDuration = `${1 + Math.random() * 1.5}s`;
        sparkle.style.width = `${3 + Math.random() * 5}px`;
        sparkle.style.height = sparkle.style.width;

        const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#34d399'];
        sparkle.style.background = colors[Math.floor(Math.random() * colors.length)];

        this.sparklesContainer.appendChild(sparkle);

        setTimeout(() => sparkle.remove(), 2500);
    }

    /**
     * Burst of sparkles for entrance.
     */
    _burstSparkles(count) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => this._spawnSparkle(), i * 50);
        }
    }

    /**
     * Create floating particles for the upload screen.
     */
    createUploadParticles(container) {
        const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899'];
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${6 + Math.random() * 8}s`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            container.appendChild(particle);
        }
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global instance
const toyAnimations = new ToyAnimations();
