import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppDialog } from '../components/AppDialog';
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
import { useProfilePhoto } from '../hooks/useProfilePhoto';
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
import { Insignia } from '../types/insignia';
import { BadgeDetailModal } from '../components/BadgeDetailModal';
import { InsigniaBadgeCard } from '../components/InsigniaBadgeCard';
import { UnlockToast } from '../components/UnlockToast';
import { useBadgeUnlockToast } from '../hooks/useBadgeUnlockToast';
import { computeBadges, curateProfileBadges } from '../utils/badges';
import { CollectionStackParamList, RootTabParamList } from '../navigation/types';
import {
  resolveCoverPhoto,
  getInitials,
  getDocNo,
  formatDateShort,
} from '../utils/stampUtils';

type CollectionNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<CollectionStackParamList, 'CollectionHome'>,
  BottomTabNavigationProp<RootTabParamList>
>;

const SCREEN_WIDTH = Dimensions.get('window').width;

// ── Explorer rank ──────────────────────────────────────────────────────────────

const RANK_THRESHOLDS = [0, 5, 10, 20, 50] as const;
const RANK_LABELS     = ['Novice Explorer', 'Wanderer', 'Seasoned Traveler', 'Expert Adventurer', 'Legendary Explorer'] as const;
const RANK_NUMERALS   = ['I', 'II', 'III', 'IV', 'V'] as const;

function getExplorerRank(count: number) {
  let rank = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    if (count >= RANK_THRESHOLDS[i]) rank = i;
  }
  const nextThreshold = rank < RANK_THRESHOLDS.length - 1 ? RANK_THRESHOLDS[rank + 1] : null;
  const prevThreshold = RANK_THRESHOLDS[rank];
  const progress = nextThreshold
    ? (count - prevThreshold) / (nextThreshold - prevThreshold)
    : 1;
  return {
    numeral:      RANK_NUMERALS[rank],
    label:        RANK_LABELS[rank],
    nextLabel:    rank < RANK_LABELS.length - 1 ? RANK_LABELS[rank + 1] : null,
    nextThreshold,
    toNext:       nextThreshold ? nextThreshold - count : 0,
    progress:     Math.min(Math.max(progress, 0), 1),
  };
}

// ── Active directive (mission) ─────────────────────────────────────────────────

interface Directive {
  label: string;
  desc: string;
  reward: string;
  progress: number;
  total: number;
}

function getActiveDirective(stamps: Stamp[], countriesCount: number): Directive {
  const notesCount = stamps.filter(s => s.note?.trim()).length;
  if (stamps.length === 0)    return { label: 'First Expedition',    desc: 'Document your first destination',         reward: 'First Journey Insignia',              progress: 0,             total: 1  };
  if (stamps.length < 5)      return { label: 'Reach Wanderer Rank', desc: 'Collect 5 entry stamps to advance',       reward: 'Explorer Rank II · Wanderer',          progress: stamps.length, total: 5  };
  if (countriesCount < 3)     return { label: 'Jet-Setter Insignia', desc: 'Record entries across 3 countries',       reward: 'Jet-Setter Expedition Seal',           progress: countriesCount, total: 3  };
  if (stamps.length < 10)     return { label: 'Seasoned Rank',       desc: 'Collect 10 entry stamps to advance',      reward: 'Explorer Rank III · Seasoned Traveler', progress: stamps.length, total: 10 };
  if (notesCount < 5)         return { label: 'Chronicler Insignia', desc: 'Write 5 field notes',                     reward: 'Chronicler Expedition Seal',           progress: notesCount,    total: 5  };
  if (stamps.length < 20)     return { label: 'Expert Rank',         desc: 'Collect 20 entry stamps to advance',      reward: 'Explorer Rank IV · Expert Adventurer',  progress: stamps.length, total: 20 };
  if (stamps.length < 50)     return { label: 'Legendary Status',    desc: 'Collect 50 entry stamps to advance',      reward: 'Explorer Rank V · Legendary Explorer',  progress: stamps.length, total: 50 };
  return                             { label: 'Master Explorer',      desc: 'All objectives completed',                reward: 'Legendary Status — Complete',           progress: 50,            total: 50 };
}

// ── Month formatter ────────────────────────────────────────────────────────────

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatMonthYear(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const m = parseInt(month, 10) - 1;
  return `${MONTH_SHORT[m] ?? ''} ${year}`;
}

// ── Grid cell type ─────────────────────────────────────────────────────────────

type GridCell = Stamp | { type: 'add' };

// ── Component ──────────────────────────────────────────────────────────────────

export function CollectionScreen() {
  const navigation  = useNavigation<CollectionNavigation>();
  const { stamps, loading: stampsLoading, loadStamps, syncStampsFromCloud, deleteStamp } = useStamps();
  const { userName, reloadUserName } = useUserName();
  const { profilePhotoUrl } = useProfilePhoto();
  const insets = useSafeAreaInsets();
  const [dialogStamp, setDialogStamp] = useState<Stamp | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Insignia | null>(null);

  const [query,  setQuery]  = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  useFocusEffect(useCallback(() => {
    (async () => {
      await syncStampsFromCloud();
      await loadStamps();
      await reloadUserName();
    })();
  }, [syncStampsFromCloud, loadStamps, reloadUserName]));

  // ── Derived data ─────────────────────────────────────────────────────────────

  const initials = getInitials(userName || 'Traveler');
  const docNo    = getDocNo(userName || 'Traveler');

  const countriesCount = useMemo(
    () => new Set(stamps.map(s => s.country).filter(Boolean)).size,
    [stamps],
  );
  const citiesCount = useMemo(
    () => new Set(stamps.map(s => s.place).filter(Boolean)).size,
    [stamps],
  );
  const photoCount = useMemo(
    () => stamps.reduce((acc, s) => acc + (s.photos?.length || 0), 0),
    [stamps],
  );
  const notesCount = useMemo(
    () => stamps.filter(s => s.note?.trim()).length,
    [stamps],
  );

  const explorerRank = useMemo(() => getExplorerRank(stamps.length), [stamps.length]);

  const memberSince = useMemo(() => {
    const sorted = stamps.slice().sort((a, b) => a.date.localeCompare(b.date));
    return formatMonthYear(sorted[0]?.date ?? new Date().toISOString().slice(0, 10));
  }, [stamps]);

  const latestJourney = useMemo(
    () => stamps.slice().sort((a, b) => b.date.localeCompare(a.date))[0] ?? null,
    [stamps],
  );

  const timeline = useMemo(
    () => stamps.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [stamps],
  );

  const allBadges     = useMemo(() => computeBadges(stamps), [stamps]);
  const profileBadges = useMemo(() => curateProfileBadges(allBadges), [allBadges]);
  const directive     = useMemo(() => getActiveDirective(stamps, countriesCount), [stamps, countriesCount]);
  const { toastBadge, dismissToast } = useBadgeUnlockToast(allBadges, stampsLoading);

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
      sortBy === 'date' ? b.date.localeCompare(a.date) : a.place.localeCompare(b.place),
    );
  }, [stamps, query, sortBy]);

  const gridData: GridCell[] = useMemo(
    () => ([...filteredStamps, { type: 'add' }] as GridCell[]),
    [filteredStamps],
  );

  // ── Percentage values ─────────────────────────────────────────────────────────

  const rankPct      = `${Math.round(explorerRank.progress * 100)}%` as `${number}%`;
  const directivePct = `${Math.min(Math.round((directive.progress / directive.total) * 100), 100)}%` as `${number}%`;

  // ── Navigation helpers ────────────────────────────────────────────────────────

  const handleStampPress     = (stamp: Stamp) => navigation.navigate('StampDetail', { stamp });
  const handleAddPress       = () => navigation.navigate('Create');
  const handleLatestLogPress = () => { if (latestJourney) navigation.navigate('StampDetail', { stamp: latestJourney }); };

  const handleStampLongPress = useCallback((stamp: Stamp) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDialogStamp(stamp);
  }, []);

  // ── Grid item renderer ────────────────────────────────────────────────────────

  const renderItem = ({ item, index }: { item: GridCell; index: number }) => {
    if ('type' in item) {
      return (
        <TouchableOpacity style={styles.gridCellWrapper} onPress={handleAddPress} activeOpacity={0.8}>
          <View style={styles.addCircle}>
            <Ionicons name="add" size={26} color={COLORS.outlineVariant} />
          </View>
          <Text style={styles.addCellLabel}>New Destination</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity style={styles.gridCellWrapper} onPress={() => handleStampPress(item)} onLongPress={() => handleStampLongPress(item)} activeOpacity={0.85}>
        <StampCard stamp={item} index={index} variant="grid" />
      </TouchableOpacity>
    );
  };

  // ── List header ───────────────────────────────────────────────────────────────
  // Intentionally compact so stamps appear at the top of the viewport.

  const progressLabel = explorerRank.toNext > 0
    ? `${explorerRank.toNext} ${explorerRank.toNext === 1 ? 'entry' : 'entries'} to ${explorerRank.nextLabel}`
    : 'Legendary Explorer — All ranks achieved';

  const ListHeader = (
    <View>

      {/* ── Profile Card ───────────────────────────────────────────────────── */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>

          {/* Avatar — reduced weight, secondary to the name */}
          {profilePhotoUrl ? (
            <Image source={{ uri: profilePhotoUrl }} style={styles.avatarPhoto} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || '?'}</Text>
            </View>
          )}

          {/* Identity block — primary visual anchor */}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{userName || 'Traveler'}</Text>
            <View style={styles.rankRow}>
              <View style={styles.rankPill}>
                <Text style={styles.rankPillText}>RNK {explorerRank.numeral}</Text>
              </View>
              <Text style={styles.rankTitle}>{explorerRank.label}</Text>
            </View>
            <Text style={styles.profileMeta}>{docNo} · Since {memberSince}</Text>
          </View>

          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="settings-outline" size={18} color={COLORS.onPrimaryContainer} />
          </TouchableOpacity>
        </View>

        {/* Rank progress — absorbed from the separate Archive Progress section */}
        <View style={styles.profileProgressArea}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: rankPct }]} />
          </View>
          <Text style={styles.progressLabel}>{progressLabel}</Text>
        </View>
      </View>

      {/* ── Seals section header — the hero of the screen ─────────────────── */}
      <View style={styles.sealsHeader}>

        {/* Decorative document corners */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />

        <View style={styles.sealsHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>OFFICIAL SEALS OF PASSAGE</Text>
            <Text style={styles.sealsCount}>
              {filteredStamps.length} {filteredStamps.length === 1 ? 'ENTRY' : 'ENTRIES'} ARCHIVED
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setSortBy(p => p === 'date' ? 'name' : 'date')}
            activeOpacity={0.7}
            style={styles.sortPill}
          >
            <Ionicons
              name={sortBy === 'date' ? 'calendar-outline' : 'text-outline'}
              size={14}
              color={COLORS.secondary}
            />
            <Text style={styles.sortPillText}>{sortBy === 'date' ? 'DATE' : 'A–Z'}</Text>
          </TouchableOpacity>
        </View>

        {/* Search — embedded as a form field on the document */}
        <View style={styles.searchField}>
          <Ionicons name="search-outline" size={18} color={COLORS.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries..."
            placeholderTextColor={COLORS.outline}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close-circle" size={16} color={COLORS.outline} />
            </TouchableOpacity>
          )}
        </View>

      </View>
    </View>
  );

  // ── List footer ───────────────────────────────────────────────────────────────

  const latestCover = latestJourney ? resolveCoverPhoto(latestJourney) : undefined;

  const ListFooter = (
    <View style={styles.footer}>

      {/* ── Active Directive (mission) ────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACTIVE DIRECTIVE</Text>
        <View style={styles.directiveCard}>

          <View style={styles.directiveTopRow}>
            <Text style={styles.directiveEyebrow}>▸ OBJECTIVE</Text>
            <Ionicons name="compass-outline" size={14} color={COLORS.secondary} />
          </View>

          <Text style={styles.directiveTitle}>{directive.label.toUpperCase()}</Text>
          <Text style={styles.directiveDesc}>{directive.desc}</Text>

          <View style={styles.directiveDivider} />

          <View style={styles.rewardRow}>
            <Text style={styles.rewardEyebrow}>REWARD</Text>
            <Text style={styles.rewardValue} numberOfLines={1}>{directive.reward}</Text>
          </View>

          <View style={styles.directiveProgressRow}>
            <View style={styles.directiveTrack}>
              <View style={[styles.directiveFill, { width: directivePct }]} />
            </View>
            <Text style={styles.directiveCount}>
              {directive.progress} / {directive.total}
            </Text>
          </View>

        </View>
      </View>

      {/* ── Latest Entry ──────────────────────────────────────────────────── */}
      {latestJourney && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LATEST ENTRY</Text>
          <TouchableOpacity style={styles.journeyCard} onPress={handleLatestLogPress} activeOpacity={0.85}>

            <View style={styles.journeyHeader}>
              <Text style={styles.journeyTitle} numberOfLines={1}>{latestJourney.title}</Text>
              <View style={styles.memoBadge}>
                <Text style={styles.memoBadgeText}>MEMO</Text>
              </View>
            </View>

            {latestCover ? (
              <Image source={{ uri: latestCover }} style={styles.journeyPhoto} resizeMode="cover" />
            ) : null}

            <View style={styles.journeyMetaRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.secondary} />
              <Text style={styles.journeyMetaText}>
                {latestJourney.place}{latestJourney.country ? `, ${latestJourney.country}` : ''}
              </Text>
              <View style={styles.metaDot} />
              <Text style={styles.journeyMetaText}>{formatDateShort(latestJourney.date)}</Text>
            </View>

            {latestJourney.note ? (
              <Text style={styles.journeyNote} numberOfLines={2}>{latestJourney.note}</Text>
            ) : null}

            <View style={styles.journeyFooter}>
              <Text style={styles.journeyCode}>
                {latestJourney.place.slice(0, 2).toUpperCase()}-{latestJourney.date.slice(2, 4)} · {latestJourney.date.slice(0, 4)}
              </Text>
              <Text style={styles.readEntry}>READ ENTRY →</Text>
            </View>

          </TouchableOpacity>
        </View>
      )}

      {/* ── Expedition Log ────────────────────────────────────────────────── */}
      {timeline.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXPEDITION LOG</Text>

          {/* Logbook container — dark header bar + ruled entries */}
          <View style={styles.logBook}>
            <View style={styles.logBookHeader}>
              <Text style={styles.logBookHeaderText}>
                CHRONOLOGICAL RECORD — {timeline.length} DISPATCHES
              </Text>
            </View>
            {timeline.map((stamp, i) => (
              <TouchableOpacity
                key={stamp.id}
                style={[styles.logEntry, i < timeline.length - 1 && styles.logEntryBorder]}
                onPress={() => handleStampPress(stamp)}
                onLongPress={() => handleStampLongPress(stamp)}
                activeOpacity={0.75}
              >
                {/* Entry reference number */}
                <Text style={styles.logRef}>{String(i + 1).padStart(2, '0')}</Text>

                {/* Color indicator tied to stamp color */}
                <View style={[styles.logColorBar, { backgroundColor: stamp.color }]} />

                {/* Content */}
                <View style={styles.logContent}>
                  <Text style={styles.logDate}>{formatDateShort(stamp.date)}</Text>
                  <Text style={styles.logTitle} numberOfLines={1}>{stamp.title}</Text>
                  <Text style={styles.logPlace} numberOfLines={1}>
                    {stamp.place}{stamp.country ? `, ${stamp.country}` : ''}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={15} color={COLORS.outlineVariant} />
              </TouchableOpacity>
            ))}
          </View>

        </View>
      )}

      {/* ── Field Statistics ──────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FIELD STATISTICS</Text>
        <View style={styles.statsCard}>
          {[
            { value: stamps.length, label: 'Entries' },
            { value: countriesCount, label: 'Countries' },
            { value: citiesCount,    label: 'Cities' },
            { value: photoCount,     label: 'Photos' },
            { value: notesCount,     label: 'Notes' },
          ].map((stat, i, arr) => (
            <React.Fragment key={stat.label}>
              <View style={styles.statCol}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── Expedition Insignia ───────────────────────────────────────────── */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.insigniaHeaderRow}
          onPress={() => navigation.navigate('BadgeCollection')}
          activeOpacity={0.7}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>EXPEDITION INSIGNIA</Text>
          <View style={styles.viewAllPill}>
            <Text style={styles.viewAllText}>VIEW ALL</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.secondary} />
          </View>
        </TouchableOpacity>
        <View style={styles.insigniaGrid}>
          {profileBadges.map((badge) => (
            <InsigniaBadgeCard key={badge.id} badge={badge} onPress={() => setSelectedBadge(badge)} />
          ))}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </View>
  );

  // ── Empty state ───────────────────────────────────────────────────────────────

  const ListEmpty = (
    <View style={styles.emptyState}>
      <Ionicons name="albums-outline" size={36} color={COLORS.outline} style={{ opacity: 0.35 }} />
      <Text style={styles.emptyText}>No entries archived yet</Text>
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

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
        keyboardShouldPersistTaps="handled"
      />
      <AppDialog
        visible={!!dialogStamp}
        onClose={() => setDialogStamp(null)}
        label="ARCHIVE REMOVAL"
        title={dialogStamp?.title ?? ''}
        message="Remove this entry from the archive?"
        actions={[
          { text: 'Keep Entry', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => dialogStamp && deleteStamp(dialogStamp.id),
          },
        ]}
      />
      <BadgeDetailModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
      <UnlockToast badge={toastBadge} topOffset={insets.top + 8} onDismiss={dismissToast} />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  list:   { paddingHorizontal: SPACING.pageMargin, paddingBottom: 16 },

  // ── Shared ────────────────────────────────────────────────────────────────────
  section: { marginBottom: 20 },
  sectionTitle: {
    fontFamily: FONTS.labelCaps,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2,
    marginBottom: 8,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.onSurfaceVariant,
    opacity: 0.4,
  },

  // ── Profile Card ──────────────────────────────────────────────────────────────
  profileCard: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    marginTop: 12,
    ...SHADOW_PAPER,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // Avatar: reduced from 64×64 to 48×48 — supporting role, name is primary
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: FONTS.headlineMd,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 1,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  // Name is the primary visual anchor — larger and more prominent than before
  profileName: {
    fontFamily: FONTS.headlineMd,
    fontSize: FONT_SIZES.headlineSm,
    color: COLORS.onPrimary,
    lineHeight: 22,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankPill: {
    backgroundColor: `${COLORS.secondary}55`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  rankPillText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    color: COLORS.secondaryContainer,
    letterSpacing: 0.8,
  },
  rankTitle: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 13,
    color: COLORS.onPrimaryContainer,
  },
  profileMeta: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 12,
    color: COLORS.onPrimaryContainer,
    opacity: 0.75,
    letterSpacing: 0.3,
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.onPrimary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // Progress bar — now lives inside the profile card, no separate section
  profileProgressArea: {
    marginTop: 14,
    gap: 5,
  },
  progressTrack: {
    height: 4,
    backgroundColor: `${COLORS.secondary}28`,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
  },
  progressLabel: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 13,
    color: COLORS.onPrimaryContainer,
    opacity: 0.8,
    letterSpacing: 0.3,
  },

  // ── Seals Section Header — hero of the screen ─────────────────────────────────
  sealsHeader: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 6,
    ...SHADOW_PAPER,
  },
  // Document corner marks — archival feel without any new libraries
  corner: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  cornerTL: {
    top: 8,
    left: 8,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: COLORS.outlineVariant,
  },
  cornerTR: {
    top: 8,
    right: 8,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: COLORS.outlineVariant,
  },
  sealsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sealsCount: {
    fontFamily: FONTS.labelStamp,
    fontSize: 12,
    color: COLORS.secondary,
    letterSpacing: 0.8,
    marginTop: 3,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.secondary}14`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginTop: 2,
  },
  sortPillText: {
    fontFamily: FONTS.labelCaps,
    fontSize: 12,
    color: COLORS.secondary,
    letterSpacing: 0.6,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.outlineVariant}80`,
    paddingTop: 9,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.labelStampRegular,
    fontSize: 15,
    color: COLORS.onSurface,
    fontStyle: 'italic',
    paddingVertical: 0,
  },

  // ── Stamps Grid ───────────────────────────────────────────────────────────────
  // alignItems: 'flex-start' prevents the row from stretching each cell to the
  // tallest sibling's height — so each cell is only as tall as its own content
  // and they all top-align naturally.
  columnWrapper: { gap: 12, marginBottom: 4, alignItems: 'flex-start' },
  gridCellWrapper: {
    flex: 1,
    alignItems: 'center',
    // Match StampCard.gridCell paddingVertical (12) so the dashed circle and
    // the Polaroid/seal start at the same vertical offset in the row.
    paddingTop: 12,
    paddingBottom: 8,
  },
  addCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCellLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 12,
    color: COLORS.outline,
    marginTop: 8,
    letterSpacing: 0.4,
    textAlign: 'center',
    maxWidth: CIRCLE_SIZE,
  },

  // ── Footer wrapper ────────────────────────────────────────────────────────────
  footer: { paddingTop: 20 },

  // ── Active Directive ──────────────────────────────────────────────────────────
  directiveCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
    ...SHADOW_PAPER,
  },
  directiveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  directiveEyebrow: {
    fontFamily: FONTS.labelCaps,
    fontSize: 11,
    color: COLORS.secondary,
    letterSpacing: 1.2,
  },
  directiveTitle: {
    fontFamily: FONTS.headlineMd,
    fontSize: 17,
    color: COLORS.onSurface,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  directiveDesc: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  directiveDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.6,
    marginVertical: 10,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 10,
  },
  rewardEyebrow: {
    fontFamily: FONTS.labelCaps,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  rewardValue: {
    flex: 1,
    fontFamily: FONTS.labelStamp,
    fontSize: 13,
    color: COLORS.secondary,
    letterSpacing: 0.4,
  },
  directiveProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  directiveTrack: {
    flex: 1,
    height: 5,
    backgroundColor: `${COLORS.secondary}22`,
    borderRadius: 3,
    overflow: 'hidden',
  },
  directiveFill: {
    height: 5,
    backgroundColor: COLORS.secondary,
    borderRadius: 3,
  },
  directiveCount: {
    fontFamily: FONTS.labelStamp,
    fontSize: 13,
    color: COLORS.secondary,
    letterSpacing: 0.4,
    minWidth: 36,
    textAlign: 'right',
  },

  // ── Latest Entry ──────────────────────────────────────────────────────────────
  journeyCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: `${COLORS.outlineVariant}50`,
    ...SHADOW_PAPER,
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  journeyTitle: {
    flex: 1,
    fontFamily: FONTS.headlineMd,
    fontSize: FONT_SIZES.headlineSm,
    color: COLORS.onSurface,
    marginRight: 8,
  },
  memoBadge: {
    backgroundColor: `${COLORS.secondary}22`,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    transform: [{ rotate: '2deg' }],
  },
  memoBadgeText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    color: COLORS.secondary,
    letterSpacing: 1.2,
  },
  journeyPhoto: {
    width: '100%',
    height: 160,
    borderRadius: RADIUS.md,
  },
  journeyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  journeyMetaText: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  journeyNote: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 13,
    color: COLORS.onSurface,
    opacity: 0.85,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  journeyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: `${COLORS.outlineVariant}50`,
    paddingTop: 9,
  },
  journeyCode: {
    fontFamily: FONTS.labelCaps,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  readEntry: {
    fontFamily: FONTS.labelCaps,
    fontSize: 12,
    color: COLORS.secondary,
    letterSpacing: 1,
  },

  // ── Expedition Log ────────────────────────────────────────────────────────────
  logBook: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    overflow: 'hidden',
    ...SHADOW_PAPER,
  },
  // Dark header bar — like a file folder label
  logBookHeader: {
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  logBookHeaderText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    color: COLORS.onPrimary,
    letterSpacing: 1.2,
    opacity: 0.85,
  },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  logEntryBorder: {
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.outlineVariant}70`,
  },
  // Archival reference number
  logRef: {
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
    width: 20,
    textAlign: 'center',
  },
  // Thin color indicator tied to the stamp's color
  logColorBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
    flexShrink: 0,
  },
  logContent: {
    flex: 1,
    gap: 2,
  },
  logDate: {
    fontFamily: FONTS.labelStamp,
    fontSize: 12,
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  logTitle: {
    fontFamily: FONTS.headlineSm,
    fontSize: 16,
    color: COLORS.onSurface,
  },
  logPlace: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },

  // ── Field Statistics ──────────────────────────────────────────────────────────
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 8,
    ...SHADOW_PAPER,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.6,
  },
  statValue: {
    fontFamily: FONTS.labelStamp,
    fontSize: 22,
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },

  // ── Expedition Insignia ───────────────────────────────────────────────────────
  insigniaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  viewAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontFamily: FONTS.labelCaps,
    fontSize: 11,
    color: COLORS.secondary,
    letterSpacing: 0.8,
  },
  insigniaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // ── Empty State ───────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingTop: 28,
    gap: 10,
  },
  emptyText: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
});
