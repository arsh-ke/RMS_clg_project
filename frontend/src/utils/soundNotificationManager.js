/**
 * Sound Notification Manager
 * Centralized utility for managing notification sounds across the application
 */

class SoundNotificationManager {
  constructor() {
    this.soundInstances = {};
    this.isMuted = localStorage.getItem('soundNotificationsMuted') === 'true';
    this.volume = parseFloat(localStorage.getItem('soundNotificationsVolume') || '0.7');
  }

  /**
   * Get or create a sound instance
   * @param {string} soundId - Unique identifier for the sound
   * @param {string} soundPath - Path to the audio file
   * @returns {Audio} - Audio element instance
   */
  getSoundInstance(soundId, soundPath) {
    if (!this.soundInstances[soundId]) {
      const audio = new Audio(soundPath);
      audio.volume = this.volume;
      audio.preload = 'auto';
      this.soundInstances[soundId] = audio;
    }
    return this.soundInstances[soundId];
  }

  /**
   * Play a notification sound
   * @param {string} soundId - Unique identifier
   * @param {string} soundPath - Path to audio file
   * @returns {Promise<void>}
   */
  async playSound(soundId, soundPath = '/notification.mp3') {
    if (this.isMuted) {
      console.debug('Sound notifications are muted');
      return;
    }

    try {
      const audio = this.getSoundInstance(soundId, soundPath);
      
      // Stop if already playing
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }

      audio.currentTime = 0;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      console.error(`Failed to play sound ${soundId}:`, error);
      this.playFallbackSound();
    }
  }

  /**
   * Stop a currently playing sound
   * @param {string} soundId - Unique identifier
   */
  stopSound(soundId) {
    if (this.soundInstances[soundId] && !this.soundInstances[soundId].paused) {
      this.soundInstances[soundId].pause();
      this.soundInstances[soundId].currentTime = 0;
    }
  }

  /**
   * Stop all sounds
   */
  stopAllSounds() {
    Object.values(this.soundInstances).forEach((audio) => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('soundNotificationsMuted', this.isMuted);
    return this.isMuted;
  }

  /**
   * Set volume (0-1)
   * @param {number} volume - Volume level
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('soundNotificationsVolume', this.volume);
    
    // Update all existing audio instances
    Object.values(this.soundInstances).forEach((audio) => {
      audio.volume = this.volume;
    });
  }

  /**
   * Get current mute state
   */
  getMuteState() {
    return this.isMuted;
  }

  /**
   * Get current volume level
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Play fallback sound using Web Audio API
   */
  playFallbackSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create notification sound sequence
      const createBeep = (frequency, duration, startTime, volumeLevel = 0.3) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(frequency, startTime);
        gain.gain.setValueAtTime(volumeLevel, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      // Create a two-tone chime effect
      createBeep(800, 0.15, now);
      createBeep(1000, 0.15, now + 0.1);
    } catch (error) {
      console.error('Web Audio API not available:', error);
    }
  }

  /**
   * Release resources
   */
  dispose() {
    this.stopAllSounds();
    this.soundInstances = {};
  }
}

export const soundNotificationManager = new SoundNotificationManager();

export default soundNotificationManager;
