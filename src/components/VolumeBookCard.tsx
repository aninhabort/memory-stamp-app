import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Volume } from '../types';
import {
  COLORS,
  FONTS,
  RADIUS,
  VOLUME_CARD_WIDTH,
  VOLUME_CARD_HEIGHT,
} from '../constants/theme';

interface VolumeBookCardProps {
  volume: Volume;
  displayYear?: string;
  isCurrent: boolean;
  stampCount: number;
  onPress: () => void;
  onDelete?: () => void;
}

// Volume color aliases — mapped to theme tokens
const VOLUME_BG = COLORS.primaryContainer; // '#1b2a41'
const VOLUME_SPINE = COLORS.primary; // '#05152b'
const VOLUME_INK = COLORS.onPrimary; // '#d5e3ff'

// Minimum upward drag distance to trigger the delete action on release.
const SWIPE_DELETE_THRESHOLD = 70;
// Movements smaller than this are treated as a tap rather than a swipe.
const TAP_MOVE_THRESHOLD = 6;

// All sizes below were tuned for a 180px-wide card — scale them up
// proportionally so text and icons stay legible on the larger card.
const SCALE = VOLUME_CARD_WIDTH / 180;
const px = (size: number) => Math.round(size * SCALE);

const GLOBE_CIRCLE_SIZE = px(76);
const GLOBE_ICON_SIZE = px(48);

/**
 * VolumeBookCard — Card for an existing volume on the shelf.
 * Each instance controls its own lift animation (bookLiftAnim) to avoid shared state.
 * Swiping the card up triggers `onDelete` (which is expected to confirm with the user).
 */
export function VolumeBookCard({ volume, displayYear, isCurrent, stampCount, onPress, onDelete }: VolumeBookCardProps) {
  const bookLiftAnim = useRef(new Animated.Value(0)).current;

  const resetLift = () => {
    Animated.spring(bookLiftAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  // Only intercepts the gesture (in the capture phase, before the inner
  // TouchableOpacity / parent ScrollView see it) when the drag is a clear
  // upward swipe. Horizontal drags and taps are left alone, so horizontal
  // scrolling and onPress keep working normally.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        gesture.dy < -TAP_MOVE_THRESHOLD && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.5,
      onPanResponderMove: (_, gesture) => {
        // Only allow dragging upward.
        bookLiftAnim.setValue(Math.min(0, gesture.dy));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy <= -SWIPE_DELETE_THRESHOLD) {
          onDelete?.();
        }
        resetLift();
      },
      onPanResponderTerminate: resetLift,
    }),
  ).current;

  return (
    <View style={styles.bookCardWrapper}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.bookVolume,
          { transform: [{ translateY: bookLiftAnim }] },
        ]}
      >
        <TouchableOpacity style={styles.bookContent} onPress={onPress} activeOpacity={0.85}>
          {/* Stamp count badge */}
          <View style={styles.stampCountBadge}>
            <Text style={styles.stampCountText}>{stampCount}</Text>
          </View>

          {/* "CURRENT" badge only on the most recent volume */}
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>CURRENT</Text>
            </View>
          )}

          {/* Top line: VOLUME I */}
          <Text style={styles.volumeLabel}>{volume.volumeLabel}</Text>

          {/* Central globe in circle */}
          <View style={styles.globeCircle}>
            <Ionicons name="globe-outline" size={GLOBE_ICON_SIZE} color={VOLUME_INK} />
          </View>

          {/* Footer: title + year */}
          <View style={styles.bookFooter}>
            <Text style={styles.bookFooterTitle}>{volume.name}</Text>
            <Text style={styles.bookFooterYear}>{displayYear ?? volume.year}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Swipe-to-delete hint — sits below the card, not over its content */}
      {onDelete && (
        <View style={styles.deleteHint}>
          <Ionicons name="chevron-up" size={px(14)} color={COLORS.outline} />
          <Text style={styles.deleteHintText}>deslize para excluir</Text>
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
    width: VOLUME_CARD_WIDTH,
    height: VOLUME_CARD_HEIGHT,
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
  },
  bookContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  volumeLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: px(10),
    color: VOLUME_INK,
    letterSpacing: 4,
    opacity: 0.8,
  },
  globeCircle: {
    width: GLOBE_CIRCLE_SIZE,
    height: GLOBE_CIRCLE_SIZE,
    borderRadius: GLOBE_CIRCLE_SIZE / 2,
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
    fontSize: px(13),
    color: VOLUME_INK,
    letterSpacing: 1,
  },
  bookFooterYear: {
    fontFamily: FONTS.labelStamp,
    fontSize: px(10),
    color: VOLUME_INK,
    letterSpacing: 2,
    opacity: 0.6,
  },

  // Stamp count badge
  stampCountBadge: {
    position: 'absolute',
    top: px(12),
    right: px(12),
    backgroundColor: 'rgba(213,227,255,0.2)',
    borderRadius: px(12),
    minWidth: px(24),
    height: px(24),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: px(6),
    borderWidth: 1,
    borderColor: 'rgba(213,227,255,0.3)',
  },
  stampCountText: {
    fontFamily: FONTS.labelStamp,
    fontSize: px(11),
    color: VOLUME_INK,
    letterSpacing: 1,
  },

  // Swipe-to-delete hint — placed below the card
  deleteHint: {
    marginTop: 10,
    alignItems: 'center',
    gap: 2,
  },
  deleteHintText: {
    fontFamily: FONTS.labelStamp,
    fontSize: px(9),
    color: COLORS.outline,
    letterSpacing: 1,
    opacity: 0.7,
  },

  // "CURRENT" badge on the most recent volume — sticking out of the top edge
  currentBadge: {
    position: 'absolute',
    top: px(35),
    left: px(12),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(123,152,135,0.4)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: px(8),
    paddingVertical: px(2),
    transform: [{ rotate: '-4deg' }],
  },
  currentBadgeText: {
    fontFamily: FONTS.labelStamp,
    fontSize: px(8),
    color: '#7b9887',
    letterSpacing: 1.5,
  },
});
