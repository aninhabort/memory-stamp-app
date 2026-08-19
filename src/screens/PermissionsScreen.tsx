import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';
import { PermissionsService, PermissionUIStatus } from '../services/permissions';

const CARD_SHADOW = {
  shadowColor: '#05152b',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1,
};

interface Props {
  onComplete: () => void;
}

interface PermissionCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  status: PermissionUIStatus | null;
  onAllow: () => void;
  requesting: boolean;
}

function PermissionCard({ icon, title, description, status, onAllow, requesting }: PermissionCardProps) {
  const isGranted = status === 'granted' || status === 'limited';
  const isBlocked = status === 'blocked';
  const loading = status === null || requesting;

  return (
    <View style={styles.permCard}>
      <View style={styles.permCardLeft}>
        <View style={[styles.permIconWrap, isGranted && styles.permIconWrapGranted]}>
          <Ionicons
            name={icon}
            size={22}
            color={isGranted ? COLORS.tertiary : COLORS.primary}
          />
        </View>
        <View style={styles.permCardText}>
          <Text style={styles.permCardTitle}>{title}</Text>
          <Text style={styles.permCardDesc}>{description}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.onSurfaceVariant} />
      ) : isGranted ? (
        <View style={styles.permGrantedBadge}>
          <Ionicons name="checkmark" size={14} color={COLORS.tertiary} />
          <Text style={styles.permGrantedText}>ALLOWED</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.permAllowBtn}
          onPress={onAllow}
          activeOpacity={0.75}
        >
          <Text style={styles.permAllowBtnText}>
            {isBlocked ? 'SETTINGS' : 'ALLOW'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function PermissionsScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [photoStatus, setPhotoStatus] = useState<PermissionUIStatus | null>(null);
  const [cameraStatus, setCameraStatus] = useState<PermissionUIStatus | null>(null);
  const [requestingPhoto, setRequestingPhoto] = useState(false);
  const [requestingCamera, setRequestingCamera] = useState(false);

  const refreshStatuses = useCallback(async () => {
    const [photo, camera] = await Promise.all([
      PermissionsService.getPhotoLibraryStatus(),
      PermissionsService.getCameraStatus(),
    ]);
    setPhotoStatus(photo);
    setCameraStatus(camera);
  }, []);

  useEffect(() => {
    refreshStatuses();
  }, [refreshStatuses]);

  const handleAllowPhoto = useCallback(async () => {
    if (photoStatus === 'blocked') {
      PermissionsService.openSettings();
      return;
    }
    setRequestingPhoto(true);
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    const updated = await PermissionsService.getPhotoLibraryStatus();
    setPhotoStatus(updated);
    setRequestingPhoto(false);
  }, [photoStatus]);

  const handleAllowCamera = useCallback(async () => {
    if (cameraStatus === 'blocked') {
      PermissionsService.openSettings();
      return;
    }
    setRequestingCamera(true);
    await ImagePicker.requestCameraPermissionsAsync();
    const updated = await PermissionsService.getCameraStatus();
    setCameraStatus(updated);
    setRequestingCamera(false);
  }, [cameraStatus]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandBlock}>
          <View style={styles.passportIcon}>
            <Ionicons name="shield-checkmark-outline" size={30} color={COLORS.onPrimaryContainer} />
          </View>
          <Text style={styles.brandTitle}>MEMORY STAMP</Text>
          <Text style={styles.pageTitle}>Before We Begin</Text>
          <Text style={styles.pageSubtitle}>
            Allow access to add photos to your stamps. You can change these at any time in your device settings.
          </Text>
        </View>

        <View style={styles.formCard}>
          <PermissionCard
            icon="images-outline"
            title="Photo Library"
            description="Choose photos from your gallery to add to stamps."
            status={photoStatus}
            onAllow={handleAllowPhoto}
            requesting={requestingPhoto}
          />

          <View style={styles.divider} />

          <PermissionCard
            icon="camera-outline"
            title="Camera"
            description="Take a photo on the spot for a new stamp."
            status={cameraStatus}
            onAllow={handleAllowCamera}
            requesting={requestingCamera}
          />
        </View>

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={onComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>CONTINUE</Text>
        </TouchableOpacity>

        <Text style={styles.skipNote}>
          You can enable these later in Settings → Memory Stamp.
        </Text>
      </ScrollView>
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
    paddingBottom: 36,
  },

  brandBlock: {
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 14,
    opacity: 0.88,
  },
  brandTitle: {
    fontFamily: FONTS.labelStamp,
    fontSize: 20,
    color: COLORS.primary,
    letterSpacing: 3,
    marginBottom: 10,
  },
  pageTitle: {
    fontFamily: FONTS.headlineMd,
    fontSize: FONT_SIZES.headlineSm,
    color: COLORS.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontFamily: FONTS.bodyMd,
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },

  formCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginBottom: 20,
    ...CARD_SHADOW,
  },

  permCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  permCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  permIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  permIconWrapGranted: {
    backgroundColor: '#d6ede2',
  },
  permCardText: {
    flex: 1,
  },
  permCardTitle: {
    fontFamily: FONTS.labelCaps,
    fontSize: FONT_SIZES.labelCaps,
    color: COLORS.primary,
    marginBottom: 2,
  },
  permCardDesc: {
    fontFamily: FONTS.bodyMd,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    lineHeight: 16,
  },

  permAllowBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  permAllowBtnText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 12,
    color: COLORS.white,
    letterSpacing: 0.8,
  },

  permGrantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  permGrantedText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 11,
    color: COLORS.tertiary,
    letterSpacing: 0.5,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.5,
    marginHorizontal: -4,
  },

  continueBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 5,
    paddingVertical: 14,
    marginBottom: 14,
    ...CARD_SHADOW,
  },
  continueBtnText: {
    fontFamily: FONTS.labelStamp,
    fontSize: 15,
    color: COLORS.white,
    letterSpacing: 1.2,
  },

  skipNote: {
    fontFamily: FONTS.bodyMd,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
});
