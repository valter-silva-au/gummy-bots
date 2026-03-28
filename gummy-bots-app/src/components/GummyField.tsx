import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  runOnJS,
  interpolate,
  Easing,
  SharedValue,
  cancelAnimation,
  withDelay,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

export interface GummyData {
  id: string;
  label: string;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  startAngle: number;
  size?: number; // 0.7-1.3 scale factor for complexity
}

const GUMMY_BASE_SIZE = 64;
const BOT_GRAVITY_WELL = 130; // Magnetic snap radius — generous for imprecise flicks
const BOT_CATCH_RADIUS = 95;  // Inner catch zone — wider for easier catches
const VELOCITY_THRESHOLD = 250; // Min velocity toward center — lowered for snappier feel
const EDGE_BOUNCE_DAMPING = 0.4;

interface GummyFieldProps {
  gummies: GummyData[];
  centerX: number;
  centerY: number;
  onCatch: (gummy: GummyData) => void;
  onDismiss?: (gummy: GummyData) => void;
  catchFlash: SharedValue<number>;
  catchColor: SharedValue<string>;
}

interface SingleGummyProps {
  gummy: GummyData;
  centerX: number;
  centerY: number;
  onCatch: (gummy: GummyData) => void;
  onDismiss?: (gummy: GummyData) => void;
  catchFlash: SharedValue<number>;
  catchColor: SharedValue<string>;
}

function SingleGummy({
  gummy,
  centerX,
  centerY,
  onCatch,
  onDismiss,
  catchFlash,
  catchColor,
}: SingleGummyProps) {
  const angle = useSharedValue(gummy.startAngle);
  const isDragging = useSharedValue(false);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isVisible = useSharedValue(1);
  const popScale = useSharedValue(1);
  const glowIntensity = useSharedValue(0);
  const wobble = useSharedValue(0);

  const gummySize = GUMMY_BASE_SIZE * (gummy.size ?? 1);

  // Orbit animation with slight wobble for organic feel
  useEffect(() => {
    angle.value = withRepeat(
      withTiming(gummy.startAngle + Math.PI * 2, {
        duration: gummy.orbitSpeed,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    // Subtle size wobble for breathing effect
    wobble.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const triggerCatch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onCatch(gummy);
  }, [gummy, onCatch]);

  const triggerDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.(gummy);
  }, [gummy, onDismiss]);

  const triggerMissHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      cancelAnimation(angle);
      const currentX = Math.cos(angle.value) * gummy.orbitRadius;
      const currentY = Math.sin(angle.value) * gummy.orbitRadius;
      dragX.value = currentX;
      dragY.value = currentY;
      // Lift effect — snappy pick-up
      popScale.value = withSpring(1.2, { damping: 6, stiffness: 400 });
      glowIntensity.value = withTiming(1, { duration: 150 });
    })
    .onUpdate((event) => {
      const currentX = Math.cos(angle.value) * gummy.orbitRadius;
      const currentY = Math.sin(angle.value) * gummy.orbitRadius;
      dragX.value = currentX + event.translationX;
      dragY.value = currentY + event.translationY;

      // Glow intensifies as gummy approaches center (gravity well feedback)
      const dist = Math.sqrt(dragX.value ** 2 + dragY.value ** 2);
      if (dist < BOT_GRAVITY_WELL) {
        glowIntensity.value = interpolate(dist, [0, BOT_GRAVITY_WELL], [2, 0.5]);
      } else {
        glowIntensity.value = 0.3;
      }
    })
    .onEnd((event) => {
      const posX = dragX.value;
      const posY = dragY.value;
      const distToCenter = Math.sqrt(posX * posX + posY * posY);

      // Calculate velocity component toward center
      const speed = Math.sqrt(event.velocityX ** 2 + event.velocityY ** 2);
      const velocityToCenter =
        -(event.velocityX * posX + event.velocityY * posY) /
        (distToCenter || 1);

      // MAGNETIC SNAPPING: generous catch detection
      // 1. Already inside catch radius
      // 2. Moving toward center with enough velocity and within gravity well
      // 3. High velocity flick from further away but still directed at center
      const isDirectHit = distToCenter < BOT_CATCH_RADIUS;
      const isGravityAssist =
        velocityToCenter > VELOCITY_THRESHOLD && distToCenter < BOT_GRAVITY_WELL;
      const isPowerFlick =
        velocityToCenter > 800 && distToCenter < gummy.orbitRadius * 1.3;

      if (isDirectHit || isGravityAssist || isPowerFlick) {
        // === CATCH: Fly to center with squish ===

        // Magnetic pull: curve toward center
        dragX.value = withTiming(0, {
          duration: isDirectHit ? 100 : 180,
          easing: Easing.in(Easing.quad),
        });
        dragY.value = withTiming(0, {
          duration: isDirectHit ? 100 : 180,
          easing: Easing.in(Easing.quad),
        });

        // Pop: expand then shrink to nothing
        popScale.value = withSequence(
          withTiming(1.4, { duration: 80 }),
          withTiming(0, { duration: 120, easing: Easing.in(Easing.ease) })
        );
        isVisible.value = withDelay(200, withTiming(0, { duration: 50 }));

        // Flash the bot with gummy's color
        catchColor.value = gummy.color;
        catchFlash.value = withSequence(
          withTiming(1, { duration: 80 }),
          withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) })
        );

        glowIntensity.value = withTiming(0, { duration: 200 });
        runOnJS(triggerCatch)();
      } else if (speed > 600 && velocityToCenter < -200) {
        // === DISMISS: Flicked away from center ===
        const flickAngle = Math.atan2(event.velocityY, event.velocityX);
        const flightDist = 400;
        dragX.value = withTiming(posX + Math.cos(flickAngle) * flightDist, {
          duration: 300,
          easing: Easing.out(Easing.quad),
        });
        dragY.value = withTiming(posY + Math.sin(flickAngle) * flightDist, {
          duration: 300,
          easing: Easing.out(Easing.quad),
        });
        popScale.value = withTiming(0.3, { duration: 400 });
        isVisible.value = withTiming(0, { duration: 400 });
        glowIntensity.value = withTiming(0, { duration: 200 });
        runOnJS(triggerDismiss)();
      } else {
        // === MISS: Bounce back to orbit with satisfying snap ===
        runOnJS(triggerMissHaptic)();
        popScale.value = withSpring(1, { damping: 6, stiffness: 300 });
        glowIntensity.value = withTiming(0, { duration: 200 });

        // Tighter spring back — snappier bounce with overshoot
        const restoreAngle = Math.atan2(posY, posX);
        const targetX = Math.cos(restoreAngle) * gummy.orbitRadius;
        const targetY = Math.sin(restoreAngle) * gummy.orbitRadius;

        dragX.value = withSpring(targetX, {
          damping: 6,
          stiffness: 180,
          mass: 0.8,
        });
        dragY.value = withSpring(
          targetY,
          {
            damping: 6,
            stiffness: 180,
            mass: 0.8,
          },
          (finished) => {
            if (finished) {
              angle.value = restoreAngle;
              isDragging.value = false;
              angle.value = withRepeat(
                withTiming(restoreAngle + Math.PI * 2, {
                  duration: gummy.orbitSpeed,
                  easing: Easing.linear,
                }),
                -1,
                false
              );
            }
          }
        );
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    let x: number, y: number;
    if (isDragging.value) {
      x = dragX.value;
      y = dragY.value;
    } else {
      x = Math.cos(angle.value) * gummy.orbitRadius;
      y = Math.sin(angle.value) * gummy.orbitRadius;
    }

    const breathScale = interpolate(wobble.value, [0, 1], [0.97, 1.03]);

    return {
      opacity: isVisible.value,
      transform: [
        { translateX: x - gummySize / 2 },
        { translateY: y - gummySize / 2 },
        { scale: popScale.value * breathScale },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowIntensity.value, [0, 1, 2], [0, 0.4, 0.8]),
    transform: [
      { scale: interpolate(glowIntensity.value, [0, 1, 2], [1, 1.3, 1.6]) },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.gummy,
          {
            left: centerX,
            top: centerY,
            width: gummySize,
            height: gummySize,
            borderRadius: gummySize / 2,
            backgroundColor: gummy.color,
            shadowColor: gummy.color,
          },
          animatedStyle,
        ]}
      >
        {/* Proximity glow */}
        <Animated.View
          style={[
            styles.proximityGlow,
            {
              width: gummySize * 1.6,
              height: gummySize * 1.6,
              borderRadius: gummySize * 0.8,
              backgroundColor: gummy.color,
            },
            glowStyle,
          ]}
        />
        <Text style={styles.gummyLabel} numberOfLines={2}>
          {gummy.label}
        </Text>
        {/* Glossy highlight */}
        <View style={styles.gummyHighlight} />
      </Animated.View>
    </GestureDetector>
  );
}

export default function GummyField({
  gummies,
  centerX,
  centerY,
  onCatch,
  onDismiss,
  catchFlash,
  catchColor,
}: GummyFieldProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {gummies.map((g) => (
        <SingleGummy
          key={g.id}
          gummy={g}
          centerX={centerX}
          centerY={centerY}
          onCatch={onCatch}
          onDismiss={onDismiss}
          catchFlash={catchFlash}
          catchColor={catchColor}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gummy: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  gummyLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  gummyHighlight: {
    position: 'absolute',
    top: 6,
    left: 12,
    width: 24,
    height: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ rotate: '-15deg' }],
  },
  proximityGlow: {
    position: 'absolute',
    opacity: 0,
  },
});
