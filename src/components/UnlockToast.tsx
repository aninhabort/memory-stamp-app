import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOW_PAPER } from '../constants/theme';
import { Insignia } from '../types/insignia';

const VISIBLE_MS = 2600;

interface UnlockToastProps {
  badge: Insignia | null;
  topOffset: number;
  onDismiss: () => void;
}

// A new passport stamp arriving — not a gaming achievement popup. Fades and
// settles in, holds briefly, fades out; no bounce, no confetti, no sound.
export function UnlockToast({ badge, topOffset, onDismiss }: UnlockToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (!badge) return;

    opacity.setValue(0);
    translateY.setValue(-8);

    const sequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]),
      Animated.delay(VISIBLE_MS),
      Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]);
    sequence.start(({ finished }) => {
      if (finished) onDismiss();
    });

    return () => sequence.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badge?.id]);

  if (!badge) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { top: topOffset, opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.eyebrow}>◆ NEW INSIGNIA UNLOCKED</Text>
      <Text style={styles.name}>{badge.name.toUpperCase()}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
    ...SHADOW_PAPER,
  },
  eyebrow: {
    fontFamily: FONTS.labelCaps,
    fontSize: 10,
    color: COLORS.secondary,
    letterSpacing: 1.5,
  },
  name: {
    fontFamily: FONTS.labelStamp,
    fontSize: 13,
    color: COLORS.onSurface,
    letterSpacing: 1,
  },
});
