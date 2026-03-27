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
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

export interface GummyData {
  id: string;
  label: string;
  color: string;
  orbitRadius: number;
  orbitSpeed: number; // full rotation in ms
  startAngle: number; // radians
}

const GUMMY_SIZE = 68;
const BOT_CATCH_RADIUS = 80;


interface GummyFieldProps {
  gummies: GummyData[];
  centerX: number;
  centerY: number;
  onCatch: (gummy: GummyData) => void;
  catchFlash: SharedValue<number>;
  catchColor: SharedValue<string>;
}

interface SingleGummyProps {
  gummy: GummyData;
  centerX: number;
  centerY: number;
  onCatch: (gummy: GummyData) => void;
  catchFlash: SharedValue<number>;
  catchColor: SharedValue<string>;
}

function SingleGummy({
  gummy,
  centerX,
  centerY,
  onCatch,
  catchFlash,
  catchColor,
}: SingleGummyProps) {
  const angle = useSharedValue(gummy.startAngle);
  const isDragging = useSharedValue(false);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isVisible = useSharedValue(1);
  const popScale = useSharedValue(1);

  // Orbit animation
  useEffect(() => {
    angle.value = withRepeat(
      withTiming(gummy.startAngle + Math.PI * 2, {
        duration: gummy.orbitSpeed,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const triggerCatch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onCatch(gummy);
  }, [gummy, onCatch]);

  const triggerSnoozeHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      cancelAnimation(angle);
      // Store current orbit position as starting drag offset
      const currentX = Math.cos(angle.value) * gummy.orbitRadius;
      const currentY = Math.sin(angle.value) * gummy.orbitRadius;
      dragX.value = currentX;
      dragY.value = currentY;
    })
    .onUpdate((event) => {
      const currentX = Math.cos(angle.value) * gummy.orbitRadius;
      const currentY = Math.sin(angle.value) * gummy.orbitRadius;
      dragX.value = currentX + event.translationX;
      dragY.value = currentY + event.translationY;
    })
    .onEnd((event) => {
      const currentX = dragX.value;
      const currentY = dragY.value;
      const distToCenter = Math.sqrt(currentX * currentX + currentY * currentY);

      // Check velocity direction — is it heading toward center?
      const velocityToCenter =
        -(event.velocityX * currentX + event.velocityY * currentY) /
        (distToCenter || 1);

      const isCaught =
        distToCenter < BOT_CATCH_RADIUS || (velocityToCenter > 400 && distToCenter < gummy.orbitRadius * 1.2);

      if (isCaught) {
        // Fly to center and pop
        dragX.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) });
        dragY.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) });
        popScale.value = withSequence(
          withTiming(0.3, { duration: 150 }),
          withTiming(0, { duration: 100 })
        );
        isVisible.value = withTiming(0, { duration: 250 });

        // Flash the bot
        catchColor.value = gummy.color;
        catchFlash.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0, { duration: 400 })
        );

        runOnJS(triggerCatch)();
      } else {
        // Snap back to orbit — keep isDragging true so position reads from dragX/dragY
        runOnJS(triggerSnoozeHaptic)();
        const restoreAngle = Math.atan2(currentY, currentX);
        dragX.value = withSpring(Math.cos(restoreAngle) * gummy.orbitRadius, {
          damping: 12,
          stiffness: 120,
        });
        dragY.value = withSpring(
          Math.sin(restoreAngle) * gummy.orbitRadius,
          { damping: 12, stiffness: 120 },
          (finished) => {
            if (finished) {
              // Spring settled — switch back to orbit mode
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

    return {
      opacity: isVisible.value,
      transform: [
        { translateX: x - GUMMY_SIZE / 2 },
        { translateY: y - GUMMY_SIZE / 2 },
        { scale: popScale.value },
      ],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.gummy,
          {
            left: centerX,
            top: centerY,
            backgroundColor: gummy.color,
            shadowColor: gummy.color,
          },
          animatedStyle,
        ]}
      >
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
    width: GUMMY_SIZE,
    height: GUMMY_SIZE,
    borderRadius: GUMMY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  gummyLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
});
