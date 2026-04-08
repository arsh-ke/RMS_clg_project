import { useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for managing notification sounds
 * Features:
 * - Role-based sound playback (kitchen only)
 * - Audio instance reuse to prevent overlapping sounds
 * - Error handling and fallback
 * - Volume control
 */
export const useNotificationSound = (options = {}) => {
  const { user } = useAuth();
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);

  const {
    volume = 0.7,
    soundPath = '/notification.mp3',
    allowedRoles = ['kitchen'],
  } = options;

  // Initialize audio instance once
  useEffect(() => {
    // Only create audio element for kitchen role users
    if (user?.role && allowedRoles.includes(user.role)) {
      if (!audioRef.current) {
        const audio = new Audio(soundPath);
        audio.volume = volume;
        // Preload audio
        audio.preload = 'auto';
        audioRef.current = audio;
      }
    }
  }, [user?.role, volume, soundPath, allowedRoles]);

  /**
   * Play notification sound with checks for role and overlapping playback
   * @returns {Promise<void>}
   */
  const playSound = useCallback(async () => {
    // Check if user has kitchen role
    if (!user?.role || !allowedRoles.includes(user.role)) {
      console.debug('Sound notification skipped: User role not allowed');
      return;
    }

    // Prevent overlapping sounds
    if (isPlayingRef.current && audioRef.current && !audioRef.current.paused) {
      console.debug('Sound already playing, skipping');
      return;
    }

    try {
      if (audioRef.current) {
        // Reset audio to start
        audioRef.current.currentTime = 0;
        // Play with error handling
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          isPlayingRef.current = true;
          await playPromise;
          isPlayingRef.current = false;
        }
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error);
      isPlayingRef.current = false;
      // Fallback: Try to generate sound using Web Audio API
      try {
        playFallbackSound();
      } catch (fallbackError) {
        console.error('Fallback sound also failed:', fallbackError);
      }
    }
  }, [user?.role, allowedRoles]);

  /**
   * Fallback sound generation using Web Audio API
   */
  const playFallbackSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Create a pleasant chime sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('Web Audio API fallback failed:', error);
    }
  }, []);

  /**
   * Stop currently playing sound
   */
  const stopSound = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      isPlayingRef.current = false;
    }
  }, []);

  /**
   * Set volume (0-1)
   */
  const setVolume = useCallback((newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  return {
    playSound,
    stopSound,
    setVolume,
    isPlaying: isPlayingRef,
    isKitchenUser: user?.role && allowedRoles.includes(user.role),
  };
};
