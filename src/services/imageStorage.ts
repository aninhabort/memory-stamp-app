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
        const response = await fetch(uri);
        const blob = await response.blob();
        const path = `${uid}/${stampId}/${Date.now()}-${index}.jpg`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true });
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
};
