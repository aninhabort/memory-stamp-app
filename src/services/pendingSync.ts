import { StorageService, PendingSyncFlags } from './storage';

export type SyncKey = keyof PendingSyncFlags;

/**
 * Tracks which datasets failed to push to the cloud so they can be retried
 * later (on login, on app foreground, or on the next change) instead of
 * silently losing the update. The app stays usable offline either way —
 * this only affects when the cloud copy catches up.
 */
export const PendingSyncService = {
  async markPending(userId: string, key: SyncKey): Promise<void> {
    const current = await StorageService.getPendingSync(userId);
    await StorageService.setPendingSync(userId, { ...current, [key]: true });
  },

  async clearPending(userId: string, key: SyncKey): Promise<void> {
    const current = await StorageService.getPendingSync(userId);
    if (!current[key]) return;
    const rest = { ...current };
    delete rest[key];
    await StorageService.setPendingSync(userId, rest);
  },

  async isPending(userId: string, key: SyncKey): Promise<boolean> {
    const current = await StorageService.getPendingSync(userId);
    return !!current[key];
  },
};
