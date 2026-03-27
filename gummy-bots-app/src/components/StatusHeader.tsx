import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function StatusHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.level}>Level 7</Text>
      <Text style={styles.streak}>🔥 5-day streak</Text>
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
