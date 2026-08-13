import useMediaPermissionFlow from './useMediaPermissionFlow';

/**
 * Lazily requests camera access — only ever called from the moment the user
 * taps "Take Photo", never on app launch or during onboarding. Returns
 * `requestAccess(onGranted)` to call at that moment, and `PermissionDialog`
 * to render once in the calling component's tree.
 */
export function useCameraPermission() {
  return useMediaPermissionFlow('camera', {
    explainerTitle: 'Take a photo',
    explainerMessage: 'Memory Stamp needs access to your camera so you can capture a memory.',
    deniedTitle: 'Camera access is turned off',
    deniedMessage: 'To take photos with your camera, allow camera access in your device settings.',
  });
}
