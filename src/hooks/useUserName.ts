import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storage';
import { CloudStorageService } from '../services/cloudStorage';
import { PendingSyncService } from '../services/pendingSync';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_NAME = 'Traveler';

export function useUserName() {
  const { userId } = useAuth();
  const [userName, setUserName] = useState(DEFAULT_NAME);

  // Pushes to the cloud and never throws: on failure it records a pending
  // sync flag (see services/pendingSync.ts) instead, so a flaky connection
  // never blocks the offline-first local write that already happened.
  const pushUserNameToCloud = useCallback(async (uid: string, name: string) => {
    try {
      await CloudStorageService.setUserName(uid, name);
      await PendingSyncService.clearPending(uid, 'userName');
    } catch (error) {
      console.warn('Could not push user name to cloud, will retry later:', error);
      await PendingSyncService.markPending(uid, 'userName');
    }
  }, []);

  const loadUserName = useCallback(async () => {
    if (!userId) {
      setUserName(DEFAULT_NAME);
      return;
    }
    try {
      const stored = await StorageService.getUserName(userId);
      if (stored) setUserName(stored);
    } catch (e) {
      console.error('Error loading user name:', e);
    }
  }, [userId]);

  useEffect(() => {
    loadUserName();
  }, [loadUserName]);

  // Sync with the cloud once we know which account is signed in. If the
  // account already has a name saved in the cloud, that takes precedence
  // (so a new device picks up the existing profile).
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const cloud = await CloudStorageService.getUserData(userId);
        if (cloud?.userName) {
          await StorageService.setUserName(userId, cloud.userName);
          setUserName(cloud.userName);
        } else {
          const stored = await StorageService.getUserName(userId);
          if (stored) await pushUserNameToCloud(userId, stored);
        }
      } catch (error) {
        console.warn('Could not reach cloud to sync user name:', error);
      }
    })();
  }, [userId, pushUserNameToCloud]);

  const setUserNameAsync = async (name: string) => {
    if (!userId) return;
    const trimmed = name.trim() || DEFAULT_NAME;
    try {
      await StorageService.setUserName(userId, trimmed);
      setUserName(trimmed);
      pushUserNameToCloud(userId, trimmed);
    } catch (e) {
      console.error('Error saving user name:', e);
    }
  };

  return { userName, setUserName: setUserNameAsync, reloadUserName: loadUserName };
}
