
class SpatialAudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("AudioContext initialization failed", e);
      }
    }
  }

  // Pan: -1 (full left) to 1 (full right)
  playDirectionalPing(pan: number = 0) {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') {
      this.ctx?.resume();
    }
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const panner = this.ctx.createStereoPanner();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, this.ctx.currentTime); // Slightly higher pitch for clarity
    panner.pan.setValueAtTime(pan, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);

    osc.connect(panner);
    panner.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  speak(text: string, pan: number = 0) {
    if (!text) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; // Slightly faster for responsiveness
    utterance.pitch = 1.0;
    
    // Play directional cue before/during speaking
    this.playDirectionalPing(pan);
    window.speechSynthesis.speak(utterance);
  }
}

export const spatialAudio = new SpatialAudioService();
