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
 * Terms of Use screen
 */
export function TermsOfUseScreen() {
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
        <Text style={styles.headerTitle}>TERMS OF USE</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By downloading, installing, or using Memory Stamp, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the app.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. License</Text>
            <Text style={styles.paragraph}>
              Memory Stamp grants you a limited, non-exclusive, non-transferable, revocable license to use the app for personal, non-commercial purposes in accordance with these terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
            <Text style={styles.paragraph}>You agree to:</Text>
            <Text style={styles.bulletPoint}>• Use the app only for lawful purposes</Text>
            <Text style={styles.bulletPoint}>• Not attempt to reverse engineer, decompile, or disassemble the app</Text>
            <Text style={styles.bulletPoint}>• Not use the app in any way that could damage, disable, or impair the app</Text>
            <Text style={styles.bulletPoint}>• Maintain the security of your device and app data</Text>
            <Text style={styles.bulletPoint}>• Not upload or share content that infringes on others' rights</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Content Ownership</Text>
            <Text style={styles.paragraph}>
              You retain all rights to the content you create in Memory Stamp, including stamps, photos, notes, and other materials. Memory Stamp does not claim any ownership rights to your content.
            </Text>
            <Text style={styles.paragraph}>
              You are responsible for ensuring that you have the necessary rights to any photos or content you add to the app.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
            <Text style={styles.paragraph}>
              Memory Stamp, including its design, features, and functionality, is owned by us and is protected by copyright, trademark, and other intellectual property laws.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Data and Backups</Text>
            <Text style={styles.paragraph}>
              All data is stored locally on your device. You are solely responsible for backing up your data. We are not responsible for any loss of data due to device failure, app deletion, or any other cause.
            </Text>
            <Text style={styles.paragraph}>
              We recommend regularly exporting your data (when the feature becomes available) to prevent data loss.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Disclaimer of Warranties</Text>
            <Text style={styles.paragraph}>
              THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </Text>
            <Text style={styles.paragraph}>
              We do not warrant that the app will be error-free, uninterrupted, or free from viruses or other harmful components.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, OR OTHER INTANGIBLE LOSSES.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Updates and Modifications</Text>
            <Text style={styles.paragraph}>
              We may update, modify, or discontinue the app at any time without notice. We may also modify these Terms of Use at any time. Your continued use of the app after changes constitutes acceptance of the modified terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Third-Party Content</Text>
            <Text style={styles.paragraph}>
              The app may allow you to add content from third-party sources (such as photos). We are not responsible for any third-party content and do not endorse any third-party products or services.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Termination</Text>
            <Text style={styles.paragraph}>
              We reserve the right to terminate or suspend your access to the app at any time for any reason. You may terminate your use of the app by uninstalling it from your device.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12. Governing Law</Text>
            <Text style={styles.paragraph}>
              These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>13. Severability</Text>
            <Text style={styles.paragraph}>
              If any provision of these terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>14. Contact Information</Text>
            <Text style={styles.paragraph}>
              If you have any questions about these Terms of Use, please contact us through the Contact Support option in the app.
            </Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.stampBorder}>
              <Text style={styles.stampText}>MEMORY STAMP</Text>
              <Text style={styles.stampSubtext}>TERMS ACCEPTED</Text>
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
