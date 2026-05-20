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

interface StampCardProps {
  stamp: Stamp;
  variant?: 'grid' | 'list';
  index?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

// Tamanho da célula no grid de 2 colunas (gap 12 entre colunas, pageMargin 20 de cada lado)
export const STAMP_SIZE  = Math.floor((SCREEN_WIDTH - 52) / 2);
// Stamp circulares e retangulares ocupam 75% da célula
export const CIRCLE_SIZE = Math.floor(STAMP_SIZE * 0.75);
const RECT_W = STAMP_SIZE - 16;
const RECT_H = Math.floor(STAMP_SIZE * 0.75);

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${MONTHS[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
}

const CATEGORY_FALLBACK: Record<Stamp['category'], React.ComponentProps<typeof Ionicons>['name']> = {
  viagem:      'airplane-outline',
  show:        'musical-notes-outline',
  restaurante: 'wine-outline',
  evento:      'calendar-outline',
  outro:       'star-outline',
};

function resolveIcon(stamp: Stamp): React.ComponentProps<typeof Ionicons>['name'] {
  if (stamp.icon && /^[a-z][a-z0-9-]+$/.test(stamp.icon)) {
    return stamp.icon as React.ComponentProps<typeof Ionicons>['name'];
  }
  return CATEGORY_FALLBACK[stamp.category];
}

// Rotação determinística de -2 a +2 graus baseada no id
function getCardRotation(id: string): string {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `${(sum % 5) - 2}deg`;
}

function resolveCoverPhoto(stamp: Stamp): string | undefined {
  return stamp.photos?.[0] ?? stamp.photo;
}

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

  const animBase  = { opacity: fadeAnim, transform: [{ translateY: slideAnim }] };
  const rotation  = getCardRotation(stamp.id);
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
              <Ionicons name={resolveIcon(stamp)} size={22} color={stamp.color} />
            </View>
          )}

          <View style={styles.listContent}>
            <Text style={styles.listTitle} numberOfLines={1}>{stamp.title}</Text>
            <Text style={styles.listSub} numberOfLines={1}>
              {stamp.place}{stamp.country ? `, ${stamp.country}` : ''}
            </Text>
            <Text style={styles.listDate}>{formatDate(stamp.date)}</Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={COLORS.secondary} style={styles.listArrow} />
        </View>
      </Animated.View>
    );
  }

  // ── Grid — Circular para viagem ──────────────────────────────────────────
  if (stamp.category === 'viagem') {
    return (
      <Animated.View style={[animBase, styles.gridCell]}>
        <View style={{ transform: [{ rotate: rotation }], alignItems: 'center' }}>
          <View style={[styles.circleCard, { borderColor: stamp.color }]}>
            <Ionicons name={resolveIcon(stamp)} size={28} color={stamp.color} />
          </View>
          <Text style={styles.circlePlace} numberOfLines={1}>
            {stamp.place}
          </Text>
          <Text style={[styles.circleDate, { color: stamp.color }]}>
            {formatDate(stamp.date)}
          </Text>
        </View>
      </Animated.View>
    );
  }

  // ── Grid — Retangular para outras categorias ─────────────────────────────
  return (
    <Animated.View style={[animBase, styles.gridCell]}>
      <View
        style={[
          styles.rectCard,
          { borderColor: stamp.color },
          { transform: [{ rotate: rotation }] },
        ]}
      >
        <Ionicons name={resolveIcon(stamp)} size={28} color={stamp.color} />
        <Text style={styles.rectTitle} numberOfLines={2}>{stamp.title}</Text>
        <Text style={[styles.rectDate, { color: stamp.color }]}>
          {formatDate(stamp.date)}
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
    paddingBottom: 8,
  },

  // ── Circular (viagem) ──
  circleCard: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainer,
    ...SHADOW_PAPER,
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
  circleDate: {
    fontFamily: FONTS.labelCaps,
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },

  // ── Retangular (outras categorias) ──
  rectCard: {
    width: RECT_W,
    height: RECT_H,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    ...SHADOW_PAPER,
  },
  rectTitle: {
    fontFamily: FONTS.headlineSm,
    fontSize: 12,
    color: COLORS.onSurface,
    textAlign: 'center',
    lineHeight: 15,
  },
  rectDate: {
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    letterSpacing: 0.5,
    opacity: 0.8,
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
