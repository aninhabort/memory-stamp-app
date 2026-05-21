import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stamp } from '../types';

const STORAGE_KEY = '@memory_stamp_app:stamps';

const SAMPLE_STAMPS: Stamp[] = [
  {
    id: '1',
    title: 'Cristo Redentor',
    place: 'Rio de Janeiro',
    country: 'Brasil',
    category: 'viagem',
    icon: 'compass-outline',
    color: '#27AE60',
    date: '2024-01-20',
    note: 'Vista incrível ao amanhecer!',
    photos: [],
    createdAt: new Date('2024-01-20').toISOString(),
  },
  {
    id: '2',
    title: 'Rock in Rio',
    place: 'Rio de Janeiro',
    country: 'Brasil',
    category: 'show',
    icon: 'musical-notes-outline',
    color: '#9B59B6',
    date: '2024-09-21',
    photos: [],
    createdAt: new Date('2024-09-21').toISOString(),
  },
  {
    id: '3',
    title: 'Kioku Omakase',
    place: 'Tóquio',
    country: 'Japão',
    category: 'restaurante',
    icon: 'restaurant-outline',
    color: '#E74C3C',
    date: '2024-04-10',
    note: 'Melhor refeição da minha vida.',
    photos: [],
    createdAt: new Date('2024-04-10').toISOString(),
  },
  {
    id: '4',
    title: 'Carnaval de Veneza',
    place: 'Veneza',
    country: 'Itália',
    category: 'evento',
    icon: 'happy-outline',
    color: '#E67E22',
    date: '2024-02-13',
    photos: [],
    createdAt: new Date('2024-02-13').toISOString(),
  },
  {
    id: '5',
    title: 'Caminho de Santiago',
    place: 'Santiago de Compostela',
    country: 'Espanha',
    category: 'viagem',
    icon: 'flag-outline',
    color: '#4A90D9',
    date: '2024-06-30',
    note: '800km, muitas histórias e ampolas.',
    photos: [],
    createdAt: new Date('2024-06-30').toISOString(),
  },
  {
    id: '6',
    title: 'Café Central',
    place: 'Viena',
    country: 'Áustria',
    category: 'restaurante',
    icon: 'cafe-outline',
    color: '#1B2B4B',
    date: '2024-11-03',
    photos: [],
    createdAt: new Date('2024-11-03').toISOString(),
  },
];

// Mapa de emojis legados → nomes Ionicons equivalentes
const EMOJI_TO_IONICON: Record<string, string> = {
  '🌍': 'globe-outline',
  '🗼': 'flag-outline',
  '🎵': 'musical-notes-outline',
  '🍷': 'wine-outline',
  '🎉': 'happy-outline',
  '⛪': 'business-outline',
  '🏖️': 'sunny-outline',
  '🎭': 'people-outline',
  '🍕': 'pizza-outline',
  '☕': 'cafe-outline',
  '🎨': 'color-palette-outline',
  '🏔️': 'compass-outline',
  '🚢': 'boat-outline',
  '✈️': 'airplane-outline',
  '🎬': 'film-outline',
  '🏛️': 'library-outline',
};

function migrateIcon(icon: string): string {
  return EMOJI_TO_IONICON[icon] ?? icon;
}

// Migra stamp com photo (string) para photos (array) se ainda não foi migrado
function migratePhotos(s: Stamp): Stamp {
  if (!s.photos) {
    return { ...s, photos: s.photo ? [s.photo] : [] };
  }
  return s;
}

export function useStamps() {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);

  // Mirrors the stamps state so addStamp / deleteStamp can read the current
  // list without an extra AsyncStorage round-trip.
  const stampsRef = useRef<Stamp[]>([]);
  useEffect(() => { stampsRef.current = stamps; }, [stamps]);

  const loadStamps = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed: Stamp[] = JSON.parse(stored);
        // Migra ícones emoji → Ionicons e photo → photos
        const migrated = parsed
          .map((s) => ({ ...s, icon: migrateIcon(s.icon) }))
          .map(migratePhotos);
        const hadMigration = migrated.some(
          (s, i) => s.icon !== parsed[i].icon || !parsed[i].photos,
        );
        if (hadMigration) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        }
        setStamps(migrated);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_STAMPS));
        setStamps(SAMPLE_STAMPS);
      }
    } catch (error) {
      console.error('Erro ao carregar stamps:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addStamp = useCallback(async (data: Omit<Stamp, 'id' | 'createdAt'>) => {
    const stamp: Stamp = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...stampsRef.current, stamp];
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setStamps(updated);
    } catch (error) {
      console.error('Erro ao adicionar stamp:', error);
    }
  }, []);

  const deleteStamp = useCallback(async (id: string) => {
    const updated = stampsRef.current.filter((s) => s.id !== id);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setStamps(updated);
    } catch (error) {
      console.error('Erro ao remover stamp:', error);
    }
  }, []);

  useEffect(() => {
    loadStamps();
  }, [loadStamps]);

  return { stamps, loading, addStamp, deleteStamp, loadStamps };
}
