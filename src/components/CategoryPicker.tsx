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
import { COLORS, FONTS, RADIUS } from '../constants/theme';

export interface Category {
  key: Stamp['category'];
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const CATEGORIES: Category[] = [
  { key: 'viagem',      label: 'Travel',     icon: 'airplane-outline'      },
  { key: 'show',        label: 'Show',        icon: 'musical-notes-outline' },
  { key: 'restaurante', label: 'Restaurant',  icon: 'restaurant-outline'    },
  { key: 'evento',      label: 'Event',       icon: 'calendar-outline'      },
  { key: 'outro',       label: 'Other',       icon: 'star-outline'          },
];

export interface CategoryPickerProps {
  selectedCategory: Stamp['category'];
  onSelectCategory: (category: Stamp['category']) => void;
}

export function CategoryPicker({ selectedCategory, onSelectCategory }: CategoryPickerProps) {
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
                size={15}
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
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  chipsRow: {
    gap: 8,
    paddingBottom: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    // Inactive: hairline border — subtle, doesn't compete with content
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  chipText: {
    fontFamily: FONTS.labelCaps,
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  chipTextActive: {
    color: COLORS.white,
  },
});
