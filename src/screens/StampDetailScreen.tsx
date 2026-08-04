import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStamps } from '../hooks/useStamps';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SHADOW_PAPER,
  SPACING,
} from '../constants/theme';
import type { Stamp } from '../types';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS_EN,
  formatArrivalDate,
  formatDateLong,
  getCardRotation,
  getEntryCode,
  resolvePhotos,
  resolveStampIcon,
} from '../utils/stampUtils';
import { PolaroidPhoto } from '../components/PolaroidPhoto';

// StampDetail is registered in three different stacks (Passaporte, Coleção,
// Buscar). A standalone param-list keeps it independent of any specific stack.
type StampDetailParamList = { StampDetail: { stamp: Stamp }; EditStamp: { stamp: Stamp } };
type Props = NativeStackScreenProps<StampDetailParamList, 'StampDetail'>;

const SCREEN_WIDTH  = Dimensions.get('window').width;
const PHOTO_WIDTH   = SCREEN_WIDTH - 40;
// Larger print — polaroid fills most of its page, commanding the eye
const POLAROID_SIZE = PHOTO_WIDTH - 70;

// Subtle dot grid shared with the form screens — reinforces paper texture
const BG_DOTS: { top: number; left: number }[] = [];
for (let row = 0; row < 22; row++) {
  for (let col = 0; col < 6; col++) {
    BG_DOTS.push({
      top:  row * 80 + (col % 2) * 40,
      left: col * (SCREEN_WIDTH / 5) + (row % 2) * 18,
    });
  }
}

export function StampDetailScreen({ route, navigation }: Props) {
  const { stamp } = route.params;
  const { deleteStamp } = useStamps();
  const insets = useSafeAreaInsets();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const photos    = resolvePhotos(stamp);
  const hasPhotos = photos.length > 0;
  const headerHeight = insets.top + 60;

  // Museum catalog number: MS prefix + entry code (e.g. PT-2026) + 6-char ID fragment
  // Reads as: MS-PT-2026-A3B5C7
  const archiveRef = useMemo(
    () => `MS-${getEntryCode(stamp)}-${stamp.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`,
    [stamp],
  );

  const handlePhotoScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / PHOTO_WIDTH);
    setCurrentPhotoIndex(index);
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove from Archive',
      'This entry will be permanently removed from the collection.',
      [
        { text: 'Keep Entry', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteStamp(stamp.id);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>

      {/* Paper texture — same dot grid as the form screens */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {BG_DOTS.map((pos, i) => (
          <View key={i} style={[styles.bgDot, { top: pos.top, left: pos.left }]} />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: headerHeight + 12 }]}
        showsVerticalScrollIndicator={false}
      >

        {hasPhotos ? (
          <>
            {/* ── Photograph — the primary evidence ────────────────────────── */}
            <View style={styles.photoSection}>
              <Text style={styles.photoSectionLabel}>PHOTOGRAPHIC RECORD</Text>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                onScroll={handlePhotoScroll}
                scrollEventThrottle={16}
              >
                {photos.map((uri, i) => (
                  <View key={i} style={styles.photoPage}>
                    <PolaroidPhoto
                      uri={uri}
                      width={POLAROID_SIZE}
                      height={POLAROID_SIZE}
                      rotation={getCardRotation(`${stamp.id}-${i}`)}
                      caption={formatArrivalDate(stamp.date)}
                    />
                  </View>
                ))}
              </ScrollView>
              {photos.length > 1 && (
                <View style={styles.photoDots}>
                  {photos.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          width: i === currentPhotoIndex ? 14 : 5,
                          backgroundColor: i === currentPhotoIndex
                            ? COLORS.primary
                            : COLORS.outlineVariant,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* ── Compact seal — catalog label beneath the photograph ───────── */}
            <View style={styles.sealWrapperCompact}>
              <View style={[styles.sealOuter, styles.sealOuterCompact, { borderColor: stamp.color }]}>
                <View
                  style={[styles.sealInnerBorder, { borderColor: stamp.color }]}
                  pointerEvents="none"
                />
                <Ionicons name={resolveStampIcon(stamp)} size={28} color={stamp.color} />
                <Text
                  style={[styles.sealTitle, styles.sealTitleCompact, { color: stamp.color }]}
                  numberOfLines={2}
                >
                  {stamp.title.toUpperCase()}
                </Text>
                <View style={[styles.sealLine, styles.sealLineCompact, { backgroundColor: stamp.color }]} />
                <Text style={[styles.sealDate, styles.sealDateCompact, { color: stamp.color }]}>
                  {formatArrivalDate(stamp.date)}
                </Text>
                <Text style={[styles.sealWatermark, { color: stamp.color }]}>
                  {stamp.id.slice(0, 8).toUpperCase()}
                </Text>
              </View>
            </View>
          </>
        ) : (
          /* ── Full seal — hero when no photograph exists ───────────────── */
          <View style={styles.sealWrapper}>
            <View style={[styles.sealOuter, { borderColor: stamp.color }]}>
              <View
                style={[styles.sealInnerBorder, { borderColor: stamp.color }]}
                pointerEvents="none"
              />
              <Ionicons name={resolveStampIcon(stamp)} size={44} color={stamp.color} />
              <Text style={[styles.sealTitle, { color: stamp.color }]} numberOfLines={2}>
                {stamp.title.toUpperCase()}
              </Text>
              <View style={[styles.sealLine, { backgroundColor: stamp.color }]} />
              <Text style={[styles.sealDate, { color: stamp.color }]}>
                {formatArrivalDate(stamp.date)}
              </Text>
              <Text style={[styles.sealWatermark, { color: stamp.color }]}>
                {stamp.id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        {/* ── Archival metadata ledger ────────────────────────────────────── */}
        <View style={styles.metadataSection}>

          {/* Archive reference — catalog identifier at the head of the ledger */}
          <View style={styles.metaArchiveRow}>
            <Text style={styles.metaArchiveLabel}>ARCHIVE REF.</Text>
            <Text style={styles.metaArchiveValue}>{archiveRef}</Text>
          </View>

          {/* Classification */}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>CLASSIFICATION</Text>
            <View style={styles.metaCategoryInline}>
              <Ionicons
                name={CATEGORY_ICONS[stamp.category]}
                size={9}
                color={COLORS.onSurfaceVariant}
                style={{ opacity: 0.6 }}
              />
              <Text style={styles.metaValueInline} numberOfLines={1}>
                {CATEGORY_LABELS_EN[stamp.category].toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Date recorded */}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>RECORDED</Text>
            <Text style={styles.metaValue}>{formatDateLong(stamp.date)}</Text>
          </View>

          {/* Location */}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>LOCATION</Text>
            <Text style={styles.metaValue}>{stamp.place}</Text>
          </View>

          {/* Territory or archive status */}
          {stamp.country ? (
            <View style={[styles.metaRow, styles.metaRowLast]}>
              <Text style={styles.metaLabel}>TERRITORY</Text>
              <Text style={styles.metaValue}>{stamp.country}</Text>
            </View>
          ) : (
            <View style={[styles.metaRow, styles.metaRowLast]}>
              <Text style={styles.metaLabel}>ARCHIVE STATUS</Text>
              <Text style={styles.metaValue}>PRESERVED</Text>
            </View>
          )}

        </View>

        {/* ── Field notes — text printed on the document, no container ───── */}
        {stamp.note ? (
          <View style={styles.noteSection}>
            <Text style={styles.noteSectionLabel}>FIELD NOTES</Text>
            <Text style={styles.noteText}>{stamp.note}</Text>
          </View>
        ) : null}

        {/* ── Document footer ──────────────────────────────────────────────── */}
        <View style={styles.footer} pointerEvents="none">
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>MEMORY STAMP ARCHIVE</Text>
          <Text style={styles.footerTextSub}>
            {`ARCHIVAL QUALITY PAPER · RECORD No. ${stamp.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`}
          </Text>
        </View>

        {/* ── Archive removal — intentionally buried, reads as a footnote ─── */}
        <TouchableOpacity style={styles.deleteLink} onPress={handleDelete} activeOpacity={0.5}>
          <Text style={styles.deleteLinkText}>remove from archive</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Sticky document header ─────────────────────────────────────────── */}
      <View
        style={[styles.header, { paddingTop: insets.top }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter} pointerEvents="none">
          <Text style={styles.headerTitle}>ARCHIVE RECORD</Text>
        </View>

        {/* Amend — archival correction annotation, never a primary action */}
        <TouchableOpacity
          style={styles.headerRight}
          onPress={() => navigation.navigate('EditStamp', { stamp })}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil-outline" size={12} color={COLORS.onSurfaceVariant} style={{ opacity: 0.65 }} />
          <Text style={styles.amendText}>amend</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  // Shared paper texture — same density as CreateStampScreen / EditStampScreen
  bgDot: {
    position: 'absolute',
    width: 1.5,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: COLORS.onSurface,
    opacity: 0.06,
  },

  // ── Document header ───────────────────────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: 'rgba(254,249,237,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.pageMargin,
    paddingBottom: 12,
    // Thin ruled bottom edge — the top rule of a document page
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(29,28,21,0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
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
  // Document type classification — not a screen name
  headerTitle: {
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2.5,
    opacity: 0.65,
  },
  headerRight: {
    minWidth: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  // Lowercase, typewriter weight — marginal correction annotation feel
  amendText: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
    opacity: 0.7,
  },

  // ── Seal — full size when no photograph (it becomes the hero) ─────────────────
  sealWrapper: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  sealOuter: {
    width: 210,
    height: 210,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    transform: [{ rotate: '-3deg' }],
    ...SHADOW_PAPER,
  },

  // ── Seal — compact (catalog label beneath a photograph) ───────────────────────
  sealWrapperCompact: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  sealOuterCompact: {
    width: 148,
    height: 148,
    borderWidth: 1.5,
    padding: 10,
    transform: [{ rotate: '-2deg' }],
  },

  sealInnerBorder: {
    position: 'absolute',
    top: 8, left: 8, right: 8, bottom: 8,
    borderWidth: 1,
    borderRadius: 8,
    opacity: 0.3,
  },
  sealTitle: {
    fontFamily: FONTS.labelStamp,
    fontSize: 14,
    letterSpacing: 2.5,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  sealTitleCompact: {
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 5,
    lineHeight: 13,
  },
  sealLine: {
    width: 36,
    height: 1,
    marginVertical: 7,
    opacity: 0.6,
  },
  sealLineCompact: {
    width: 22,
    marginVertical: 5,
  },
  sealDate: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelStamp,
    letterSpacing: 1,
    opacity: 0.85,
  },
  sealDateCompact: {
    fontSize: 10,
  },
  // Ghost catalog code — printer's registration mark level opacity
  sealWatermark: {
    position: 'absolute',
    bottom: 9,
    right: 10,
    fontFamily: FONTS.labelStamp,
    fontSize: 7,
    letterSpacing: 1,
    opacity: 0.18,
  },

  // ── Photographic record ───────────────────────────────────────────────────────
  photoSection: {
    width: '100%',
    marginBottom: 12,
  },
  photoSectionLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 8,
    opacity: 0.6,
  },
  photoPage: {
    width: PHOTO_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingTop: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },

  // ── Metadata ledger ───────────────────────────────────────────────────────────
  // Top border anchors the ledger to the content above as one document
  metadataSection: {
    width: '100%',
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(29,28,21,0.12)',
    paddingTop: 14,
  },
  // Archive reference — the catalog heading of the entire ledger block
  metaArchiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingBottom: 10,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(29,28,21,0.12)',
  },
  metaArchiveLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 8,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2,
    opacity: 0.5,
  },
  metaArchiveValue: {
    fontFamily: FONTS.labelStamp,
    fontSize: 12,
    color: COLORS.onSurface,
    letterSpacing: 1.5,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 8,
    marginBottom: 14,
    borderBottomWidth: 1,
    // Very faint ledger line — just enough to separate without interrupting
    borderBottomColor: 'rgba(29,28,21,0.07)',
  },
  metaRowLast: {
    marginBottom: 0,
  },
  // Labels recede — they are index terms, not content
  metaLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    opacity: 0.55,
  },
  // Values advance — they are the record content
  metaValue: {
    fontFamily: FONTS.labelStamp,
    fontSize: 15,
    color: COLORS.onSurface,
    maxWidth: '60%',
    textAlign: 'right',
  },
  // Classification: no maxWidth, single line guaranteed
  metaValueInline: {
    fontFamily: FONTS.labelStamp,
    fontSize: 15,
    color: COLORS.onSurface,
    textAlign: 'right',
  },
  metaCategoryInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // ── Field notes — bare text on paper, no container ────────────────────────────
  noteSection: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(29,28,21,0.12)',
    paddingTop: 14,
    marginBottom: 20,
  },
  noteSectionLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 10,
    opacity: 0.55,
  },
  // Plain typewriter text — no card, no border, no background
  noteText: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 15,
    color: COLORS.onSurface,
    opacity: 0.82,
    lineHeight: 24,
  },

  // ── Document footer ───────────────────────────────────────────────────────────
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
    opacity: 0.2,
    marginBottom: 12,
  },
  footerLine: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.onSurface,
  },
  footerText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 10,
    color: COLORS.onSurface,
    letterSpacing: 2,
    textAlign: 'center',
  },
  footerTextSub: {
    fontFamily: FONTS.labelStamp,
    fontSize: 8,
    color: COLORS.onSurface,
    letterSpacing: 1.5,
    textAlign: 'center',
  },

  // ── Archive removal — footnote-level visibility, never competes ───────────────
  deleteLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  deleteLinkText: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 9,
    color: COLORS.outline,
    letterSpacing: 1,
    opacity: 0.35,
  },
});
