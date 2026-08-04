import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES } from '../constants/theme';

const MAX_PHOTOS = 6;
// Must stay in sync with passportCard paddingHorizontal in StampForm
const CARD_PADDING = 32;

export interface PhotoSelectorProps {
  photos: string[];
  onAddPhoto: () => void;
  onRemovePhoto: (index: number) => void;
  onScroll?: (event: { nativeEvent: { contentOffset: { x: number } } }) => void;
  activePhotoIndex?: number;
}

export function PhotoSelector({
  photos,
  onAddPhoto,
  onRemovePhoto,
  onScroll,
  activePhotoIndex = 0,
}: PhotoSelectorProps) {

  // ── Empty state — blank photo slot with archival corner marks ────────────────
  if (photos.length === 0) {
    return (
      <TouchableOpacity
        style={styles.photoEmpty}
        onPress={onAddPhoto}
        activeOpacity={0.7}
      >
        {/* L-shaped alignment marks — like a physical photo mounting guide */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        <Ionicons name="camera-outline" size={20} color={COLORS.outline} />
        <Text style={styles.photoEmptyTitle}>PHOTOGRAPHIC EVIDENCE</Text>
        <Text style={styles.photoEmptyHint}>Tap to attach a photograph</Text>
      </TouchableOpacity>
    );
  }

  // ── Gallery ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.photoSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.photoScrollView}
        contentContainerStyle={styles.photoScrollContent}
      >
        {photos.map((uri, i) => (
          <View key={i} style={styles.photoThumb}>
            <Image source={{ uri }} style={styles.photoThumbImg} resizeMode="cover" />
            <TouchableOpacity
              style={styles.photoRemoveBtn}
              onPress={() => onRemovePhoto(i)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={10} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ))}

        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity
            style={styles.photoAddSlot}
            onPress={onAddPhoto}
            activeOpacity={0.7}
          >
            {/* Corner marks echo the empty-state mounting guides */}
            <View style={[styles.slotCorner, styles.slotCornerTL]} />
            <View style={[styles.slotCorner, styles.slotCornerTR]} />
            <View style={[styles.slotCorner, styles.slotCornerBL]} />
            <View style={[styles.slotCorner, styles.slotCornerBR]} />
            <Ionicons name="add" size={18} color={COLORS.outline} />
            <Text style={styles.photoAddSlotText}>ADD PHOTO</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Active-frame indicator + counter */}
      <View style={styles.photoDotRow}>
        <View style={styles.photoDots}>
          {photos.map((_, i) => (
            <View
              key={i}
              style={[
                styles.photoDot,
                {
                  // Active dot becomes a pill to indicate position without a number
                  width: i === activePhotoIndex ? 14 : 5,
                  backgroundColor: i === activePhotoIndex
                    ? COLORS.primary
                    : COLORS.outlineVariant,
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.photoCounter}>{photos.length} / {MAX_PHOTOS}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  // ── Empty state ──────────────────────────────────────────────────────────────
  photoEmpty: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.surfaceContainerHigh,
    // Break out of the card's horizontal padding — spans full card width
    marginHorizontal: -CARD_PADDING,
    marginBottom: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: `${COLORS.outlineVariant}80`,
  },
  // L-shaped corner marks — physical photo placement guides
  corner: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  cornerTL: { top: 10, left: 12, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: COLORS.outlineVariant },
  cornerTR: { top: 10, right: 12, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: COLORS.outlineVariant },
  cornerBL: { bottom: 10, left: 12, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: COLORS.outlineVariant },
  cornerBR: { bottom: 10, right: 12, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: COLORS.outlineVariant },
  photoEmptyTitle: {
    fontFamily: FONTS.labelStamp,
    fontSize: 9,
    color: COLORS.outline,
    letterSpacing: 2,
  },
  photoEmptyHint: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.outlineVariant,
    fontStyle: 'italic',
  },

  // ── Gallery ──────────────────────────────────────────────────────────────────
  photoSection: {
    marginBottom: 4,
  },
  photoScrollView: {
    marginBottom: 8,
  },
  photoScrollContent: {
    gap: 8,
  },
  // All thumbnails share the same dimensions — contact sheet consistency
  photoThumb: {
    width: 140,
    height: 110,
    borderRadius: 6,
    overflow: 'hidden',
  },
  photoThumbImg: {
    width: 140,
    height: 110,
  },
  // Remove button: minimal footprint, unobtrusive
  photoRemoveBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Add slot: same dimensions as thumbnails — reads as "one more photo slot"
  photoAddSlot: {
    width: 140,
    height: 110,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  // Smaller corner marks repeat the empty-state mounting language
  slotCorner: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  slotCornerTL: { top: 7, left: 7, borderTopWidth: 1, borderLeftWidth: 1, borderColor: COLORS.outlineVariant },
  slotCornerTR: { top: 7, right: 7, borderTopWidth: 1, borderRightWidth: 1, borderColor: COLORS.outlineVariant },
  slotCornerBL: { bottom: 7, left: 7, borderBottomWidth: 1, borderLeftWidth: 1, borderColor: COLORS.outlineVariant },
  slotCornerBR: { bottom: 7, right: 7, borderBottomWidth: 1, borderRightWidth: 1, borderColor: COLORS.outlineVariant },
  photoAddSlotText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 8,
    color: COLORS.outline,
    letterSpacing: 1.5,
  },

  // ── Dots & counter ───────────────────────────────────────────────────────────
  photoDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  photoDots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  photoDot: {
    height: 4,
    borderRadius: 2,
  },
  photoCounter: {
    fontFamily: FONTS.labelStamp,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
    opacity: 0.5,
  },
});
