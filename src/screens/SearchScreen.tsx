import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStamps } from '../hooks/useStamps';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
} from '../constants/theme';
import { Stamp } from '../types';
import { SearchStackParamList } from '../navigation/types';
import { CATEGORY_LABELS_EN, formatArrivalDate, getEntryCode } from '../utils/stampUtils';

type SearchNavigation = NativeStackNavigationProp<SearchStackParamList, 'SearchHome'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

// Background paper dot texture — same pattern as CreateStampScreen
const BG_DOTS: { top: number; left: number }[] = [];
for (let row = 0; row < 24; row++) {
  for (let col = 0; col < 6; col++) {
    BG_DOTS.push({
      top:  row * 80 + (col % 2) * 40,
      left: col * (SCREEN_WIDTH / 5) + (row % 2) * 18,
    });
  }
}

// Classification filter options — "All" followed by every stamp category
const CATEGORY_FILTERS: { value: Stamp['category'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  ...(Object.keys(CATEGORY_LABELS_EN) as Stamp['category'][]).map(value => ({
    value,
    label: CATEGORY_LABELS_EN[value],
  })),
];

export function SearchScreen() {
  const navigation = useNavigation<SearchNavigation>();
  const { stamps, loadStamps, syncStampsFromCloud } = useStamps();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Stamp['category'] | 'all'>('all');
  const [country, setCountry] = useState<string>('all');
  const insets = useSafeAreaInsets();

  useFocusEffect(useCallback(() => {
    (async () => {
      await syncStampsFromCloud();
      await loadStamps();
    })();
  }, [syncStampsFromCloud, loadStamps]));

  // Territory filter derived from stamps that have a country
  const countryFilters = useMemo(() => {
    const countries = Array.from(
      new Set(stamps.map(s => s.country).filter((c): c is string => !!c))
    ).sort();
    return [{ value: 'all', label: 'All' }, ...countries.map(c => ({ value: c, label: c }))];
  }, [stamps]);

  const hasFilters = query.trim() !== '' || category !== 'all' || country !== 'all';

  // Real-time filtering across title, place, country, notes, category, territory
  const filteredStamps = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stamps.filter(s => {
      const matchesQuery = !q ||
        s.title.toLowerCase().includes(q)   ||
        s.place.toLowerCase().includes(q)   ||
        (s.country?.toLowerCase().includes(q) ?? false) ||
        (s.note?.toLowerCase().includes(q)    ?? false);
      const matchesCategory = category === 'all' || s.category === category;
      const matchesCountry  = country  === 'all' || s.country  === country;
      return matchesQuery && matchesCategory && matchesCountry;
    });
  }, [stamps, query, category, country]);

  const handleStampPress = (stamp: Stamp) =>
    navigation.navigate('StampDetail', { stamp });

  // ── Each result row — catalog entry format ────────────────────────────────
  const renderItem = ({ item }: { item: Stamp }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleStampPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.resultLeft}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.resultMeta}>
          {CATEGORY_LABELS_EN[item.category].toUpperCase()} · {item.place}
        </Text>
        <Text style={styles.resultDate}>{formatArrivalDate(item.date)}</Text>
      </View>
      <Text style={styles.resultCode}>{getEntryCode(item)}</Text>
    </TouchableOpacity>
  );

  // ── Results list header — archival record count ───────────────────────────
  const ResultsHeader = (
    <View style={styles.resultsHeader}>
      <View style={styles.resultsHeaderLine} />
      <Text style={styles.resultsHeaderText}>
        {filteredStamps.length} {filteredStamps.length === 1 ? 'RECORD' : 'RECORDS'} FOUND
      </Text>
    </View>
  );

  // ── Empty prompt — archive catalog invite ─────────────────────────────────
  // Shown before any filters are applied; feels like opening the catalog index.
  const EmptyPrompt = (
    <View style={styles.emptyState}>
      {/* Archival watermark printed behind the invite text */}
      <Text style={styles.emptyWatermark}>INDEX</Text>

      <View style={styles.emptyContent}>
        <Text style={styles.emptyDept}>DEPT. OF PERSONAL ARCHIVES</Text>
        <View style={styles.emptyDivider} />
        <Text style={styles.emptyTitle}>Archive Catalog</Text>
        <Text style={styles.emptyCollectionCount}>
          {stamps.length} {stamps.length === 1 ? 'record' : 'records'} in collection
        </Text>
        <Text style={styles.emptyHint}>
          Search by title, location,{'\n'}classification, or territory.
        </Text>
      </View>
    </View>
  );

  // ── No results — formal archival response ─────────────────────────────────
  const NoResults = (
    <View style={styles.emptyState}>
      <View style={styles.emptyContent}>
        <Ionicons name="document-outline" size={28} color={COLORS.outlineVariant} style={{ opacity: 0.5 }} />
        <Text style={styles.noResultsTitle}>NO RECORDS FOUND</Text>
        <Text style={styles.noResultsHint}>
          {query.trim()
            ? `No entries match "${query}".`
            : 'No entries match the current classification.'}
          {'\n'}Adjust your search or classification.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* Background paper dot texture */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {BG_DOTS.map((pos, i) => (
          <View key={i} style={[styles.bgDot, { top: pos.top, left: pos.left }]} />
        ))}
      </View>

      {/* ── Archive document header ─────────────────────────────────── */}
      <View style={styles.headerArea}>
        <Text style={styles.archivesLabel}>THE ARCHIVES · SEARCH</Text>
        <Text style={styles.archivesTitle}>Archive Index</Text>
        <View style={styles.archivesDivider} />
        <Text style={styles.archivesMeta}>
          {stamps.length} {stamps.length === 1 ? 'RECORD' : 'RECORDS'} IN COLLECTION
        </Text>
      </View>

      {/* ── Catalog search bar — ledger underline style ─────────────── */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search the archive..."
          placeholderTextColor={COLORS.outline}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={16} color={COLORS.outline} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Classification filter — catalog label tags ──────────────── */}
      <View style={styles.filterRow}>
        <Text style={styles.filterSectionLabel}>CLASSIFICATION</Text>
        <FlatList
          data={CATEGORY_FILTERS}
          keyExtractor={item => item.value}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const active = category === item.value;
            return (
              <TouchableOpacity
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setCategory(item.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── Territory filter ────────────────────────────────────────── */}
      {countryFilters.length > 1 && (
        <View style={styles.filterRow}>
          <Text style={styles.filterSectionLabel}>TERRITORY</Text>
          <FlatList
            data={countryFilters}
            keyExtractor={item => item.value}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => {
              const active = country === item.value;
              return (
                <TouchableOpacity
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setCountry(item.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {item.label.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      {!hasFilters ? EmptyPrompt : (
        <FlatList
          data={filteredStamps}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ResultsHeader}
          ListEmptyComponent={NoResults}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Paper dot texture — subtle grain across the entire screen
  bgDot: {
    position: 'absolute',
    width: 1.5,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: COLORS.onSurface,
    opacity: 0.07,
  },

  // ── Archive document header — matches PassportScreen header language ──
  headerArea: {
    paddingHorizontal: SPACING.pageMargin,
    paddingTop: 16,
    paddingBottom: 12,
  },
  archivesLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  archivesTitle: {
    fontFamily: FONTS.displayLg,
    fontSize: FONT_SIZES.headlineMd,
    color: COLORS.primary,
    marginBottom: 14,
  },
  archivesDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginBottom: 8,
  },
  archivesMeta: {
    fontFamily: FONTS.labelStamp,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    opacity: 0.55,
  },

  // ── Catalog search bar — ledger underline, no border box ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.pageMargin,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(29,28,21,0.25)',
    paddingBottom: 8,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurface,
    fontStyle: 'italic',
    paddingVertical: 4,
  },

  // ── Catalog label filters — rectangular tags, not pill chips ──
  filterRow: {
    marginBottom: 14,
  },
  filterSectionLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2,
    opacity: 0.7,
    paddingHorizontal: SPACING.pageMargin,
    marginBottom: 8,
  },
  filterList: {
    paddingHorizontal: SPACING.pageMargin,
    gap: 8,
  },
  // Rectangular catalog tag — reduced border-radius removes the pill feeling
  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontFamily: FONTS.labelCaps,
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
  },
  filterChipTextActive: {
    color: COLORS.onPrimary,
  },

  // ── Results list ──
  list: {
    paddingHorizontal: SPACING.pageMargin,
    paddingBottom: 32,
  },
  // Archival record count header above the results
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
  },
  resultsHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outlineVariant,
  },
  resultsHeaderText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2,
    opacity: 0.65,
  },

  // Each result — reads like a library catalog card entry
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    gap: 12,
  },
  resultLeft: {
    flex: 1,
    gap: 3,
  },
  // Serif title — catalog entry heading
  resultTitle: {
    fontFamily: FONTS.headlineSm,
    fontSize: 14,
    color: COLORS.onSurface,
  },
  resultMeta: {
    fontFamily: FONTS.labelCaps,
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  // Arrival-stamp date format: 20.JAN.24
  resultDate: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 11,
    color: COLORS.outline,
    letterSpacing: 0.5,
  },
  resultCode: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelStamp,
    color: COLORS.primary,
    letterSpacing: 1,
  },

  // ── Empty states ──
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },

  // Large rotated "INDEX" watermark — archival underprint behind the catalog invite
  emptyWatermark: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    fontFamily: FONTS.displayLg,
    fontSize: 96,
    color: COLORS.primary,
    opacity: 0.028,
    letterSpacing: 16,
    textAlign: 'center',
    transform: [{ rotate: '-8deg' }],
  },

  // Catalog invite content — centered on top of the watermark
  emptyContent: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyDept: {
    fontFamily: FONTS.labelStamp,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2.5,
    opacity: 0.5,
  },
  // Thin horizontal rule between dept label and title
  emptyDivider: {
    height: 1,
    width: 40,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.6,
  },
  emptyTitle: {
    fontFamily: FONTS.displayLg,
    fontSize: FONT_SIZES.headlineMd,
    color: COLORS.primary,
    opacity: 0.7,
  },
  emptyCollectionCount: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  emptyHint: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.outlineVariant,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 18,
    marginTop: 4,
  },

  // No results — formal archival response
  noResultsTitle: {
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 3,
    opacity: 0.65,
    marginTop: 8,
  },
  noResultsHint: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.outlineVariant,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 18,
    marginTop: 4,
  },
});
