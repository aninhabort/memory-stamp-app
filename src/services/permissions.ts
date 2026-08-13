import * as ImagePicker from 'expo-image-picker';
import { Linking } from 'react-native';
import type { CameraPermissionResponse, MediaLibraryPermissionResponse } from 'expo-image-picker';

/**
 * Normalized permission state used across the app's UI. expo-image-picker
 * itself only reports 'granted' | 'undetermined' | 'denied' (+ canAskAgain
 * and, for the media library, accessPrivileges) — this collapses that into
 * the states the UI actually needs to distinguish:
 *  - 'undetermined' — never asked yet (no permission UI shown until now)
 *  - 'granted'       — full access
 *  - 'limited'        — iOS "Select Photos..." partial library access
 *  - 'denied'         — previously denied, the OS may still re-prompt
 *  - 'blocked'        — previously denied and the OS won't prompt again;
 *                        the user must change it in system Settings
 */
export type PermissionUIStatus = 'undetermined' | 'granted' | 'limited' | 'denied' | 'blocked';

function normalize(response: CameraPermissionResponse | MediaLibraryPermissionResponse): PermissionUIStatus {
  if (response.status === 'granted') {
    const accessPrivileges = (response as MediaLibraryPermissionResponse).accessPrivileges;
    return accessPrivileges === 'limited' ? 'limited' : 'granted';
  }
  if (response.status === 'undetermined') return 'undetermined';
  return response.canAskAgain ? 'denied' : 'blocked';
}

export const PermissionsService = {
  normalize,

  async getPhotoLibraryStatus(): Promise<PermissionUIStatus> {
    const response = await ImagePicker.getMediaLibraryPermissionsAsync();
    return normalize(response);
  },

  async getCameraStatus(): Promise<PermissionUIStatus> {
    const response = await ImagePicker.getCameraPermissionsAsync();
    return normalize(response);
  },

  /** Human-readable label for read-only display (e.g. Settings rows). Never shows a raw OS status string. */
  statusLabel(status: PermissionUIStatus): string {
    switch (status) {
      case 'granted':      return 'Allowed';
      case 'limited':      return 'Limited';
      case 'denied':
      case 'blocked':      return 'Not Allowed';
      case 'undetermined': return 'Not Requested Yet';
    }
  },

  /** Opens the OS Settings app to this app's permission page. Never attempts to change the permission itself. */
  openSettings(): Promise<void> {
    return Linking.openSettings();
  },
};
