import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOW } from '../constants/theme';

interface PassportCoverProps {
  stampCount: number;
  userName: string;
  onEditName: () => void;
}

export function PassportCover({ stampCount, userName, onEditName }: PassportCoverProps) {
  return (
    <View style={styles.container}>
      <View style={styles.innerBorder}>
        {/* Globe icon */}
        <Ionicons name="globe-outline" size={60} color={COLORS.secondary} style={styles.globe} />

        <Text style={styles.title}>MEMORY PASSPORT</Text>

        {/* Editable name with pencil icon */}
        <TouchableOpacity style={styles.nameRow} onPress={onEditName} activeOpacity={0.7}>
          <Text style={styles.subtitle}>{userName}</Text>
          <Ionicons name="pencil" size={14} color={COLORS.secondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.counter}>
          {stampCount} {stampCount === 1 ? 'stamp collected' : 'stamps collected'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 3,
    ...SHADOW,
  },
  innerBorder: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  globe: {
    marginBottom: 8,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.secondary,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.background,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: COLORS.secondary,
    opacity: 0.5,
    marginBottom: 10,
  },
  counter: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.secondary,
    letterSpacing: 1,
  },
});
