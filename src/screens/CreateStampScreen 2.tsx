import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
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
import type { RootTabParamList } from '../navigation/types';
import type { Stamp } from '../types';
import { formatDecoDate } from '../utils/stampUtils';

type Props = BottomTabScreenProps<RootTabParamList, 'Criar'>;

// ── Constantes ────────────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH   = SCREEN_WIDTH - 40;   // margem 20 × 2
const CARD_INNER   = CARD_WIDTH - 64;     // padding 32 × 2 dentro do card
const MAX_PHOTOS   = 6;

// TODAY_ISO and DECO_DATE are now computed per component-mount inside the
// component (via useState lazy init / useMemo) so they always reflect the
// actual day the screen opens, not the app-launch time.

// Grid de ícones em 4 colunas (3 gaps de 8px entre elas)
const ICON_CELL = Math.floor((CARD_INNER - 8 * 3) / 4);

// ── Categorias ────────────────────────────────────────────────────────────────

const CATEGORIES: {
  key: Stamp['category'];
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { key: 'viagem',      label: 'Viagem',      icon: 'airplane-outline' },
  { key: 'show',        label: 'Show',        icon: 'musical-notes-outline' },
  { key: 'restaurante', label: 'Restaurante', icon: 'restaurant-outline' },
  { key: 'evento',      label: 'Evento',      icon: 'calendar-outline' },
  { key: 'outro',       label: 'Outro',       icon: 'star-outline' },
];

const COLOR_PALETTE = [
  '#4A90D9', '#9B59B6', '#E74C3C',
  '#27AE60', '#E67E22', '#1B2B4B',
];

// 16 ícones em grid 4×4 (sem sobras)
const ICONS: React.ComponentProps<typeof Ionicons>['name'][] = [
  'globe-outline',         'flag-outline',          'musical-notes-outline', 'wine-outline',
  'happy-outline',         'home-outline',          'sunny-outline',         'people-outline',
  'pizza-outline',         'cafe-outline',          'compass-outline',       'boat-outline',
  'airplane-outline',      'film-outline',          'library-outline',       'color-palette-outline',
];

// ── Pontos de textura de fundo ────────────────────────────────────────────────

const BG_DOTS: { top: number; left: number }[] = [];
for (let row = 0; row < 18; row++) {
  for (let col = 0; col < 6; col++) {
    BG_DOTS.push({
      top:  row * 80 + (col % 2) * 40,
      left: col * (SCREEN_WIDTH / 5) + (row % 2) * 18,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export function CreateStampScreen({ navigation }: Props) {
  const { addStamp } = useStamps();
  const insets = useSafeAreaInsets();

  // Computed once per mount so they always reflect the day the screen opens.
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const decoDate = useMemo(() => formatDecoDate(new Date()), []);

  // ── Estado ───────────────────────────────────────────────────────────────
  const [title,    setTitle]   = useState('');
  const [place,    setPlace]   = useState('');
  const [country,  setCountry] = useState('');
  const [date,     setDate]    = useState(todayISO);
  const [note,     setNote]    = useState('');
  const [photos,   setPhotos]  = useState<string[]>([]);
  const [photoScrollIndex, setPhotoScrollIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Stamp['category']>('viagem');
  const [selectedColor,    setSelectedColor]    = useState(COLOR_PALETTE[0]);
  const [selectedIcon,     setSelectedIcon]     = useState(ICONS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const stampScaleAnim = useRef(new Animated.Value(1)).current;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const resetForm = () => {
    setTitle(''); setPlace(''); setCountry('');
    setDate(todayISO); setNote('');
    setPhotos([]); setPhotoScrollIndex(0);
    setSelectedCategory('viagem');
    setSelectedColor(COLOR_PALETTE[0]);
    setSelectedIcon(ICONS[0]);
  };

  // ── Fotos ─────────────────────────────────────────────────────────────────

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    if (photos.length >= MAX_PHOTOS) return;
    const permResult = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert('Permissão necessária', 'Habilite o acesso nas Configurações do dispositivo.');
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3] as [number, number],
      quality: 0.8,
    };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handlePhotoPress = () => {
    if (photos.length >= MAX_PHOTOS) return;
    Alert.alert('Adicionar foto', 'Escolha a fonte:', [
      { text: 'Câmera',   onPress: () => pickPhoto('camera') },
      { text: 'Galeria',  onPress: () => pickPhoto('gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoScrollIndex(prev => Math.max(0, Math.min(prev, photos.length - 2)));
  };

  // Atualiza o dot ativo com base no offset do scroll horizontal das fotos
  const handlePhotoScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(event.nativeEvent.contentOffset.x / 148); // 140 + 8 de gap
    setPhotoScrollIndex(Math.max(0, Math.min(idx, photos.length - 1)));
  };

  // ── Botão STAMP ───────────────────────────────────────────────────────────

  const handleStampPressIn = () =>
    Animated.timing(stampScaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }).start();
  const handleStampPressOut = () =>
    Animated.timing(stampScaleAnim, { toValue: 1.0,  duration: 80, useNativeDriver: true }).start();

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Campo obrigatório', 'Insira um título para a entrada.'); return; }
    if (!place.trim()) { Alert.alert('Campo obrigatório', 'Insira a localização.'); return; }
    if (isSaving) return;
    setIsSaving(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await addStamp({
        title:    title.trim(),
        place:    place.trim(),
        country:  country.trim() || undefined,
        date:     date || todayISO,
        category: selectedCategory,
        color:    selectedColor,
        icon:     selectedIcon,
        note:     note.trim() || undefined,
        photos,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
      navigation.navigate('Passaporte');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert('Descartar entrada?', 'As alterações serão perdidas.', [
      { text: 'Continuar editando', style: 'cancel' },
      {
        text: 'Descartar', style: 'destructive',
        onPress: () => { resetForm(); navigation.navigate('Passaporte'); },
      },
    ]);
  };

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>

      {/* Padrão de pontos de fundo */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {BG_DOTS.map((pos, i) => (
          <View key={i} style={[styles.bgDot, { top: pos.top, left: pos.left }]} />
        ))}
      </View>

      {/* Elemento decorativo de canto */}
      <View style={styles.decorativeCorner} pointerEvents="none">
        <View style={styles.decorativeBox}>
          <Text style={styles.decorativeText}>CERTIFIED</Text>
          <Text style={[styles.decorativeText, { fontSize: 8, marginTop: 3, letterSpacing: 1 }]}>
            ARCHIVAL DEPT.
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ──────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.navigate('Passaporte')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
              <Text style={styles.backText}>BACK</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>NEW ENTRY</Text>
            <View style={styles.headerRight} />
          </View>

          {/* ── Card "Passport Page" ────────────────────────────────────── */}
          <View style={styles.passportCard}>
            <View style={styles.cardInnerBorder} pointerEvents="none" />

            {/* Data decorativa — canto superior direito */}
            <Text style={styles.decoDate}>{decoDate}</Text>

            {/* ── Secção de fotos ──────────────────────────────────────── */}
            {photos.length === 0 ? (
              // Estado sem fotos: botão compacto de 72px
              <TouchableOpacity
                style={styles.photoEmpty}
                onPress={handlePhotoPress}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={24} color={COLORS.outline} />
                <Text style={styles.photoEmptyText}>Adicionar evidência fotográfica</Text>
              </TouchableOpacity>
            ) : (
              // Estado com fotos: miniaturas horizontais + dots
              <View style={styles.photoHasSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  onScroll={handlePhotoScroll}
                  scrollEventThrottle={16}
                  style={styles.photoScroll}
                >
                  {photos.map((uri, i) => (
                    <View key={i} style={styles.photoThumb}>
                      <Image source={{ uri }} style={styles.photoThumbImg} resizeMode="cover" />
                      <TouchableOpacity
                        style={styles.photoThumbRemove}
                        onPress={() => removePhoto(i)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="close" size={12} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {/* Card de adicionar mais fotos */}
                  {photos.length < MAX_PHOTOS && (
                    <TouchableOpacity
                      style={styles.photoAddCard}
                      onPress={handlePhotoPress}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={20} color={COLORS.outline} />
                      <Text style={styles.photoAddCardText}>+ foto</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>

                {/* Dots + contador */}
                <View style={styles.photoDotRow}>
                  <View style={styles.photoDots}>
                    {photos.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.photoDot,
                          {
                            backgroundColor: i === photoScrollIndex
                              ? COLORS.secondary
                              : COLORS.outlineVariant,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.photoCounter}>{photos.length}/{MAX_PHOTOS} fotos</Text>
                </View>
              </View>
            )}

            <View style={styles.cardDivider} />

            {/* ── ENTRY TITLE ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ENTRY TITLE</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={[styles.fieldInputLarge, styles.flex]}
                  placeholder="Nome desta memória..."
                  placeholderTextColor={COLORS.outlineVariant}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            {/* ── LOCALIZAÇÃO ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>LOCALIZAÇÃO</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={[styles.fieldInputLarge, styles.flex]}
                  placeholder="Cidade, lugar..."
                  placeholderTextColor={COLORS.outlineVariant}
                  value={place}
                  onChangeText={setPlace}
                />
                <Ionicons name="location-outline" size={16} color={COLORS.outline} />
              </View>
            </View>

            {/* ── PAÍS / TERRITÓRIO ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PAÍS / TERRITÓRIO</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={[styles.fieldInputMono, styles.flex]}
                  placeholder="País..."
                  placeholderTextColor={COLORS.outlineVariant}
                  value={country}
                  onChangeText={setCountry}
                />
                <Ionicons name="globe-outline" size={16} color={COLORS.outline} />
              </View>
            </View>

            {/* ── DATA DE ENTRADA ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>DATA DE ENTRADA</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={[styles.fieldInputMono, styles.flex]}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={COLORS.outlineVariant}
                  value={date}
                  onChangeText={setDate}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />
                <Ionicons name="calendar-outline" size={16} color={COLORS.outline} />
              </View>
            </View>

            {/* ── OBSERVAÇÕES ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>OBSERVAÇÕES DE CAMPO</Text>
              <View style={[styles.fieldRow, { alignItems: 'flex-start' }]}>
                <TextInput
                  style={[styles.fieldInputMono, styles.flex, styles.fieldInputNote]}
                  placeholder="Descreva a memória desta entrada..."
                  placeholderTextColor={COLORS.outlineVariant}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color={COLORS.outline}
                  style={{ marginTop: 14 }}
                />
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* ── CLASSIFICATION — chips ── */}
            <Text style={styles.sectionLabel}>CLASSIFICATION</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {CATEGORIES.map(({ key, label, icon }) => {
                const active = selectedCategory === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedCategory(key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={icon}
                      size={13}
                      color={active ? COLORS.white : COLORS.onSurfaceVariant}
                    />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.cardDivider} />

            {/* ── COLOR TAG ── */}
            <Text style={styles.sectionLabel}>COLOR TAG</Text>
            <View style={styles.colorRow}>
              {COLOR_PALETTE.map((color) => {
                const active = selectedColor === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      active && styles.colorCircleActive,
                    ]}
                    onPress={() => setSelectedColor(color)}
                    activeOpacity={0.8}
                  />
                );
              })}
            </View>

            <View style={styles.cardDivider} />

            {/* ── ÍCONE — grid 4 colunas ── */}
            <Text style={styles.sectionLabel}>ÍCONE</Text>
            <View style={styles.iconGrid}>
              {ICONS.map((icon) => {
                const active = selectedIcon === icon;
                return (
                  <TouchableOpacity
                    key={icon}
                    style={[styles.iconCell, active && styles.iconCellActive]}
                    onPress={() => setSelectedIcon(icon)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={icon}
                      size={22}
                      color={active ? COLORS.secondary : COLORS.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

          </View>

          {/* ── Área de ação ───────────────────────────────────────────────── */}
          <View style={styles.actionArea}>
            <Text style={styles.pressHint}>Press firmly to certify entry</Text>

            <TouchableOpacity
              onPressIn={handleStampPressIn}
              onPressOut={handleStampPressOut}
              onPress={handleSave}
              activeOpacity={1}
              disabled={isSaving}
            >
              <Animated.View
                style={[
                  styles.stampBtn,
                  { transform: [{ scale: stampScaleAnim }] },
                  isSaving && styles.stampBtnSaving,
                ]}
              >
                <Ionicons
                  name={isSaving ? 'checkmark-circle' : 'albums'}
                  size={40}
                  color={COLORS.white}
                />
                <Text style={styles.stampBtnLabel}>STAMP</Text>
                <Text style={styles.stampBtnSublabel}>PAGE</Text>
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDiscard} activeOpacity={0.7}>
              <Text style={styles.discardLink}>Discard Journal Entry</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: SPACING.stackLoose }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  flex:   { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // Pontos de textura de fundo
  bgDot: {
    position: 'absolute',
    width: 1.5, height: 1.5,
    borderRadius: 1,
    backgroundColor: COLORS.onSurface,
    opacity: 0.10,
  },

  // Elemento decorativo de canto
  decorativeCorner: {
    position: 'absolute',
    bottom: 220, right: -12,
    opacity: 0.15,
    transform: [{ rotate: '12deg' }, { scale: 1.5 }],
    zIndex: 0,
  },
  decorativeBox: {
    borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: COLORS.secondary,
    paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'center',
  },
  decorativeText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 12, color: COLORS.secondary, letterSpacing: 2,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, minWidth: 72,
  },
  backText: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.primary, letterSpacing: 1.5,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.headlineSm, fontSize: 16,
    color: COLORS.primary, textAlign: 'center', letterSpacing: 1,
  },
  headerRight: { minWidth: 72 },

  // Card passaporte
  passportCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 8, padding: 32,
    borderWidth: 1, borderColor: 'rgba(197,198,206,0.3)',
    zIndex: 1,
    ...SHADOW_PAPER,
  },
  cardInnerBorder: {
    position: 'absolute',
    top: 8, left: 8, right: 8, bottom: 8,
    borderWidth: 1, borderRadius: 4,
    borderColor: 'rgba(197,198,206,0.3)',
  },
  decoDate: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.onSurfaceVariant,
    opacity: 0.5, textAlign: 'right',
    letterSpacing: 1, marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.4,
    marginVertical: 20,
  },
  sectionLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: 9, color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5, marginBottom: 12,
  },

  // ── Secção de fotos — estado vazio ──
  photoEmpty: {
    height: 72,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainer,
    marginHorizontal: -32,
    marginBottom: 4,
  },
  photoEmptyText: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.outline, letterSpacing: 1,
  },

  // ── Secção de fotos — com fotos ──
  photoHasSection: {
    marginBottom: 4,
  },
  photoScroll: {
    marginBottom: 10,
  },
  // Miniatura individual: 140 × 110px
  photoThumb: {
    width: 140, height: 110,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
  },
  photoThumbImg: {
    width: 140, height: 110,
  },
  photoThumbRemove: {
    position: 'absolute', top: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  // Card de adicionar mais fotos: 80 × 110px
  photoAddCard: {
    width: 80, height: 110,
    borderRadius: 8,
    borderWidth: 1, borderStyle: 'dashed',
    borderColor: COLORS.outline,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
    gap: 4,
  },
  photoAddCardText: {
    fontFamily: FONTS.labelCaps,
    fontSize: 10, color: COLORS.outline, letterSpacing: 0.5,
  },
  // Row de dots + contador
  photoDotRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 2,
  },
  photoDots: {
    flexDirection: 'row', gap: 5, alignItems: 'center',
  },
  photoDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  photoCounter: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.secondary, letterSpacing: 0.5,
  },

  // Campos ledger (sem caixa, apenas linha inferior)
  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: 9, color: COLORS.outline,
    letterSpacing: 1.5, marginBottom: 4,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(29,28,21,0.35)',
  },
  fieldInputLarge: {
    fontFamily: FONTS.headlineSm,
    fontSize: FONT_SIZES.bodyLg,
    color: COLORS.onSurface,
    paddingVertical: 10, paddingRight: 4,
    backgroundColor: 'transparent',
  },
  fieldInputMono: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.labelStamp,
    color: COLORS.onSurface,
    paddingVertical: 10, paddingRight: 4,
    backgroundColor: 'transparent',
  },
  fieldInputNote: {
    minHeight: 80, paddingTop: 10,
  },

  // Chips de categoria
  chipsRow: { gap: 8, paddingBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  chipActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  chipText: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.onSurfaceVariant, letterSpacing: 0.5,
  },
  chipTextActive: { color: COLORS.white },

  // Seletor de cor
  colorRow: {
    flexDirection: 'row', gap: 12, paddingVertical: 4,
  },
  colorCircle: {
    width: 36, height: 36, borderRadius: 18,
    ...SHADOW_PAPER,
  },
  colorCircleActive: {
    borderWidth: 3, borderColor: COLORS.onSurface,
    transform: [{ scale: 1.15 }],
  },

  // Grid de ícones (4 colunas)
  iconGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  iconCell: {
    width: ICON_CELL, height: ICON_CELL,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1, borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  iconCellActive: {
    backgroundColor: `${COLORS.secondary}22`,
    borderColor: COLORS.secondary, borderWidth: 1.5,
  },

  // Área de ação
  actionArea: {
    alignItems: 'center', marginTop: 32, gap: 16,
  },
  pressHint: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.outline, fontStyle: 'italic', letterSpacing: 1,
  },
  stampBtn: {
    width: 128, height: 128, borderRadius: 64,
    backgroundColor: COLORS.secondary,
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', gap: 2,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 14,
  },
  stampBtnSaving: { opacity: 0.75 },
  stampBtnLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 12, color: COLORS.white, letterSpacing: 2,
  },
  stampBtnSublabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 10, color: COLORS.white, opacity: 0.7, letterSpacing: 2,
  },
  discardLink: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.outline,
    textDecorationLine: 'underline', letterSpacing: 0.5,
  },
});
