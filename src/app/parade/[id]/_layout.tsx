import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

/**
 * Everything about one parade. The hub (index) branches on role: organiser sees I1, a car sees I3.
 * The car sheet (A3) is a transparent modal that draws its own <Sheet/>, so it looks and behaves
 * the same on iOS, Android and web (native formSheet detents don't exist on web).
 */
export default function ParadeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.onyx } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cars" />
      <Stack.Screen
        name="car/[carId]"
        options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
      />
      <Stack.Screen name="arrive" />
      <Stack.Screen name="ready" />
      <Stack.Screen name="countdown" options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="done" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      <Stack.Screen name="drive" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      <Stack.Screen name="console" options={{ gestureEnabled: false }} />
      <Stack.Screen name="help" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
