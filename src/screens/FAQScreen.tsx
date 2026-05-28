import React, { useState } from 'react';
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
  SHADOW_PAPER,
  SPACING,
} from '../constants/theme';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'What is Memory Stamp?',
    answer: 'Memory Stamp is a personal archive app that helps you document and preserve your travel memories. Think of it as your digital passport where you can collect stamps of places you\'ve visited, add photos, and write notes about your experiences.',
  },
  {
    question: 'How do I create a new stamp?',
    answer: 'Tap the pencil icon (FAB button) on the Passport or Collection screen. Fill in the details like title, place, country, date, and add photos. You can also write notes about your experience. When you\'re done, save it to add it to your collection.',
  },
  {
    question: 'What are Volumes?',
    answer: 'Volumes are like different passport books that help you organize your stamps. You might want to create separate volumes for different years, trips, or themes. Each volume can hold multiple stamps, and you can switch between them on the Passport screen.',
  },
  {
    question: 'Can I add multiple photos to a stamp?',
    answer: 'Yes! Each stamp can have multiple photos. When creating or editing a stamp, you can add photos from your camera roll or take new ones with your camera.',
  },
  {
    question: 'How do I edit or delete a stamp?',
    answer: 'Tap on any stamp to view its details. From the detail screen, you can edit the information or delete the stamp. Be careful when deleting - this action cannot be undone.',
  },
  {
    question: 'Can I export my stamps?',
    answer: 'The export feature is coming soon! You\'ll be able to export all your stamps to a TXT file for backup or sharing purposes.',
  },
  {
    question: 'How is my data stored?',
    answer: 'All your stamps and photos are stored locally on your device using AsyncStorage. Your data is private and never sent to any servers unless you explicitly choose to export or share it.',
  },
  {
    question: 'Can I change my name in the app?',
    answer: 'Yes! Go to Settings (accessible from the Collection screen) and tap on your name in the Bearer Information section. You can edit it and save the changes.',
  },
  {
    question: 'What happens if I clear all data?',
    answer: 'Clearing all data will permanently delete all your stamps, photos, and volumes from the app. This action cannot be undone, so make sure to export your data first if you want to keep a backup.',
  },
  {
    question: 'Is Memory Stamp free to use?',
    answer: 'Yes, Memory Stamp is completely free to use. There are no in-app purchases or subscriptions required.',
  },
  {
    question: 'Does the app work offline?',
    answer: 'Yes! Memory Stamp works completely offline. You don\'t need an internet connection to create, view, or manage your stamps.',
  },
  {
    question: 'How can I report a bug or suggest a feature?',
    answer: 'We\'d love to hear from you! Use the Contact Support option in the Help & Support section to send us your feedback, bug reports, or feature suggestions.',
  },
];

function FAQItemComponent({ item, isExpanded, onToggle }: {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.faqQuestionText}>{item.question}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.secondary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
}

/**
 * FAQ screen with frequently asked questions
 */
export function FAQScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

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
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.description}>
            Frequently asked questions about Memory Stamp
          </Text>

          <View style={styles.faqList}>
            {FAQ_DATA.map((item, index) => (
              <FAQItemComponent
                key={index}
                item={item}
                isExpanded={expandedIndex === index}
                onToggle={() => toggleItem(index)}
              />
            ))}
          </View>

          {/* Still have questions? */}
          <View style={styles.footer}>
            <View style={styles.footerCard}>
              <Ionicons name="help-circle-outline" size={32} color={COLORS.secondary} />
              <Text style={styles.footerTitle}>Still have questions?</Text>
              <Text style={styles.footerText}>
                Contact our support team and we'll be happy to help.
              </Text>
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
  description: {
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurfaceVariant,
    marginBottom: 20,
  },
  faqList: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOW_PAPER,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  faqQuestionText: {
    flex: 1,
    fontFamily: FONTS.headlineSm,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurface,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
  },
  faqAnswerText: {
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurfaceVariant,
    lineHeight: 22,
    marginTop: 10,
  },
  footer: {
    marginTop: 32,
  },
  footerCard: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.md,
    padding: 24,
    alignItems: 'center',
    ...SHADOW_PAPER,
  },
  footerTitle: {
    fontFamily: FONTS.headlineSm,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onPrimaryContainer,
    marginTop: 12,
    marginBottom: 8,
  },
  footerText: {
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onPrimaryContainer,
    textAlign: 'center',
    opacity: 0.85,
  },
});
