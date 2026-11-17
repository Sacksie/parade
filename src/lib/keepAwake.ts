import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Keep the screen on while a screen is mounted.
 * expo-keep-awake's own hook throws on web if the wake lock is released before it activated
 * (hot reloads, quick back-navigation), so this version swallows those errors and ignores web
 * when the Wake Lock API is missing.
 */
export function useKeepAwakeSafe(tag = 'parade') {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !('wakeLock' in navigator)) return;
    let active = false;
    activateKeepAwakeAsync(tag)
      .then(() => {
        active = true;
      })
      .catch(() => {});
    return () => {
      if (!active) return;
      try {
        deactivateKeepAwake(tag);
      } catch {
        // Already released, or never activated: nothing to do.
      }
    };
  }, [tag]);
}
