import { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';

const DEFAULT_NAME = 'Traveler';

export function useUserName() {
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

  const setUserNameAsync = async (name: string) => {
    const trimmed = name.trim() || DEFAULT_NAME;
    try {
      await StorageService.setUserName(trimmed);
      setUserName(trimmed);
    } catch (e) {
      console.error('Error saving user name:', e);
    }
  };

  return { userName, setUserName: setUserNameAsync, reloadUserName: loadUserName };
}
