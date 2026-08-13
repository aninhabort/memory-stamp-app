import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { AppDialog } from './AppDialog';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SHADOW_PAPER,
} from '../constants/theme';
import type { Stamp } from '../types';
import { formatDecoDate } from '../utils/stampUtils';
import { PhotoSelector } from './PhotoSelector';
import { CategoryPicker } from './CategoryPicker';
import { ColorPicker, PRESET_COLORS } from './ColorPicker';
import { usePhotoPermission } from '../hooks/usePhotoPermission';
import { useCameraPermission } from '../hooks/useCameraPermission';

const ICONS: React.ComponentProps<typeof Ionicons>['name'][] = [
  'globe-outline',          'musical-notes-outline', 'wine-outline',          'happy-outline',
  'home-outline',           'sunny-outline',         'people-outline',        'pizza-outline',
  'cafe-outline',           'compass-outline',       'boat-outline',          'airplane-outline',
  'film-outline',           'library-outline',       'color-palette-outline',
];

const COLOR_PALETTE = [
  '#4A90D9', '#9B59B6', '#E74C3C',
  '#27AE60', '#E67E22', '#1B2B4B',
];

export interface StampFormData {
  title: string;
  place: string;
  country?: string;
  date: string;
  note?: string;
  photos: string[];
  category: Stamp['category'];
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

interface StampFormProps {
  onSubmit: (data: StampFormData) => Promise<void>;
  onDiscard: () => void;
  initialData?: StampFormData;
  pressHint?: string;
  actionLabel?: [string, string];
  entryNumber?: number;
}

export function StampForm({
  onSubmit,
  onDiscard,
  initialData,
  pressHint = 'Press firmly to certify entry',
  actionLabel = ['STAMP', 'PAGE'],
  entryNumber,
}: StampFormProps) {
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const decoDate = useMemo(() => formatDecoDate(new Date()), []);

  const initialColorIsCustom = !!initialData && !PRESET_COLORS.includes(initialData.color);
  const initialIconIsCustom  = !!initialData && !ICONS.includes(initialData.icon);

  const [title,    setTitle]   = useState(initialData?.title    ?? '');
  const [place,    setPlace]   = useState(initialData?.place    ?? '');
  const [country,  setCountry] = useState(initialData?.country  ?? '');
  const [date,     setDate]    = useState(initialData?.date     ?? todayISO);
  const [note,     setNote]    = useState(initialData?.note     ?? '');
  const [photos,   setPhotos]  = useState<string[]>(initialData?.photos ?? []);
  const [photoScrollIndex, setPhotoScrollIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Stamp['category']>(initialData?.category ?? 'viagem');
  const [selectedColor,    setSelectedColor]    = useState(initialData?.color  ?? COLOR_PALETTE[0]);
  const [customColor,      setCustomColor]      = useState(initialColorIsCustom ? initialData!.color : '');
  const [isCustomColorMode, setIsCustomColorMode] = useState(initialColorIsCustom);
  const [selectedIcon,     setSelectedIcon]     = useState(initialIconIsCustom ? ICONS[0] : (initialData?.icon ?? ICONS[0]));
  const [customEmoji,      setCustomEmoji]      = useState(initialIconIsCustom ? initialData!.icon : '');
  const [isCustomEmojiMode, setIsCustomEmojiMode] = useState(initialIconIsCustom);
  const [isSaving, setIsSaving] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);

  const stampScaleAnim = useRef(new Animated.Value(1)).current;
  const sealOpacity    = useRef(new Animated.Value(0)).current;
  const sealScale      = useRef(new Animated.Value(0.85)).current;
  const [showSeal, setShowSeal] = useState(false);

  const { requestAccess: requestPhotoAccess, PermissionDialog: PhotoPermissionDialog } = usePhotoPermission();
  const { requestAccess: requestCameraAccess, PermissionDialog: CameraPermissionDialog } = useCameraPermission();

  const resetForm = () => {
    setTitle(''); setPlace(''); setCountry('');
    setDate(todayISO); setNote('');
    setPhotos([]); setPhotoScrollIndex(0);
    setSelectedCategory('viagem');
    setSelectedColor(COLOR_PALETTE[0]);
    setCustomColor(''); setIsCustomColorMode(false);
    setSelectedIcon(ICONS[0]);
    setCustomEmoji(''); setIsCustomEmojiMode(false);
  };

  const launchPicker = async (source: 'camera' | 'gallery') => {
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

  // Permission is requested here — lazily, only once the user has already
  // chosen "Camera" or "Gallery" from the action sheet below — never on
  // mount and never before this point.
  const pickPhoto = (source: 'camera' | 'gallery') => {
    if (photos.length >= 6) return;
    if (source === 'camera') {
      requestCameraAccess(() => launchPicker('camera'));
    } else {
      requestPhotoAccess(() => launchPicker('gallery'));
    }
  };

  const handlePhotoPress = () => {
    if (photos.length >= 6) return;
    Alert.alert('Add photo', 'Choose source:', [
      { text: 'Camera',  onPress: () => pickPhoto('camera')  },
      { text: 'Gallery', onPress: () => pickPhoto('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoScrollIndex(prev => Math.max(0, Math.min(prev, photos.length - 2)));
  };

  const handlePhotoScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(event.nativeEvent.contentOffset.x / 148);
    setPhotoScrollIndex(Math.max(0, Math.min(idx, photos.length - 1)));
  };

  // Press-in: stamp presses down
  const handleStampPressIn = () =>
    Animated.timing(stampScaleAnim, { toValue: 0.93, duration: 90, useNativeDriver: true }).start();

  // Press-out: stamp rebounds — overshoots then settles (tactile spring-back)
  const handleStampPressOut = () =>
    Animated.sequence([
      Animated.timing(stampScaleAnim, { toValue: 1.06, duration: 80,  useNativeDriver: true }),
      Animated.spring(stampScaleAnim,  { toValue: 1.0,  friction: 6, tension: 300, useNativeDriver: true }),
    ]).start();

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Required field', 'Please enter a title for the entry.'); return; }
    if (!place.trim()) { Alert.alert('Required field', 'Please enter the location.'); return; }
    if (isSaving) return;
    setIsSaving(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

      // New entries: play the certified seal animation before persisting
      if (!initialData) {
        sealOpacity.setValue(0);
        sealScale.setValue(0.85);
        setShowSeal(true);
        await new Promise<void>(resolve => {
          Animated.sequence([
            Animated.parallel([
              Animated.timing(sealOpacity, { toValue: 0.92, duration: 150, useNativeDriver: true }),
              Animated.spring(sealScale, { toValue: 1, friction: 7, tension: 180, useNativeDriver: true }),
            ]),
            Animated.delay(300),
            Animated.timing(sealOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
          ]).start(() => { setShowSeal(false); resolve(); });
        });
      }

      await onSubmit({
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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (!initialData) resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => setDiscardVisible(true);

  return (
    <>
      {/* ── Document card ───────────────────────────────────────────────────── */}
      <View style={styles.passportCard}>
        <View style={styles.cardInnerBorder} pointerEvents="none" />

        {/* Document header — date left, entry reference right */}
        <View style={styles.docHeaderRow}>
          <Text style={styles.decoDate}>{decoDate}</Text>
          <Text style={styles.entryRef}>
            {entryNumber !== undefined
              ? `ENTRY #${String(entryNumber).padStart(4, '0')}`
              : initialData ? 'REVISION' : 'ENTRY —'}
          </Text>
        </View>

        {/* ── Photo section ─────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>PHOTOGRAPHIC RECORD</Text>
        <PhotoSelector
          photos={photos}
          onAddPhoto={handlePhotoPress}
          onRemovePhoto={removePhoto}
          onScroll={handlePhotoScroll}
          activePhotoIndex={photoScrollIndex}
        />

        <View style={styles.cardDivider} />

        {/* ── Core fields ───────────────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>ENTRY TITLE</Text>
          <View style={styles.fieldRow}>
            <TextInput
              style={[styles.fieldInputLarge, styles.flex]}
              placeholder="Give this memory a name"
              placeholderTextColor={COLORS.outlineVariant}
              value={title}
              onChangeText={setTitle}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>LOCATION</Text>
          <View style={styles.fieldRow}>
            <TextInput
              style={[styles.fieldInputLarge, styles.flex]}
              placeholder="City, site, or landmark"
              placeholderTextColor={COLORS.outlineVariant}
              value={place}
              onChangeText={setPlace}
            />
            <Ionicons name="location-outline" size={21} color={COLORS.outline} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>COUNTRY / TERRITORY</Text>
          <View style={styles.fieldRow}>
            <TextInput
              style={[styles.fieldInputMono, styles.flex]}
              placeholder="Country or territory"
              placeholderTextColor={COLORS.outlineVariant}
              value={country}
              onChangeText={setCountry}
            />
            <Ionicons name="globe-outline" size={21} color={COLORS.outline} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>ENTRY DATE</Text>
          <View style={styles.fieldRow}>
            <TextInput
              style={[styles.fieldInputMono, styles.flex]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.outlineVariant}
              value={date}
              onChangeText={setDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <Ionicons name="calendar-outline" size={21} color={COLORS.outline} />
          </View>
        </View>

        <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
          <Text style={styles.fieldLabel}>NOTES</Text>
          <View style={[styles.fieldRow, { alignItems: 'flex-start' }]}>
            <TextInput
              style={[styles.fieldInputMono, styles.flex, styles.fieldInputNote]}
              placeholder="Write what should not be forgotten"
              placeholderTextColor={COLORS.outlineVariant}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Ionicons
              name="document-text-outline"
              size={21}
              color={COLORS.outline}
              style={styles.noteIcon}
            />
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* ── Classification ────────────────────────────────────────────────── */}
        <CategoryPicker
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <View style={styles.cardDivider} />

        {/* ── Color tag ─────────────────────────────────────────────────────── */}
        <ColorPicker
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          customColor={customColor}
          onCustomColorChange={setCustomColor}
          isCustomColorMode={isCustomColorMode}
          onToggleCustomMode={setIsCustomColorMode}
        />

        <View style={styles.cardDivider} />

        {/* ── Icon ──────────────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>ICON</Text>
        <View style={styles.iconGrid}>
          {[...ICONS, 'custom-emoji' as const].map((icon) => {
            const isCustom = icon === 'custom-emoji';
            const active   = isCustom
              ? isCustomEmojiMode
              : (!isCustomEmojiMode && selectedIcon === icon);

            return (
              <TouchableOpacity
                key={isCustom ? 'custom' : icon}
                style={[styles.iconCell, active && styles.iconCellActive]}
                onPress={() => {
                  if (isCustom) {
                    setIsCustomEmojiMode(true);
                  } else {
                    setSelectedIcon(icon as React.ComponentProps<typeof Ionicons>['name']);
                    setIsCustomEmojiMode(false);
                  }
                }}
                activeOpacity={0.7}
              >
                {isCustom ? (
                  isCustomEmojiMode && customEmoji ? (
                    <Text style={styles.customEmojiDisplay}>{customEmoji}</Text>
                  ) : (
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color={active ? COLORS.secondary : COLORS.onSurfaceVariant}
                    />
                  )
                ) : (
                  <Ionicons
                    name={icon as React.ComponentProps<typeof Ionicons>['name']}
                    size={20}
                    color={active ? COLORS.secondary : COLORS.onSurfaceVariant}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {isCustomEmojiMode && (
          <View style={styles.emojiInputContainer}>
            <TextInput
              style={styles.emojiInput}
              placeholder="Type an emoji..."
              placeholderTextColor={COLORS.outlineVariant}
              value={customEmoji}
              onChangeText={setCustomEmoji}
              maxLength={2}
              autoFocus
            />
          </View>
        )}
      </View>

      {/* ── Certification line ───────────────────────────────────────────────── */}
      <View style={styles.certificationRow}>
        <View style={styles.certLine} />
        <View style={styles.certCenter}>
          <Text style={styles.certLabel}>CERTIFY ENTRY</Text>
          <Text style={styles.certSub}>DEPT. OF PERSONAL ARCHIVES</Text>
        </View>
        <View style={styles.certLine} />
      </View>

      {/* ── Stamp action ─────────────────────────────────────────────────────── */}
      <View style={styles.actionArea}>

        <Text style={styles.pressHint}>{pressHint}</Text>

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
            {/* Outer certification ring */}
            <View style={styles.stampInnerRing} pointerEvents="none" />
            <Ionicons
              name={isSaving ? 'checkmark-circle' : 'albums'}
              size={36}
              color={COLORS.white}
            />
            <Text style={styles.stampBtnLabel}>{actionLabel[0]}</Text>
            <Text style={styles.stampBtnSublabel}>{actionLabel[1]}</Text>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDiscard} activeOpacity={0.7} style={styles.discardBtn}>
          <Text style={styles.discardLink}>Discard Journal Entry</Text>
        </TouchableOpacity>

      </View>

      {/* ── Certified seal overlay ─────────────────────────────────────────────── */}
      <Modal visible={showSeal} transparent statusBarTranslucent animationType="none">
        <Animated.View style={[styles.sealOverlay, { opacity: sealOpacity }]}>
          <Animated.View
            style={[styles.sealStamp, { transform: [{ rotate: '-9deg' }, { scale: sealScale }] }]}
          >
            <View style={styles.sealInner} pointerEvents="none" />
            <Ionicons name="checkmark" size={22} color={COLORS.secondary} style={{ marginBottom: 4 }} />
            <Text style={styles.sealTitle}>ARCHIVED</Text>
            <Text style={styles.sealSub}>MEMORY RECORDED</Text>
            <Text style={styles.sealDept}>DEPT. OF PERSONAL ARCHIVES</Text>
          </Animated.View>
        </Animated.View>
      </Modal>

      <AppDialog
        visible={discardVisible}
        onClose={() => setDiscardVisible(false)}
        label="DISCARD CHANGES"
        title="Discard entry?"
        message="All changes will be lost."
        actions={[
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => { resetForm(); onDiscard(); },
          },
        ]}
      />

      {PhotoPermissionDialog}
      {CameraPermissionDialog}
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // ── Document card ────────────────────────────────────────────────────────────
  passportCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 8,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(197,198,206,0.3)',
    zIndex: 1,
    ...SHADOW_PAPER,
  },
  cardInnerBorder: {
    position: 'absolute',
    top: 8, left: 8, right: 8, bottom: 8,
    borderWidth: 1, borderRadius: 4,
    borderColor: 'rgba(197,198,206,0.3)',
  },
  // Document header row: decoDate on left, entry ref on right
  docHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  decoDate: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.onSurfaceVariant,
    opacity: 0.5,
    letterSpacing: 1,
  },
  entryRef: {
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
    letterSpacing: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.4,
    marginVertical: 18,
  },
  sectionLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // ── Form fields (ledger-line style) ──────────────────────────────────────────
  // Tighter vertical rhythm — 16 between groups, 6 label-to-field gap
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: 13,
    color: COLORS.outline,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(29,28,21,0.25)',
  },
  fieldInputLarge: {
    fontFamily: FONTS.headlineSm,
    fontSize: 17,
    color: COLORS.onSurface,
    paddingVertical: 9,
    paddingRight: 4,
    backgroundColor: 'transparent',
  },
  fieldInputMono: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 17,
    color: COLORS.onSurface,
    paddingVertical: 9,
    paddingRight: 4,
    backgroundColor: 'transparent',
  },
  fieldInputNote: {
    minHeight: 76,
    paddingTop: 9,
  },
  // Icon pinned to the top of the notes field (not vertically centered)
  noteIcon: {
    marginTop: 12,
  },

  // ── Icon grid ─────────────────────────────────────────────────────────────────
  // Cells reduced from 70×70 to 56×56 — lighter visual weight, same touch target
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    rowGap: 8,
  },
  iconCell: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    // Lighter border for unselected cells — they recede, selected cell advances
    borderWidth: 1,
    borderColor: `${COLORS.outlineVariant}90`,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  iconCellActive: {
    backgroundColor: `${COLORS.secondary}1A`,
    borderColor: COLORS.secondary,
    borderWidth: 1.5,
  },
  customEmojiDisplay: {
    fontSize: 20,
  },
  emojiInputContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.outlineVariant}80`,
  },
  emojiInput: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 24,
    color: COLORS.onSurface,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },

  // ── Certification divider ─────────────────────────────────────────────────────
  certificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 36,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  certLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.5,
  },
  certCenter: {
    alignItems: 'center',
    gap: 3,
  },
  certLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.8,
    opacity: 0.65,
  },
  certSub: {
    fontFamily: FONTS.labelStamp,
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
    opacity: 0.4,
  },

  // ── Stamp action area ─────────────────────────────────────────────────────────
  actionArea: {
    alignItems: 'center',
    gap: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pressHint: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 13,
    color: COLORS.outline,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  stampBtn: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: COLORS.secondary,
    // Outer ring: suggests a wax seal or official stamp border
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 14,
  },
  // Inner certification ring — double-border feel of an official seal
  stampInnerRing: {
    position: 'absolute',
    top: 8, left: 8, right: 8, bottom: 8,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  stampBtnSaving: {
    opacity: 0.75,
  },
  stampBtnLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 15,
    color: COLORS.white,
    letterSpacing: 2,
  },
  stampBtnSublabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    color: COLORS.white,
    opacity: 0.7,
    letterSpacing: 1.5,
  },
  discardBtn: {
    paddingVertical: 12,
  },
  discardLink: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.outline,
    textDecorationLine: 'underline',
    letterSpacing: 0.5,
  },

  // ── Certified seal overlay ────────────────────────────────────────────────────
  sealOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5,21,43,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealStamp: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.secondary,
    paddingHorizontal: 40,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 4,
  },
  sealInner: {
    position: 'absolute',
    top: 6, left: 6, right: 6, bottom: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${COLORS.secondary}50`,
  },
  sealTitle: {
    fontFamily: FONTS.labelStamp,
    fontSize: 24,
    color: COLORS.secondary,
    letterSpacing: 6,
  },
  sealSub: {
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    color: COLORS.secondary,
    letterSpacing: 2.5,
    opacity: 0.8,
  },
  sealDept: {
    fontFamily: FONTS.labelStamp,
    fontSize: 10,
    color: COLORS.secondary,
    letterSpacing: 1.5,
    opacity: 0.55,
    marginTop: 2,
  },
});
