import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES } from '../constants/theme';

/**
 * Loading screen shown while the app initializes
 */
export function LoadingScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation for the stamp icon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Vintage stamp border */}
        <View style={styles.stampBorder}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="globe-outline" size={64} color={COLORS.secondary} />
          </Animated.View>
        </View>

        {/* App title */}
        <Text style={styles.title}>MEMORY STAMP</Text>
        <Text style={styles.subtitle}>Archival System</Text>

        {/* Loading indicator */}
        <View style={styles.loadingDots}>
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
        </View>

        {/* Footer text */}
        <Text style={styles.footer}>Preparing your collection...</Text>
      </Animated.View>

      {/* Decorative corner stamps */}
      <View style={styles.cornerStamp}>
        <Ionicons name="airplane" size={20} color={COLORS.outlineVariant} />
      </View>
      <View style={[styles.cornerStamp, styles.cornerStampBottomRight]}>
        <Ionicons name="camera" size={20} color={COLORS.outlineVariant} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  stampBorder: {
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: COLORS.secondary,
    borderRadius: 80,
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    transform: [{ rotate: '-5deg' }],
  },
  title: {
    fontFamily: FONTS.labelStamp,
    fontSize: 28,
    color: COLORS.primary,
    letterSpacing: 3,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2,
    marginBottom: 40,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  footer: {
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
  },
  cornerStamp: {
    position: 'absolute',
    top: 60,
    left: 40,
    transform: [{ rotate: '-15deg' }],
  },
  cornerStampBottomRight: {
    top: undefined,
    left: undefined,
    bottom: 60,
    right: 40,
    transform: [{ rotate: '15deg' }],
  },
});
