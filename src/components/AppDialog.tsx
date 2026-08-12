import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
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

export interface DialogAction {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AppDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  label?: string;
  actions: DialogAction[];
}

export function AppDialog({ visible, onClose, title, message, label, actions }: AppDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        onPress={onClose}
        activeOpacity={1}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={styles.card}>

            {/* Decorative header */}
            <View style={styles.header}>
              <View style={styles.headerRule} />
              <Text style={styles.headerLabel}>{label ?? 'NOTICE'}</Text>
              <View style={styles.headerRule} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            {!!message && <Text style={styles.message}>{message}</Text>}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Actions */}
            <View style={styles.actions}>
              {actions.map((action, i) => {
                const isCancel = action.style === 'cancel';
                const isDestructive = action.style === 'destructive';
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.btn,
                      isCancel      && styles.btnCancel,
                      isDestructive && styles.btnDestructive,
                      !isCancel && !isDestructive && styles.btnDefault,
                    ]}
                    onPress={() => {
                      onClose();
                      action.onPress?.();
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[
                      styles.btnText,
                      isCancel      && styles.btnCancelText,
                      isDestructive && styles.btnDestructiveText,
                      !isCancel && !isDestructive && styles.btnDefaultText,
                    ]}>
                      {action.text.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5,21,43,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.pageMargin,
    paddingTop: SPACING.stackLoose,
    paddingBottom: SPACING.stackLoose,
    gap: SPACING.stackTight,
    ...SHADOW_STRONG,
  },

  // ── Decorative header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.stackTight,
    marginBottom: 4,
  },
  headerRule: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outlineVariant,
  },
  headerLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    color: COLORS.outline,
    letterSpacing: 3,
  },

  // ── Content ──
  title: {
    fontFamily: FONTS.headlineMd,
    fontSize: FONT_SIZES.headlineSm,
    color: COLORS.primary,
    textAlign: 'center',
  },
  message: {
    fontFamily: FONTS.bodyMd,
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 4,
    opacity: 0.5,
  },

  // ── Actions ──
  actions: {
    flexDirection: 'row',
    gap: SPACING.stackTight,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 13,
    letterSpacing: 1.5,
    textAlign: 'center',
  },

  btnCancel: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  btnCancelText: {
    color: COLORS.onSurfaceVariant,
  },

  btnDefault: {
    backgroundColor: COLORS.primary,
  },
  btnDefaultText: {
    color: COLORS.onPrimary,
  },

  btnDestructive: {
    backgroundColor: COLORS.errorContainer,
  },
  btnDestructiveText: {
    color: COLORS.error,
  },
});
