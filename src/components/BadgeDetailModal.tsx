import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  FONTS,
  RADIUS,
  SHADOW_PAPER,
  SPACING,
} from '../constants/theme';
import { Insignia } from '../types/insignia';

const STAMP_SIZE = 168;

const MONTH_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function formatUnlockedDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const [year, month] = dateStr.split('-');
  const m = parseInt(month, 10) - 1;
  return `${MONTH_SHORT[m] ?? ''} ${year}`;
}

interface BadgeDetailModalProps {
  badge: Insignia | null;
  onClose: () => void;
}

export function BadgeDetailModal({ badge, onClose }: BadgeDetailModalProps) {
  const unlockedDate = badge ? formatUnlockedDate(badge.unlockedDate) : null;
  const tint = badge?.unlocked ? COLORS.secondary : COLORS.outline;

  return (
    <Modal visible={!!badge} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.cardWrapper}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {badge && (
              <View style={styles.card}>

                {/* Eyebrow + close */}
                <View style={styles.headerRow}>
                  <Text style={styles.eyebrow}>◈ INSIGNIA RECORD</Text>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={18} color={COLORS.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>

                {/* Circular stamp frame */}
                <View style={styles.stampFrame}>
                  <View
                    style={[
                      styles.stampRing,
                      badge.unlocked ? styles.stampRingUnlocked : styles.stampRingLocked,
                    ]}
                  >
                    {badge.image ? (
                      <Image
                        source={badge.image}
                        resizeMode="contain"
                        style={{ width: STAMP_SIZE, height: STAMP_SIZE, tintColor: tint }}
                      />
                    ) : (
                      <Ionicons name={badge.ionIcon} size={STAMP_SIZE * 0.4} color={tint} />
                    )}
                  </View>
                </View>

                {/* Name */}
                <Text style={[styles.name, { color: badge.unlocked ? COLORS.onSurface : COLORS.onSurfaceVariant }]}>
                  {badge.name.toUpperCase()}
                </Text>

                {/* Flavor quote — the badge's concept, phrased to read naturally
                    whether it's already earned or still ahead of the user */}
                <Text style={styles.quote}>"{badge.description}"</Text>

                {/* Status */}
                <View style={[styles.statusPill, badge.unlocked ? styles.statusUnlocked : styles.statusLocked]}>
                  <Text style={[styles.statusText, badge.unlocked ? styles.statusTextUnlocked : styles.statusTextLocked]}>
                    {badge.unlocked ? `UNLOCKED${unlockedDate ? ` · ${unlockedDate}` : ''}` : 'LOCKED'}
                  </Text>
                </View>

                {/* Progress — locked, countable badges only */}
                {!badge.unlocked && badge.progress && (
                  <View style={styles.progressBlock}>
                    <Text style={styles.progressCount}>
                      {badge.progress.current} / {badge.progress.target} {badge.progress.unit}
                    </Text>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.round((badge.progress.current / badge.progress.target) * 100)}%` },
                        ]}
                      />
                    </View>
                  </View>
                )}

                {/* Requirement — how the insignia is (or was) earned */}
                <Text style={styles.requirementCaption}>"{badge.requirement}"</Text>

              </View>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5,21,43,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.pageMargin,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '88%',
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    paddingHorizontal: SPACING.pageMargin,
    paddingTop: 16,
    paddingBottom: SPACING.stackLoose - 8,
    alignItems: 'center',
    ...SHADOW_PAPER,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.stackTight,
  },
  eyebrow: {
    fontFamily: FONTS.labelCaps,
    fontSize: 11,
    color: COLORS.outline,
    letterSpacing: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Circular stamp frame ──
  stampFrame: {
    marginTop: SPACING.stackTight,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampRing: {
    width: STAMP_SIZE + 28,
    height: STAMP_SIZE + 28,
    borderRadius: (STAMP_SIZE + 28) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampRingUnlocked: {
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  stampRingLocked: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLow,
  },

  name: {
    fontFamily: FONTS.labelStamp,
    fontSize: 19,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 10,
  },
  quote: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 15,
    fontStyle: 'italic',
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: SPACING.elementGap,
  },

  progressBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.elementGap,
  },
  progressCount: {
    fontFamily: FONTS.labelStamp,
    fontSize: 13,
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  progressTrack: {
    width: '70%',
    height: 4,
    borderRadius: 2,
    backgroundColor: `${COLORS.secondary}22`,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.secondary,
  },

  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginBottom: 14,
  },
  statusUnlocked: {
    backgroundColor: `${COLORS.secondary}1c`,
  },
  statusLocked: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  statusText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  statusTextUnlocked: {
    color: COLORS.secondary,
  },
  statusTextLocked: {
    color: COLORS.outline,
  },

  requirementCaption: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.onSurfaceVariant,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 10,
  },
});
