import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState } from 'react-native';
import { Stamp } from '../types';
import { StorageService } from '../services/storage';
import { CloudStorageService } from '../services/cloudStorage';
import { ImageStorageService } from '../services/imageStorage';
import { PendingSyncService } from '../services/pendingSync';
import { useAuth } from './AuthContext';

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

function migratePhotos(s: Stamp): Stamp {
  if (!s.photos) {
    return { ...s, photos: s.photo ? [s.photo] : [] };
  }
  return s;
}

function migrateStamps(stamps: Stamp[]): Stamp[] {
  return stamps.map((s) => ({ ...s, icon: migrateIcon(s.icon) })).map(migratePhotos);
}

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

function stampsSignature(items: Stamp[]): string {
  return items
    .map((s) => `${s.id}:${s.updatedAt ?? s.createdAt}:${s.deletedAt ?? ''}`)
    .sort()
    .join('|');
}

interface StampsContextValue {
  stamps: Stamp[];
  loading: boolean;
  addStamp: (data: Omit<Stamp, 'id' | 'createdAt'>) => Promise<void>;
  updateStamp: (id: string, data: Omit<Stamp, 'id' | 'createdAt'>) => Promise<void>;
  deleteStamp: (id: string) => Promise<void>;
  loadStamps: () => Promise<void>;
  syncStampsFromCloud: () => Promise<boolean>;
}

const StampsContext = createContext<StampsContextValue | null>(null);

export function StampsProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);

  const stampsRef = useRef<Stamp[]>([]);
  useEffect(() => { stampsRef.current = stamps; }, [stamps]);

  const pushStampsToCloud = useCallback(async (uid: string, items: Stamp[]) => {
    try {
      await CloudStorageService.setStamps(uid, items);
      await PendingSyncService.clearPending(uid, 'stamps');
    } catch (error) {
      console.warn('Could not push stamps to cloud, will retry later:', error);
      await PendingSyncService.markPending(uid, 'stamps');
    }
  }, []);

  const loadStamps = useCallback(async () => {
    if (!userId) {
      setStamps([]);
      setLoading(false);
      return;
    }
    try {
      const parsed = await StorageService.getStamps(userId);
      if (parsed !== null) {
        const migrated = migrateStamps(parsed);
        const hadMigration = migrated.some(
          (s, i) => s.icon !== parsed[i].icon || !parsed[i].photos,
        );
        if (hadMigration) {
          await StorageService.setStamps(userId, migrated);
        }
        setStamps(migrated);
      } else {
        await StorageService.setStamps(userId, []);
        setStamps([]);
      }
    } catch (error) {
      console.error('Error loading stamps:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const flushPendingStamps = useCallback(async () => {
    if (!userId) return;
    const pending = await PendingSyncService.isPending(userId, 'stamps');
    if (!pending) return;
    const local = await StorageService.getStamps(userId) ?? stampsRef.current;
    await pushStampsToCloud(userId, local);
  }, [userId, pushStampsToCloud]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') flushPendingStamps();
    });
    return () => subscription.remove();
  }, [flushPendingStamps]);

  const syncStampsFromCloud = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    await flushPendingStamps();
    let cloud: Awaited<ReturnType<typeof CloudStorageService.getUserData>>;
    try {
      cloud = await CloudStorageService.getUserData(userId);
    } catch (error) {
      console.warn('Could not reach cloud to sync stamps:', error);
      return false;
    }
    if (!cloud?.stamps) return false;
    const cloudStamps = migrateStamps(cloud.stamps);
    const freshLocal = await StorageService.getStamps(userId) ?? stampsRef.current;
    const merged = mergeStamps(freshLocal, cloudStamps);
    await StorageService.setStamps(userId, merged);
    setStamps(merged);
    if (stampsSignature(merged) !== stampsSignature(cloudStamps)) {
      await pushStampsToCloud(userId, merged);
    }
    return true;
  }, [userId, flushPendingStamps, pushStampsToCloud]);

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
      if (cloud?.stamps) return;
      const local = await StorageService.getStamps(userId) ?? [];
      const seeded = await Promise.all(
        local.map(async (s) => ({
          ...s,
          photos: await ImageStorageService.uploadStampPhotos(userId, s.id, s.photos ?? []),
        })),
      );
      await StorageService.setStamps(userId, seeded);
      setStamps(seeded);
      await pushStampsToCloud(userId, seeded);
    })();
  }, [userId, pushStampsToCloud]);

  const persistStampPhotos = useCallback(async (uid: string, stampId: string, photos: string[]) => {
    try {
      const uploaded = await ImageStorageService.uploadStampPhotos(uid, stampId, photos);
      const updated = stampsRef.current.map((s) => (s.id === stampId ? { ...s, photos: uploaded } : s));
      await StorageService.setStamps(uid, updated);
      setStamps(updated);
      await pushStampsToCloud(uid, updated);
    } catch (error) {
      console.warn('Error uploading stamp photos to cloud storage:', error);
    }
  }, [pushStampsToCloud]);

  const addStamp = useCallback(async (data: Omit<Stamp, 'id' | 'createdAt'>) => {
    if (!userId) throw new Error('Cannot add a stamp while signed out');
    const now = new Date().toISOString();
    const stamp: Stamp = {
      ...data,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...stampsRef.current, stamp];
    await StorageService.setStamps(userId, updated);
    setStamps(updated);
    persistStampPhotos(userId, stamp.id, stamp.photos ?? []);
  }, [userId, persistStampPhotos]);

  const updateStamp = useCallback(async (id: string, data: Omit<Stamp, 'id' | 'createdAt'>) => {
    if (!userId) return;
    const updated = stampsRef.current.map((s) =>
      s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
    );
    try {
      await StorageService.setStamps(userId, updated);
      setStamps(updated);
      persistStampPhotos(userId, id, updated.find((s) => s.id === id)?.photos ?? []);
    } catch (error) {
      console.error('Error updating stamp:', error);
    }
  }, [userId, persistStampPhotos]);

  const deleteStamp = useCallback(async (id: string) => {
    if (!userId) return;
    const now = new Date().toISOString();
    const toDelete = stampsRef.current.find((s) => s.id === id);
    const updated = stampsRef.current.map((s) =>
      s.id === id ? { ...s, deletedAt: now, updatedAt: now } : s
    );
    try {
      await StorageService.setStamps(userId, updated);
      setStamps(updated);
      pushStampsToCloud(userId, updated);
      if (toDelete?.photos?.length) ImageStorageService.deleteStampPhotos(toDelete.photos);
    } catch (error) {
      console.error('Error deleting stamp:', error);
    }
  }, [userId, pushStampsToCloud]);

  useEffect(() => {
    loadStamps();
  }, [loadStamps]);

  const visibleStamps = useMemo(() => stamps.filter((s) => !s.deletedAt), [stamps]);

  return (
    <StampsContext.Provider value={{ stamps: visibleStamps, loading, addStamp, updateStamp, deleteStamp, loadStamps, syncStampsFromCloud }}>
      {children}
    </StampsContext.Provider>
  );
}

export function useStampsContext(): StampsContextValue {
  const ctx = useContext(StampsContext);
  if (!ctx) throw new Error('useStampsContext must be used inside StampsProvider');
  return ctx;
}
