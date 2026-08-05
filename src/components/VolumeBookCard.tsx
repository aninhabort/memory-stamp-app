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
  VOLUME_CARD_WIDTH,
  VOLUME_CARD_HEIGHT,
} from '../constants/theme';

interface VolumeBookCardProps {
  volume: Volume;
  displayYear?: string;
  isCurrent: boolean;
  stampCount: number;
  holderName?: string;
  onPress: () => void;
  onDelete?: () => void;
}

const VOLUME_BG    = COLORS.primaryContainer;
const VOLUME_SPINE = COLORS.primary;
const VOLUME_INK   = COLORS.onPrimary;

const SWIPE_DELETE_THRESHOLD = 70;
const TAP_MOVE_THRESHOLD     = 6;

// All sizes tuned for a 180px-wide base card — scaled proportionally for legibility
const SCALE = VOLUME_CARD_WIDTH / 180;
const px = (size: number) => Math.round(size * SCALE);

const GLOBE_CIRCLE_SIZE = px(70);
const GLOBE_ICON_SIZE   = px(44);

// Derive an archival passport number from the volume UUID
function derivePassportNo(id: string): string {
  return `MSA-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export function VolumeBookCard({
  volume,
  displayYear,
  isCurrent,
  stampCount,
  holderName,
  onPress,
  onDelete,
}: VolumeBookCardProps) {
  const bookLiftAnim = useRef(new Animated.Value(0)).current;
  const passportNo   = derivePassportNo(volume.id);

  const resetLift = () => {
    Animated.spring(bookLiftAnim, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
  };

  // Only intercepts the gesture (capture phase) when the drag is a clear upward
  // swipe — horizontal drags and taps pass through to the shelf scroll and onPress.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        gesture.dy < -TAP_MOVE_THRESHOLD && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.5,
      onPanResponderMove: (_, gesture) => {
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
        style={[styles.bookVolume, { transform: [{ translateY: bookLiftAnim }] }]}
      >
        <TouchableOpacity style={styles.bookContent} onPress={onPress} activeOpacity={0.85}>

          {/* ── Top: archive authority + volume number ── */}
          <View style={styles.bookTop}>
            <Text style={styles.authorityLabel}>MEMORY STAMP ARCHIVE</Text>
            <Text style={styles.volumeLabel}>{volume.volumeLabel}</Text>
          </View>

          {/* ── Active record annotation — printed text, no border ── */}
          {isCurrent && (
            <Text style={styles.currentLabel}>ACTIVE RECORD</Text>
          )}

          {/* ── Central globe seal ── */}
          <View style={styles.globeCircle}>
            <Ionicons name="globe-outline" size={GLOBE_ICON_SIZE} color={VOLUME_INK} />
          </View>

          {/* ── Footer: holder identity and archival fields ── */}
          <View style={styles.bookFooter}>
            {holderName ? (
              <Text style={styles.holderName} numberOfLines={1}>
                {holderName.toUpperCase()}
              </Text>
            ) : null}
            <Text style={styles.bookFooterTitle} numberOfLines={1}>{volume.name}</Text>
            <View style={styles.footerDivider} />
            <View style={styles.footerRow}>
              <Text style={styles.bookFooterYear}>{displayYear ?? volume.year}</Text>
              <Text style={styles.footerEntries}>{stampCount} ENTRIES</Text>
            </View>
            {/* Passport number — archival micro detail, barely legible */}
            <Text style={styles.passportNo}>{passportNo}</Text>
          </View>

        </TouchableOpacity>
      </Animated.View>

      {onDelete && (
        <View style={styles.deleteHint}>
          <Ionicons name="chevron-up" size={10} color={COLORS.onSurface} style={styles.deleteHintIcon} />
          <Text style={styles.deleteHintText}>DELETE</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bookCardWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  deleteHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    opacity: 0.18,
  },
  deleteHintIcon: {
    opacity: 1,
  },
  deleteHintText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 7,
    color: COLORS.onSurface,
    letterSpacing: 1.5,
  },

  // Passport cover — left spine, layered shadow for physical depth
  bookVolume: {
    width: VOLUME_CARD_WIDTH,
    height: VOLUME_CARD_HEIGHT,
    backgroundColor: VOLUME_BG,
    borderLeftWidth: 8,
    borderLeftColor: VOLUME_SPINE,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    // Multi-layer depth: a close shadow gives the spine edge, a far shadow grounds the object
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 18 },
    shadowOpacity: 0.32,
    shadowRadius: 22,
    elevation: 14,
  },

  bookContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 18,
  },

  // ── Top section ──
  bookTop: {
    alignItems: 'center',
    gap: 5,
  },
  // Issuing authority — printed very faint, like pre-press text on passport covers
  authorityLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: px(7),
    color: VOLUME_INK,
    letterSpacing: 1.5,
    opacity: 0.3,
    textAlign: 'center',
  },
  volumeLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: px(10),
    color: VOLUME_INK,
    letterSpacing: 4,
    opacity: 0.85,
  },

  // ── Globe seal ──
  globeCircle: {
    width: GLOBE_CIRCLE_SIZE,
    height: GLOBE_CIRCLE_SIZE,
    borderRadius: GLOBE_CIRCLE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(213,227,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Footer — left-aligned document fields ──
  bookFooter: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    gap: 3,
  },
  // Holder name — uppercase, the most prominent footer field
  holderName: {
    fontFamily: FONTS.labelStamp,
    fontSize: px(10),
    color: VOLUME_INK,
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  // Volume name — secondary, slightly receded
  bookFooterTitle: {
    fontFamily: FONTS.headlineSm,
    fontSize: px(11),
    color: VOLUME_INK,
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  // Hairline rule — separates identity from metadata fields
  footerDivider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: VOLUME_INK,
    opacity: 0.1,
    marginVertical: 2,
  },
  // Two-column row: establishment year on left, entry count on right
  footerRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookFooterYear: {
    fontFamily: FONTS.labelStamp,
    fontSize: px(8),
    color: VOLUME_INK,
    letterSpacing: 1.5,
    opacity: 0.5,
  },
  footerEntries: {
    fontFamily: FONTS.labelStamp,
    fontSize: px(8),
    color: VOLUME_INK,
    letterSpacing: 1,
    opacity: 0.5,
  },
  // Passport number — legible enough to feel printed, not invisible
  passportNo: {
    fontFamily: FONTS.labelStamp,
    fontSize: px(7),
    color: VOLUME_INK,
    letterSpacing: 1,
    opacity: 0.42,
    marginTop: 1,
  },

  // Active record annotation — a single printed line, no border, no rotation
  // Reads as metadata printed into the document rather than a badge attached to it
  currentLabel: {
    position: 'absolute',
    top: px(32),
    right: px(14),
    fontFamily: FONTS.labelStamp,
    fontSize: px(7),
    color: VOLUME_INK,
    letterSpacing: 2,
    opacity: 0.45,
  },

});
