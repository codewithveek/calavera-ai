import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/shared/theme/tokens';

interface CandleProps {
  height: number;
  /** Desynchronises flames so a row of candles never flickers in lockstep. */
  phaseMs?: number;
}

/** Flicker runs entirely on the UI thread, so it never competes with inference on the JS thread. */
export function Candle({ height, phaseMs = 0 }: CandleProps) {
  const reduceMotion = useReducedMotion();
  const flicker = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    const easing = Easing.inOut(Easing.quad);
    flicker.value = withRepeat(
      withSequence(
        withTiming(0.82, { duration: 260 + phaseMs, easing }),
        withTiming(1.05, { duration: 340, easing }),
        withTiming(0.92, { duration: 220, easing }),
      ),
      -1,
      true,
    );
  }, [flicker, phaseMs, reduceMotion]);

  const flameStyle = useAnimatedStyle(() => ({
    opacity: 0.75 + flicker.value * 0.25,
    transform: [{ scaleY: flicker.value }, { scaleX: 2 - flicker.value }],
  }));

  return (
    <View style={styles.candle} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.glow} />
      <Animated.View style={[styles.flame, flameStyle]} />
      <View style={styles.wick} />
      <View style={[styles.body, { height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  candle: { alignItems: 'center', justifyContent: 'flex-end' },
  glow: {
    position: 'absolute',
    top: -10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.candle,
    opacity: 0.12,
  },
  flame: {
    width: 10,
    height: 18,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: colors.candle,
    transformOrigin: 'bottom',
  },
  wick: { width: 2, height: 4, backgroundColor: colors.nightSunken },
  body: { width: 16, borderRadius: 3, backgroundColor: colors.bone },
});
