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
  // Empty state - show add photo button
  if (photos.length === 0) {
    return (
      <TouchableOpacity
        style={styles.photoEmpty}
        onPress={onAddPhoto}
        activeOpacity={0.7}
      >
        <Ionicons name="camera-outline" size={24} color={COLORS.outline} />
        <Text style={styles.photoEmptyText}>Add photographic evidence</Text>
      </TouchableOpacity>
    );
  }

  // Photos present - show gallery
  return (
    <View style={styles.photoHasSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.photoScroll}
      >
        {photos.map((uri, i) => (
          <View key={i} style={styles.photoThumb}>
            <Image source={{ uri }} style={styles.photoThumbImg} resizeMode="cover" />
            <TouchableOpacity
              style={styles.photoThumbRemove}
              onPress={() => onRemovePhoto(i)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="close" size={12} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity
            style={styles.photoAddCard}
            onPress={onAddPhoto}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={COLORS.outline} />
            <Text style={styles.photoAddCardText}>+ photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.photoDotRow}>
        <View style={styles.photoDots}>
          {photos.map((_, i) => (
            <View
              key={i}
              style={[
                styles.photoDot,
                {
                  backgroundColor: i === activePhotoIndex
                    ? COLORS.secondary
                    : COLORS.outlineVariant,
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.photoCounter}>{photos.length}/{MAX_PHOTOS} photos</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photoEmpty: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainer,
    marginHorizontal: -32,
    marginBottom: 4,
  },
  photoEmptyText: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.outline,
    letterSpacing: 1,
  },

  photoHasSection: {
    marginBottom: 4,
  },
  photoScroll: {
    marginBottom: 10,
  },
  // Individual thumbnail: 140 × 110px
  photoThumb: {
    width: 140,
    height: 110,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
  },
  photoThumbImg: {
    width: 140,
    height: 110,
  },
  photoThumbRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Add more photos card: 80 × 110px
  photoAddCard: {
    width: 80,
    height: 110,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.outline,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddCardText: {
    fontFamily: FONTS.labelCaps,
    fontSize: 10,
    color: COLORS.outline,
    letterSpacing: 0.5,
  },
  // Dots + counter row
  photoDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  photoDots: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  photoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  photoCounter: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
});
