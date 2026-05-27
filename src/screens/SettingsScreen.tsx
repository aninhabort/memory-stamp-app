import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useUserName } from '../hooks/useUserName';
import { useStamps } from '../hooks/useStamps';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SHADOW_PAPER,
  SPACING,
} from '../constants/theme';
import { CollectionStackParamList } from '../navigation/types';

type SettingsNavigation = NativeStackNavigationProp<
  CollectionStackParamList,
  'Settings'
>;

/**
 * Settings screen with vintage editorial design.
 * Allows users to manage their profile, preferences, and data.
 */
export function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigation>();
  const insets = useSafeAreaInsets();
  const { userName, setUserName } = useUserName();
  const { stamps } = useStamps();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName || '');

  const handleSaveName = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      setEditingName(false);
    }
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      `Export ${stamps.length} stamps to JSON file?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            // TODO: Implement actual export functionality
            Alert.alert('Coming Soon', 'Export feature will be available soon.');
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your stamps and volumes. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement clear data functionality
            Alert.alert('Coming Soon', 'Data management will be available soon.');
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BEARER INFORMATION</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="person-outline" size={20} color={COLORS.onSurface} />
                <Text style={styles.settingLabel}>Name</Text>
              </View>
              {editingName ? (
                <View style={styles.editNameRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={nameInput}
                    onChangeText={setNameInput}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                  />
                  <TouchableOpacity onPress={handleSaveName}>
                    <Ionicons name="checkmark" size={20} color={COLORS.secondary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.settingRight}
                  onPress={() => setEditingName(true)}
                >
                  <Text style={styles.settingValue}>{userName || 'Viajante'}</Text>
                  <Ionicons name="pencil-outline" size={16} color={COLORS.outline} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ARCHIVE STATISTICS</Text>
          <View style={styles.settingCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Entries</Text>
              <Text style={styles.statValue}>{stamps.length}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Countries Visited</Text>
              <Text style={styles.statValue}>
                {new Set(stamps.map(s => s.country).filter(Boolean)).size}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Photos Collected</Text>
              <Text style={styles.statValue}>
                {stamps.reduce((acc, s) => acc + (s.photos?.length || 0), 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATA MANAGEMENT</Text>
          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleExportData}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="download-outline" size={20} color={COLORS.onSurface} />
                <Text style={styles.settingLabel}>Export Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.outline} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleClearData}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="trash-outline" size={20} color="#c44e3f" />
                <Text style={[styles.settingLabel, { color: '#c44e3f' }]}>
                  Clear All Data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.outline} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.onSurface} />
                <Text style={styles.settingLabel}>Version</Text>
              </View>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Footer stamp */}
        <View style={styles.footer}>
          <View style={styles.stampBorder}>
            <Text style={styles.stampText}>MEMORY STAMP</Text>
            <Text style={styles.stampSubtext}>ARCHIVAL SYSTEM</Text>
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
  section: {
    paddingHorizontal: SPACING.pageMargin,
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  settingCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: 16,
    ...SHADOW_PAPER,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingLabel: {
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurface,
  },
  settingValue: {
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurfaceVariant,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  nameInput: {
    flex: 1,
    fontFamily: FONTS.bodyMd,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    marginVertical: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontFamily: FONTS.labelStampRegular,
    fontSize: FONT_SIZES.bodyMd,
    color: COLORS.onSurfaceVariant,
  },
  statValue: {
    fontFamily: FONTS.labelStamp,
    fontSize: 16,
    color: COLORS.secondary,
    letterSpacing: 1,
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
