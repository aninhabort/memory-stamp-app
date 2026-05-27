import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stamp, Volume } from '../types';

/**
 * Centralized storage keys for the Memory Stamp App
 */
export const STORAGE_KEYS = {
  STAMPS: '@memory_stamp_app:stamps',
  VOLUMES: '@memory_stamp_app:volumes',
  USER_NAME: '@memory_stamp_app:userName',
} as const;

/**
 * Storage service providing type-safe access to AsyncStorage
 */
export const StorageService = {
  /**
   * Get stamps from storage
   */
  async getStamps(): Promise<Stamp[] | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.STAMPS);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading stamps:', error);
      return null;
    }
  },

  /**
   * Save stamps to storage
   */
  async setStamps(stamps: Stamp[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STAMPS, JSON.stringify(stamps));
    } catch (error) {
      console.error('Error saving stamps:', error);
      throw error;
    }
  },

  /**
   * Get volumes from storage
   */
  async getVolumes(): Promise<Volume[] | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.VOLUMES);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading volumes:', error);
      return null;
    }
  },

  /**
   * Save volumes to storage
   */
  async setVolumes(volumes: Volume[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VOLUMES, JSON.stringify(volumes));
    } catch (error) {
      console.error('Error saving volumes:', error);
      throw error;
    }
  },

  /**
   * Get user name from storage
   */
  async getUserName(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
    } catch (error) {
      console.error('Error loading user name:', error);
      return null;
    }
  },

  /**
   * Save user name to storage
   */
  async setUserName(name: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name);
    } catch (error) {
      console.error('Error saving user name:', error);
      throw error;
    }
  },

  /**
   * Clear all app data from storage (useful for debugging/testing)
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.STAMPS,
        STORAGE_KEYS.VOLUMES,
        STORAGE_KEYS.USER_NAME,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
};
