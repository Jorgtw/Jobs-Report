/**
 * AudioService - Simplified notification system
 */

class AudioService {
  private soundPath = '/sounds/notification.mp3';
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlockAudio();
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('click', unlock);
      window.addEventListener('touchstart', unlock);
      window.addEventListener('keydown', unlock);
    }
  }

  private unlockAudio() {
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (e) {
      console.warn('[AUDIO] Could not unlock AudioContext:', e);
    }
  }

  private playSynthesizedChime() {
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) this.audioCtx = new AudioCtxClass();
      }
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Note 2: A5 (880.00 Hz) - slightly delayed
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.35, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.38);
    } catch (e) {
      console.error('[AUDIO] Synthesized chime playback error:', e);
    }
  }

  async play() {
    // Check if sound notifications are enabled by user
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('app_notification_audio');
      const soundEnabled = saved !== null ? JSON.parse(saved) : true;
      if (!soundEnabled) return;
    }

    this.unlockAudio();

    try {
      const audio = new Audio(this.soundPath);
      audio.volume = 1.0;
      await audio.play();
    } catch (e) {
      // Fallback to Web Audio API synthesized chime if HTML5 audio is blocked or fails
      if (e instanceof Error && e.name === 'NotAllowedError') {
        console.warn('[AUDIO] MP3 autoplay blocked by browser policy. Falling back to synth chime.');
      }
      this.playSynthesizedChime();
    }
  }
}

export const audioService = new AudioService();

