import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stamp, Volume } from '../types';

const NAMESPACE = '@memory_stamp_app';

// Pre-namespacing keys (every account on the device used to share these).
// Used once to migrate a device's existing local data into the first
// account that signs in after this update, then deleted — so a different
// account signing into the same device later can never inherit them.
const LEGACY_KEYS = {
  STAMPS: `${NAMESPACE}:stamps`,
  VOLUMES: `${NAMESPACE}:volumes`,
  USER_NAME: `${NAMESPACE}:userName`,
} as const;

function buildKey(userId: string, suffix: string): string {
  return `${NAMESPACE}:${userId}:${suffix}`;
}

export interface PendingSyncFlags {
  stamps?: boolean;
  volumes?: boolean;
  userName?: boolean;
}

/**
 * Storage service providing type-safe, per-account access to AsyncStorage.
 * Every key is namespaced with the Supabase auth user id so that two
 * accounts signed into the same device never read or write each other's
 * stamps, volumes or profile data.
 */
export const StorageService = {
  async getStamps(userId: string): Promise<Stamp[] | null> {
    try {
      const stored = await AsyncStorage.getItem(buildKey(userId, 'stamps'));
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading stamps:', error);
      return null;
    }
  },

  async setStamps(userId: string, stamps: Stamp[]): Promise<void> {
    try {
      await AsyncStorage.setItem(buildKey(userId, 'stamps'), JSON.stringify(stamps));
    } catch (error) {
      console.error('Error saving stamps:', error);
      throw error;
    }
  },

  async getVolumes(userId: string): Promise<Volume[] | null> {
    try {
      const stored = await AsyncStorage.getItem(buildKey(userId, 'volumes'));
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading volumes:', error);
      return null;
    }
  },

  async setVolumes(userId: string, volumes: Volume[]): Promise<void> {
    try {
      await AsyncStorage.setItem(buildKey(userId, 'volumes'), JSON.stringify(volumes));
    } catch (error) {
      console.error('Error saving volumes:', error);
      throw error;
    }
  },

  async getUserName(userId: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(buildKey(userId, 'userName'));
    } catch (error) {
      console.error('Error loading user name:', error);
      return null;
    }
  },

  async setUserName(userId: string, name: string): Promise<void> {
    try {
      await AsyncStorage.setItem(buildKey(userId, 'userName'), name);
    } catch (error) {
      console.error('Error saving user name:', error);
      throw error;
    }
  },

  /** Flags for which datasets still need to be retried against the cloud after a failed push. */
  async getPendingSync(userId: string): Promise<PendingSyncFlags> {
    try {
      const stored = await AsyncStorage.getItem(buildKey(userId, 'pendingSync'));
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading pending sync flags:', error);
      return {};
    }
  },

  async setPendingSync(userId: string, flags: PendingSyncFlags): Promise<void> {
    try {
      const key = buildKey(userId, 'pendingSync');
      const hasAny = Object.values(flags).some(Boolean);
      if (!hasAny) {
        await AsyncStorage.removeItem(key);
        return;
      }
      await AsyncStorage.setItem(key, JSON.stringify(flags));
    } catch (error) {
      console.error('Error saving pending sync flags:', error);
    }
  },

  /**
   * One-time, best-effort migration of this device's pre-namespacing local
   * data into `userId`'s namespaced keys. Only does anything if the legacy
   * keys are still present; always deletes them afterwards (even if there
   * was nothing to copy) so they can never be read again by a different
   * account that later signs into this device.
   */
  async migrateLegacyData(userId: string): Promise<void> {
    try {
      const [legacyStamps, legacyVolumes, legacyUserName] = await Promise.all([
        AsyncStorage.getItem(LEGACY_KEYS.STAMPS),
        AsyncStorage.getItem(LEGACY_KEYS.VOLUMES),
        AsyncStorage.getItem(LEGACY_KEYS.USER_NAME),
      ]);
      if (legacyStamps === null && legacyVolumes === null && legacyUserName === null) {
        return;
      }

      const writes: Promise<void>[] = [];
      if (legacyStamps !== null && (await AsyncStorage.getItem(buildKey(userId, 'stamps'))) === null) {
        writes.push(AsyncStorage.setItem(buildKey(userId, 'stamps'), legacyStamps));
      }
      if (legacyVolumes !== null && (await AsyncStorage.getItem(buildKey(userId, 'volumes'))) === null) {
        writes.push(AsyncStorage.setItem(buildKey(userId, 'volumes'), legacyVolumes));
      }
      if (legacyUserName !== null && (await AsyncStorage.getItem(buildKey(userId, 'userName'))) === null) {
        writes.push(AsyncStorage.setItem(buildKey(userId, 'userName'), legacyUserName));
      }
      await Promise.all(writes);
      await AsyncStorage.multiRemove([LEGACY_KEYS.STAMPS, LEGACY_KEYS.VOLUMES, LEGACY_KEYS.USER_NAME]);
    } catch (error) {
      console.error('Error migrating legacy storage:', error);
    }
  },

  /**
   * Clears all locally stored data for one account (stamps, volumes,
   * profile name, pending-sync flags). Never touches other accounts'
   * namespaced keys on the same device.
   */
  async clearAll(userId: string): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        buildKey(userId, 'stamps'),
        buildKey(userId, 'volumes'),
        buildKey(userId, 'userName'),
        buildKey(userId, 'pendingSync'),
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
};
