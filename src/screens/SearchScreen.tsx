import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
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
import { BuscarStackParamList } from '../navigation/types';
import { CATEGORY_LABELS_EN, getEntryCode } from '../utils/stampUtils';

type BuscarNavigation = NativeStackNavigationProp<BuscarStackParamList, 'BuscarHome'>;

export function SearchScreen() {
  const navigation = useNavigation<BuscarNavigation>();
  const { stamps, loadStamps } = useStamps();
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  useFocusEffect(useCallback(() => { loadStamps(); }, [loadStamps]));

  // Filtra em tempo real por título, lugar, país e nota
  const filteredStamps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return stamps.filter(
      s =>
        s.title.toLowerCase().includes(q)   ||
        s.place.toLowerCase().includes(q)   ||
        (s.country?.toLowerCase().includes(q) ?? false) ||
        (s.note?.toLowerCase().includes(q)    ?? false),
    );
  }, [stamps, query]);

  const handleStampPress = (stamp: Stamp) =>
    navigation.navigate('StampDetail', { stamp });

  // ── Render de cada resultado — estilo itinerário ────────────────────────
  const renderItem = ({ item }: { item: Stamp }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleStampPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.resultLeft}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.resultCategory}>
          {CATEGORY_LABELS_EN[item.category].toUpperCase()} · {item.place}
        </Text>
      </View>
      <Text style={styles.resultCode}>{getEntryCode(item)}</Text>
    </TouchableOpacity>
  );

  // ── Estado vazio (sem query) ─────────────────────────────────────────────
  const EmptyPrompt = (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={48} color={COLORS.outline} style={{ opacity: 0.4 }} />
      <Text style={styles.emptyText}>Write to search your memories</Text>
    </View>
  );

  // ── Sem resultados (query mas sem match) ─────────────────────────────────
  const NoResults = (
    <View style={styles.emptyState}>
      <Ionicons name="file-tray-outline" size={40} color={COLORS.outline} style={{ opacity: 0.4 }} />
      <Text style={styles.emptyText}>No entries found for "{query}"</Text>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* ── Cabeçalho ────────────────────────────────────────────────── */}
      <View style={styles.headerArea}>
        <Text style={styles.archiveLabel}>MEMORY ARCHIVE</Text>
        <Text style={styles.screenTitle}>Search Destinations</Text>
      </View>

      {/* ── Search bar estilo ledger ──────────────────────────────────── */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={COLORS.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search destinations..."
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

      {/* ── Conteúdo ─────────────────────────────────────────────────── */}
      {query.trim() === '' ? EmptyPrompt : (
        <FlatList
          data={filteredStamps}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={NoResults}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          // Divisor entre resultados (pontilhado simulado com borda no item)
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  // ── Cabeçalho ──
  headerArea: {
    paddingHorizontal: SPACING.pageMargin,
    paddingTop: 16,
    paddingBottom: 8,
  },
  archiveLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  screenTitle: {
    fontFamily: FONTS.displayLg,
    fontSize: FONT_SIZES.headlineMd,
    color: COLORS.primary,
    marginBottom: 16,
  },

  // ── Search bar ledger (sem caixa, apenas borda inferior) ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.pageMargin,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(29,28,21,0.3)',
    paddingBottom: 8,
    gap: 10,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurface,
    fontStyle: 'italic',
    paddingVertical: 6,
  },

  // ── Lista de resultados ──
  list: {
    paddingHorizontal: SPACING.pageMargin,
    paddingBottom: 32,
  },
  separator: { height: 0 }, // borda fica no próprio item

  // Cada resultado — estilo linha de itinerário
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    borderStyle: 'solid',
    gap: 12,
  },
  resultLeft: { flex: 1, gap: 4 },
  resultTitle: {
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurface,
  },
  resultCategory: {
    fontFamily: FONTS.labelCaps,
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  resultCode: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelStamp,
    color: COLORS.primary,
    letterSpacing: 1,
  },

  // ── Estado vazio ──
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 14,
  },
  emptyText: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
