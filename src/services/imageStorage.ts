import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../config/supabase';

const BUCKET = 'stamp-photos';

// Photos picked via expo-image-picker are local file:// (or content://) URIs,
// valid only on the device that created them. Anything already starting with
// http(s) has already been uploaded to Storage and just needs to pass through.
const isRemoteUrl = (uri: string) => uri.startsWith('http://') || uri.startsWith('https://');

// Storage objects are keyed as `{uid}/{stampId}/{file}` so the bucket's RLS
// policies can scope reads/writes to the owning user's folder.
function extractStoragePath(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

// fetch() with local file:// or content:// URIs is unreliable in React Native.
// expo-file-system reads local files correctly on both iOS and Android.
async function readLocalFileAsUint8Array(uri: string): Promise<Uint8Array> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const ImageStorageService = {
  /**
   * Uploads any on-device photo URIs for a stamp to Supabase Storage and
   * returns the list with those replaced by their public URLs. Already-
   * remote URLs are left untouched.
   */
  async uploadStampPhotos(uid: string, stampId: string, photos: string[]): Promise<string[]> {
    return Promise.all(
      photos.map(async (uri, index) => {
        if (isRemoteUrl(uri)) return uri;
        const bytes = await readLocalFileAsUint8Array(uri);
        const path = `${uid}/${stampId}/${Date.now()}-${index}.jpg`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        return data.publicUrl;
      }),
    );
  },

  /** Deletes any previously-uploaded (remote) photos for a stamp from Storage. */
  async deleteStampPhotos(photos: string[]): Promise<void> {
    const paths = photos
      .filter(isRemoteUrl)
      .map(extractStoragePath)
      .filter((p): p is string => p !== null);
    if (!paths.length) return;
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) console.warn('Error deleting stamp photos from storage:', error);
  },

  /** Uploads a local URI as the user's profile photo and returns its public URL. */
  async uploadProfilePhoto(uid: string, localUri: string): Promise<string> {
    const bytes = await readLocalFileAsUint8Array(localUri);
    const path = `${uid}/profile/photo.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    // Cache-bust so the new photo shows after replacing the old one
    return `${data.publicUrl}?t=${Date.now()}`;
  },

  /** Deletes the user's profile photo from Storage. */
  async deleteProfilePhoto(uid: string): Promise<void> {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([`${uid}/profile/photo.jpg`]);
    if (error) console.warn('Error deleting profile photo:', error);
  },
};
