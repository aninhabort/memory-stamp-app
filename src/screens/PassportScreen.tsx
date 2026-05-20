import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useNavigation,
  useFocusEffect,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useStamps } from '../hooks/useStamps';
import { useUserName } from '../hooks/useUserName';
import { StampCard } from '../components/StampCard';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SHADOW_PAPER,
  SHADOW_STRONG,
  SPACING,
} from '../constants/theme';
import { Stamp } from '../types';
import { PassporteStackParamList, RootTabParamList } from '../navigation/types';

type PassportNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<PassporteStackParamList, 'PassaporteHome'>,
  BottomTabNavigationProp<RootTabParamList>
>;

const SCREEN_WIDTH = Dimensions.get('window').width;

// Cor do interior do volume (spine mais escura, capa levemente mais clara)
const VOLUME_BG    = '#1b2a41';
const VOLUME_SPINE = '#05152b';
const VOLUME_INK   = '#d5e3ff'; // texto e ícones sobre fundo escuro

export function PassportScreen() {
  const navigation = useNavigation<PassportNavigation>();
  const { stamps, loadStamps } = useStamps();
  const { userName } = useUserName();
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  // ── Valores de animação ──────────────────────────────────────────────────
  const passportScale      = useRef(new Animated.Value(1)).current;
  const passportTranslateX = useRef(new Animated.Value(0)).current;
  const passportOpacity    = useRef(new Animated.Value(1)).current;
  const contentOpacity     = useRef(new Animated.Value(0)).current;
  // Elevação do volume ao pressionar (translateY -16px)
  const bookLiftAnim       = useRef(new Animated.Value(0)).current;

  // Recarrega stamps ao entrar em foco
  useFocusEffect(
    useCallback(() => { loadStamps(); }, [loadStamps]),
  );

  // Controla visibilidade da tab bar: oculta no estado fechado, exibe no aberto
  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({
      tabBarStyle: isOpen
        ? {
            backgroundColor: COLORS.primary,
            borderTopWidth: 0,
            height: 60 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
          }
        : { display: 'none' },
    });
  }, [isOpen, navigation, insets.bottom]);

  // ── Interação com o volume ────────────────────────────────────────────────

  // Eleva o livro ao tocar (feedback visual antes de abrir)
  const handlePressIn = () => {
    Animated.timing(bookLiftAnim, {
      toValue: -16,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  // ── Abrir passaporte ─────────────────────────────────────────────────────
  const handleOpen = () => {
    Animated.parallel([
      Animated.timing(passportScale,      { toValue: 0.3,               duration: 380, useNativeDriver: true }),
      Animated.timing(passportOpacity,    { toValue: 0,                 duration: 380, useNativeDriver: true }),
      Animated.timing(passportTranslateX, { toValue: -SCREEN_WIDTH / 2, duration: 380, useNativeDriver: true }),
    ]).start(() => {
      bookLiftAnim.setValue(0);
      contentOpacity.setValue(0);
      setIsOpen(true);
      Animated.timing(contentOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  // ── Fechar passaporte ────────────────────────────────────────────────────
  const handleClose = () => {
    Animated.timing(contentOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      passportScale.setValue(1);
      passportTranslateX.setValue(0);
      passportOpacity.setValue(0);
      bookLiftAnim.setValue(0);
      setIsOpen(false);
      Animated.timing(passportOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    });
  };

  const handleFabPress = () => navigation.navigate('Criar');

  const handleStampPress = (stamp: Stamp) => navigation.navigate('StampDetail', { stamp });

  const renderItem = ({ item, index }: { item: Stamp; index: number }) => (
    <TouchableOpacity onPress={() => handleStampPress(item)} activeOpacity={0.85}>
      <StampCard stamp={item} index={index} />
    </TouchableOpacity>
  );

  // Faixa compacta do passaporte — 120px, topo do scroll quando aberto (só leitura)
  const renderCompactHeader = () => (
    <View style={styles.compactStrip}>
      <View style={styles.compactGlobe}>
        <Ionicons name="globe-outline" size={24} color={VOLUME_INK} />
      </View>
      <View style={styles.compactInfo}>
        <Text style={styles.compactLabel}>PASSAPORTE DE MEMÓRIAS</Text>
        <View style={styles.compactNameRow}>
          <Text style={styles.compactName}>{userName}</Text>
        </View>
      </View>
      <Text style={styles.compactCount}>{stamps.length}</Text>
    </View>
  );

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {!isOpen ? (

        /* ──────────── ESTADO FECHADO ──────────── */
        <View style={styles.closedBg}>

          {/* Header THE ARCHIVES */}
          <View style={[styles.archivesHeader, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.archivesLabel}>THE ARCHIVES</Text>
            <Text style={styles.archivesTitle}>Passport Collection</Text>
            <View style={styles.archivesDivider} />
          </View>

          {/* Área central com o volume */}
          <View style={styles.bookSection}>
            <Animated.View
              style={[
                styles.centeredContent,
                {
                  transform: [
                    { scale: passportScale },
                    { translateX: passportTranslateX },
                  ],
                  opacity: passportOpacity,
                },
              ]}
            >
              {/* Volume / livro */}
              <TouchableOpacity
                onPressIn={handlePressIn}
                onPress={handleOpen}
                activeOpacity={1}
              >
                <Animated.View
                  style={[
                    styles.bookVolume,
                    { transform: [{ translateY: bookLiftAnim }] },
                  ]}
                >
                  {/* Linha superior: VOLUME I */}
                  <Text style={styles.volumeLabel}>VOLUME I</Text>

                  {/* Globo em círculo central */}
                  <View style={styles.globeCircle}>
                    <Ionicons name="globe-outline" size={48} color={VOLUME_INK} />
                  </View>

                  {/* Rodapé: título + ano */}
                  <View style={styles.bookFooter}>
                    <Text style={styles.bookFooterTitle}>Passaporte</Text>
                    <Text style={styles.bookFooterYear}>EST. 2024</Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>

              {/* Badge "CURRENT" inclinado -2° */}
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>CURRENT</Text>
              </View>

              {/* Contador de selos */}
              <Text style={styles.stampCounter}>
                {stamps.length} selos colecionados
              </Text>
            </Animated.View>
          </View>
        </View>

      ) : (

        /* ──────────── ESTADO ABERTO ──────────── */
        <Animated.View style={[styles.openContainer, { opacity: contentOpacity }]}>

          {/* Header fixo */}
          <View style={[styles.openHeader, { paddingTop: insets.top + SPACING.stackTight }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>

            <Text style={styles.openTitle}>Meu Passaporte</Text>

            <Text style={styles.openCounter}>{stamps.length} selos</Text>
          </View>

          {/* Grid de stamps */}
          <FlatList
            data={stamps}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={renderCompactHeader}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />

          {/* FAB — ícone lápis, fundo burgundy */}
          <TouchableOpacity style={styles.fab} onPress={handleFabPress} activeOpacity={0.8}>
            <Ionicons name="pencil" size={24} color={COLORS.white} />
          </TouchableOpacity>

        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Estado fechado ──────────────────────────────────────────────────────
  closedBg: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header "THE ARCHIVES" — topo da tela fechada
  archivesHeader: {
    paddingHorizontal: SPACING.pageMargin,
    paddingBottom: SPACING.elementGap,
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

  // Área central onde o volume fica centralizado
  bookSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredContent: {
    alignItems: 'center',
  },

  // Volume estilo lombada de livro/passaporte
  bookVolume: {
    width: 192,
    height: 256,
    backgroundColor: VOLUME_BG,
    borderLeftWidth: 8,
    borderLeftColor: VOLUME_SPINE,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    // Sombra pronunciada estilo livro em prateleira
    shadowColor: VOLUME_SPINE,
    shadowOffset: { width: 8, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  volumeLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 10,
    color: VOLUME_INK,
    letterSpacing: 4,
    opacity: 0.8,
  },
  globeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(213,227,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookFooter: {
    alignItems: 'center',
    gap: 4,
  },
  bookFooterTitle: {
    fontFamily: FONTS.headlineSm,
    fontSize: FONT_SIZES.headlineSm,
    color: VOLUME_INK,
    letterSpacing: 1,
  },
  bookFooterYear: {
    fontFamily: FONTS.labelStamp,
    fontSize: 10,
    color: VOLUME_INK,
    letterSpacing: 2,
    opacity: 0.6,
  },

  // Badge "CURRENT" inclinado -2 graus
  currentBadge: {
    marginTop: 20,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(123,152,135,0.4)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 4,
    transform: [{ rotate: '-2deg' }],
  },
  currentBadgeText: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelStamp,
    color: '#7b9887',
    letterSpacing: 2,
  },
  stampCounter: {
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.onSurfaceVariant,
  },

  // ── Estado aberto ────────────────────────────────────────────────────────
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

  // Faixa compacta do passaporte (120px) — ListHeaderComponent
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
  // Contador de selos no canto direito da faixa
  compactCount: {
    fontFamily: FONTS.labelStamp,
    fontSize: 28,
    color: COLORS.secondaryContainer,
    opacity: 0.6,
  },

  // Grid — padding e gap alinhados com stampSize = (screenWidth - 52) / 2
  list: {
    paddingHorizontal: 20,
    paddingBottom: 96,
  },
  row: {
    gap: 12,
    marginBottom: 8,
  },

  // FAB — lápis burgund
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
    ...SHADOW_STRONG,
  },
});
