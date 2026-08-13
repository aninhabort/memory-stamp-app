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

  /**
   * Deletes every object under this user's `{uid}/` prefix (all stamp
   * photos plus the profile photo) — used by account deletion. Two-level
   * list matching the only key shapes this app writes: `{uid}/{stampId}/{file}`
   * and `{uid}/profile/photo.jpg`. Deleting rows out of `storage.objects` via
   * SQL only removes metadata, not the physical blobs, so this must go
   * through the Storage SDK — hence it's client-side, not part of the
   * account-deletion RPC.
   */
  async deleteAllUserObjects(uid: string): Promise<void> {
    const { data: entries, error } = await supabase.storage.from(BUCKET).list(uid, { limit: 1000 });
    if (error) throw error;

    const paths: string[] = [];
    for (const entry of entries ?? []) {
      if (entry.id === null) {
        // A "folder" (e.g. a stampId or "profile") — list its contents.
        const { data: nested, error: nestedError } = await supabase.storage
          .from(BUCKET)
          .list(`${uid}/${entry.name}`, { limit: 1000 });
        if (nestedError) throw nestedError;
        for (const file of nested ?? []) paths.push(`${uid}/${entry.name}/${file.name}`);
      } else {
        paths.push(`${uid}/${entry.name}`);
      }
    }

    if (paths.length) {
      const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
      if (removeError) throw removeError;
    }
  },
};
