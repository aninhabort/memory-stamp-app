import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, RADIUS, SHADOW_PAPER } from '../constants/theme';

const PRESET_COLORS = [
  '#4A90D9', '#9B59B6', '#E74C3C',
  '#27AE60', '#E67E22', '#1B2B4B',
  '#FF69B4', '#00CED1', '#FFD700',
  '#FF6347', '#32CD32', '#BA55D3',
];

export interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  customColor: string;
  onCustomColorChange: (color: string) => void;
  isCustomColorMode: boolean;
  onToggleCustomMode: (isCustom: boolean) => void;
}

export function ColorPicker({
  selectedColor,
  onSelectColor,
  customColor,
  onCustomColorChange,
  isCustomColorMode,
  onToggleCustomMode,
}: ColorPickerProps) {
  const handleCustomColorChange = (text: string) => {
    onCustomColorChange(text);
    // Auto-apply valid hex colors
    if (text.match(/^#[0-9A-Fa-f]{6}$/)) {
      onSelectColor(text);
    }
  };

  return (
    <View>
      <Text style={styles.sectionLabel}>COLOR TAG</Text>
      <View style={styles.colorRow}>
        {PRESET_COLORS.map((color) => {
          const active = !isCustomColorMode && selectedColor === color;
          return (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorCircle,
                { backgroundColor: color },
                active && styles.colorCircleActive,
              ]}
              onPress={() => {
                onSelectColor(color);
                onToggleCustomMode(false);
              }}
              activeOpacity={0.8}
            />
          );
        })}
        <TouchableOpacity
          style={[
            styles.colorCircle,
            styles.customColorButton,
            isCustomColorMode && styles.colorCircleActive,
            isCustomColorMode && customColor && { backgroundColor: customColor },
          ]}
          onPress={() => onToggleCustomMode(true)}
          activeOpacity={0.8}
        >
          {!isCustomColorMode || !customColor ? (
            <Ionicons name="add-circle-outline" size={20} color={COLORS.onSurfaceVariant} />
          ) : null}
        </TouchableOpacity>
      </View>

      {isCustomColorMode && (
        <View style={styles.customColorInputContainer}>
          <TextInput
            style={styles.customColorInput}
            placeholder="#HEX color (e.g., #FF5733)"
            placeholderTextColor={COLORS.outlineVariant}
            value={customColor}
            onChangeText={handleCustomColorChange}
            maxLength={7}
            autoCapitalize="characters"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    ...SHADOW_PAPER,
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: COLORS.onSurface,
    transform: [{ scale: 1.15 }],
  },
  customColorButton: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customColorInputContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
  },
  customColorInput: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 14,
    color: COLORS.onSurface,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
});
