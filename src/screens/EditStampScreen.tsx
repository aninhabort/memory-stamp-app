import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStamps } from '../hooks/useStamps';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
} from '../constants/theme';
import type { Stamp } from '../types';
import { StampForm, type StampFormData } from '../components/StampForm';

// EditStamp is registered in three different stacks (Passaporte, Coleção,
// Buscar). A standalone param-list type keeps the component independent of any
// specific stack and prevents incorrect navigation-prop inference.
type EditStampParamList = { EditStamp: { stamp: Stamp }; StampDetail: { stamp: Stamp } };
type Props = NativeStackScreenProps<EditStampParamList, 'EditStamp'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

// Background dot pattern generation
const BG_DOTS: { top: number; left: number }[] = [];
for (let row = 0; row < 18; row++) {
  for (let col = 0; col < 6; col++) {
    BG_DOTS.push({
      top:  row * 80 + (col % 2) * 40,
      left: col * (SCREEN_WIDTH / 5) + (row % 2) * 18,
    });
  }
}

/**
 * Screen for editing an existing stamp entry.
 * Provides the layout container and delegates form logic to StampForm component.
 */
export function EditStampScreen({ route, navigation }: Props) {
  const { stamp } = route.params;
  const { updateStamp } = useStamps();
  const insets = useSafeAreaInsets();

  const initialData: StampFormData = {
    title: stamp.title,
    place: stamp.place,
    country: stamp.country,
    date: stamp.date,
    note: stamp.note,
    photos: stamp.photos ?? [],
    category: stamp.category,
    color: stamp.color,
    icon: stamp.icon as StampFormData['icon'],
  };

  const handleSubmit = async (data: StampFormData) => {
    await updateStamp(stamp.id, data);
    // Navigate to StampDetail with the updated stamp data so the detail screen
    // reflects the edits immediately rather than showing stale route.params.
    navigation.navigate('StampDetail', { stamp: { ...stamp, ...data } });
  };

  const handleDiscard = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>

      {/* Background dot pattern */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {BG_DOTS.map((pos, i) => (
          <View key={i} style={[styles.bgDot, { top: pos.top, left: pos.left }]} />
        ))}
      </View>

      {/* Decorative corner element */}
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

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
              <Text style={styles.backText}>BACK</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>EDIT ENTRY</Text>
            <View style={styles.headerRight} />
          </View>

          <StampForm
            onSubmit={handleSubmit}
            onDiscard={handleDiscard}
            initialData={initialData}
            pressHint="Press firmly to update entry"
            actionLabel={['UPDATE', 'ENTRY']}
          />

          <View style={{ height: SPACING.stackLoose }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  bgDot: {
    position: 'absolute',
    width: 1.5,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: COLORS.onSurface,
    opacity: 0.10,
  },
  decorativeCorner: {
    position: 'absolute',
    bottom: 220,
    right: -12,
    opacity: 0.15,
    transform: [{ rotate: '12deg' }, { scale: 1.5 }],
    zIndex: 0,
  },
  decorativeBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  decorativeText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 12,
    color: COLORS.secondary,
    letterSpacing: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
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
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.headlineSm,
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  headerRight: {
    minWidth: 72,
  },
});
