/**
 * AudioService - Centralized robust notification system
 * Uses Web Audio API for high-precision, background-capable playback.
 */

// Test audio base64 (Short silent MP3)
const CHIME_BASE64 = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v///w==';


class AudioService {
  private context: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private isInitialized = false;
  private isLoading = false;

  constructor() {
    // Attempt to unlock on first interaction
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.init().catch(console.error);
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
      };
      window.addEventListener('click', unlock);
      window.addEventListener('touchstart', unlock);
    }
  }

  /**
   * Manual conversion of Base64 to ArrayBuffer to bypass CSP fetch restrictions.
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const base64Content = base64.includes(',') ? base64.split(',')[1] : base64;
    const binaryString = window.atob(base64Content);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async init() {
    if (this.isInitialized || this.isLoading) return;
    this.isLoading = true;

    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Bypass fetch and CSP by decoding manually in memory
      const arrayBuffer = this.base64ToArrayBuffer(CHIME_BASE64);

      // Web Audio API decoding
      this.buffer = await this.context.decodeAudioData(arrayBuffer);
      this.isInitialized = true;
      console.log('[AUDIO] Audio Service initialized successfully via memory decode');
    } catch (e) {
      console.error('[AUDIO] Failed to initialize AudioContext', e);
    } finally {
      this.isLoading = false;
    }
  }

  async play() {
    // Ensure initialized
    if (!this.isInitialized) {
      await this.init();
    }

    if (!this.context || !this.buffer) {
      console.warn('[AUDIO] Service not ready for playback');
      return;
    }

    try {
      // Chrome/Safari requirement: resume context on user gesture
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      const source = this.context.createBufferSource();
      source.buffer = this.buffer;
      source.connect(this.context.destination);
      source.start(0);
    } catch (e) {
      console.error('[AUDIO] Playback error:', e);
    }
  }
}

export const audioService = new AudioService();
