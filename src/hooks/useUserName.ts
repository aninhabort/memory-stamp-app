import { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';

const DEFAULT_NAME = 'Traveler';

export function useUserName() {
  const [userName, setUserName] = useState(DEFAULT_NAME);

  useEffect(() => {
    StorageService.getUserName().then((stored) => {
      if (stored) setUserName(stored);
    }).catch(() => {});
  }, []);

  const updateUserName = async (name: string) => {
    const trimmed = name.trim() || DEFAULT_NAME;
    try {
      await StorageService.setUserName(trimmed);
      setUserName(trimmed);
    } catch (e) {
      console.error('Error saving user name:', e);
    }
  };

  return { userName, updateUserName };
}
