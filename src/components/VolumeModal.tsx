import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SHADOW_STRONG,
  SPACING,
} from '../constants/theme';

interface VolumeModalProps {
  visible: boolean;
  nextLabel: string; // e.g., "VOLUME II"
  onClose: () => void;
  onConfirm: (name: string) => void;
}

/**
 * VolumeModal — Modal dialog for creating a new passport/volume.
 */
export function VolumeModal({ visible, nextLabel, onClose, onConfirm }: VolumeModalProps) {
  const [name, setName] = useState('');
  const year = new Date().getFullYear();

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setName('');
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        {/* Touch outside to close */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          activeOpacity={1}
        />

        <View style={styles.modalCard}>
          {/* Thumbnail of the volume to be created */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalNextLabel}>{nextLabel}</Text>
            <Text style={styles.modalTitle}>New Passport</Text>
            <Text style={styles.modalSubtitle}>EST. {year}</Text>
          </View>

          {/* Name field */}
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={setName}
            placeholder="Passport name…"
            placeholderTextColor={COLORS.outlineVariant}
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
            autoFocus
            maxLength={40}
          />

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalBtnSecondary}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtnPrimary, !name.trim() && styles.modalBtnDisabled]}
              onPress={handleConfirm}
              activeOpacity={0.8}
              disabled={!name.trim()}
            >
              <Text style={styles.modalBtnPrimaryText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5,21,43,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.pageMargin,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.stackLoose,
    gap: SPACING.elementGap,
    ...SHADOW_STRONG,
  },
  modalHeader: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  modalNextLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelXs,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 3,
    marginBottom: 2,
  },
  modalTitle: {
    fontFamily: FONTS.headlineMd,
    fontSize: FONT_SIZES.headlineMd,
    color: COLORS.primary,
  },
  modalSubtitle: {
    fontFamily: FONTS.labelStamp,
    fontSize: FONT_SIZES.labelStamp,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2,
    opacity: 0.7,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.elementGap,
    paddingVertical: 12,
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurface,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.stackTight,
  },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelStamp,
    color: COLORS.onSurfaceVariant,
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelStamp,
    color: COLORS.onPrimary,
  },
  modalBtnDisabled: {
    opacity: 0.35,
  },
});
