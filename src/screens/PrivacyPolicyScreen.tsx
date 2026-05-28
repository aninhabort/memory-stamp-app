import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
} from '../constants/theme';

/**
 * Privacy Policy screen
 */
export function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PRIVACY POLICY</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.paragraph}>
              Memory Stamp ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we handle your information when you use our mobile application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>
            <Text style={styles.paragraph}>
              Memory Stamp is designed with privacy in mind. All your data is stored locally on your device. We collect and store:
            </Text>
            <Text style={styles.bulletPoint}>• Your name (as entered in the app)</Text>
            <Text style={styles.bulletPoint}>• Stamps you create (titles, places, dates, notes)</Text>
            <Text style={styles.bulletPoint}>• Photos you add to your stamps</Text>
            <Text style={styles.bulletPoint}>• Volume information</Text>
            <Text style={styles.paragraph}>
              This information is stored locally on your device using AsyncStorage and is never transmitted to our servers or any third parties.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
            <Text style={styles.paragraph}>
              Your information is used solely to provide the app's functionality:
            </Text>
            <Text style={styles.bulletPoint}>• To display your travel memories and stamps</Text>
            <Text style={styles.bulletPoint}>• To organize your stamps into volumes</Text>
            <Text style={styles.bulletPoint}>• To generate statistics about your travels</Text>
            <Text style={styles.bulletPoint}>• To personalize your experience</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Storage and Security</Text>
            <Text style={styles.paragraph}>
              All data is stored locally on your device. We do not have access to your data, and it is not transmitted to any servers. The security of your data depends on your device's security measures.
            </Text>
            <Text style={styles.paragraph}>
              We recommend enabling device encryption and using a secure lock screen to protect your personal information.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Photo Permissions</Text>
            <Text style={styles.paragraph}>
              Memory Stamp requests access to your camera and photo library to allow you to:
            </Text>
            <Text style={styles.bulletPoint}>• Take photos for your stamps</Text>
            <Text style={styles.bulletPoint}>• Select existing photos from your library</Text>
            <Text style={styles.paragraph}>
              Photos are only accessed when you explicitly choose to add them to a stamp. We do not access, scan, or transmit your photos for any other purpose.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Data Sharing</Text>
            <Text style={styles.paragraph}>
              We do not share, sell, or transmit your data to any third parties. Your information stays on your device unless you explicitly choose to export or share it.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Third-Party Services</Text>
            <Text style={styles.paragraph}>
              Memory Stamp does not integrate with any third-party analytics, advertising, or tracking services. The app functions entirely offline.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
            <Text style={styles.paragraph}>
              Memory Stamp does not knowingly collect any information from children. The app is designed for general audiences and does not require age verification.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Your Rights</Text>
            <Text style={styles.paragraph}>
              Since all data is stored locally on your device, you have complete control:
            </Text>
            <Text style={styles.bulletPoint}>• You can view all your data within the app</Text>
            <Text style={styles.bulletPoint}>• You can edit or delete any stamps at any time</Text>
            <Text style={styles.bulletPoint}>• You can export your data (coming soon)</Text>
            <Text style={styles.bulletPoint}>• You can delete all data through the Settings screen</Text>
            <Text style={styles.bulletPoint}>• You can uninstall the app to remove all data</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
            <Text style={styles.paragraph}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date at the top of this policy.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions about this Privacy Policy, please contact us through the Contact Support option in the app.
            </Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.stampBorder}>
              <Text style={styles.stampText}>MEMORY STAMP</Text>
              <Text style={styles.stampSubtext}>PRIVACY FIRST</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.pageMargin,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
  },
  backText: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.headlineSm,
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  headerRight: {
    minWidth: 72,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.pageMargin,
    paddingBottom: 32,
  },
  lastUpdated: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.onSurfaceVariant,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.headlineSm,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.primary,
    marginBottom: 12,
  },
  paragraph: {
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurface,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoint: {
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurface,
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  stampBorder: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.outlineVariant,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    transform: [{ rotate: '-2deg' }],
  },
  stampText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2,
  },
  stampSubtext: {
    fontFamily: FONTS.labelStamp,
    fontSize: 8,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginTop: 2,
  },
});
