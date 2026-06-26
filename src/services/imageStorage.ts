import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../config/firebase';

// Photos picked via expo-image-picker are local file:// (or content://) URIs,
// valid only on the device that created them. Anything already starting with
// http(s) has already been uploaded to Storage and just needs to pass through.
const isRemoteUrl = (uri: string) => uri.startsWith('http://') || uri.startsWith('https://');

export const ImageStorageService = {
  /**
   * Uploads any on-device photo URIs for a stamp to Firebase Storage and
   * returns the list with those replaced by their download URLs. Already-
   * remote URLs are left untouched.
   */
  async uploadStampPhotos(uid: string, stampId: string, photos: string[]): Promise<string[]> {
    return Promise.all(
      photos.map(async (uri, index) => {
        if (isRemoteUrl(uri)) return uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const photoRef = ref(storage, `users/${uid}/stamps/${stampId}/${Date.now()}-${index}.jpg`);
        await uploadBytes(photoRef, blob);
        return getDownloadURL(photoRef);
      }),
    );
  },

  /** Deletes any previously-uploaded (remote) photos for a stamp from Storage. */
  async deleteStampPhotos(photos: string[]): Promise<void> {
    await Promise.all(
      photos.filter(isRemoteUrl).map(async (url) => {
        try {
          await deleteObject(ref(storage, url));
        } catch (error) {
          console.warn('Error deleting stamp photo from storage:', error);
        }
      }),
    );
  },
};
