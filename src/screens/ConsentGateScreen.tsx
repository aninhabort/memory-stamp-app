import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';
import { ConsentCheckboxRow } from '../components/ConsentCheckboxRow';
import { LegalDocumentViewer } from '../components/LegalDocumentViewer';
import { TERMS_SECTIONS } from '../content/termsContent';
import { PRIVACY_SECTIONS } from '../content/privacyContent';
import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
  TERMS_LAST_UPDATED,
  PRIVACY_LAST_UPDATED,
} from '../constants/legal';
import { useAuth } from '../contexts/AuthContext';

const CARD_SHADOW = {
  shadowColor: '#05152b',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1,
};

/**
 * Blocking safety-net shown to any authenticated session without a
 * current-version consent record — covers accounts that signed up via
 * Google OAuth, email confirmation completed on a different device, and
 * any pre-existing account created before this feature shipped. This is
 * the actual guarantee behind "no account can use the app without
 * recording consent," not just the SignUpScreen checkbox.
 */
export function ConsentGateScreen() {
  const insets = useSafeAreaInsets();
  const { confirmConsent, logout } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [visibleDoc, setVisibleDoc] = useState<'terms' | 'privacy' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!agreed || submitting) return;
    setSubmitting(true);
    try {
      await confirmConsent();
    } catch (error) {
      Alert.alert(
        'Could Not Continue',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Terms Required',
      'You need to accept the Terms of Service and Privacy Policy to use Memory Stamp. You can review them again next time you sign in.',
      [
        { text: 'Review Again', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandBlock}>
          <View style={styles.passportIcon}>
            <Ionicons name="document-text-outline" size={32} color={COLORS.onPrimaryContainer} />
          </View>
          <Text style={styles.brandTitle}>MEMORY STAMP</Text>
          <Text style={styles.formTitle}>Updated Archive Terms</Text>
          <Text style={styles.formDescription}>
            Please review and accept our Terms of Service and Privacy Policy to continue.
          </Text>
        </View>

        <View style={styles.formCard}>
          <ConsentCheckboxRow
            checked={agreed}
            onToggle={() => setAgreed(v => !v)}
            onOpenTerms={() => setVisibleDoc('terms')}
            onOpenPrivacy={() => setVisibleDoc('privacy')}
          />

          <TouchableOpacity
            style={[styles.submitBtn, (!agreed || submitting) && styles.submitBtnDisabled]}
            onPress={handleAccept}
            activeOpacity={0.8}
            disabled={!agreed || submitting}
          >
            <Text style={styles.submitBtnText}>{submitting ? 'PLEASE WAIT...' : 'ACCEPT & CONTINUE'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDecline} activeOpacity={0.7} style={styles.declineBtn}>
            <Text style={styles.declineText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={visibleDoc !== null}
        animationType="slide"
        onRequestClose={() => setVisibleDoc(null)}
      >
        {visibleDoc === 'terms' && (
          <LegalDocumentViewer
            title="Terms of Use"
            version={CURRENT_TERMS_VERSION}
            lastUpdated={TERMS_LAST_UPDATED}
            sections={TERMS_SECTIONS}
            onBack={() => setVisibleDoc(null)}
          />
        )}
        {visibleDoc === 'privacy' && (
          <LegalDocumentViewer
            title="Privacy Policy"
            version={CURRENT_PRIVACY_VERSION}
            lastUpdated={PRIVACY_LAST_UPDATED}
            sections={PRIVACY_SECTIONS}
            onBack={() => setVisibleDoc(null)}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.pageMargin,
    paddingBottom: 28,
  },

  brandBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  passportIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryContainer,
    borderWidth: 2,
    borderColor: COLORS.onPrimaryContainer,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-3deg' }],
    marginBottom: 12,
    opacity: 0.88,
  },
  brandTitle: {
    fontFamily: FONTS.labelStamp,
    fontSize: 22,
    color: COLORS.primary,
    letterSpacing: 3,
    marginBottom: 10,
  },
  formTitle: {
    fontFamily: FONTS.headlineMd,
    fontSize: FONT_SIZES.headlineMd,
    color: COLORS.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  formDescription: {
    fontFamily: FONTS.bodyMd,
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },

  formCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 5,
    padding: 24,
    gap: 20,
    ...CARD_SHADOW,
  },

  submitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 5,
    paddingVertical: 14,
    ...CARD_SHADOW,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 15,
    color: COLORS.white,
    letterSpacing: 1.2,
  },

  declineBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  declineText: {
    fontFamily: FONTS.bodyMd,
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    textDecorationLine: 'underline',
  },
});
