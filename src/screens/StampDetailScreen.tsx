import React, { useState } from 'react';
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
  RADIUS,
  SHADOW_PAPER,
  SPACING,
} from '../constants/theme';
import type { Stamp } from '../types';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  formatArrivalDate,
  formatDateLong,
  formatDateShort,
  getCardRotation,
  resolvePhotos,
  resolveStampIcon,
} from '../utils/stampUtils';
import { PolaroidPhoto } from '../components/PolaroidPhoto';

// StampDetail is registered in three different stacks (Passaporte, Coleção,
// Buscar). A standalone param-list type keeps the component independent of any
// specific stack and prevents incorrect navigation-prop inference.
type StampDetailParamList = { StampDetail: { stamp: Stamp }; EditStamp: { stamp: Stamp } };
type Props = NativeStackScreenProps<StampDetailParamList, 'StampDetail'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
// Photo width: 20 px horizontal padding on each side of the scroll container.
const PHOTO_WIDTH = SCREEN_WIDTH - 40;
// Polaroid frame is noticeably narrower than its page so it reads as a
// small floating print rather than a full-bleed image.
const POLAROID_SIZE = PHOTO_WIDTH - 120;

// ── Componente ────────────────────────────────────────────────────────────────

export function StampDetailScreen({ route, navigation }: Props) {
  const { stamp } = route.params;
  const { deleteStamp } = useStamps();
  const insets = useSafeAreaInsets();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const photos    = resolvePhotos(stamp);
  const hasPhotos = photos.length > 0;
  const headerHeight   = insets.top + 60;

  const handlePhotoScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / PHOTO_WIDTH);
    setCurrentPhotoIndex(index);
  };

  const handleDelete = () => {
    Alert.alert(
      'Apagar Memória',
      'Esta entrada será permanentemente removida dos arquivos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
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

      {/* ── Conteúdo em scroll ───────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: headerHeight + 24 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── O Selo — carimbo inclinado, elemento central ────────────────── */}
        <View style={styles.sealWrapper}>
          {/* Sealou externo com borda e rotação */}
          <View style={[styles.sealOuter, { borderColor: stamp.color }]}>
            {/* Borda interna decorativa — 8px de inset */}
            <View
              style={[styles.sealInnerBorder, { borderColor: stamp.color }]}
              pointerEvents="none"
            />

            {/* Ícone do stamp */}
            <Ionicons name={resolveStampIcon(stamp)} size={48} color={stamp.color} />

            {/* Título em maiúsculas estilo labelStamp */}
            <Text style={[styles.sealTitle, { color: stamp.color }]} numberOfLines={2}>
              {stamp.title.toUpperCase()}
            </Text>

            {/* Linha decorativa horizontal */}
            <View style={[styles.sealLine, { backgroundColor: stamp.color }]} />

            {/* Data de chegada */}
            <Text style={[styles.sealDate, { color: stamp.color }]}>
              {formatArrivalDate(stamp.date)}
            </Text>
          </View>

        </View>

        {/* ── Fotos (se existirem) — molduras estilo polaroid ──────────────── */}
        {hasPhotos && (
          <View style={styles.photoSection}>
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
                    caption={formatDateShort(stamp.date)}
                  />
                </View>
              ))}
            </ScrollView>
            {/* Indicador de foto atual para múltiplas fotos */}
            {photos.length > 1 && (
              <View style={styles.photoDots}>
                {photos.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      { backgroundColor: i === currentPhotoIndex ? COLORS.secondary : COLORS.outline },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Seção de metadados — estilo ledger/livro contábil ────────────── */}
        <View style={styles.metadataSection}>
          {/* VOLUME — categoria com badge burgundy */}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>VOLUME</Text>
            <View style={[styles.categoryBadge, { backgroundColor: stamp.color }]}>
              <Ionicons name={CATEGORY_ICONS[stamp.category]} size={11} color={COLORS.white} />
              <Text style={styles.categoryBadgeText}>
                {CATEGORY_LABELS[stamp.category].toUpperCase()}
              </Text>
            </View>
          </View>

          {/* DATE */}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>DATE</Text>
            <Text style={styles.metaValue}>{formatDateLong(stamp.date)}</Text>
          </View>

          {/* LOCATION */}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>LOCATION</Text>
            <Text style={styles.metaValue}>{stamp.place}</Text>
          </View>

          {/* COUNTRY ou REF */}
          <View style={[styles.metaRow, styles.metaRowLast]}>
            {stamp.country ? (
              <>
                <Text style={styles.metaLabel}>COUNTRY</Text>
                <Text style={styles.metaValue}>{stamp.country}</Text>
              </>
            ) : (
              <>
                <Text style={styles.metaLabel}>REF</Text>
                <Text style={styles.metaValue}>
                  #{stamp.id.slice(0, 8).toUpperCase()}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* ── Nota (se existir) ───────────────────────────────────────────── */}
        {stamp.note ? (
          <View style={[styles.noteCard, { borderLeftColor: stamp.color }]}>
            <Text style={styles.noteTitle}>Field Notes</Text>
            <Text style={styles.noteText}>{stamp.note}</Text>
          </View>
        ) : null}

        {/* ── Botões de ação ─────────────────────────────────────────────── */}
        <View style={styles.actionsSection}>
          {/* Link de remoção — labelCaps secondary, confirmação antes de deletar */}
          <TouchableOpacity style={styles.deleteLink} onPress={handleDelete} activeOpacity={0.7}>
            <Text style={styles.deleteLinkText}>Deletar</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer decorativo (não interativo) ──────────────────────────── */}
        <View style={styles.footer} pointerEvents="none">
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>
            ARCHIVAL QUALITY PAPER • NO. 883-21
          </Text>
        </View>
      </ScrollView>

      {/* ── Header sticky — sobreposto ao scroll ────────────────────────── */}
      <View
        style={[styles.header, { paddingTop: insets.top }]}
        pointerEvents="box-none"
      >
        {/* Botão voltar */}
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>

        {/* Título central */}
        <View style={styles.headerCenter} pointerEvents="none">
          <Text style={styles.headerTitle}>Memory Details</Text>
        </View>

        {/* Editar */}
        <TouchableOpacity
          style={styles.headerRight}
          onPress={() => navigation.navigate('EditStamp', { stamp })}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    alignItems: 'center',
  },

  // ── Header sticky ──
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(254,249,237,0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.pageMargin,
    paddingBottom: 12,
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
  headerTitle: {
    fontFamily: FONTS.headlineSm,
    fontSize: 16,
    color: COLORS.primary,
  },
  headerRight: {
    minWidth: 72,
    alignItems: 'flex-end',
  },

  // ── O Selo ──
  sealWrapper: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  // Carimbo principal: quadrado 220px, rotacionado -3deg
  sealOuter: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    transform: [{ rotate: '-3deg' }],
    ...SHADOW_PAPER,
  },
  // Borda interna decorativa com inset de 8px
  sealInnerBorder: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
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
  sealLine: {
    width: 40,
    height: 1,
    marginVertical: 8,
    opacity: 0.7,
  },
  sealDate: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelStamp,
    letterSpacing: 1,
    opacity: 0.85,
  },

  // ── Fotos — molduras polaroid ──
  photoSection: {
    width: '100%',
    marginBottom: 32,
  },
  photoPage: {
    width: PHOTO_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 12,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    opacity: 0.7,
  },

  // ── Metadados estilo ledger ──
  metadataSection: {
    width: '100%',
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 6,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(29,28,21,0.14)',
  },
  metaRowLast: {
    marginBottom: 0,
  },
  metaLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
  },
  metaValue: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelStamp,
    color: COLORS.onSurface,
    maxWidth: '65%',
    textAlign: 'right',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontFamily: FONTS.labelCaps,
    fontSize: 10,
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // ── Nota ──
  noteCard: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(117,119,126,0.25)',
    borderLeftWidth: 4,
    marginBottom: 28,
  },
  noteTitle: {
    fontFamily: FONTS.headlineMd,
    fontSize: FONT_SIZES.headlineSm,
    color: COLORS.onSurface,
    marginBottom: 12,
  },
  noteText: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurface,
    opacity: 0.9,
    lineHeight: 24,
  },

  // ── Botões de ação ──
  actionsSection: {
    width: '100%',
    gap: 12,
    marginBottom: 36,
  },
  // Link de remoção
  deleteLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  deleteLinkText: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.secondary,
    textDecorationLine: 'underline',
    letterSpacing: 1,
  },

  // ── Footer decorativo (opacity 0.2) ──
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    opacity: 0.2,
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
});
