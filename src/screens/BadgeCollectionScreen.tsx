import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStamps } from '../hooks/useStamps';
import { BadgeDetailModal } from '../components/BadgeDetailModal';
import { InsigniaBadgeCard } from '../components/InsigniaBadgeCard';
import { computeBadges, CATEGORY_LABELS, CATEGORY_ORDER } from '../utils/badges';
import { Insignia } from '../types/insignia';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';
import { CollectionStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<CollectionStackParamList, 'BadgeCollection'>;

export function BadgeCollectionScreen({ navigation }: Props) {
  const { stamps } = useStamps();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [selectedBadge, setSelectedBadge] = useState<Insignia | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const badges = useMemo(() => computeBadges(stamps), [stamps]);
  const unlockedCount = useMemo(() => badges.filter(b => b.unlocked).length, [badges]);

  const headerHeight = insets.top + 60;

  // Always open (and return to) the archive at the top — this screen is
  // reused across visits by the stack navigator, so without this a second
  // visit would resume wherever the user last scrolled to.
  useFocusEffect(
    React.useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.container,
          { paddingTop: headerHeight + 12, paddingBottom: tabBarHeight + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>◈ THE FULL ARCHIVE</Text>
          <Text style={styles.summaryCount}>
            {unlockedCount} / {badges.length} UNLOCKED
          </Text>
        </View>

        {CATEGORY_ORDER.map((category) => {
          // Catalog order only — computeBadges already returns badges
          // order-sorted, so this reads as the intended logical
          // progression (e.g. City Hopper → Urban Explorer → ...), with
          // the unlocked/locked border and artwork tint communicating
          // progress instead of badges jumping around by unlock status.
          const categoryBadges = badges.filter(b => b.category === category);
          if (categoryBadges.length === 0) return null;
          return (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>{CATEGORY_LABELS[category]}</Text>
              <View style={styles.grid}>
                {categoryBadges.map((badge) => (
                  <InsigniaBadgeCard key={badge.id} badge={badge} onPress={() => setSelectedBadge(badge)} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Sticky document header ─────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top }]} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter} pointerEvents="none">
          <Text style={styles.headerTitle}>BADGE COLLECTION</Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      <BadgeDetailModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingHorizontal: SPACING.pageMargin,
  },

  // ── Document header — mirrors StampDetailScreen's sticky header ──────────────
  // Fully opaque (unlike the semi-transparent header elsewhere) so scrolling
  // badge content disappears cleanly behind it instead of showing through.
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.pageMargin,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(29,28,21,0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
    paddingVertical: 12,
  },
  backText: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.labelStamp,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2,
    opacity: 0.7,
  },
  headerRight: {
    minWidth: 72,
  },

  // ── Summary ────────────────────────────────────────────────────────────────
  summaryCard: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 28,
  },
  summaryEyebrow: {
    fontFamily: FONTS.labelCaps,
    fontSize: 11,
    color: COLORS.outline,
    letterSpacing: 2,
  },
  summaryCount: {
    fontFamily: FONTS.labelStamp,
    fontSize: 20,
    color: COLORS.secondary,
    letterSpacing: 1.5,
  },

  // ── Category sections ──────────────────────────────────────────────────────
  section: { marginBottom: 34 },
  sectionTitle: {
    fontFamily: FONTS.labelCaps,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
