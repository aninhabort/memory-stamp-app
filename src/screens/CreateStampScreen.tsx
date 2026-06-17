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
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStamps } from '../hooks/useStamps';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
} from '../constants/theme';
import type { RootTabParamList } from '../navigation/types';
import { StampForm, type StampFormData } from '../components/StampForm';

type Props = BottomTabScreenProps<RootTabParamList, 'Create'>;

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
 * Screen for creating a new stamp entry.
 * Provides the layout container and delegates form logic to StampForm component.
 */
export function CreateStampScreen({ navigation }: Props) {
  const { addStamp } = useStamps();
  const insets = useSafeAreaInsets();

  const handleSubmit = async (data: StampFormData) => {
    await addStamp(data);
    // Land on PassportHome (not whatever screen was last open in that stack)
    // with autoOpen so the newly created stamp is immediately visible.
    navigation.navigate('Passport', { screen: 'PassportHome', params: { autoOpen: true } });
  };

  const handleDiscard = () => {
    navigation.navigate('Passport');
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
              onPress={() => navigation.navigate('Passport')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
              <Text style={styles.backText}>BACK</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>NEW ENTRY</Text>
            <View style={styles.headerRight} />
          </View>

          <StampForm onSubmit={handleSubmit} onDiscard={handleDiscard} />

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
