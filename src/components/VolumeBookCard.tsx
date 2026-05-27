import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Volume } from '../types';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
} from '../constants/theme';

interface VolumeBookCardProps {
  volume: Volume;
  isCurrent: boolean;
  onPress: () => void;
}

// Volume color aliases — mapped to theme tokens
const VOLUME_BG = COLORS.primaryContainer; // '#1b2a41'
const VOLUME_SPINE = COLORS.primary; // '#05152b'
const VOLUME_INK = COLORS.onPrimary; // '#d5e3ff'

/**
 * VolumeBookCard — Card for an existing volume on the shelf.
 * Each instance controls its own lift animation (bookLiftAnim) to avoid shared state.
 */
export function VolumeBookCard({ volume, isCurrent, onPress }: VolumeBookCardProps) {
  const bookLiftAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.timing(bookLiftAnim, {
      toValue: -14,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(bookLiftAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.bookCardWrapper}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.bookVolume,
            { transform: [{ translateY: bookLiftAnim }] },
          ]}
        >
          {/* Top line: VOLUME I */}
          <Text style={styles.volumeLabel}>{volume.volumeLabel}</Text>

          {/* Central globe in circle */}
          <View style={styles.globeCircle}>
            <Ionicons name="globe-outline" size={40} color={VOLUME_INK} />
          </View>

          {/* Footer: title + year */}
          <View style={styles.bookFooter}>
            <Text style={styles.bookFooterTitle}>{volume.name}</Text>
            <Text style={styles.bookFooterYear}>{volume.year}</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* "CURRENT" badge only on the most recent volume */}
      {isCurrent && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>CURRENT</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Wrapper for the card (includes badge below the book)
  bookCardWrapper: {
    alignItems: 'center',
  },

  // Volume styled as book spine/passport
  bookVolume: {
    width: 150,
    height: 200,
    backgroundColor: VOLUME_BG,
    borderLeftWidth: 8,
    borderLeftColor: VOLUME_SPINE,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    shadowColor: VOLUME_SPINE,
    shadowOffset: { width: 8, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 12,
  },
  volumeLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 9,
    color: VOLUME_INK,
    letterSpacing: 4,
    opacity: 0.8,
  },
  globeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(213,227,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookFooter: {
    alignItems: 'center',
    gap: 4,
  },
  bookFooterTitle: {
    fontFamily: FONTS.headlineSm,
    fontSize: FONT_SIZES.labelStamp,
    color: VOLUME_INK,
    letterSpacing: 1,
  },
  bookFooterYear: {
    fontFamily: FONTS.labelStamp,
    fontSize: 9,
    color: VOLUME_INK,
    letterSpacing: 2,
    opacity: 0.6,
  },

  // "CURRENT" badge on the most recent volume
  currentBadge: {
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(123,152,135,0.4)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 3,
    transform: [{ rotate: '-2deg' }],
  },
  currentBadgeText: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelStamp,
    color: '#7b9887',
    letterSpacing: 2,
  },
});
