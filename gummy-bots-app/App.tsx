import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import BotOrb from './src/components/BotOrb';
import GummyField, { GummyData } from './src/components/GummyField';
import StatusHeader from './src/components/StatusHeader';
import ConnectorDock from './src/components/ConnectorDock';
import DoneToast from './src/components/DoneToast';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const INITIAL_GUMMIES: GummyData[] = [
  {
    id: '1',
    label: 'Reply to Mom',
    color: '#4a90ff',
    orbitRadius: 155,
    orbitSpeed: 8000,
    startAngle: 0,
  },
  {
    id: '2',
    label: 'Book Dentist',
    color: '#44cc66',
    orbitRadius: 175,
    orbitSpeed: 11000,
    startAngle: Math.PI * 0.4,
  },
  {
    id: '3',
    label: 'Daily News',
    color: '#ff8833',
    orbitRadius: 145,
    orbitSpeed: 9500,
    startAngle: Math.PI * 0.8,
  },
  {
    id: '4',
    label: 'Pay Rent',
    color: '#ff4455',
    orbitRadius: 165,
    orbitSpeed: 7500,
    startAngle: Math.PI * 1.2,
  },
  {
    id: '5',
    label: 'Auto Backup',
    color: '#aa66ff',
    orbitRadius: 150,
    orbitSpeed: 12000,
    startAngle: Math.PI * 1.6,
  },
  {
    id: '6',
    label: 'Team Standup',
    color: '#4a90ff',
    orbitRadius: 185,
    orbitSpeed: 10000,
    startAngle: Math.PI * 0.15,
  },
];

export default function App() {
  const [gummies, setGummies] = useState(INITIAL_GUMMIES);
  const [toasts, setToasts] = useState<{ id: string; label: string }[]>([]);

  const catchFlash = useSharedValue(0);
  const catchColor = useSharedValue('#00dcff');

  const centerX = SCREEN_W / 2;
  const centerY = SCREEN_H * 0.42;

  const handleCatch = useCallback((gummy: GummyData) => {
    const toastId = `${gummy.id}-${Date.now()}`;
    setToasts((prev) => [...prev, { id: toastId, label: gummy.label }]);
    // Remove gummy after a short delay to allow animation to finish
    setTimeout(() => {
      setGummies((prev) => prev.filter((g) => g.id !== gummy.id));
    }, 300);
  }, []);

  const handleToastDone = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Status Bar */}
        <StatusHeader />

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

        {/* Connector Dock */}
        <ConnectorDock />
      </View>
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
});
