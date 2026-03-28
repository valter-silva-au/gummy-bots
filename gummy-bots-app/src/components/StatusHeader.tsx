import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatusHeaderProps {
  level?: number;
  streakDays?: number;
}

export default function StatusHeader({ level = 1, streakDays = 0 }: StatusHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.level}>Level {level}</Text>
      {streakDays > 0 && (
        <Text style={styles.streak}>{streakDays}-day streak</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 12,
  },
  level: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  streak: {
    color: '#ffaa44',
    fontSize: 16,
    fontWeight: '600',
  },
});
