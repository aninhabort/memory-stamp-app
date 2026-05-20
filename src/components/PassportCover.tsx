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
        {/* Ícone de globo substituindo emoji */}
        <Ionicons name="globe-outline" size={60} color={COLORS.GOLD} style={styles.globe} />

        <Text style={styles.title}>PASSAPORTE DE MEMÓRIAS</Text>

        {/* Nome clicável com ícone de lápis */}
        <TouchableOpacity style={styles.nameRow} onPress={onEditName} activeOpacity={0.7}>
          <Text style={styles.subtitle}>{userName}</Text>
          <Ionicons name="pencil" size={14} color={COLORS.GOLD} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.counter}>
          {stampCount} {stampCount === 1 ? 'selo colecionado' : 'selos colecionados'}
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
    backgroundColor: COLORS.NAVY,
    borderRadius: 12,
    padding: 3,
    ...SHADOW,
  },
  innerBorder: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.GOLD,
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
    color: COLORS.GOLD,
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
    color: COLORS.CREAM,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: COLORS.GOLD,
    opacity: 0.5,
    marginBottom: 10,
  },
  counter: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.GOLD,
    letterSpacing: 1,
  },
});
