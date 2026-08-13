import useMediaPermissionFlow from './useMediaPermissionFlow';

/**
 * Lazily requests photo-library access — only ever called from the moment
 * the user taps "Add Photo", never on app launch or during onboarding.
 * Returns `requestAccess(onGranted)` to call at that moment, and
 * `PermissionDialog` to render once in the calling component's tree.
 */
export function usePhotoPermission() {
  return useMediaPermissionFlow('photo', {
    explainerTitle: 'Add photos to your memories',
    explainerMessage: 'Memory Stamp needs access to your photos so you can choose pictures to add to your stamps.',
    deniedTitle: 'Photo access is turned off',
    deniedMessage: 'To add photos from your library, allow photo access in your device settings.',
  });
}
