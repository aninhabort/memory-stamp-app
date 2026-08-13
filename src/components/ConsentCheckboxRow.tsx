import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

interface ConsentCheckboxRowProps {
  checked: boolean;
  onToggle: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

/**
 * "I agree to the Terms of Service and Privacy Policy" consent row, shared
 * by SignUpScreen and ConsentGateScreen. Deliberately not modeled as (or
 * near) any OS permission UI — this is an in-app agreement, not a system
 * prompt.
 */
export function ConsentCheckboxRow({ checked, onToggle, onOpenTerms, onOpenPrivacy }: ConsentCheckboxRowProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={styles.checkboxTouchable}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
      >
        <Ionicons
          name={checked ? 'checkbox' : 'square-outline'}
          size={22}
          color={checked ? COLORS.secondary : COLORS.outline}
        />
      </TouchableOpacity>

      <Text style={styles.text}>
        I agree to the{' '}
        <Text
          style={styles.link}
          onPress={onOpenTerms}
          accessibilityRole="link"
          suppressHighlighting
        >
          Terms of Service
        </Text>
        {' '}and{' '}
        <Text
          style={styles.link}
          onPress={onOpenPrivacy}
          accessibilityRole="link"
          suppressHighlighting
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkboxTouchable: {
    paddingTop: 1,
  },
  text: {
    flex: 1,
    fontFamily: FONTS.bodyMd,
    fontSize: 14,
    color: COLORS.onSurface,
    lineHeight: 20,
  },
  link: {
    color: COLORS.secondary,
    textDecorationLine: 'underline',
  },
});
