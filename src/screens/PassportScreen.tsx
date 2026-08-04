import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  CompositeNavigationProp,
} from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useStamps } from '../hooks/useStamps';
import { useUserName } from '../hooks/useUserName';
import { useVolumes } from '../hooks/useVolumes';
import { StampCard } from '../components/StampCard';
import { VolumeBookCard } from '../components/VolumeBookCard';
import { VolumeModal } from '../components/VolumeModal';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SHADOW_PAPER,
  SPACING,
  VOLUME_CARD_WIDTH,
  VOLUME_CARD_HEIGHT,
  VOLUME_SHELF_SIDE_PADDING,
} from '../constants/theme';
import { Stamp, Volume } from '../types';
import { getInitials, toRoman } from '../utils/stampUtils';
import { PassportStackParamList, RootTabParamList } from '../navigation/types';

type PassportNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<PassportStackParamList, 'PassportHome'>,
  BottomTabNavigationProp<RootTabParamList>
>;

const VOLUME_INK = COLORS.onPrimary;
const SHELF_ITEM_GAP = 16;

// ─── AddVolumeCard ─────────────────────────────────────────────────────────────

function AddVolumeCard({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.bookCardWrapper}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.65}>
        <View style={styles.addVolumeCard}>
          <View style={styles.addVolumeIcon}>
            <Ionicons name="add" size={28} color={COLORS.outlineVariant} />
          </View>
          <Text style={styles.addVolumeLabel}>{'NEW\nVOLUME'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── PassportScreen ────────────────────────────────────────────────────────────

export function PassportScreen() {
  const navigation = useNavigation<PassportNavigation>();
  const route = useRoute<RouteProp<PassportStackParamList, 'PassportHome'>>();
  const { stamps, loadStamps, syncStampsFromCloud } = useStamps();
  const { userName, reloadUserName } = useUserName();
  const { volumes, addVolume, deleteVolume, syncVolumesFromCloud } = useVolumes();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const insets = useSafeAreaInsets();

  // Track if we've already processed the autoOpen param to avoid infinite loops
  const autoOpenProcessedRef = useRef(false);
  // Keep volumes and isOpen in sync with the latest state to avoid stale
  // closures in the focus effect below, without needing them in its deps
  // (which would re-run the cloud sync on every volume open/close).
  const volumesRef = useRef(volumes);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    volumesRef.current = volumes;
  }, [volumes]);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // ── Animations ──────────────────────────────────────────────────────────────
  const shelfOpacity   = useRef(new Animated.Value(1)).current;
  const shelfScale     = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Reload stamps, volumes and userName when screen comes into focus, pulling
  // the latest from the cloud first so changes made on another device show up.
  // If autoOpen param is set (navigated here after creating a stamp), open the
  // correct volume (either the one specified by returnToVolumeId or the most recent).
  useFocusEffect(
    useCallback(() => {
      (async () => {
        await Promise.all([syncStampsFromCloud(), syncVolumesFromCloud()]);
        await loadStamps();
        await reloadUserName();

        if (route.params?.autoOpen && !autoOpenProcessedRef.current) {
          autoOpenProcessedRef.current = true;
          navigation.setParams({ autoOpen: undefined });

          let target: Volume | null = null;
          const returnToId = route.params?.returnToVolumeId;

          if (returnToId) {
            target = volumesRef.current.find(v => v.id === returnToId) ?? null;
          }

          if (!target) {
            target = volumesRef.current[volumesRef.current.length - 1] ?? null;
          }

          if (target && !isOpenRef.current) {
            setSelectedVolume(target);
            shelfOpacity.setValue(0);
            shelfScale.setValue(0.94);
            setIsOpen(true);
            Animated.timing(contentOpacity, { toValue: 1, duration: 240, useNativeDriver: true }).start();
          }
        } else {
          if (!route.params?.autoOpen) {
            autoOpenProcessedRef.current = false;
          }
        }
      })();
    }, [syncStampsFromCloud, syncVolumesFromCloud, loadStamps, reloadUserName, route.params?.autoOpen]),
  );

  // ── Open volume ───────────────────────────────────────────────────────────
  const handleVolumePress = (volume: Volume) => {
    setSelectedVolume(volume);
    Animated.parallel([
      Animated.timing(shelfOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(shelfScale,   { toValue: 0.94, duration: 280, useNativeDriver: true }),
    ]).start(() => {
      contentOpacity.setValue(0);
      setIsOpen(true);
      Animated.timing(contentOpacity, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    });
  };

  // ── Close volume ──────────────────────────────────────────────────────────
  const handleClose = () => {
    Animated.timing(contentOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      shelfOpacity.setValue(0);
      shelfScale.setValue(0.94);
      setIsOpen(false);
      Animated.parallel([
        Animated.timing(shelfOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(shelfScale,   { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleFabPress = () => {
    navigation.navigate('Create', selectedVolume
      ? { volumeId: selectedVolume.id, returnToVolumeId: selectedVolume.id }
      : undefined);
  };

  const handleStampPress = (stamp: Stamp) => navigation.navigate('StampDetail', { stamp });

  // The 'default' volume displays all stamps without volumeId (backwards compatible).
  const volumeStamps = !selectedVolume || selectedVolume.id === 'default'
    ? stamps.filter(s => !s.volumeId || s.volumeId === 'default')
    : stamps.filter(s => s.volumeId === selectedVolume.id);

  const nextVolumeLabel = `VOLUME ${toRoman(volumes.length + 1)}`;

  // Closes the modal immediately instead of waiting on addVolume — its cloud
  // sync step can hang while offline, which would otherwise leave the modal stuck.
  const handleCreateVolume = (name: string) => {
    setShowAddModal(false);
    addVolume(name);
  };

  const handleDeleteVolume = (volume: Volume) => {
    if (volumes.length <= 1) {
      Alert.alert('Cannot Delete', 'At least one passport must remain in the collection.');
      return;
    }
    Alert.alert(
      'Delete Passport',
      `Are you sure you want to delete "${volume.name}"? All memories inside will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteVolume(volume.id);
            await loadStamps();
          },
        },
      ],
    );
  };

  // ── Renders ────────────────────────────────────────────────────────────────

  const renderStampItem = ({ item, index }: { item: Stamp; index: number }) => (
    <TouchableOpacity onPress={() => handleStampPress(item)} activeOpacity={0.85}>
      <StampCard stamp={item} index={index} />
    </TouchableOpacity>
  );

  const renderEmptyStamps = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={36} color={COLORS.outlineVariant} />
      <Text style={styles.emptyStateText}>No entries in this volume</Text>
      <Text style={styles.emptyStateHint}>Press 'NEW ENTRY' to record your first memory.</Text>
    </View>
  );

  // Compact passport card at the top of the open stamps grid
  const renderCompactHeader = () => (
    <View style={styles.compactStrip}>
      <View style={styles.compactGlobe}>
        <Ionicons name="globe-outline" size={20} color={VOLUME_INK} />
      </View>
      <View style={styles.compactInfo}>
        <Text style={styles.compactLabel}>MEMORY PASSPORT</Text>
        <Text style={styles.compactName}>{userName}</Text>
        <Text style={styles.compactVolumeName} numberOfLines={1}>
          {selectedVolume?.name ?? 'My Passport'}
        </Text>
      </View>
      {/* Entry count structured as a document field — number + label below */}
      <View style={styles.compactCountBlock}>
        <Text style={styles.compactCountNum}>{volumeStamps.length}</Text>
        <Text style={styles.compactCountLabel}>ENTRIES</Text>
      </View>
    </View>
  );

  type ShelfItem = Volume | { id: '__add__' };

  const renderShelfItem = ({ item, index }: { item: ShelfItem; index: number }) => {
    if (item.id === '__add__') {
      return <AddVolumeCard onPress={() => setShowAddModal(true)} />;
    }
    const vol = item as Volume;
    const volStamps = vol.id === 'default'
      ? stamps.filter(s => !s.volumeId || s.volumeId === 'default')
      : stamps.filter(s => s.volumeId === vol.id);

    const earliestYear = volStamps.map(s => s.date.slice(0, 4)).sort()[0];
    const displayYear = earliestYear ? `EST. ${earliestYear}` : vol.year;

    return (
      <VolumeBookCard
        volume={vol}
        displayYear={displayYear}
        isCurrent={index === volumes.length - 1}
        stampCount={volStamps.length}
        onPress={() => handleVolumePress(vol)}
        onDelete={() => handleDeleteVolume(vol)}
      />
    );
  };

  const shelfData: ShelfItem[] = [...volumes, { id: '__add__' }];

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {!isOpen ? (

        /* ────────── CLOSED STATE ────────── */
        <View style={styles.closedBg}>

          {/* Document header */}
          <View style={[styles.archivesHeader, { paddingTop: insets.top + 16 }]}>
            <View style={styles.archivesTitleRow}>
              <View style={styles.archivesTitleCol}>
                <Text style={styles.archivesLabel}>THE ARCHIVES</Text>
                <Text style={styles.archivesTitle}>Passports</Text>
              </View>
              <TouchableOpacity
                style={styles.profileBtn}
                onPress={() => navigation.navigate('Collection')}
                activeOpacity={0.7}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(userName || 'Viajante') || '?'}</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.archivesDivider} />
            {/* Archival metadata row — reads like a document property table */}
            <View style={styles.archivesMetaRow}>
              <Text style={styles.archivesMeta}>
                {stamps.length} {stamps.length === 1 ? 'ENTRY' : 'ENTRIES'}
              </Text>
              <Text style={styles.archivesMeta}>
                {volumes.length} {volumes.length === 1 ? 'VOLUME' : 'VOLUMES'}
              </Text>
            </View>
          </View>

          {/* Volume shelf — flex: 1 so it fills remaining space and footer pins to bottom */}
          <Animated.View
            style={[
              styles.bookSection,
              { opacity: shelfOpacity, transform: [{ scale: shelfScale }] },
            ]}
          >
            <Text style={styles.shelfHint}>Select a volume to open</Text>

            <FlatList
              horizontal
              data={shelfData}
              keyExtractor={(item) => item.id}
              renderItem={renderShelfItem}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shelfContent}
              ItemSeparatorComponent={() => <View style={{ width: SHELF_ITEM_GAP }} />}
              snapToInterval={VOLUME_CARD_WIDTH + SHELF_ITEM_GAP}
              decelerationRate="fast"
              snapToAlignment="start"
            />

            {/* Spacer pushes the footer to the bottom of the section */}
            <View style={styles.shelfSpacer} />

            {/* Archival footer — printed document language at the bottom of the page */}
            <View style={styles.archiveFooter}>
              <View style={styles.archiveFooterLine} />
              <Text style={styles.archiveFooterText}>
                {`MEMORY STAMP ARCHIVE · ${stamps.length} ${stamps.length === 1 ? 'MEMORY' : 'MEMORIES'} PRESERVED`}
              </Text>
            </View>
          </Animated.View>
        </View>

      ) : (

        /* ────────── OPEN STATE ────────── */
        <Animated.View style={[styles.openContainer, { opacity: contentOpacity }]}>

          {/* Fixed header */}
          <View style={[styles.openHeader, { paddingTop: insets.top + SPACING.stackTight }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
              <Text style={styles.closeBtnText}>BACK</Text>
            </TouchableOpacity>

            <Text style={styles.openTitle} numberOfLines={1}>
              {selectedVolume?.name ?? 'My Passport'}
            </Text>

            <Text style={styles.openCounter}>{volumeStamps.length} ENTRIES</Text>
          </View>

          {/* Stamps grid */}
          <FlatList
            data={volumeStamps}
            keyExtractor={(item) => item.id}
            renderItem={renderStampItem}
            ListHeaderComponent={renderCompactHeader}
            ListEmptyComponent={renderEmptyStamps}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />

          {/* Archival action button — stamp-pill shape, not a circular FAB */}
          <View style={styles.fabContainer} pointerEvents="box-none">
            <TouchableOpacity style={styles.fab} onPress={handleFabPress} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={16} color={COLORS.white} />
              <Text style={styles.fabLabel}>NEW ENTRY</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      )}

      <VolumeModal
        visible={showAddModal}
        nextLabel={nextVolumeLabel}
        onClose={() => setShowAddModal(false)}
        onConfirm={handleCreateVolume}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Closed state ────────────────────────────────────────────────────────────
  closedBg: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Document header
  archivesHeader: {
    paddingHorizontal: SPACING.pageMargin,
    paddingBottom: 12,
  },
  archivesTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  archivesTitleCol: {
    flex: 1,
  },
  profileBtn: {
    padding: 4,
  },
  // Avatar as embossed seal — thin border, initials in ink, warm paper bg
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 1,
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
    fontSize: FONT_SIZES.displayLg,
    color: COLORS.primary,
    marginBottom: 14,
  },
  archivesDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
  },
  // Two-column property row below the header divider — like a document field table
  archivesMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  archivesMeta: {
    fontFamily: FONTS.labelStamp,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    opacity: 0.55,
  },

  // Volume shelf
  bookSection: {
    flex: 1,
    alignItems: 'center',
  },
  shelfContent: {
    paddingHorizontal: VOLUME_SHELF_SIDE_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Shelf instruction — minimal, archival tone
  shelfHint: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.45,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  // Grows to fill remaining space so archiveFooter pins to the bottom
  shelfSpacer: {
    flex: 1,
  },
  // Archival footer strip — reinforces the document feeling of the page
  archiveFooter: {
    alignSelf: 'stretch',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  archiveFooterLine: {
    height: 1,
    width: '80%',
    backgroundColor: COLORS.onSurface,
    opacity: 0.07,
  },
  archiveFooterText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    opacity: 0.35,
    textAlign: 'center',
  },

  // Wrapper for card (includes badge below the book)
  bookCardWrapper: {
    alignItems: 'center',
  },

  // Placeholder card to add new volume
  addVolumeCard: {
    width: VOLUME_CARD_WIDTH,
    height: VOLUME_CARD_HEIGHT,
    backgroundColor: COLORS.surfaceContainerLow,
    borderLeftWidth: 6,
    borderLeftColor: COLORS.outlineVariant,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  addVolumeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVolumeLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.outlineVariant,
    letterSpacing: 2,
    textAlign: 'center',
    lineHeight: 16,
  },

  // ── Open state ──────────────────────────────────────────────────────────────
  openContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  openHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.pageMargin,
    paddingBottom: SPACING.stackTight,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(29,28,21,0.08)',
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 72,
  },
  closeBtnText: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  openTitle: {
    flex: 1,
    fontFamily: FONTS.headlineSm,
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
  },
  openCounter: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.onSurfaceVariant,
    opacity: 0.65,
    minWidth: 72,
    textAlign: 'right',
  },

  // Compact passport card — ListHeaderComponent for stamps grid
  compactStrip: {
    height: 108,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.lg,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.elementGap,
    gap: 12,
    ...SHADOW_PAPER,
  },
  compactGlobe: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(213,227,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInfo: {
    flex: 1,
    gap: 2,
  },
  compactLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 8,
    color: COLORS.onPrimaryContainer,
    letterSpacing: 2,
    opacity: 0.7,
    marginBottom: 2,
  },
  compactName: {
    fontFamily: FONTS.headlineSm,
    fontSize: 15,
    color: VOLUME_INK,
  },
  // Volume name — secondary context below the traveller's name
  compactVolumeName: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 11,
    color: VOLUME_INK,
    opacity: 0.5,
    letterSpacing: 0.5,
  },
  // Entry count as a structured document field: number + label stacked
  compactCountBlock: {
    alignItems: 'center',
    minWidth: 48,
  },
  compactCountNum: {
    fontFamily: FONTS.labelStamp,
    fontSize: 22,
    color: COLORS.secondaryContainer,
    opacity: 0.75,
    lineHeight: 26,
  },
  compactCountLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 7,
    color: COLORS.onPrimaryContainer,
    letterSpacing: 2,
    opacity: 0.5,
  },

  // Empty state (volume with no stamps)
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: SPACING.pageMargin,
    gap: 10,
  },
  emptyStateText: {
    fontFamily: FONTS.headlineSm,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyStateHint: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.outlineVariant,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Stamps grid
  list: {
    paddingHorizontal: 20,
    paddingBottom: 96,
  },
  row: {
    gap: 16,
    marginBottom: 16,
    justifyContent: 'center',
  },

  // Archival action button — stamp-pill shape replaces the circular FAB
  fabContainer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 6,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  fabLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 12,
    color: COLORS.white,
    letterSpacing: 2.5,
  },
});
