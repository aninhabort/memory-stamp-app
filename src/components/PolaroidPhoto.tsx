import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS, FONTS, SHADOW_PAPER } from '../constants/theme';

interface PolaroidPhotoProps {
  uri: string;
  width: number;
  height: number;
  rotation?: string;
  caption?: string;
  style?: StyleProp<ViewStyle>;
}

export function PolaroidPhoto({ uri, width, height, rotation = '0deg', caption, style }: PolaroidPhotoProps) {
  return (
    <View style={[styles.frame, { transform: [{ rotate: rotation }] }, style]}>
      <Image source={{ uri }} style={{ width, height }} resizeMode="cover" />
      <Text style={styles.caption} numberOfLines={1}>{caption ?? ' '}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: COLORS.white,
    padding: 8,
    paddingBottom: 4,
    borderRadius: 2,
    ...SHADOW_PAPER,
  },
  caption: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    paddingTop: 6,
    paddingBottom: 4,
    letterSpacing: 0.5,
  },
});
