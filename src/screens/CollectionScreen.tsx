import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CompositeNavigationProp,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useStamps } from '../hooks/useStamps';
import { useUserName } from '../hooks/useUserName';
import { StampCard, CIRCLE_SIZE } from '../components/StampCard';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SHADOW_PAPER,
  SPACING,
} from '../constants/theme';
import { Stamp } from '../types';
import { ColeçãoStackParamList, RootTabParamList } from '../navigation/types';
import {
  resolveCoverPhoto,
  getInitials,
  getDocNo,
} from '../utils/stampUtils';

// Composite type gives access to both the stack's own routes (StampDetail) and
// the parent tab routes (Criar), eliminating the `as any` cast.
type CollectionNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<ColeçãoStackParamList, 'ColeçãoHome'>,
  BottomTabNavigationProp<RootTabParamList>
>;

// Item de grid: stamp real ou célula "adicionar"
type GridCell = Stamp | { type: 'add' };

export function CollectionScreen() {
  const navigation   = useNavigation<CollectionNavigation>();
  const { stamps, loadStamps } = useStamps();
  const { userName, reloadUserName } = useUserName();
  const insets       = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy]     = useState<'date' | 'name'>('date');

  useFocusEffect(useCallback(() => {
    loadStamps();
    reloadUserName();
  }, [loadStamps, reloadUserName]));

  // ── Dados calculados ──────────────────────────────────────────────────────

  const initials   = getInitials(userName || 'Viajante');
  const docNo      = getDocNo(userName || 'Viajante');
  const exploredPct = Math.min(Math.round((stamps.length / 50) * 100), 100);

  const filteredStamps = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? stamps.filter(s =>
          s.title.toLowerCase().includes(q) ||
          s.place.toLowerCase().includes(q) ||
          (s.country?.toLowerCase().includes(q) ?? false),
        )
      : stamps;
    return [...base].sort((a, b) =>
      sortBy === 'date'
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : a.title.localeCompare(b.title),
    );
  }, [stamps, query, sortBy]);

  // Grid com célula de adicionar no final
  const gridData: GridCell[] = useMemo(
    () => ([...filteredStamps, { type: 'add' }] as GridCell[]),
    [filteredStamps],
  );

  // Stamp mais recente com nota para "Latest Log"
  const latestLog = useMemo(
    () => stamps.filter(s => s.note?.trim()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0] ?? null,
    [stamps],
  );

  // ── Navegação ─────────────────────────────────────────────────────────────

  const handleStampPress = (stamp: Stamp) => navigation.navigate('StampDetail', { stamp });
  const handleLatestLogPress = () => { if (latestLog) navigation.navigate('StampDetail', { stamp: latestLog }); };
  // Composite navigation type already includes the parent tab routes.
  const handleAddPress = () => navigation.navigate('Criar');

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderItem = ({ item, index }: { item: GridCell; index: number }) => {
    // Célula "adicionar novo stamp"
    if ('type' in item) {
      return (
        <TouchableOpacity
          style={styles.gridCellWrapper}
          onPress={handleAddPress}
          activeOpacity={0.8}
        >
          <View style={styles.addCircleCard}>
            <Ionicons name="add" size={32} color={COLORS.outline} />
          </View>
          <Text style={styles.addCellText}>Add Stamp</Text>
        </TouchableOpacity>
      );
    }
    // Stamp card com visual de selo
    return (
      <TouchableOpacity
        style={styles.gridCellWrapper}
        onPress={() => handleStampPress(item)}
        activeOpacity={0.85}
      >
        <StampCard stamp={item} index={index} variant="grid" />
      </TouchableOpacity>
    );
  };

  // ── Cabeçalho da lista (perfil + search bar) ──────────────────────────────
  const ListHeader = (
    <View>
      {/* ─── Cartão de identificação do portador ─── */}
      <View style={styles.profileCard}>
        {/* Avatar circular com iniciais */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>

        {/* Nome e documento */}
        <View style={styles.profileInfo}>
          <Text style={styles.profileFieldLabel}>BEARER NAME</Text>
          <Text style={styles.profileName}>{userName || 'Viajante'}</Text>
        </View>

        {/* Número do documento */}
        <View style={styles.profileDocCol}>
          <Text style={styles.profileFieldLabel}>DOCUMENT NO.</Text>
          <Text style={styles.profileDocNo}>{docNo}</Text>
        </View>

        {/* Settings button */}
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={20} color={COLORS.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Barra de progresso "X% EXPLORED" */}
      <View style={styles.progressWrapper}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${exploredPct}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{exploredPct}% EXPLORED</Text>
      </View>

      {/* ─── Search bar estilo ledger ─── */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={COLORS.outline} />
        <TextInput
          style={styles.searchPlaceholder}
          placeholder="Search destinations..."
          placeholderTextColor={COLORS.outline}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        <TouchableOpacity
          onPress={() => setSortBy(prev => prev === 'date' ? 'name' : 'date')}
          activeOpacity={0.7}
        >
          <Text style={styles.sortLabel}>SORT BY: {sortBy === 'date' ? 'DATE' : 'NAME'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        OFFICIAL SEALS — {filteredStamps.length} ENTRIES
      </Text>
    </View>
  );

  // ── Rodapé da lista (Latest Log) ──────────────────────────────────────────
  const ListFooter = latestLog ? (
    <TouchableOpacity
      style={styles.latestLogCard}
      onPress={handleLatestLogPress}
      activeOpacity={0.85}
    >
      {/* Cabeçalho com badge "MEMO" */}
      <View style={styles.latestLogHeader}>
        <Text style={styles.latestLogTitle} numberOfLines={1}>
          Latest Log: {latestLog.title}
        </Text>
        <View style={styles.memoBadge}>
          <Text style={styles.memoBadgeText}>MEMO</Text>
        </View>
      </View>

      {/* Foto (se existir) */}
      {resolveCoverPhoto(latestLog) ? (
        <Image
          source={{ uri: resolveCoverPhoto(latestLog) }}
          style={styles.latestLogPhoto}
          resizeMode="cover"
        />
      ) : null}

      {/* Preview da nota */}
      <Text style={styles.latestLogNote} numberOfLines={2}>
        {latestLog.note}
      </Text>

      {/* Footer decorativo */}
      <View style={styles.latestLogFooter}>
        <Text style={styles.latestLogMeta}>
          {latestLog.place.slice(0, 2).toUpperCase()}-VOL{latestLog.date.split('-')[0].slice(-2)} • PAGE {stamps.indexOf(latestLog) + 1}
        </Text>
        <Text style={styles.readEntry}>READ ENTRY</Text>
      </View>
    </TouchableOpacity>
  ) : <View style={{ height: SPACING.stackLoose }} />;

  // ── Estado vazio ──────────────────────────────────────────────────────────
  const ListEmpty = (
    <View style={styles.emptyState}>
      <Ionicons name="albums-outline" size={40} color={COLORS.outline} style={{ opacity: 0.4 }} />
      <Text style={styles.emptyText}>Nenhuma entrada arquivada</Text>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={gridData}
        keyExtractor={(item) => ('type' in item ? 'add-cell' : item.id)}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  list:   { paddingHorizontal: SPACING.pageMargin, paddingBottom: 32 },

  // ── Cartão de perfil ──
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 8,
    padding: 16,
    gap: 12,
    marginBottom: 10,
    marginTop: 12,
    ...SHADOW_PAPER,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.headlineMd,
    fontSize: 20,
    color: COLORS.onPrimaryContainer,
    letterSpacing: 1,
  },
  profileInfo:      { flex: 1, gap: 4 },
  profileFieldLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
  },
  profileName: {
    fontFamily: FONTS.headlineSm,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.primary,
  },
  profileDocCol: { alignItems: 'flex-end', gap: 4 },
  profileDocNo:  {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelStamp,
    color: COLORS.onSurface,
    letterSpacing: 0.5,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.onSurface}08`,
  },

  // Barra de progresso
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: `${COLORS.secondary}33`,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.secondary,
  },
  progressLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.secondary,
    letterSpacing: 1,
  },

  // Search bar ledger
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(29,28,21,0.25)',
    paddingBottom: 8,
    gap: 8,
    marginBottom: 20,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.labelStamp,
    color: COLORS.onSurface,
    fontStyle: 'italic',
    paddingVertical: 0,
  },
  sortLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.secondary,
    letterSpacing: 1,
  },

  sectionTitle: {
    fontFamily: FONTS.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // ── Grid ──
  columnWrapper: { gap: 12, marginBottom: 4 },
  gridCellWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  // Célula "Add Stamp" em círculo dashed
  addCircleCard: {
    width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2, borderStyle: 'dashed',
    borderColor: COLORS.outlineVariant,
    alignItems: 'center', justifyContent: 'center',
  },
  addCellText: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.outline,
    marginTop: 8,
    letterSpacing: 0.5,
  },

  // ── Estado vazio ──
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
  },
  emptyText: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
    letterSpacing: 1,
  },

  // ── Latest Log ──
  latestLogCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 8,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: `${COLORS.outlineVariant}50`,
    ...SHADOW_PAPER,
  },
  latestLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  latestLogTitle: {
    flex: 1,
    fontFamily: FONTS.headlineMd,
    fontSize: FONT_SIZES.headlineSm,
    color: COLORS.onSurface,
  },
  memoBadge: {
    backgroundColor: `${COLORS.secondary}26`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    transform: [{ rotate: '3deg' }],
  },
  memoBadgeText: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.secondary,
    letterSpacing: 1.5,
  },
  latestLogPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 12,
  },
  latestLogNote: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurface,
    opacity: 0.85,
    lineHeight: 22,
    marginBottom: 16,
  },
  latestLogFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: `${COLORS.outlineVariant}50`,
    paddingTop: 12,
  },
  latestLogMeta: {
    fontFamily: FONTS.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  readEntry: {
    fontFamily: FONTS.labelCaps,
    fontSize: 9,
    color: COLORS.secondary,
    letterSpacing: 1.5,
  },
});
