import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const connectors = [
  { icon: '📧', label: 'Gmail' },
  { icon: '📅', label: 'Cal' },
  { icon: '💬', label: 'Chat' },
  { icon: '📋', label: 'Tasks' },
  { icon: '🔔', label: 'Alerts' },
];

export default function ConnectorDock() {
  return (
    <View style={styles.container}>
      {connectors.map((c) => (
        <TouchableOpacity key={c.label} style={styles.item} activeOpacity={0.6}>
          <View style={styles.iconBg}>
            <Text style={styles.icon}>{c.icon}</Text>
          </View>
          <Text style={styles.label}>{c.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 36,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  item: {
    alignItems: 'center',
    gap: 4,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  label: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '500',
  },
});
