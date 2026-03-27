import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

interface DoneToastProps {
  label: string;
  onDone: () => void;
}

export default function DoneToast({ label, onDone }: DoneToastProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(1200, withTiming(0, { duration: 400 }))
    );
    translateY.value = withSequence(
      withTiming(0, { duration: 200, easing: Easing.out(Easing.back(1.5)) }),
      withDelay(1200, withTiming(-20, { duration: 400 }))
    );
    scale.value = withSequence(
      withTiming(1, { duration: 200, easing: Easing.out(Easing.back(1.5)) }),
      withDelay(
        1200,
        withTiming(0.8, { duration: 400 }, () => {
          runOnJS(onDone)();
        })
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.toast, style]}>
      <Text style={styles.check}>✓</Text>
      <Text style={styles.text}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    backgroundColor: 'rgba(40, 220, 120, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#28dc78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  check: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
