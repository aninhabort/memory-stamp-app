import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW_PAPER, SPACING } from '../constants/theme';
import { Insignia } from '../types/insignia';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Sized for a 4-per-row grid — shared by the Profile screen's compact
// selection and the full Badge Collection, so both read as one system.
export const BADGE_SIZE = Math.floor((SCREEN_WIDTH - SPACING.pageMargin * 2 - 30) / 4);
export const INSIGNIA_IMAGE_SIZE = Math.floor(BADGE_SIZE * 0.5);

// Single source for the badge's internal padding — used both by the card's
// own style and by the label-sizing math below, so they can't drift apart.
const BADGE_PADDING        = SPACING.stackTight;
const LABEL_BASE_SIZE      = 12;
const LABEL_MIN_SIZE       = 9;
const LABEL_LETTER_SPACING = 0.3;
// CourierPrime is monospace — this is its rough advance width as a
// fraction of font size, used to size text deterministically rather than
// relying on adjustsFontSizeToFit (which, applied per line independently,
// shrinks a long second word far more than a short first word and leaves
// a badge's two lines at visibly mismatched sizes).
const MONOSPACE_ADVANCE = 0.62;

// One shared font size per badge, sized to the longest word so every line
// of a given name reads at the same size — never a per-line auto-shrink.
function computeLabelFontSize(words: string[]): number {
  const availableWidth = BADGE_SIZE - BADGE_PADDING * 2;
  const longest = Math.max(...words.map(w => w.length));
  const sizeToFit = (availableWidth / longest - LABEL_LETTER_SPACING) / MONOSPACE_ADVANCE;
  return Math.min(LABEL_BASE_SIZE, Math.max(LABEL_MIN_SIZE, Math.floor(sizeToFit)));
}

interface InsigniaBadgeCardProps {
  badge: Insignia;
  onPress: () => void;
}

// Tappable badge card — a light press-scale gives the grid a tactile,
// "pick up the stamp" feel without pulling in a gesture/animation library.
export function InsigniaBadgeCard({ badge, onPress }: InsigniaBadgeCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };

  // Each word gets its own line — deliberately not a single multiline Text
  // with a manual "\n", which can mis-wrap a long word like "CONTINENTAL"
  // mid-character and silently drop the rest of the name. Every line
  // shares one precomputed font size (see computeLabelFontSize) so e.g.
  // "THE" and "CHRONICLER" render at the same size instead of the shorter
  // word looking oddly large next to an auto-shrunk longer one.
  const words = badge.name.toUpperCase().split(' ');
  const labelFontSize = computeLabelFontSize(words);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => animateTo(0.94)}
      onPressOut={() => animateTo(1)}
      activeOpacity={0.85}
      hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
    >
      <Animated.View
        style={[
          styles.badge,
          badge.unlocked ? styles.badgeUnlocked : styles.badgeLocked,
          { transform: [{ scale }] },
        ]}
      >
        {badge.image ? (
          <Image
            source={badge.image}
            resizeMode="contain"
            style={{
              width: INSIGNIA_IMAGE_SIZE,
              height: INSIGNIA_IMAGE_SIZE,
              tintColor: badge.unlocked ? COLORS.secondary : COLORS.outlineVariant,
            }}
          />
        ) : (
          <Ionicons
            name={badge.ionIcon}
            size={20}
            color={badge.unlocked ? COLORS.secondary : COLORS.outlineVariant}
          />
        )}
        <View style={styles.labelStack}>
          {words.map((word, i) => (
            <Text
              key={i}
              style={[
                styles.label,
                badge.unlocked && styles.labelUnlocked,
                { fontSize: labelFontSize, lineHeight: labelFontSize + 3 },
              ]}
              numberOfLines={1}
            >
              {word}
            </Text>
          ))}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: BADGE_SIZE,
    borderRadius: RADIUS.md,
    padding: BADGE_PADDING,
    alignItems: 'center',
    gap: 6,
  },
  // Unlocked — solid burgundy border, feels like an earned stamp
  badgeUnlocked: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    ...SHADOW_PAPER,
  },
  // Locked — dashed neutral border, unissued-stamp feel. No blanket opacity:
  // fading comes from the pale image tint and muted label color instead, so
  // the badge name stays legible rather than washing out entirely.
  badgeLocked: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderStyle: 'dashed',
  },
  // Fixed width (matches the formula in computeLabelFontSize) so every
  // word-line centers against the same container instead of each Text
  // shrink-wrapping to its own natural, per-word width.
  labelStack: {
    width: BADGE_SIZE - BADGE_PADDING * 2,
  },
  // fontSize/lineHeight here are a resting default — actual rendering
  // always overrides them with the shared, precomputed labelFontSize.
  label: {
    fontFamily: FONTS.labelStamp,
    fontSize: LABEL_BASE_SIZE,
    color: COLORS.outline,
    letterSpacing: LABEL_LETTER_SPACING,
    textAlign: 'center',
    lineHeight: LABEL_BASE_SIZE + 3,
  },
  labelUnlocked: {
    color: COLORS.onSurface,
  },
});
