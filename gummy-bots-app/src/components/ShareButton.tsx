import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

interface ShareButtonProps {
  viewRef: React.RefObject<ViewShot | null>;
}

export default function ShareButton({ viewRef }: ShareButtonProps) {
  const isCapturing = useRef(false);

  const handleShare = useCallback(async () => {
    if (isCapturing.current) return;
    isCapturing.current = true;

    try {
      // Capture the game view as a PNG (includes watermark overlay)
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not supported on this device.');
        return;
      }

      // Share the captured screenshot with Gummy Bots branding
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your Gummy Bots flick!',
        UTI: 'public.png',
      });
    } catch (error) {
      // Silently handle — user may have cancelled sharing
    } finally {
      isCapturing.current = false;
    }
  }, [viewRef]);

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleShare}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>&#x1F4F9;</Text>
      <Text style={styles.label}>Share</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  icon: {
    fontSize: 18,
  },
  label: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
