/**
 * AudioService - Centralized robust notification system
 * Uses Web Audio API for high-precision, background-capable playback.
 */

// Chime audio base64 (MP3 format)
const CHIME_BASE64 = 'data:audio/mpeg;base64,SUQzBAAAAAABAFRYWFhYAAAASU0UAAAAUE9SVEFCTEUtU09VTkRTIE5PVElGSUNBVElPTiBNUDMgQ0hJTUUKAFRFTkMAbm90aWZpY2F0aW9uc291bmRzLmNvbQBUSVQyAAAAGU5vdGlmaWNhdGlvbiBTb3VuZCAtIENoaW1lAFRBTEIAAAAQTm90aWZpY2F0aW9uIFNvdW5kAFRQRTEAAAAPUmVsYXhpbmcgQ2hpbWVzAP/70MQAAAAAAAAAAAAAAAAAAAAAABYaW5nAAAADwAAACIAAEWJAAMICQ0OExYXGhseHyEjJykrLi8xMzY5Oz9BQ0ZJS05QUVJWWVxeYGFjZmlrbm9xcnZ5e36AgYOGiYyOkJGTVllcXmBhY2Zpa25vcXN2eXxeYGFjZmlrbm9xcnZ5e36AgYOGiYyOkJGTVllcXmBhY2Zpa25vcXN2eXxeYGFjZmlrbm9xcnZ5e36AgYOGiYyOkJGTVllcXmBhY2Zpa25vcXN2eXxeYGFjZmlrbm9xcnZ5e36AgYOGiYyOkJGTVllcXmBhY2Zpa25vcXN2eXxeYGFjZmlrbm9xcnZ5e36AgYOGiYyOkJGTVllcXmBhY2Zpa25vcXN2eXxeYGFjZmlrbm9xcnZ5e36AgYOGiYyOkJGTVllcXmBhY2Zpa25vcXN2eXxeYGFjZmlrbm9xcnZ5e36AgYOGiYyOkJGTVllcXmBhY2Zpa25vcXN2eXxeYGFjZmlrbm9xcnZ5e36AgYOGiYyOkJGTVllcXmBhY2Zpa25vcXN2eXxeYGFjZmlrbm9xcnZ5e36AgYOGiYyOkJGTVllcXmBhY2Zpa25vcXN2eXxeYGFjZmlrbm9xcnZ5e36AgYOGiYyOkJGTVllcXmBhY2Zpa25vcXN2eXxcXmBhY2Zpa25vcXN2eYAAAAADAAAAAE9reSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/++9DECRAAAAnwAAAAAAAFlVSAAAAAnwAAAAAAAFmWRXNhbXBsZSAyMAAAM8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8AA//vQxEgUAADPPAAAAAAAZZ8AAAAAAM88AAAAAAFZ5/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8AA//vQxFgeAADPPAAAAAAAZZ4AAAAAAM88AAAAAAFZ5/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8AADEAAAABAAAAAgAAAAEAAAADAAAAAQAAAAQAAAABAAAABQAAAAEAAAAGAAAAAQAAAB/+9DETwCAAAZ54AAAAAAJZ4AAAAAAM88AAAAAAFZ54AA//70MRuLAAADPPAAAAAAFlngAAAAAAzzzAAAAAAAWeePz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8';


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
    const base64Content = (base64.includes(',') ? base64.split(',')[1] : base64).trim().replace(/\s/g, '');
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
