/**
 * AudioService - Simplified notification system
 */

class AudioService {
  private soundPath = '/sounds/notification.mp3';

  async play() {
    try {
      const audio = new Audio(this.soundPath);
      // Explicitly set volume to 1.0
      audio.volume = 1.0;
      await audio.play();
    } catch (e) {
      // Chrome/Safari may block autoplay without user gesture
      if (e instanceof Error && e.name === 'NotAllowedError') {
        console.warn('[AUDIO] Playback blocked by browser policy. Interaction required.');
      } else {
        console.error('[AUDIO] Playback error:', e);
      }
    }
  }
}

export const audioService = new AudioService();
