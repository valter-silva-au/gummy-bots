import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
} from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('window');

interface SlideData {
  emoji: string;
  title: string;
  subtitle: string;
}

const SLIDES: SlideData[] = [
  {
    emoji: '🤖',
    title: 'Meet Your Bot',
    subtitle: 'Your AI assistant lives here, ready to help with tasks',
  },
  {
    emoji: '👆',
    title: 'Flick to Execute',
    subtitle: 'Swipe task bubbles at your bot to get things done',
  },
  {
    emoji: '🚀',
    title: 'Get Stuff Done',
    subtitle: 'Earn XP, build streaks, level up your bot',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_W);
    setCurrentPage(page);
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleGetStarted = () => {
    onComplete();
  };

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {SLIDES.map((slide, index) => (
          <Slide key={index} slide={slide} index={index} />
        ))}
      </ScrollView>

      {/* Page indicators */}
      <View style={styles.indicatorContainer}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentPage && styles.indicatorActive,
            ]}
          />
        ))}
      </View>

      {/* Get Started button (only on last slide) */}
      {currentPage === SLIDES.length - 1 && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

interface SlideProps {
  slide: SlideData;
  index: number;
}

function Slide({ slide, index }: SlideProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const emojiScale = useSharedValue(0);

  useEffect(() => {
    // Stagger animations for text fade-in
    opacity.value = withDelay(
      index * 100,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) })
    );
    translateY.value = withDelay(
      index * 100,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.back(1.2)) })
    );

    // Emoji pop-in with bounce
    emojiScale.value = withDelay(
      index * 100 + 200,
      withSequence(
        withTiming(1.2, { duration: 300, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) })
      )
    );
  }, [index]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.emojiContainer, emojiStyle]}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
      </Animated.View>

      <Animated.View style={textStyle}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emojiContainer: {
    marginBottom: 48,
  },
  emoji: {
    fontSize: 120,
    textAlign: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#00f0ff',
  },
  buttonContainer: {
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  getStartedButton: {
    backgroundColor: '#00f0ff',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedText: {
    color: '#0a0a1a',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
