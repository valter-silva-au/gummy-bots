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

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const orbStyle = useAnimatedStyle(() => {
    const scale = interpolate(breathe.value, [0, 1], [1, 1.08]);
    const flashScale = interpolate(catchFlash.value, [0, 1], [1, 1.25]);
    return {
      transform: [{ scale: scale * flashScale }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(breathe.value, [0, 1], [0.3, 0.6]);
    const flashOpacity = interpolate(catchFlash.value, [0, 1], [0, 0.5]);
    const scale = interpolate(breathe.value, [0, 1], [1, 1.15]);
    return {
      opacity: opacity + flashOpacity,
      transform: [{ scale }],
    };
  });

  const innerGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(breathe.value, [0, 1], [0.5, 0.8]);
    return { opacity };
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
  orb: {
    width: BOT_SIZE,
    height: BOT_SIZE,
    borderRadius: BOT_SIZE / 2,
    overflow: 'hidden',
    shadowColor: '#00dcff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
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
});
