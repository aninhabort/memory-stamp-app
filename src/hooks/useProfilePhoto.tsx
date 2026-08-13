import { useState, useEffect, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { StorageService } from '../services/storage';
import { CloudStorageService } from '../services/cloudStorage';
import { ImageStorageService } from '../services/imageStorage';
import { useAuth } from '../contexts/AuthContext';
import { usePhotoPermission } from './usePhotoPermission';

export function useProfilePhoto() {
  const { userId } = useAuth();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { requestAccess: requestPhotoAccess, PermissionDialog: photoPermissionDialog } = usePhotoPermission();

  const loadProfilePhoto = useCallback(async () => {
    if (!userId) { setProfilePhotoUrl(null); return; }
    try {
      const stored = await StorageService.getProfilePhotoUrl(userId);
      if (stored) setProfilePhotoUrl(stored);
    } catch (e) {
      console.error('Error loading profile photo:', e);
    }
  }, [userId]);

  // On mount, load local then sync from cloud (cloud wins for multi-device)
  useEffect(() => {
    if (!userId) return;
    loadProfilePhoto();
    (async () => {
      try {
        const cloud = await CloudStorageService.getUserData(userId);
        if (cloud?.profilePhotoUrl) {
          await StorageService.setProfilePhotoUrl(userId, cloud.profilePhotoUrl);
          setProfilePhotoUrl(cloud.profilePhotoUrl);
        }
      } catch (e) {
        console.warn('Could not sync profile photo from cloud:', e);
      }
    })();
  }, [userId, loadProfilePhoto]);

  const launchPickerAndUpload = useCallback(async () => {
    if (!userId) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const url = await ImageStorageService.uploadProfilePhoto(userId, result.assets[0].uri);
      await StorageService.setProfilePhotoUrl(userId, url);
      await CloudStorageService.setProfilePhotoUrl(userId, url);
      setProfilePhotoUrl(url);
    } catch (e) {
      console.error('Error uploading profile photo:', e);
    } finally {
      setUploading(false);
    }
  }, [userId]);

  // Permission is requested here — lazily, only when the user taps to
  // change their profile photo — never on mount.
  const pickAndUpload = useCallback(() => {
    if (!userId) return;
    requestPhotoAccess(launchPickerAndUpload);
  }, [userId, requestPhotoAccess, launchPickerAndUpload]);

  // Called from AuthContext after OAuth login to store the provider avatar
  const setFromUrl = useCallback(async (url: string) => {
    if (!userId) return;
    try {
      await StorageService.setProfilePhotoUrl(userId, url);
      await CloudStorageService.setProfilePhotoUrl(userId, url);
      setProfilePhotoUrl(url);
    } catch (e) {
      console.warn('Could not save OAuth profile photo:', e);
    }
  }, [userId]);

  return {
    profilePhotoUrl,
    uploading,
    pickAndUpload,
    setFromUrl,
    reloadProfilePhoto: loadProfilePhoto,
    photoPermissionDialog,
  };
}
