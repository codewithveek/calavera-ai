import * as Haptics from 'expo-haptics';

/** Fire-and-forget haptics: feedback must never block or throw. */
export const haptics = {
  tap() {
    Haptics.selectionAsync().catch(() => undefined);
  },
  success() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  },
  warning() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
  },
};
