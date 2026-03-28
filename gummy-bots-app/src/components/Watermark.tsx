import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Watermark() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.badge}>
        <Text style={styles.logo}>GUMMY BOTS</Text>
        <Text style={styles.tagline}>flick to execute</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
  },
  logo: {
    color: '#00dcff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    marginTop: -1,
  },
});
