import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS !== 'web';

function run(fn: () => Promise<void>) {
  if (!enabled) return;
  try {
    fn().catch(() => {});
  } catch {
    // Haptics are a nicety; never let them break a tap.
  }
}

/** Light tap for presses and selection changes. */
export const tap = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const select = () => run(() => Haptics.selectionAsync());
export const success = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const warning = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
