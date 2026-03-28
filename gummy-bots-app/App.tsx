import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import BotOrb from './src/components/BotOrb';
import GummyField, { GummyData } from './src/components/GummyField';
import StatusHeader from './src/components/StatusHeader';
import ConnectorDock from './src/components/ConnectorDock';
import DoneToast from './src/components/DoneToast';
import ShareButton from './src/components/ShareButton';
import Watermark from './src/components/Watermark';
import { useWebSocket, WSMessage } from './src/hooks/useWebSocket';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// 20 realistic tasks across all categories for standalone demo mode
// These appear with timed delays to create a living, breathing experience
const MOCK_TASK_POOL: Omit<GummyData, 'id' | 'startAngle'>[] = [
  // Comms (blue)
  { label: 'Reply to Mom', color: '#4a90ff', orbitRadius: 155, orbitSpeed: 8000, size: 0.9 },
  { label: 'Email from Sarah:\nProject update', color: '#4a90ff', orbitRadius: 170, orbitSpeed: 9500, size: 1.0 },
  { label: 'Slack: @you\nin #engineering', color: '#4a90ff', orbitRadius: 160, orbitSpeed: 8500, size: 0.85 },
  { label: 'Reply to Boss:\nMeeting notes', color: '#4a90ff', orbitRadius: 180, orbitSpeed: 7500, size: 1.15 },
  // Calendar (green)
  { label: 'Book Dentist\n5pm Thursday', color: '#44cc66', orbitRadius: 175, orbitSpeed: 11000, size: 1.0 },
  { label: 'Sprint Review\n2pm today', color: '#44cc66', orbitRadius: 165, orbitSpeed: 9000, size: 1.1 },
  { label: '1:1 with Manager\n10am tomorrow', color: '#44cc66', orbitRadius: 145, orbitSpeed: 10500, size: 0.95 },
  { label: 'Team Lunch\nnoon Friday', color: '#44cc66', orbitRadius: 185, orbitSpeed: 12000, size: 0.9 },
  // Info (orange)
  { label: 'Daily News\nDigest', color: '#ff8833', orbitRadius: 145, orbitSpeed: 9500, size: 0.8 },
  { label: 'AI Breakthrough:\nNew model dropped', color: '#ff8833', orbitRadius: 155, orbitSpeed: 11500, size: 0.85 },
  { label: 'Tech News:\nRust 2.0 released', color: '#ff8833', orbitRadius: 150, orbitSpeed: 10000, size: 0.75 },
  { label: 'Read: Remote\nWork Study', color: '#ff8833', orbitRadius: 165, orbitSpeed: 13000, size: 0.8 },
  // Urgent (red)
  { label: 'Pay Rent\nDue Tomorrow!', color: '#ff4455', orbitRadius: 140, orbitSpeed: 6500, size: 1.3 },
  { label: 'Prod is Down!\nCheck Grafana', color: '#ff4455', orbitRadius: 135, orbitSpeed: 5500, size: 1.4 },
  { label: 'Client Escalation\nRespond ASAP', color: '#ff4455', orbitRadius: 150, orbitSpeed: 6000, size: 1.25 },
  { label: 'Tax Filing\nDeadline Today', color: '#ff4455', orbitRadius: 145, orbitSpeed: 7000, size: 1.2 },
  // Automation (purple)
  { label: 'Auto Backup\nCompleted', color: '#aa66ff', orbitRadius: 150, orbitSpeed: 12000, size: 0.85 },
  { label: 'CI Pipeline\nNeeds Approval', color: '#aa66ff', orbitRadius: 160, orbitSpeed: 11000, size: 0.95 },
  { label: 'Deploy Preview\nReady to Ship', color: '#aa66ff', orbitRadius: 170, orbitSpeed: 10500, size: 0.9 },
  { label: 'Cron Job Failed:\nRetry?', color: '#aa66ff', orbitRadius: 155, orbitSpeed: 9000, size: 1.0 },
];

// Start with first 4 visible, rest appear over time
const INITIAL_COUNT = 4;

function getInitialGummies(): GummyData[] {
  return MOCK_TASK_POOL.slice(0, INITIAL_COUNT).map((task, i) => ({
    ...task,
    id: `mock-${i}`,
    startAngle: (Math.PI * 2 * i) / INITIAL_COUNT,
  }));
}

export default function App() {
  const [gummies, setGummies] = useState<GummyData[]>(getInitialGummies);
  const [toasts, setToasts] = useState<{ id: string; label: string }[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [comboCount, setComboCount] = useState(0);

  const catchFlash = useSharedValue(0);
  const catchColor = useSharedValue('#00dcff');
  const counterPop = useSharedValue(1);
  const screenShake = useSharedValue(0);

  // ViewShot ref for share replay capture
  const viewShotRef = useRef<ViewShot>(null);

  const centerX = SCREEN_W / 2;
  const centerY = SCREEN_H * 0.42;

  // Track which mock tasks have been spawned
  const nextMockIndexRef = useRef(INITIAL_COUNT);
  const lastCatchTimeRef = useRef(0);

  // Timed mock task appearance (15-30s intervals) for standalone mode
  useEffect(() => {
    const spawnNext = () => {
      const idx = nextMockIndexRef.current;
      if (idx >= MOCK_TASK_POOL.length) {
        // Cycle back through the pool with new IDs
        nextMockIndexRef.current = 0;
        return;
      }

      const task = MOCK_TASK_POOL[idx];
      const newGummy: GummyData = {
        ...task,
        id: `mock-${Date.now()}-${idx}`,
        startAngle: Math.random() * Math.PI * 2,
      };

      setGummies((prev) => {
        // Cap at 8 visible gummies to avoid clutter
        if (prev.length >= 8) return prev;
        return [...prev, newGummy];
      });

      nextMockIndexRef.current = idx + 1;
    };

    // Spawn new tasks every 15-30 seconds
    const scheduleNext = () => {
      const delay = 15000 + Math.random() * 15000;
      return setTimeout(() => {
        spawnNext();
        timerRef.current = scheduleNext();
      }, delay);
    };

    const timerRef = { current: scheduleNext() };

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // WebSocket connection — uses server gummies when available
  const handleWSMessage = useCallback((msg: WSMessage) => {
    if (msg.type === 'gummy:new' && msg.payload) {
      const p = msg.payload as { id: number; taskId: number; color: string; size: number; orbitRadius: number; orbitSpeed: number; label?: string };
      const newGummy: GummyData = {
        id: `ws-${p.id}`,
        label: p.label || `Task #${p.taskId}`,
        color: p.color || '#4a90ff',
        orbitRadius: p.orbitRadius || 150 + Math.random() * 40,
        orbitSpeed: p.orbitSpeed || 8000 + Math.random() * 4000,
        startAngle: Math.random() * Math.PI * 2,
        size: p.size || 1,
      };
      setGummies((prev) => {
        if (prev.length >= 8) return prev;
        return [...prev, newGummy];
      });
    }

    if (msg.type === 'xp:gained' && msg.payload) {
      const p = msg.payload as { level: number; streak: number; combo: number };
      setLevel(p.level);
      setStreak(p.streak);
      setComboCount(p.combo);
    }
  }, []);

  const { isConnected } = useWebSocket(handleWSMessage);

  // Combo tracking for standalone mode
  const handleCatch = useCallback((gummy: GummyData) => {
    const now = Date.now();
    const timeSinceLast = now - lastCatchTimeRef.current;
    lastCatchTimeRef.current = now;

    const toastId = `${gummy.id}-${now}`;
    setToasts((prev) => [...prev, { id: toastId, label: gummy.label }]);

    setCompletedCount((prev) => {
      const next = prev + 1;
      // Level up every 5 completions in standalone mode
      if (!isConnected) {
        setLevel(Math.floor(next / 5) + 1);
      }
      return next;
    });

    // Combo detection: catches within 3 seconds
    if (timeSinceLast < 3000 && timeSinceLast > 0) {
      setComboCount((prev) => {
        const next = prev + 1;
        // Screen shake on 3+ combo
        if (next >= 3) {
          screenShake.value = withSequence(
            withTiming(8, { duration: 50 }),
            withTiming(-6, { duration: 50 }),
            withTiming(4, { duration: 50 }),
            withTiming(-2, { duration: 50 }),
            withTiming(0, { duration: 50 })
          );
        }
        return next;
      });
    } else {
      setComboCount(1);
    }

    // Counter pop animation
    counterPop.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    setTimeout(() => {
      setGummies((prev) => prev.filter((g) => g.id !== gummy.id));
    }, 300);
  }, [isConnected, catchFlash, counterPop, screenShake]);

  const handleDismiss = useCallback((gummy: GummyData) => {
    setTimeout(() => {
      setGummies((prev) => prev.filter((g) => g.id !== gummy.id));
    }, 500);
  }, []);

  const handleToastDone = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  // Animated counter style
  const counterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterPop.value }],
  }));

  // Screen shake on combo
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenShake.value }],
  }));

  return (
    <GestureHandlerRootView style={styles.root}>
      <ViewShot ref={viewShotRef} style={styles.root} options={{ format: 'png', quality: 1 }}>
        <Animated.View style={[styles.container, shakeStyle]}>
          <StatusBar style="light" />

          {/* Status Bar with dynamic level/streak */}
          <StatusHeader level={level} streakDays={streak} />

          {/* Task completed counter */}
          <Animated.View style={[styles.counterContainer, counterStyle]}>
            <Text style={styles.counterValue}>{completedCount}</Text>
            <Text style={styles.counterLabel}>flicked</Text>
            {comboCount >= 2 && (
              <Text style={styles.comboText}>{comboCount}x combo!</Text>
            )}
          </Animated.View>

          {/* Main area */}
          <View style={styles.field}>
            {/* Bot Orb at center */}
            <View
              style={[
                styles.botContainer,
                { left: centerX - 90, top: centerY - 90 - 80 },
              ]}
            >
              <BotOrb catchFlash={catchFlash} catchColor={catchColor} />
            </View>

            {/* Gummies orbiting */}
            <GummyField
              gummies={gummies}
              centerX={centerX}
              centerY={centerY - 80}
              onCatch={handleCatch}
              onDismiss={handleDismiss}
              catchFlash={catchFlash}
              catchColor={catchColor}
            />
          </View>

          {/* Done Toasts */}
          {toasts.map((t) => (
            <DoneToast
              key={t.id}
              label={t.label}
              onDone={() => handleToastDone(t.id)}
            />
          ))}

          {/* Watermark overlay for share captures */}
          <Watermark />

          {/* Connector Dock */}
          <ConnectorDock />

          {/* Share replay button */}
          <ShareButton viewRef={viewShotRef} />

          {/* Connection indicator — shows standalone mode text when offline */}
          <View style={styles.connectionBar}>
            <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#44cc66' : '#666' }]} />
            <Text style={styles.connectionText}>
              {isConnected ? 'Live' : 'Standalone'}
            </Text>
          </View>
        </Animated.View>
      </ViewShot>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  field: {
    flex: 1,
  },
  botContainer: {
    position: 'absolute',
  },
  counterContainer: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  counterValue: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 220, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  counterLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: -4,
  },
  comboText: {
    color: '#ffaa44',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
    textShadowColor: 'rgba(255, 170, 68, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  connectionBar: {
    position: 'absolute',
    top: 58,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '500',
  },
});
