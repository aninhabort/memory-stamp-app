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
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
} from '../constants/theme';
import { LegalSection } from '../content/legalTypes';

interface LegalDocumentViewerProps {
  title: string;
  lastUpdated: string;
  version: string;
  sections: LegalSection[];
  onBack: () => void;
}

/**
 * Presentational document viewer shared by the Terms of Use / Privacy Policy
 * navigator screens AND the sign-up / consent-gate modal. Takes `onBack` as a
 * prop instead of calling useNavigation() internally, since the sign-up and
 * consent-gate screens render outside any NavigationContainer.
 */
export function LegalDocumentViewer({ title, lastUpdated, version, sections, onBack }: LegalDocumentViewerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title.toUpperCase()}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>

          {/* Draft notice — this must never read as a finished legal document */}
          <View style={styles.draftBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
            <Text style={styles.draftBannerText}>
              DRAFT — structural placeholder, not reviewed by legal counsel. Replace before public launch.
            </Text>
          </View>

          <Text style={styles.lastUpdated}>Version {version} · {lastUpdated}</Text>

          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.paragraphs?.map((paragraph, i) => (
                <Text key={i} style={styles.paragraph}>{paragraph}</Text>
              ))}
              {section.bullets?.map((bullet, i) => (
                <Text key={i} style={styles.bulletPoint}>• {bullet}</Text>
              ))}
            </View>
          ))}

          <View style={styles.footer}>
            <View style={styles.stampBorder}>
              <Text style={styles.stampText}>MEMORY STAMP</Text>
              <Text style={styles.stampSubtext}>{title.toUpperCase()}</Text>
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
    paddingVertical: 12,
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

  // ── Draft notice ──
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.errorContainer,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
  },
  draftBannerText: {
    flex: 1,
    fontFamily: FONTS.bodyMd,
    fontSize: 13,
    color: COLORS.error,
    lineHeight: 18,
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
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginTop: 2,
    textAlign: 'center',
  },
});
