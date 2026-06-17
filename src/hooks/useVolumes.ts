import { useState, useCallback, useEffect } from 'react';
import { Volume } from '../types';
import { StorageService } from '../services/storage';
import { CloudStorageService } from '../services/cloudStorage';
import { useAuth } from '../contexts/AuthContext';

const isInVolume = (stamp: { volumeId?: string }, volumeId: string) =>
  volumeId === 'default' ? (!stamp.volumeId || stamp.volumeId === 'default') : stamp.volumeId === volumeId;

export const DEFAULT_VOLUME: Volume = {
  id: 'default',
  name: 'Passport',
  volumeLabel: 'VOLUME I',
  year: 'EST. 2024',
  createdAt: new Date('2024-01-01').toISOString(),
};

// Combines two volume lists into their union, deduped by id. Used to
// reconcile volumes created independently on different devices instead of
// letting one device's data silently overwrite the other's.
function mergeVolumes(a: Volume[], b: Volume[]): Volume[] {
  const map = new Map<string, Volume>();
  for (const v of a) map.set(v.id, v);
  for (const v of b) map.set(v.id, v);
  return Array.from(map.values());
}

function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
}

export function useVolumes() {
  const { userId } = useAuth();
  const [volumes, setVolumes] = useState<Volume[]>([DEFAULT_VOLUME]);

  const loadVolumes = useCallback(async () => {
    try {
      const parsed = await StorageService.getVolumes();
      if (parsed) {
        setVolumes(parsed.length > 0 ? parsed : [DEFAULT_VOLUME]);
      } else {
        await StorageService.setVolumes([DEFAULT_VOLUME]);
        setVolumes([DEFAULT_VOLUME]);
      }
    } catch {
      setVolumes([DEFAULT_VOLUME]);
    }
  }, []);

  // Pulls the latest volumes from the cloud, if the signed-in account has
  // any saved there, and merges them with this device's local volumes
  // (union by id). Used both on login and whenever the Passport screen
  // regains focus, so changes made on another device show up here without
  // needing a full app restart, and without one device's data clobbering
  // the other's.
  const syncVolumesFromCloud = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    let cloud: Awaited<ReturnType<typeof CloudStorageService.getUserData>>;
    try {
      cloud = await CloudStorageService.getUserData(userId);
    } catch (error) {
      console.warn('Could not reach cloud to sync volumes:', error);
      return false;
    }
    if (!cloud?.volumes) return false;
    const cloudVolumes = cloud.volumes.length > 0 ? cloud.volumes : [DEFAULT_VOLUME];
    const local = await StorageService.getVolumes() ?? [DEFAULT_VOLUME];
    const merged = mergeVolumes(local, cloudVolumes);
    await StorageService.setVolumes(merged);
    setVolumes(merged);
    if (merged.length !== cloudVolumes.length) {
      await CloudStorageService.setVolumes(userId, merged);
    }
    return true;
  }, [userId]);

  // On first sign-in, if the account has no cloud volumes yet, seed the
  // cloud with this device's local data. Checks the cloud directly (rather
  // than relying on syncVolumesFromCloud's true/false) so a failed read is
  // never mistaken for "cloud confirmed empty", which would otherwise
  // overwrite real cloud data with this device's (possibly empty) local
  // state — see the matching fix in useStamps.ts.
  useEffect(() => {
    if (!userId) return;
    (async () => {
      let cloud: Awaited<ReturnType<typeof CloudStorageService.getUserData>>;
      try {
        cloud = await CloudStorageService.getUserData(userId);
      } catch (error) {
        console.warn('Could not verify cloud volumes before seeding, skipping:', error);
        return;
      }
      if (cloud?.volumes) return; // cloud already has data; syncVolumesFromCloud merges it in
      // Read from storage (not volumesRef) since it reflects this account's
      // local data — in-memory state may still hold a previous account's
      // volumes if it hasn't reloaded yet.
      const local = await StorageService.getVolumes() ?? [DEFAULT_VOLUME];
      await CloudStorageService.setVolumes(userId, local);
    })();
  }, [userId]);

  const addVolume = useCallback(async (name: string): Promise<Volume> => {
    const current = await StorageService.getVolumes();
    const volumes: Volume[] = current ?? [DEFAULT_VOLUME];
    const newVolume: Volume = {
      id: Date.now().toString(),
      name,
      volumeLabel: `VOLUME ${toRoman(volumes.length + 1)}`,
      year: `EST. ${new Date().getFullYear()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...volumes, newVolume];
    await StorageService.setVolumes(updated);
    setVolumes(updated);
    if (userId) await CloudStorageService.setVolumes(userId, updated);
    return newVolume;
  }, [userId]);

  // Removes a volume and any stamps that belong to it. Refuses to delete
  // the last remaining volume so the user always has at least one passport.
  const deleteVolume = useCallback(async (volumeId: string): Promise<boolean> => {
    const current = await StorageService.getVolumes() ?? [DEFAULT_VOLUME];
    if (current.length <= 1) return false;

    const updatedVolumes = current.filter(v => v.id !== volumeId);
    await StorageService.setVolumes(updatedVolumes);
    setVolumes(updatedVolumes);
    if (userId) await CloudStorageService.setVolumes(userId, updatedVolumes);

    const stamps = await StorageService.getStamps() ?? [];
    const remainingStamps = stamps.filter(s => !isInVolume(s, volumeId));
    if (remainingStamps.length !== stamps.length) {
      await StorageService.setStamps(remainingStamps);
      if (userId) await CloudStorageService.setStamps(userId, remainingStamps);
    }

    return true;
  }, [userId]);

  useEffect(() => { loadVolumes(); }, [loadVolumes]);

  return { volumes, addVolume, deleteVolume, loadVolumes, syncVolumesFromCloud };
}
