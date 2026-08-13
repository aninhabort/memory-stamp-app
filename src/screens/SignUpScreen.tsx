import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
} from '../constants/theme';
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
import { ConsentService } from '../services/consentService';

interface SignUpScreenProps {
  onSignUp: (name: string, email: string, password: string) => void;
  onNavigateToLogin: () => void;
  onGoogleLogin?: () => Promise<void>;
}

const PLACEHOLDER_COLOR = 'rgba(117, 119, 126, 0.45)';

const CARD_SHADOW = {
  shadowColor: '#05152b',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1,
};

export function SignUpScreen({ onSignUp, onNavigateToLogin, onGoogleLogin }: SignUpScreenProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [visibleDoc, setVisibleDoc] = useState<'terms' | 'privacy' | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 550, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter your name to continue.');
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Please enter a valid name (at least 2 characters).');
      return;
    }

    if (!trimmedEmail) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!trimmedPassword) {
      Alert.alert('Password Required', 'Please enter a password.');
      return;
    }

    if (trimmedPassword.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      Alert.alert('Passwords Don\'t Match', 'Please make sure your passwords match.');
      return;
    }

    if (!agreedToTerms) return;

    // Captured before signup() runs — email confirmation can delay the
    // session by an unknown amount, so this can't wait for a userId yet.
    // AuthContext reconciles it into a real consent record the moment a
    // session for this account first appears (see applySession).
    ConsentService.recordIntent('signup_email');
    onSignUp(trimmedName, trimmedEmail, trimmedPassword);
  };

  const handleGoogleLogin = async () => {
    if (!onGoogleLogin || loadingGoogle || !agreedToTerms) return;
    setLoadingGoogle(true);
    try {
      ConsentService.recordIntent('signup_google');
      await onGoogleLogin();
    } finally {
      setLoadingGoogle(false);
    }
  };

  const animStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  const isFormValid =
    name.trim() && email.trim() && password.trim() && confirmPassword.trim() && agreedToTerms;

  return (
    <>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Brand header ── */}
        <Animated.View style={[styles.brandBlock, animStyle]}>
          <View style={styles.passportIcon}>
            <Ionicons name="book" size={32} color={COLORS.onPrimaryContainer} />
          </View>
          <Text style={styles.brandTitle}>MEMORY STAMP</Text>
          <Text style={styles.formTitle}>Open Your Archive</Text>
          <Text style={styles.formDescription}>Begin preserving your memories.</Text>
        </Animated.View>

        {/* ── Form card ── */}
        <Animated.View style={[styles.formCard, animStyle]}>

          {/* Archivist name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ARCHIVIST NAME</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.outline} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={PLACEHOLDER_COLOR}
                autoCapitalize="words"
                autoFocus
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.outline} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor={PLACEHOLDER_COLOR}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ACCESS KEY</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.outline} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 6 characters"
                placeholderTextColor={PLACEHOLDER_COLOR}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.outline}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONFIRM ACCESS KEY</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.outline} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your key"
                placeholderTextColor={PLACEHOLDER_COLOR}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.outline}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms & Privacy consent — not an OS permission, just an in-app agreement */}
          <View style={styles.consentRow}>
            <ConsentCheckboxRow
              checked={agreedToTerms}
              onToggle={() => setAgreedToTerms(v => !v)}
              onOpenTerms={() => setVisibleDoc('terms')}
              onOpenPrivacy={() => setVisibleDoc('privacy')}
            />
          </View>

          {/* Primary action */}
          <TouchableOpacity
            style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={!isFormValid}
          >
            <Text style={styles.submitBtnText}>ISSUE PASSPORT</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>

          {/* OR separator */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Google */}
          <TouchableOpacity
            style={[styles.altBtn, { marginBottom: 0 }, (loadingGoogle || !agreedToTerms) && { opacity: 0.5 }]}
            activeOpacity={0.75}
            onPress={handleGoogleLogin}
            disabled={loadingGoogle || !agreedToTerms}
          >
            <Ionicons name="logo-google" size={20} color={COLORS.onSurface} style={{ opacity: 0.45 }} />
            <Text style={styles.altBtnText}>
              {loadingGoogle ? 'Connecting...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {/* Nav link */}
          <View style={[styles.navLinkRow, { marginBottom: 0 }]}>
            <Text style={styles.navLinkText}>Already have a Passport? </Text>
            <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
              <Text style={styles.navLink}>Access Archive</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>

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
    </>
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

  // ── Brand block ──
  brandBlock: {
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 26,
    color: COLORS.primary,
    letterSpacing: 3,
    marginBottom: 12,
  },
  formTitle: {
    fontFamily: FONTS.headlineMd,
    fontSize: FONT_SIZES.headlineMd,
    color: COLORS.primary,
    marginBottom: 2,
  },
  formDescription: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.3,
    opacity: 0.6,
  },

  // ── Form card ──
  formCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 5,
    padding: 24,
    marginBottom: 12,
    ...CARD_SHADOW,
  },

  // ── Inputs ──
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 14,
    color: COLORS.onSurface,
    letterSpacing: 1.5,
    opacity: 0.4,
    marginBottom: 7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 3,
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 9,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.bodyMd,
    fontSize: 16,
    color: COLORS.onSurface,
    padding: 0,
  },

  // ── Terms & Privacy consent ──
  consentRow: {
    marginTop: 4,
    marginBottom: 16,
  },

  // ── Primary button ──
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 5,
    paddingVertical: 14,
    marginTop: 6,
    marginBottom: 14,
    ...CARD_SHADOW,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 1.5,
  },

  // ── OR separator ──
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.55,
  },
  separatorText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 7,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    opacity: 0.38,
    marginHorizontal: 8,
  },

  // ── Alternative auth buttons ──
  altBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 5,
    paddingVertical: 11,
    marginBottom: 9,
  },
  altBtnText: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: 12,
    color: COLORS.onSurface,
    letterSpacing: 0.3,
    opacity: 0.6,
  },

  // ── Navigation link ──
  navLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  navLinkText: {
    fontFamily: FONTS.bodyMd,
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  navLink: {
    fontFamily: FONTS.headlineSm,
    fontSize: 13,
    color: COLORS.secondary,
    textDecorationLine: 'underline',
  },

});
