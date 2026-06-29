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
import { getInitials } from '../utils/stampUtils';
import { PassportStackParamList, RootTabParamList } from '../navigation/types';

type PassportNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<PassportStackParamList, 'PassportHome'>,
  BottomTabNavigationProp<RootTabParamList>
>;

// Volume color aliases for UI elements
const VOLUME_INK = COLORS.onPrimary; // '#d5e3ff'

// Spacing between cards on the volume shelf, used for snap-to-page scrolling.
const SHELF_ITEM_GAP = 16;

// ─── AddVolumeCard ─────────────────────────────────────────────────────────────
// Placeholder card that occupies the space for the next volume to be created.

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

  // ── Animations ──────────────────────────────────────────────────────────────
  const shelfOpacity   = useRef(new Animated.Value(1)).current;
  const shelfScale     = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Reload stamps, volumes and userName when screen comes into focus, pulling
  // the latest from the cloud first so changes made on another device show up.
  // If autoOpen param is set (navigated here after creating a stamp), open the
  // most recent volume automatically so the new stamp is immediately visible.
  useFocusEffect(
    useCallback(() => {
      (async () => {
        await Promise.all([syncStampsFromCloud(), syncVolumesFromCloud()]);
        await loadStamps();
        await reloadUserName();
        if (route.params?.autoOpen) {
          navigation.setParams({ autoOpen: undefined });
          // volumes state may not reflect the latest yet; read from the
          // hook's in-memory list to pick the most recent passport.
          const target = volumes[volumes.length - 1] ?? null;
          if (target && !isOpen) {
            setSelectedVolume(target);
            shelfOpacity.setValue(0);
            shelfScale.setValue(0.94);
            setIsOpen(true);
            Animated.timing(contentOpacity, { toValue: 1, duration: 240, useNativeDriver: true }).start();
          }
        }
      })();
    }, [syncStampsFromCloud, syncVolumesFromCloud, loadStamps, reloadUserName, route.params?.autoOpen]),
  );

  // Hide tab bar on this screen
  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({
      tabBarStyle: {
        display: 'none',
      },
    });
  }, [navigation]);

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

  const handleFabPress = () => navigation.navigate('Create');
  const handleStampPress = (stamp: Stamp) => navigation.navigate('StampDetail', { stamp });

  // ── Stamps for selected volume ────────────────────────────────────────────
  // The 'default' volume displays all stamps without volumeId (backwards compatible).
  // New volumes only display stamps with matching volumeId.
  const volumeStamps = !selectedVolume || selectedVolume.id === 'default'
    ? stamps.filter(s => !s.volumeId || s.volumeId === 'default')
    : stamps.filter(s => s.volumeId === selectedVolume.id);

  // ── Next volume label ────────────────────────────────────────────────────
  const nextVolumeLabel = `VOLUME ${toRoman(volumes.length + 1)}`;

  // ── Create new volume ──────────────────────────────────────────────────────
  // Closes the modal immediately instead of waiting on addVolume — its cloud
  // sync step can hang while offline, which would otherwise leave the modal
  // stuck open even though the volume was already saved locally.
  const handleCreateVolume = (name: string) => {
    setShowAddModal(false);
    addVolume(name);
  };

  // ── Delete volume ────────────────────────────────────────────────────────
  const handleDeleteVolume = (volume: Volume) => {
    if (volumes.length <= 1) {
      Alert.alert('Não é possível excluir', 'Você precisa manter pelo menos um passaporte.');
      return;
    }
    Alert.alert(
      'Excluir passaporte',
      `Tem certeza que deseja excluir "${volume.name}"? Todos os selos guardados nele serão apagados permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
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
      <Ionicons name="book-outline" size={44} color={COLORS.outlineVariant} />
      <Text style={styles.emptyStateText}>No stamps in this passport</Text>
      <Text style={styles.emptyStateHint}>Tap the pencil to record your first memory.</Text>
    </View>
  );

  // Compact strip at the top of the list when volume is open
  const renderCompactHeader = () => (
    <View style={styles.compactStrip}>
      <View style={styles.compactGlobe}>
        <Ionicons name="globe-outline" size={24} color={VOLUME_INK} />
      </View>
      <View style={styles.compactInfo}>
        <Text style={styles.compactLabel}>MEMORY PASSPORT</Text>
        <View style={styles.compactNameRow}>
          <Text style={styles.compactName}>{userName}</Text>
        </View>
      </View>
      <Text style={styles.compactCount}>{volumeStamps.length}</Text>
    </View>
  );

  // Shelf item: real volume or add card
  type ShelfItem = Volume | { id: '__add__' };

  const renderShelfItem = ({ item, index }: { item: ShelfItem; index: number }) => {
    if (item.id === '__add__') {
      return <AddVolumeCard onPress={() => setShowAddModal(true)} />;
    }
    const vol = item as Volume;
    // Stamps belonging to this volume
    const volStamps = vol.id === 'default'
      ? stamps.filter(s => !s.volumeId || s.volumeId === 'default')
      : stamps.filter(s => s.volumeId === vol.id);

    // Show the year of the oldest stamp in the volume, falling back to the
    // volume's own year if it has no stamps yet.
    const earliestYear = volStamps
      .map(s => s.date.slice(0, 4))
      .sort()[0];
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

        /* ──────────── CLOSED STATE ──────────── */
        <View style={styles.closedBg}>

          {/* Header THE ARCHIVES */}
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
          </View>

          {/* Volume shelf */}
          <Animated.View
            style={[
              styles.bookSection,
              {
                opacity: shelfOpacity,
                transform: [{ scale: shelfScale }],
              },
            ]}
          >
            <Text style={styles.stampCounter}>
              {stamps.length} {stamps.length === 1 ? 'stamp collected' : 'stamps collected'}
            </Text>

            <Text style={styles.shelfHint}>
              Tap a passport to open
            </Text>

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
          </Animated.View>
        </View>

      ) : (

        /* ──────────── OPEN STATE ──────────── */
        <Animated.View style={[styles.openContainer, { opacity: contentOpacity }]}>

          {/* Fixed header */}
          <View style={[styles.openHeader, { paddingTop: insets.top + SPACING.stackTight }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
              <Text style={styles.closeBtnText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.openTitle} numberOfLines={1}>
              {selectedVolume?.name ?? 'My Passport'}
            </Text>

            <Text style={styles.openCounter}>{volumeStamps.length} stamps</Text>
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

          {/* FAB — pencil icon, burgundy background */}
          <TouchableOpacity style={styles.fab} onPress={handleFabPress} activeOpacity={0.8}>
            <Ionicons name="pencil" size={24} color={COLORS.white} />
          </TouchableOpacity>

        </Animated.View>
      )}

      {/* Modal for creating new volume */}
      <VolumeModal
        visible={showAddModal}
        nextLabel={nextVolumeLabel}
        onClose={() => setShowAddModal(false)}
        onConfirm={handleCreateVolume}
      />
    </View>
  );
}

// ─── Utility ───────────────────────────────────────────────────────────────────

function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
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

  // Header "THE ARCHIVES"
  archivesHeader: {
    paddingHorizontal: SPACING.pageMargin,
    paddingBottom: SPACING.elementGap,
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
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.headlineSm,
    fontSize: 18,
    color: COLORS.onPrimaryContainer,
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

  // Volume shelf
  bookSection: {
    flex: 0.8,
    alignItems: 'center',
  },
  shelfContent: {
    paddingHorizontal: VOLUME_SHELF_SIDE_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelfHint: {
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.7,
  },
  stampCounter: {
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 8,
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
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 80,
  },
  closeBtnText: {
    fontFamily: FONTS.headlineSm,
    fontSize: 15,
    color: COLORS.primary,
  },
  openTitle: {
    flex: 1,
    fontFamily: FONTS.headlineMd,
    fontSize: 18,
    color: COLORS.primary,
    textAlign: 'center',
  },
  openCounter: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.secondary,
    minWidth: 80,
    textAlign: 'right',
  },

  // Compact strip — ListHeaderComponent for stamps grid
  compactStrip: {
    height: 120,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(213,227,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInfo: {
    flex: 1,
  },
  compactLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.onPrimaryContainer,
    letterSpacing: 2,
    marginBottom: 6,
  },
  compactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactName: {
    fontFamily: FONTS.headlineSm,
    fontSize: 16,
    color: VOLUME_INK,
  },
  compactCount: {
    fontFamily: FONTS.labelStamp,
    fontSize: 28,
    color: COLORS.secondaryContainer,
    opacity: 0.6,
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
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.outlineVariant,
    textAlign: 'center',
  },

  // Stamps grid
  list: {
    paddingHorizontal: 20,
    paddingBottom: 96,
  },
  row: {
    gap: 20,
    marginBottom: 20,
    justifyContent: 'center',
  },

  // FAB — pencil burgundy
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    ...SHADOW_PAPER,
  },
});
