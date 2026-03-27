import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  SharedValue,
  withSpring,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const BOT_SIZE = 100;
const GLOW_SIZE = 180;

interface BotOrbProps {
  catchFlash: SharedValue<number>;
  catchColor: SharedValue<string>;
}

export default function BotOrb({ catchFlash, catchColor }: BotOrbProps) {
  const breathe = useSharedValue(0);
  const ringPulse = useSharedValue(0);

  useEffect(() => {
    // Breathing animation
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    // Subtle ring rotation for life-like feel
    ringPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  // Main orb: breathing + catch squish
  const orbStyle = useAnimatedStyle(() => {
    const breathScale = interpolate(breathe.value, [0, 1], [1, 1.06]);

    // Catch: squish horizontally, stretch vertically, then bounce back
    const catchSquishX = interpolate(catchFlash.value, [0, 0.3, 0.6, 1], [1, 1.25, 0.9, 1]);
    const catchSquishY = interpolate(catchFlash.value, [0, 0.3, 0.6, 1], [1, 0.8, 1.08, 1]);
    const catchScale = interpolate(catchFlash.value, [0, 0.2, 0.5, 1], [1, 1.2, 1.05, 1]);

    return {
      transform: [
        { scale: breathScale * catchScale },
        { scaleX: catchSquishX },
        { scaleY: catchSquishY },
      ],
    };
  });

  // Outer glow: pulses with breathing and flashes on catch
  const glowStyle = useAnimatedStyle(() => {
    const breathOpacity = interpolate(breathe.value, [0, 1], [0.25, 0.55]);
    const catchGlow = interpolate(catchFlash.value, [0, 0.3, 1], [0, 0.6, 0]);
    const scale = interpolate(breathe.value, [0, 1], [1, 1.12]);
    const catchExpand = interpolate(catchFlash.value, [0, 0.3, 1], [1, 1.4, 1]);

    return {
      opacity: breathOpacity + catchGlow,
      transform: [{ scale: scale * catchExpand }],
    };
  });

  // Inner glow ring
  const innerGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(breathe.value, [0, 1], [0.4, 0.75]);
    const catchBoost = interpolate(catchFlash.value, [0, 0.3, 1], [0, 0.3, 0]);
    const ringScale = interpolate(ringPulse.value, [0, 1], [0.95, 1.05]);

    return {
      opacity: opacity + catchBoost,
      transform: [{ scale: ringScale }],
    };
  });

  // Catch flash ring — expands outward on catch
  const flashRingStyle = useAnimatedStyle(() => {
    const scale = interpolate(catchFlash.value, [0, 0.2, 1], [0.5, 1, 2.5]);
    const opacity = interpolate(catchFlash.value, [0, 0.15, 0.5, 1], [0, 0.8, 0.3, 0]);

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Outer glow */}
      <Animated.View style={[styles.glowOuter, glowStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(0, 220, 255, 0.15)', 'transparent']}
          style={styles.glowGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Inner glow ring */}
      <Animated.View style={[styles.glowInner, innerGlowStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(0, 220, 255, 0.3)', 'rgba(120, 200, 255, 0.1)', 'transparent']}
          style={styles.glowGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Catch flash ring — expanding shockwave */}
      <Animated.View style={[styles.flashRing, flashRingStyle]} />

      {/* Main orb */}
      <Animated.View style={[styles.orb, orbStyle]}>
        <LinearGradient
          colors={['#78e8ff', '#00dcff', '#0099cc', '#006688']}
          style={styles.orbGradient}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
        />
        {/* Highlight */}
        <View style={styles.highlight} />
        {/* Secondary highlight for depth */}
        <View style={styles.highlightSecondary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    overflow: 'hidden',
  },
  glowInner: {
    position: 'absolute',
    width: GLOW_SIZE * 0.75,
    height: GLOW_SIZE * 0.75,
    borderRadius: (GLOW_SIZE * 0.75) / 2,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
    borderRadius: GLOW_SIZE / 2,
  },
  flashRing: {
    position: 'absolute',
    width: BOT_SIZE * 1.2,
    height: BOT_SIZE * 1.2,
    borderRadius: BOT_SIZE * 0.6,
    borderWidth: 3,
    borderColor: 'rgba(0, 220, 255, 0.6)',
  },
  orb: {
    width: BOT_SIZE,
    height: BOT_SIZE,
    borderRadius: BOT_SIZE / 2,
    overflow: 'hidden',
    shadowColor: '#00dcff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 15,
  },
  orbGradient: {
    flex: 1,
    borderRadius: BOT_SIZE / 2,
  },
  highlight: {
    position: 'absolute',
    top: 12,
    left: 18,
    width: 30,
    height: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    transform: [{ rotate: '-20deg' }],
  },
  highlightSecondary: {
    position: 'absolute',
    top: 22,
    right: 20,
    width: 12,
    height: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ rotate: '15deg' }],
  },
});
