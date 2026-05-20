import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_NAME_KEY = '@memory_stamp_app:userName';
const DEFAULT_NAME = 'Viajante';

export function useUserName() {
  const [userName, setUserName] = useState(DEFAULT_NAME);

  useEffect(() => {
    AsyncStorage.getItem(USER_NAME_KEY).then((stored) => {
      if (stored) setUserName(stored);
    }).catch(() => {});
  }, []);

  const updateUserName = async (name: string) => {
    const trimmed = name.trim() || DEFAULT_NAME;
    try {
      await AsyncStorage.setItem(USER_NAME_KEY, trimmed);
      setUserName(trimmed);
    } catch (e) {
      console.error('Erro ao salvar nome do usuário:', e);
    }
  };

  return { userName, updateUserName };
}
