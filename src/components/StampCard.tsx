import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stamp } from '../types';
import {
  COLORS,
  FONTS,
  RADIUS,
  SHADOW_PAPER,
} from '../constants/theme';
import {
  formatDateShort,
  getCardRotation,
  resolveCoverPhoto,
  resolveStampIcon,
} from '../utils/stampUtils';
import { PolaroidPhoto } from './PolaroidPhoto';

interface StampCardProps {
  stamp: Stamp;
  variant?: 'grid' | 'list';
  index?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

// Tamanho da célula no grid de 2 colunas (gap 12 entre colunas, pageMargin 20 de cada lado)
export const STAMP_SIZE  = Math.floor((SCREEN_WIDTH - 52) / 2);
// Stamp circulares ocupam 75% da célula
export const CIRCLE_SIZE = Math.floor(STAMP_SIZE * 0.75);
// Selo (sem foto) — menor que a célula, com a localização abaixo
const SEAL_SIZE = STAMP_SIZE - 40;

// Date formatting, icon resolution, rotation, and cover-photo helpers are
// provided by the shared stampUtils module (imported above).

export function StampCard({ stamp, variant = 'grid', index = 0 }: StampCardProps) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const delay = Math.min(index * 60, 300);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 260, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 260, delay, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animBase   = { opacity: fadeAnim, transform: [{ translateY: slideAnim }] };
  const rotation   = getCardRotation(stamp.id);
  const coverPhoto = resolveCoverPhoto(stamp);
  const extraPhotos = (stamp.photos?.length ?? 0) - 1;

  // ── Modo lista (SearchScreen / CollectionScreen) ────────────────────────
  if (variant === 'list') {
    return (
      <Animated.View style={animBase}>
        <View style={[styles.listContainer, { borderLeftColor: stamp.color }]}>
          {coverPhoto ? (
            <View style={styles.listThumbWrapper}>
              <Image source={{ uri: coverPhoto }} style={styles.listThumbnail} />
              {extraPhotos > 0 && (
                <View style={styles.photoBadge}>
                  <Text style={styles.photoBadgeText}>+{extraPhotos}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.listCircle, { backgroundColor: stamp.color + '26' }]}>
              <Ionicons name={resolveStampIcon(stamp)} size={22} color={stamp.color} />
            </View>
          )}

          <View style={styles.listContent}>
            <Text style={styles.listTitle} numberOfLines={1}>{stamp.title}</Text>
            <Text style={styles.listSub} numberOfLines={1}>
              {stamp.place}{stamp.country ? `, ${stamp.country}` : ''}
            </Text>
            <Text style={styles.listDate}>{formatDateShort(stamp.date)}</Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={COLORS.secondary} style={styles.listArrow} />
        </View>
      </Animated.View>
    );
  }

  // ── Grid — Polaroid quando o stamp tem foto ──────────────────────────────
  if (coverPhoto) {
    const photoSize = STAMP_SIZE - 24;
    return (
      <Animated.View style={[animBase, styles.gridCell]}>
        <View style={{ alignItems: 'center' }}>
          <View style={styles.polaroidWrapper}>
            <PolaroidPhoto
              uri={coverPhoto}
              width={photoSize}
              height={photoSize}
              rotation={rotation}
              caption={formatDateShort(stamp.date)}
            />
            {extraPhotos > 0 && (
              <View style={styles.photoBadge}>
                <Text style={styles.photoBadgeText}>+{extraPhotos}</Text>
              </View>
            )}
          </View>
          <Text style={styles.circlePlace} numberOfLines={1}>
            {stamp.place}
          </Text>
        </View>
      </Animated.View>
    );
  }

  // ── Grid — Selo, igual ao stamp principal da tela de detalhes ───────────
  return (
    <Animated.View style={[animBase, styles.gridCell]}>
      <View style={{ alignItems: 'center' }}>
        <View
          style={[
            styles.sealOuter,
            { borderColor: stamp.color },
            { transform: [{ rotate: rotation }] },
          ]}
        >
          <View style={[styles.sealInnerBorder, { borderColor: stamp.color }]} pointerEvents="none" />
          <Ionicons name={resolveStampIcon(stamp)} size={22} color={stamp.color} />
          <Text style={[styles.sealTitle, { color: stamp.color }]} numberOfLines={2}>
            {stamp.title.toUpperCase()}
          </Text>
          <View style={[styles.sealLine, { backgroundColor: stamp.color }]} />
          <Text style={[styles.sealDate, { color: stamp.color }]}>
            {formatDateShort(stamp.date)}
          </Text>
        </View>
        <Text style={styles.circlePlace} numberOfLines={1}>
          {stamp.place}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Célula do grid: preenche coluna, centraliza o stamp internamente
  gridCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },

  // ── Polaroid (stamps com foto) ──
  polaroidWrapper: {
    position: 'relative',
  },

  circlePlace: {
    marginTop: 6,
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    color: COLORS.onSurface,
    letterSpacing: 0.5,
    textAlign: 'center',
    maxWidth: CIRCLE_SIZE,
  },

  // ── Selo (sem foto) — mesmo estilo do stamp principal em Stamp Detail ──
  sealOuter: {
    width: SEAL_SIZE,
    height: SEAL_SIZE,
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    ...SHADOW_PAPER,
  },
  sealInnerBorder: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderWidth: 1,
    borderRadius: 5,
    opacity: 0.3,
  },
  sealTitle: {
    fontFamily: FONTS.labelStamp,
    fontSize: 9,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 11,
  },
  sealLine: {
    width: 22,
    height: 1,
    marginVertical: 4,
    opacity: 0.7,
  },
  sealDate: {
    fontFamily: FONTS.labelStamp,
    fontSize: 9,
    letterSpacing: 0.5,
    opacity: 0.85,
  },

  // ── Lista ──
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    height: 72,
    borderLeftWidth: 4,
    overflow: 'hidden',
    ...SHADOW_PAPER,
  },
  listThumbWrapper: {
    width: 48, height: 48,
    marginHorizontal: 12,
  },
  listThumbnail: {
    width: 48, height: 48,
    borderRadius: 6,
  },
  photoBadge: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  photoBadgeText: {
    fontFamily: FONTS.labelCaps,
    fontSize: 9,
    color: COLORS.white,
  },
  listCircle: {
    width: 46, height: 46, borderRadius: 23,
    marginHorizontal: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  listContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  listTitle: {
    fontFamily: FONTS.headlineSm,
    fontSize: 14,
    color: COLORS.onSurface,
  },
  listSub: {
    fontFamily: FONTS.bodyMd,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  listDate: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 11,
    color: COLORS.outline,
  },
  listArrow: {
    paddingRight: 12,
  },
});
