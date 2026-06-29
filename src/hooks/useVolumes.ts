import { useState, useCallback, useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { Stamp, Volume } from '../types';
import { StorageService } from '../services/storage';
import { CloudStorageService } from '../services/cloudStorage';
import { PendingSyncService } from '../services/pendingSync';
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
// letting one device's data silently overwrite the other's. Mirrors
// mergeStamps in useStamps.ts: the most recently modified copy wins, and a
// deletion tombstone (deletedAt + an updatedAt bump) is itself a valid
// "most recent" value, so a delete can't be undone by a stale copy still
// held by the other side.
function mergeVolumes(a: Volume[], b: Volume[]): Volume[] {
  const map = new Map<string, Volume>();
  const lastModified = (v: Volume) => v.updatedAt ?? v.createdAt;
  const put = (v: Volume) => {
    const existing = map.get(v.id);
    if (!existing || lastModified(v) > lastModified(existing)) {
      map.set(v.id, v);
    }
  };
  for (const v of a) put(v);
  for (const v of b) put(v);
  return Array.from(map.values());
}

// Fingerprint of a volume list's actual content — see stampsSignature in
// useStamps.ts for why this (rather than list length) decides whether a
// merge result needs to be pushed back to the cloud.
function volumesSignature(items: Volume[]): string {
  return items
    .map((v) => `${v.id}:${v.updatedAt ?? v.createdAt}:${v.deletedAt ?? ''}`)
    .sort()
    .join('|');
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
  // Includes tombstoned (deletedAt) entries — needed locally so merges never
  // resurrect a delete. Filtered for consumers via `visibleVolumes` below.
  const [volumes, setVolumes] = useState<Volume[]>([DEFAULT_VOLUME]);

  // Pushes to the cloud and never throws: on failure it records a pending
  // sync flag (see services/pendingSync.ts) instead, so a flaky connection
  // never blocks the offline-first local write that already happened.
  const pushVolumesToCloud = useCallback(async (uid: string, items: Volume[]) => {
    try {
      await CloudStorageService.setVolumes(uid, items);
      await PendingSyncService.clearPending(uid, 'volumes');
    } catch (error) {
      console.warn('Could not push volumes to cloud, will retry later:', error);
      await PendingSyncService.markPending(uid, 'volumes');
    }
  }, []);

  const loadVolumes = useCallback(async () => {
    if (!userId) {
      setVolumes([DEFAULT_VOLUME]);
      return;
    }
    try {
      const parsed = await StorageService.getVolumes(userId);
      if (parsed) {
        setVolumes(parsed.length > 0 ? parsed : [DEFAULT_VOLUME]);
      } else {
        await StorageService.setVolumes(userId, [DEFAULT_VOLUME]);
        setVolumes([DEFAULT_VOLUME]);
      }
    } catch {
      setVolumes([DEFAULT_VOLUME]);
    }
  }, [userId]);

  // Retries a previously failed cloud push, if one is still pending for
  // this account.
  const flushPendingVolumes = useCallback(async () => {
    if (!userId) return;
    const pending = await PendingSyncService.isPending(userId, 'volumes');
    if (!pending) return;
    const local = await StorageService.getVolumes(userId) ?? [DEFAULT_VOLUME];
    await pushVolumesToCloud(userId, local);
  }, [userId, pushVolumesToCloud]);

  // Retry on app foreground — covers the case where the failed push
  // happened while the device had no connectivity at all.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') flushPendingVolumes();
    });
    return () => subscription.remove();
  }, [flushPendingVolumes]);

  // Pulls the latest volumes from the cloud, if the signed-in account has
  // any saved there, and merges them with this device's local volumes
  // (union by id). Used both on login and whenever the Passport screen
  // regains focus, so changes made on another device show up here without
  // needing a full app restart, and without one device's data clobbering
  // the other's.
  const syncVolumesFromCloud = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    await flushPendingVolumes();
    let cloud: Awaited<ReturnType<typeof CloudStorageService.getUserData>>;
    try {
      cloud = await CloudStorageService.getUserData(userId);
    } catch (error) {
      console.warn('Could not reach cloud to sync volumes:', error);
      return false;
    }
    if (!cloud?.volumes) return false;
    const cloudVolumes = cloud.volumes.length > 0 ? cloud.volumes : [DEFAULT_VOLUME];
    const local = await StorageService.getVolumes(userId) ?? [DEFAULT_VOLUME];
    const merged = mergeVolumes(local, cloudVolumes);
    await StorageService.setVolumes(userId, merged);
    setVolumes(merged);
    // Push back whenever the merge actually changed something, not just
    // when the item count moved.
    if (volumesSignature(merged) !== volumesSignature(cloudVolumes)) {
      await pushVolumesToCloud(userId, merged);
    }
    return true;
  }, [userId, flushPendingVolumes, pushVolumesToCloud]);

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
      // Read from this account's own namespaced key — never another
      // account's local data, even if this device was previously used by
      // someone else, since each account's data lives under its own key.
      const local = await StorageService.getVolumes(userId) ?? [DEFAULT_VOLUME];
      await pushVolumesToCloud(userId, local);
    })();
  }, [userId, pushVolumesToCloud]);

  const addVolume = useCallback(async (name: string): Promise<Volume> => {
    // PassportScreen (the only caller) only mounts once signed in, so userId
    // is always set here; this guards the invariant rather than handling a
    // real runtime case.
    if (!userId) throw new Error('Cannot add a volume while signed out');
    const current = await StorageService.getVolumes(userId) ?? [DEFAULT_VOLUME];
    const activeCount = current.filter((v) => !v.deletedAt).length;
    const now = new Date().toISOString();
    const newVolume: Volume = {
      id: Date.now().toString(),
      name,
      volumeLabel: `VOLUME ${toRoman(activeCount + 1)}`,
      year: `EST. ${new Date().getFullYear()}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...current, newVolume];
    await StorageService.setVolumes(userId, updated);
    setVolumes(updated);
    pushVolumesToCloud(userId, updated);
    return newVolume;
  }, [userId, pushVolumesToCloud]);

  // Marks a volume (and any stamps that belong to it) as deleted instead of
  // removing them outright, for the same tombstone reason as deleteStamp in
  // useStamps.ts. Refuses to delete the last remaining volume so the user
  // always has at least one passport.
  const deleteVolume = useCallback(async (volumeId: string): Promise<boolean> => {
    if (!userId) return false;
    const current = await StorageService.getVolumes(userId) ?? [DEFAULT_VOLUME];
    const active = current.filter((v) => !v.deletedAt);
    if (active.length <= 1) return false;

    const now = new Date().toISOString();
    const updatedVolumes = current.map((v) =>
      v.id === volumeId ? { ...v, deletedAt: now, updatedAt: now } : v
    );
    await StorageService.setVolumes(userId, updatedVolumes);
    setVolumes(updatedVolumes);
    pushVolumesToCloud(userId, updatedVolumes);

    const stamps: Stamp[] = await StorageService.getStamps(userId) ?? [];
    const updatedStamps = stamps.map((s) =>
      !s.deletedAt && isInVolume(s, volumeId) ? { ...s, deletedAt: now, updatedAt: now } : s
    );
    if (updatedStamps.some((s, i) => s !== stamps[i])) {
      await StorageService.setStamps(userId, updatedStamps);
      CloudStorageService.setStamps(userId, updatedStamps).catch(async (error) => {
        console.warn('Could not push stamp deletions to cloud, will retry later:', error);
        await PendingSyncService.markPending(userId, 'stamps');
      });
    }

    return true;
  }, [userId, pushVolumesToCloud]);

  useEffect(() => { loadVolumes(); }, [loadVolumes]);

  // Hide tombstoned entries from consumers, falling back to the default
  // volume if every volume has been deleted (shouldn't happen given the
  // guard in deleteVolume, but keeps the UI from ever rendering an empty
  // shelf).
  const visibleVolumes = useMemo(() => {
    const visible = volumes.filter((v) => !v.deletedAt);
    return visible.length > 0 ? visible : [DEFAULT_VOLUME];
  }, [volumes]);

  return { volumes: visibleVolumes, addVolume, deleteVolume, loadVolumes, syncVolumesFromCloud };
}
