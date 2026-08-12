import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useUserName } from '../hooks/useUserName';
import { useProfilePhoto } from '../hooks/useProfilePhoto';
import { useStamps } from '../hooks/useStamps';
import { useAuth } from '../contexts/AuthContext';
import { formatArrivalDate } from '../utils/stampUtils';
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  RADIUS,
  SPACING,
} from '../constants/theme';
import { SettingsStackParamList } from '../navigation/types';

type SettingsNavigation = NativeStackNavigationProp<
  SettingsStackParamList,
  'Settings'
>;

const CARD_SHADOW = {
  shadowColor: '#05152b',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1,
};

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigation>();
  const insets = useSafeAreaInsets();
  const { userName, setUserName } = useUserName();
  const { stamps } = useStamps();
  const { logout, userId, userCreatedAt, linkedProviders, linkWithGoogle } = useAuth();
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  const { profilePhotoUrl, uploading, pickAndUpload } = useProfilePhoto();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName || '');

  const archiveRef = useMemo(() => {
    if (!userId) return 'MSA-PENDING';
    const year = new Date().getFullYear();
    const hash = parseInt(userId.replace(/-/g, '').slice(0, 8), 16);
    const num = (hash % 9999) + 1;
    return `MSA-${year}-${String(num).padStart(4, '0')}`;
  }, [userId]);

  const registeredDate = useMemo(() => {
    if (!userCreatedAt) return null;
    return formatArrivalDate(userCreatedAt);
  }, [userCreatedAt]);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      setEditingName(false);
    }
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      `Export ${stamps.length} stamps to TXT file?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
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
            Alert.alert('Coming Soon', 'Data management will be available soon.');
          },
        },
      ]
    );
  };

  const handleContactSupport = () => navigation.navigate('ContactSupport');
  const handleFAQ = () => navigation.navigate('FAQ');
  const handlePrivacyPolicy = () => navigation.navigate('PrivacyPolicy');
  const handleTermsOfUse = () => navigation.navigate('TermsOfUse');

  const handleLinkGoogle = async () => {
    if (linkedProviders.includes('google')) return;
    setLinkingGoogle(true);
    try {
      await linkWithGoogle();
    } catch (err: any) {
      Alert.alert('Connection Failed', err?.message ?? 'Could not connect Google account.');
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Leave Archive',
      'Are you sure you want to close this archive session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Archive',
          style: 'destructive',
          onPress: () => logout(),
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>SETTINGS</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Archive Identity ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ARCHIVE IDENTITY</Text>
          <View style={styles.identityCard}>

            {/* Profile photo */}
            <TouchableOpacity style={styles.photoRow} onPress={pickAndUpload} activeOpacity={0.7} disabled={uploading}>
              <View style={styles.photoContainer}>
                {profilePhotoUrl ? (
                  <Image source={{ uri: profilePhotoUrl }} style={styles.photoImage} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="person-outline" size={22} color={COLORS.onSurfaceVariant} style={{ opacity: 0.4 }} />
                  </View>
                )}
                <View style={styles.photoCameraBtn}>
                  {uploading
                    ? <ActivityIndicator size={10} color={COLORS.onPrimary} />
                    : <Ionicons name="camera-outline" size={10} color={COLORS.onPrimary} />
                  }
                </View>
              </View>
              <View style={styles.photoInfo}>
                <Text style={styles.photoLabel}>PROFILE PHOTO</Text>
                <Text style={styles.photoHint}>{profilePhotoUrl ? 'Tap to change' : 'Tap to add'}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.identityDivider} />

            {/* Archivist — editable */}
            <View style={styles.identityField}>
              <Text style={styles.identityFieldLabel}>ARCHIVIST</Text>
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
                    <Ionicons name="checkmark" size={16} color={COLORS.secondary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.identityNameRow}
                  onPress={() => setEditingName(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.identityName}>{userName || 'Archivist'}</Text>
                  <Ionicons name="pencil-outline" size={11} color={COLORS.outline} style={{ opacity: 0.45 }} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.identityDivider} />

            {/* Archive ID */}
            <View style={styles.identityField}>
              <Text style={styles.identityFieldLabel}>ARCHIVE ID</Text>
              <Text style={styles.identityCode}>{archiveRef}</Text>
            </View>

            <View style={styles.identityDivider} />

            {/* Registered + Entries — two columns */}
            <View style={styles.identityTwoCol}>
              <View style={styles.identityHalf}>
                <Text style={styles.identityFieldLabel}>REGISTERED</Text>
                <Text style={styles.identityMeta}>{registeredDate ?? '—'}</Text>
              </View>
              <View style={styles.identityColRule} />
              <View style={styles.identityHalf}>
                <Text style={styles.identityFieldLabel}>ENTRIES</Text>
                <Text style={styles.identityMeta}>{stamps.length}</Text>
              </View>
            </View>

          </View>
        </View>

        {/* ── Connected Accounts ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONNECTED ACCOUNTS</Text>
          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleLinkGoogle}
              activeOpacity={linkedProviders.includes('google') ? 1 : 0.7}
              disabled={linkedProviders.includes('google') || linkingGoogle}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="logo-google" size={20} color={COLORS.onSurface} />
                <Text style={styles.settingLabel}>Google</Text>
              </View>
              {linkingGoogle ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : linkedProviders.includes('google') ? (
                <View style={styles.connectedBadge}>
                  <Ionicons name="checkmark" size={9} color={COLORS.secondary} />
                  <Text style={styles.connectedText}>LINKED</Text>
                </View>
              ) : (
                <Text style={styles.connectText}>Connect</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={[styles.settingRow, { opacity: 0.4 }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="logo-apple" size={20} color={COLORS.onSurface} />
                <Text style={styles.settingLabel}>Apple</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>PLANNED</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Data Management ── */}
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
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>PLANNED</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={14} color={COLORS.outline} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleClearData}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="trash-outline" size={20} color="#c44e3f" />
                <Text style={[styles.settingLabel, { color: COLORS.error }]}>
                  Clear All Data
                </Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>PLANNED</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={14} color={COLORS.outline} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Help & Support ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HELP & SUPPORT</Text>
          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleContactSupport}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="mail-outline" size={20} color={COLORS.onSurface} />
                <Text style={styles.settingLabel}>Contact Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={COLORS.outline} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleFAQ}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="help-circle-outline" size={20} color={COLORS.onSurface} />
                <Text style={styles.settingLabel}>FAQ</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={COLORS.outline} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handlePrivacyPolicy}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="shield-outline" size={20} color={COLORS.onSurface} />
                <Text style={styles.settingLabel}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={COLORS.outline} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleTermsOfUse}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.onSurface} />
                <Text style={styles.settingLabel}>Terms of Use</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={COLORS.outline} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── About ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.onSurface} />
                <Text style={styles.settingLabel}>Archive Revision</Text>
              </View>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* ── Account ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="log-out-outline" size={20} color="#c44e3f" />
                <Text style={[styles.settingLabel, { color: COLORS.error }]}>
                  Leave Archive
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={COLORS.outline} />
            </TouchableOpacity>
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

  // ── Header ──
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.headlineSm,
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: FONTS.labelStamp,
    fontSize: 8,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    opacity: 0.55,
    marginTop: 2,
  },
  headerRight: {
    minWidth: 72,
  },

  scrollContent: {
    flex: 1,
  },

  // ── Sections ──
  section: {
    paddingHorizontal: SPACING.pageMargin,
    marginBottom: 36,
  },
  sectionLabel: {
    fontFamily: FONTS.labelCaps,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 8,
    opacity: 0.7,
  },

  // ── Archive Identity card — vertical document layout ──
  identityCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 5,
    padding: 18,
    ...CARD_SHADOW,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  photoContainer: {
    position: 'relative',
    width: 52,
    height: 52,
  },
  photoImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
  },
  photoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInfo: {
    gap: 3,
  },
  photoLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 7,
    color: COLORS.onSurface,
    letterSpacing: 2,
    opacity: 0.35,
  },
  photoHint: {
    fontFamily: FONTS.bodyMd,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    opacity: 0.7,
  },
  identityField: {
    gap: 4,
  },
  identityFieldLabel: {
    fontFamily: FONTS.labelStamp,
    fontSize: 7,
    color: COLORS.onSurface,
    letterSpacing: 2,
    opacity: 0.35,
  },
  identityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  identityName: {
    fontFamily: FONTS.headlineSm,
    fontSize: 16,
    color: COLORS.onSurface,
    letterSpacing: 0.3,
  },
  identityCode: {
    fontFamily: FONTS.labelStamp,
    fontSize: 13,
    color: COLORS.onSurface,
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  identityTwoCol: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  identityHalf: {
    flex: 1,
    gap: 4,
  },
  identityColRule: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.5,
    marginHorizontal: 16,
  },
  identityMeta: {
    fontFamily: FONTS.labelStamp,
    fontSize: 12,
    color: COLORS.onSurface,
    letterSpacing: 1,
    opacity: 0.7,
  },
  identityDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.5,
    marginVertical: 14,
  },

  // ── Standard setting cards (Data Management, Help, About, Account) ──
  settingCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 5,
    padding: 16,
    ...CARD_SHADOW,
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
    opacity: 0.6,
  },

  connectedBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    opacity: 0.7,
  },
  connectedText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 7,
    color: COLORS.secondary,
    letterSpacing: 1.5,
  },
  connectText: {
    fontFamily: FONTS.bodyMd,
    fontSize: 12,
    color: COLORS.primary,
    opacity: 0.85,
  },

  // ── PLANNED badge — small technical catalog tag ──
  comingSoonBadge: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 2,
    marginLeft: 6,
  },
  comingSoonText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 6,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    opacity: 0.55,
  },

  // ── Footer — almost-erased institutional stamp ──
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  stampBorder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.outlineVariant,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    transform: [{ rotate: '-2deg' }],
    opacity: 0.28,
  },
  stampText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    color: COLORS.onSurface,
    letterSpacing: 2,
  },
  stampSubtext: {
    fontFamily: FONTS.labelStamp,
    fontSize: 7,
    color: COLORS.onSurface,
    letterSpacing: 1.5,
    marginTop: 2,
  },
});
