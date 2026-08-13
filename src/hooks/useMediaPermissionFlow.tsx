import React, { useCallback, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { AppDialog } from '../components/AppDialog';
import { PermissionsService } from '../services/permissions';

type MediaKind = 'photo' | 'camera';

interface MediaPermissionCopy {
  explainerTitle: string;
  explainerMessage: string;
  deniedTitle: string;
  deniedMessage: string;
}

type DialogState = 'none' | 'explainer' | 'denied';

/**
 * Shared implementation behind usePhotoPermission/useCameraPermission.
 *
 * Deliberately callback-based (`onGranted`, not a Promise the caller awaits)
 * to match how AppDialog is used everywhere else in this app: its `onClose`
 * prop always fires before an action's own `onPress` (see AppDialog.tsx),
 * so a naive Promise-resolver tied to `onClose` would resolve the wrong
 * outcome for actions that need an async follow-up (like "Continue", which
 * has to await the real OS permission prompt). A callback that's only ever
 * invoked on an actual grant sidesteps that ordering hazard entirely.
 */
function useMediaPermissionFlow(kind: MediaKind, copy: MediaPermissionCopy) {
  const [dialogState, setDialogState] = useState<DialogState>('none');
  const onGrantedRef = useRef<(() => void) | null>(null);

  const getStatus = kind === 'photo'
    ? ImagePicker.getMediaLibraryPermissionsAsync
    : ImagePicker.getCameraPermissionsAsync;
  const requestStatus = kind === 'photo'
    ? ImagePicker.requestMediaLibraryPermissionsAsync
    : ImagePicker.requestCameraPermissionsAsync;

  /**
   * Checks the current permission and, if access isn't already granted,
   * walks the user through the themed explainer (first ask) or the
   * "turned off, open Settings" dialog (previously denied) before asking
   * again. `onGranted` fires only once real access is confirmed — never on
   * cancel/deny, matching the "feature just doesn't open" behavior this app
   * already had before any of this permission UI existed.
   */
  const requestAccess = useCallback((onGranted: () => void) => {
    (async () => {
      const current = await getStatus();
      const status = PermissionsService.normalize(current);

      if (status === 'granted' || status === 'limited') {
        onGranted();
        return;
      }

      onGrantedRef.current = onGranted;
      setDialogState(status === 'blocked' ? 'denied' : 'explainer');
    })();
  }, [getStatus]);

  const handleDialogClose = useCallback(() => {
    setDialogState('none');
  }, []);

  const handleCancel = useCallback(() => {
    onGrantedRef.current = null;
  }, []);

  const handleContinue = useCallback(async () => {
    const result = await requestStatus();
    const status = PermissionsService.normalize(result);
    if (status === 'granted' || status === 'limited') {
      const onGranted = onGrantedRef.current;
      onGrantedRef.current = null;
      onGranted?.();
    } else if (status === 'blocked') {
      // The OS just denied it permanently (e.g. iOS never re-prompts after
      // the first "Don't Allow") — fall through to the Settings dialog
      // instead of silently giving up.
      setDialogState('denied');
    } else {
      onGrantedRef.current = null;
    }
  }, [requestStatus]);

  const handleOpenSettings = useCallback(() => {
    onGrantedRef.current = null;
    PermissionsService.openSettings();
  }, []);

  const PermissionDialog = (
    <AppDialog
      visible={dialogState !== 'none'}
      onClose={handleDialogClose}
      label={dialogState === 'denied' ? 'ACCESS NEEDED' : 'PERMISSION'}
      title={dialogState === 'denied' ? copy.deniedTitle : copy.explainerTitle}
      message={dialogState === 'denied' ? copy.deniedMessage : copy.explainerMessage}
      actions={
        dialogState === 'denied'
          ? [
              { text: 'Maybe Later', style: 'cancel', onPress: handleCancel },
              { text: 'Open Settings', onPress: handleOpenSettings },
            ]
          : [
              { text: 'Cancel', style: 'cancel', onPress: handleCancel },
              { text: 'Continue', onPress: handleContinue },
            ]
      }
    />
  );

  return { requestAccess, PermissionDialog };
}

export default useMediaPermissionFlow;
