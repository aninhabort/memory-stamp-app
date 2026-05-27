import { useState, useCallback, useEffect } from 'react';
import { Volume } from '../types';
import { StorageService } from '../services/storage';

export const DEFAULT_VOLUME: Volume = {
  id: 'default',
  name: 'Passport',
  volumeLabel: 'VOLUME I',
  year: 'EST. 2024',
  createdAt: new Date('2024-01-01').toISOString(),
};

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
    return newVolume;
  }, []);

  useEffect(() => { loadVolumes(); }, [loadVolumes]);

  return { volumes, addVolume, loadVolumes };
}
