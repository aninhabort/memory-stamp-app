import { useState, useEffect, useCallback, useRef } from 'react';
import { Stamp } from '../types';
import { StorageService } from '../services/storage';
import { CloudStorageService } from '../services/cloudStorage';
import { ImageStorageService } from '../services/imageStorage';
import { useAuth } from '../contexts/AuthContext';

const SAMPLE_STAMPS: Stamp[] = [
  {
    id: '1',
    title: 'Cristo Redentor',
    place: 'Rio de Janeiro',
    country: 'Brasil',
    category: 'viagem',
    icon: 'compass-outline',
    color: '#27AE60',
    date: '2024-01-20',
    note: 'Vista incrível ao amanhecer!',
    photos: [],
    createdAt: new Date('2024-01-20').toISOString(),
  },
  {
    id: '2',
    title: 'Rock in Rio',
    place: 'Rio de Janeiro',
    country: 'Brasil',
    category: 'show',
    icon: 'musical-notes-outline',
    color: '#9B59B6',
    date: '2024-09-21',
    photos: [],
    createdAt: new Date('2024-09-21').toISOString(),
  },
  {
    id: '3',
    title: 'Kioku Omakase',
    place: 'Tóquio',
    country: 'Japão',
    category: 'restaurante',
    icon: 'restaurant-outline',
    color: '#E74C3C',
    date: '2024-04-10',
    note: 'Melhor refeição da minha vida.',
    photos: [],
    createdAt: new Date('2024-04-10').toISOString(),
  },
  {
    id: '4',
    title: 'Carnaval de Veneza',
    place: 'Veneza',
    country: 'Itália',
    category: 'evento',
    icon: 'happy-outline',
    color: '#E67E22',
    date: '2024-02-13',
    photos: [],
    createdAt: new Date('2024-02-13').toISOString(),
  },
  {
    id: '5',
    title: 'Caminho de Santiago',
    place: 'Santiago de Compostela',
    country: 'Espanha',
    category: 'viagem',
    icon: 'flag-outline',
    color: '#4A90D9',
    date: '2024-06-30',
    note: '800km, muitas histórias e ampolas.',
    photos: [],
    createdAt: new Date('2024-06-30').toISOString(),
  },
  {
    id: '6',
    title: 'Café Central',
    place: 'Viena',
    country: 'Áustria',
    category: 'restaurante',
    icon: 'cafe-outline',
    color: '#1B2B4B',
    date: '2024-11-03',
    photos: [],
    createdAt: new Date('2024-11-03').toISOString(),
  },
];

// Legacy emoji to Ionicons name mapping
const EMOJI_TO_IONICON: Record<string, string> = {
  '🌍': 'globe-outline',
  '🗼': 'flag-outline',
  '🎵': 'musical-notes-outline',
  '🍷': 'wine-outline',
  '🎉': 'happy-outline',
  '⛪': 'business-outline',
  '🏖️': 'sunny-outline',
  '🎭': 'people-outline',
  '🍕': 'pizza-outline',
  '☕': 'cafe-outline',
  '🎨': 'color-palette-outline',
  '🏔️': 'compass-outline',
  '🚢': 'boat-outline',
  '✈️': 'airplane-outline',
  '🎬': 'film-outline',
  '🏛️': 'library-outline',
};

function migrateIcon(icon: string): string {
  return EMOJI_TO_IONICON[icon] ?? icon;
}

// Migrate stamp with photo (string) to photos (array) if not yet migrated
function migratePhotos(s: Stamp): Stamp {
  if (!s.photos) {
    return { ...s, photos: s.photo ? [s.photo] : [] };
  }
  return s;
}

// Migrate emoji icons → Ionicons and photo → photos
function migrateStamps(stamps: Stamp[]): Stamp[] {
  return stamps.map((s) => ({ ...s, icon: migrateIcon(s.icon) })).map(migratePhotos);
}

// Combines two stamp lists into their union, deduped by id. Used to
// reconcile stamps created/edited independently on different devices (or on
// this device while a background cloud push from another screen is still
// in flight) instead of letting one side's data silently overwrite the
// other's. When both sides have the same id, the one with the more recent
// updatedAt (falling back to createdAt for stamps from before that field
// existed) wins, rather than always preferring one side.
function mergeStamps(a: Stamp[], b: Stamp[]): Stamp[] {
  const map = new Map<string, Stamp>();
  const lastModified = (s: Stamp) => s.updatedAt ?? s.createdAt;
  const put = (s: Stamp) => {
    const existing = map.get(s.id);
    if (!existing || lastModified(s) > lastModified(existing)) {
      map.set(s.id, s);
    }
  };
  for (const s of a) put(s);
  for (const s of b) put(s);
  return Array.from(map.values());
}

export function useStamps() {
  const { userId } = useAuth();
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);

  // Mirrors the stamps state so addStamp / deleteStamp can read the current
  // list without an extra AsyncStorage round-trip.
  const stampsRef = useRef<Stamp[]>([]);
  useEffect(() => { stampsRef.current = stamps; }, [stamps]);

  const loadStamps = useCallback(async () => {
    try {
      const parsed = await StorageService.getStamps();
      if (parsed !== null) {
        const migrated = migrateStamps(parsed);
        const hadMigration = migrated.some(
          (s, i) => s.icon !== parsed[i].icon || !parsed[i].photos,
        );
        if (hadMigration) {
          await StorageService.setStamps(migrated);
        }
        setStamps(migrated);
      } else {
        // Start with empty stamps for new users
        await StorageService.setStamps([]);
        setStamps([]);
      }
    } catch (error) {
      console.error('Error loading stamps:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Pulls the latest stamps from the cloud, if the signed-in account has
  // any saved there, and merges them with this device's local stamps
  // (union by id). Used both on login and whenever the Passport screen
  // regains focus, so changes made on another device show up here without
  // needing a full app restart, and without one device's data clobbering
  // the other's.
  const syncStampsFromCloud = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    let cloud: Awaited<ReturnType<typeof CloudStorageService.getUserData>>;
    try {
      cloud = await CloudStorageService.getUserData(userId);
    } catch (error) {
      console.warn('Could not reach cloud to sync stamps:', error);
      return false;
    }
    if (!cloud?.stamps) return false;
    const cloudStamps = migrateStamps(cloud.stamps);
    // Merge against the freshest on-disk state, not this hook instance's
    // in-memory snapshot — another instance (e.g. the create-stamp screen)
    // may have just written a new stamp to storage that this instance's
    // state hasn't picked up yet. The cloud's copy can also lag behind a
    // moment (the upload that pushes a new stamp runs in the background),
    // so merging against a stale in-memory snapshot risked overwriting
    // storage with a copy that was missing that stamp.
    const freshLocal = await StorageService.getStamps() ?? stampsRef.current;
    const merged = mergeStamps(freshLocal, cloudStamps);
    await StorageService.setStamps(merged);
    setStamps(merged);
    if (merged.length !== cloudStamps.length) {
      await CloudStorageService.setStamps(userId, merged);
    }
    return true;
  }, [userId]);

  // On first sign-in, if the account has no cloud stamps yet, seed the
  // cloud with this device's local data. Checks the cloud directly (rather
  // than relying on syncStampsFromCloud's true/false) so a failed read —
  // e.g. network not ready yet right after launch — is never mistaken for
  // "cloud confirmed empty", which would otherwise overwrite real cloud data
  // with this device's (possibly empty) local state.
  useEffect(() => {
    if (!userId) return;
    (async () => {
      let cloud: Awaited<ReturnType<typeof CloudStorageService.getUserData>>;
      try {
        cloud = await CloudStorageService.getUserData(userId);
      } catch (error) {
        console.warn('Could not verify cloud stamps before seeding, skipping:', error);
        return;
      }
      if (cloud?.stamps) return; // cloud already has data; syncStampsFromCloud merges it in
      // Read from storage (not stampsRef) since it reflects this account's
      // local data — in-memory state may still hold a previous account's
      // stamps if it hasn't reloaded yet.
      const local = await StorageService.getStamps() ?? [];
      // Upload any on-device photo URIs first, otherwise the seeded cloud
      // document would carry local file:// paths that are meaningless once
      // read back from another device.
      const seeded = await Promise.all(
        local.map(async (s) => ({
          ...s,
          photos: await ImageStorageService.uploadStampPhotos(userId, s.id, s.photos ?? []),
        })),
      );
      await StorageService.setStamps(seeded);
      setStamps(seeded);
      await CloudStorageService.setStamps(userId, seeded);
    })();
  }, [userId]);

  // Uploads any on-device photo URIs for a stamp to Firebase Storage, then
  // patches the stamp with the resulting download URLs before pushing to
  // Firestore. Local file:// URIs are only valid on the device that created
  // them, so writing them to the cloud as-is would leave the image
  // unreachable after a reinstall or on another device. Runs in the
  // background (not awaited by callers) so it never blocks navigation.
  const persistStampPhotos = useCallback(async (uid: string, stampId: string, photos: string[]) => {
    try {
      const uploaded = await ImageStorageService.uploadStampPhotos(uid, stampId, photos);
      const updated = stampsRef.current.map((s) => (s.id === stampId ? { ...s, photos: uploaded } : s));
      await StorageService.setStamps(updated);
      setStamps(updated);
      await CloudStorageService.setStamps(uid, updated);
    } catch (error) {
      console.warn('Error uploading stamp photos to cloud storage:', error);
    }
  }, []);

  const addStamp = useCallback(async (data: Omit<Stamp, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const stamp: Stamp = {
      ...data,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...stampsRef.current, stamp];
    try {
      await StorageService.setStamps(updated);
      setStamps(updated);
      // Cloud sync (and any photo upload) is best-effort in the background —
      // not awaited so it never blocks navigation when Firestore/Storage are
      // slow or offline.
      if (userId) persistStampPhotos(userId, stamp.id, stamp.photos ?? []);
    } catch (error) {
      console.error('Error adding stamp:', error);
    }
  }, [userId, persistStampPhotos]);

  const updateStamp = useCallback(async (id: string, data: Omit<Stamp, 'id' | 'createdAt'>) => {
    const updated = stampsRef.current.map((s) =>
      s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
    );
    try {
      await StorageService.setStamps(updated);
      setStamps(updated);
      if (userId) persistStampPhotos(userId, id, updated.find((s) => s.id === id)?.photos ?? []);
    } catch (error) {
      console.error('Error updating stamp:', error);
    }
  }, [userId, persistStampPhotos]);

  const deleteStamp = useCallback(async (id: string) => {
    const toDelete = stampsRef.current.find((s) => s.id === id);
    const updated = stampsRef.current.filter((s) => s.id !== id);
    try {
      await StorageService.setStamps(updated);
      setStamps(updated);
      if (userId) {
        CloudStorageService.setStamps(userId, updated);
        if (toDelete?.photos?.length) ImageStorageService.deleteStampPhotos(toDelete.photos);
      }
    } catch (error) {
      console.error('Error deleting stamp:', error);
    }
  }, [userId]);

  useEffect(() => {
    loadStamps();
  }, [loadStamps]);

  return { stamps, loading, addStamp, updateStamp, deleteStamp, loadStamps, syncStampsFromCloud };
}
