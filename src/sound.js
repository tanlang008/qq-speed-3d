// Web Audio API 合成 QQ 飞车经典音效
class SoundManager {
    constructor() {
        this.ctx = null;
        this.engineOsc = null;
        this.engineGain = null;
        this.initialized = false;
        this.driftNoise = null;
        this.driftGain = null;
    }

    init() {
        if (this.initialized) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.initialized = true;

        // 引擎声
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(50, this.ctx.currentTime);
        this.engineGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, this.ctx.currentTime);

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();

        // 漂移胎噪生成 (白噪音 + Bandpass)
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        this.driftNoise = this.ctx.createBufferSource();
        this.driftNoise.buffer = noiseBuffer;
        this.driftNoise.loop = true;

        const driftFilter = this.ctx.createBiquadFilter();
        driftFilter.type = 'bandpass';
        driftFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        driftFilter.Q.setValueAtTime(3, this.ctx.currentTime);

        this.driftGain = this.ctx.createGain();
        this.driftGain.gain.setValueAtTime(0, this.ctx.currentTime);

        this.driftNoise.connect(driftFilter);
        driftFilter.connect(this.driftGain);
        this.driftGain.connect(this.ctx.destination);
        this.driftNoise.start();
    }

    updateEngine(speed, maxSpeed, isBoosting) {
        if (!this.initialized || !this.ctx) return;
        const ratio = Math.min(Math.max(speed / maxSpeed, 0), 1.5);
        const baseFreq = isBoosting ? 120 + ratio * 200 : 50 + ratio * 120;
        this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
        this.engineGain.gain.setTargetAtTime(0.04 + ratio * 0.04, this.ctx.currentTime, 0.05);
    }

    setDrift(isDrifting, intensity = 1.0) {
        if (!this.initialized || !this.ctx) return;
        const targetVol = isDrifting ? 0.12 * Math.min(intensity, 1.5) : 0;
        this.driftGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.05);
    }

    playBoost() {
        if (!this.initialized || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
    }

    playN2O() {
        if (!this.initialized || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(150, now + 1.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
    }

    playCountdown() {
        if (!this.initialized || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playStart() {
        if (!this.initialized || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

window.soundManager = new SoundManager();
