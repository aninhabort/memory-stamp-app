import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Stamp } from '../types';
import { COLORS, FONTS, FONT_SIZES, RADIUS } from '../constants/theme';

export interface Category {
  key: Stamp['category'];
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const CATEGORIES: Category[] = [
  { key: 'viagem', label: 'Travel', icon: 'airplane-outline' },
  { key: 'show', label: 'Show', icon: 'musical-notes-outline' },
  { key: 'restaurante', label: 'Restaurant', icon: 'restaurant-outline' },
  { key: 'evento', label: 'Event', icon: 'calendar-outline' },
  { key: 'outro', label: 'Other', icon: 'star-outline' },
];

export interface CategoryPickerProps {
  selectedCategory: Stamp['category'];
  onSelectCategory: (category: Stamp['category']) => void;
}

export function CategoryPicker({
  selectedCategory,
  onSelectCategory,
}: CategoryPickerProps) {
  return (
    <View>
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
              onPress={() => onSelectCategory(key)}
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
  chipsRow: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  chipText: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  chipTextActive: {
    color: COLORS.white,
  },
});
