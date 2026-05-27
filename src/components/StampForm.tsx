import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
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
import { ColorPicker } from './ColorPicker';

const ICON_GAP = 10;

const COLOR_PALETTE = [
  '#4A90D9', '#9B59B6', '#E74C3C',
  '#27AE60', '#E67E22', '#1B2B4B',
];

const ICONS: React.ComponentProps<typeof Ionicons>['name'][] = [
  'globe-outline',         'musical-notes-outline', 'wine-outline',          'happy-outline',
  'home-outline',          'sunny-outline',         'people-outline',        'pizza-outline',
  'cafe-outline',          'compass-outline',       'boat-outline',          'airplane-outline',
  'film-outline',          'library-outline',       'color-palette-outline',
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
}

/**
 * Form component for creating a new stamp entry.
 * Handles all form state, photo selection, and user input.
 */
export function StampForm({ onSubmit, onDiscard }: StampFormProps) {
  // Computed once per mount so they always reflect the day the form opens.
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const decoDate = useMemo(() => formatDecoDate(new Date()), []);

  const [title,    setTitle]   = useState('');
  const [place,    setPlace]   = useState('');
  const [country,  setCountry] = useState('');
  const [date,     setDate]    = useState(todayISO);
  const [note,     setNote]    = useState('');
  const [photos,   setPhotos]  = useState<string[]>([]);
  const [photoScrollIndex, setPhotoScrollIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Stamp['category']>('viagem');
  const [selectedColor,    setSelectedColor]    = useState(COLOR_PALETTE[0]);
  const [customColor,      setCustomColor]      = useState('');
  const [isCustomColorMode, setIsCustomColorMode] = useState(false);
  const [selectedIcon,     setSelectedIcon]     = useState(ICONS[0]);
  const [customEmoji,      setCustomEmoji]      = useState('');
  const [isCustomEmojiMode, setIsCustomEmojiMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const stampScaleAnim = useRef(new Animated.Value(1)).current;

  const resetForm = () => {
    setTitle(''); setPlace(''); setCountry('');
    setDate(todayISO); setNote('');
    setPhotos([]); setPhotoScrollIndex(0);
    setSelectedCategory('viagem');
    setSelectedColor(COLOR_PALETTE[0]);
    setCustomColor('');
    setIsCustomColorMode(false);
    setSelectedIcon(ICONS[0]);
    setCustomEmoji('');
    setIsCustomEmojiMode(false);
  };

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    if (photos.length >= 6) return;
    const permResult = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert('Permission required', 'Please enable access in device Settings.');
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
    if (photos.length >= 6) return;
    Alert.alert('Add photo', 'Choose source:', [
      { text: 'Camera',   onPress: () => pickPhoto('camera') },
      { text: 'Gallery',  onPress: () => pickPhoto('gallery') },
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

  const handleStampPressIn = () =>
    Animated.timing(stampScaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }).start();
  const handleStampPressOut = () =>
    Animated.timing(stampScaleAnim, { toValue: 1.0,  duration: 80, useNativeDriver: true }).start();

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Required field', 'Please enter a title for the entry.'); return; }
    if (!place.trim()) { Alert.alert('Required field', 'Please enter the location.'); return; }
    if (isSaving) return;
    setIsSaving(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert('Discard entry?', 'All changes will be lost.', [
      { text: 'Continue editing', style: 'cancel' },
      {
        text: 'Discard', style: 'destructive',
        onPress: () => { resetForm(); onDiscard(); },
      },
    ]);
  };

  return (
    <>
      <View style={styles.passportCard}>
        <View style={styles.cardInnerBorder} pointerEvents="none" />

        <Text style={styles.decoDate}>{decoDate}</Text>

        <PhotoSelector
          photos={photos}
          onAddPhoto={handlePhotoPress}
          onRemovePhoto={removePhoto}
          onScroll={handlePhotoScroll}
          activePhotoIndex={photoScrollIndex}
        />

        <View style={styles.cardDivider} />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>ENTRY TITLE</Text>
          <View style={styles.fieldRow}>
            <TextInput
              style={[styles.fieldInputLarge, styles.flex]}
              placeholder="Name of this memory..."
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
              placeholder="City, place..."
              placeholderTextColor={COLORS.outlineVariant}
              value={place}
              onChangeText={setPlace}
            />
            <Ionicons name="location-outline" size={16} color={COLORS.outline} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>COUNTRY / TERRITORY</Text>
          <View style={styles.fieldRow}>
            <TextInput
              style={[styles.fieldInputMono, styles.flex]}
              placeholder="Country..."
              placeholderTextColor={COLORS.outlineVariant}
              value={country}
              onChangeText={setCountry}
            />
            <Ionicons name="globe-outline" size={16} color={COLORS.outline} />
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
            <Ionicons name="calendar-outline" size={16} color={COLORS.outline} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>FIELD NOTES</Text>
          <View style={[styles.fieldRow, { alignItems: 'flex-start' }]}>
            <TextInput
              style={[styles.fieldInputMono, styles.flex, styles.fieldInputNote]}
              placeholder="Describe the memory of this entry..."
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

        <CategoryPicker
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <View style={styles.cardDivider} />

        <ColorPicker
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          customColor={customColor}
          onCustomColorChange={setCustomColor}
          isCustomColorMode={isCustomColorMode}
          onToggleCustomMode={setIsCustomColorMode}
        />

        <View style={styles.cardDivider} />

        <Text style={styles.sectionLabel}>ICON</Text>
        <View style={styles.iconGrid}>
          {[...ICONS, 'custom-emoji' as const].map((icon) => {
            const isCustom = icon === 'custom-emoji';
            const active = isCustom ? isCustomEmojiMode : (!isCustomEmojiMode && selectedIcon === icon);

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
                      size={22}
                      color={active ? COLORS.secondary : COLORS.onSurfaceVariant}
                    />
                  )
                ) : (
                  <Ionicons
                    name={icon as React.ComponentProps<typeof Ionicons>['name']}
                    size={22}
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
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Passport card
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

  // Form fields (ledger-style with bottom border only)
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

  // Icon grid
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    gap: ICON_GAP,
  },
  iconCell: {
    width: 70, height: 70,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1, borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  iconCellActive: {
    backgroundColor: `${COLORS.secondary}22`,
    borderColor: COLORS.secondary, borderWidth: 1.5,
  },
  customEmojiDisplay: {
    fontSize: 22,
  },
  emojiInputContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
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

  // Action area
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
