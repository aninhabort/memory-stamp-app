import { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { CloudStorageService } from '../services/cloudStorage';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_NAME = 'Traveler';

export function useUserName() {
  const { userId } = useAuth();
  const [userName, setUserName] = useState(DEFAULT_NAME);

  const loadUserName = async () => {
    try {
      const stored = await StorageService.getUserName();
      if (stored) setUserName(stored);
    } catch (e) {
      console.error('Error loading user name:', e);
    }
  };

  useEffect(() => {
    loadUserName();
  }, []);

  // Sync with the cloud once we know which account is signed in. If the
  // account already has a name saved in the cloud, that takes precedence
  // (so a new device picks up the existing profile).
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const cloud = await CloudStorageService.getUserData(userId);
      if (cloud?.userName) {
        await StorageService.setUserName(cloud.userName);
        setUserName(cloud.userName);
      } else {
        const stored = await StorageService.getUserName();
        if (stored) await CloudStorageService.setUserName(userId, stored);
      }
    })();
  }, [userId]);

  const setUserNameAsync = async (name: string) => {
    const trimmed = name.trim() || DEFAULT_NAME;
    try {
      await StorageService.setUserName(trimmed);
      setUserName(trimmed);
      if (userId) await CloudStorageService.setUserName(userId, trimmed);
    } catch (e) {
      console.error('Error saving user name:', e);
    }
  };

  return { userName, setUserName: setUserNameAsync, reloadUserName: loadUserName };
}
