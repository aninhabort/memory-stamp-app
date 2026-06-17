import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Stamp, Volume } from '../types';

export interface UserData {
  stamps?: Stamp[];
  volumes?: Volume[];
  userName?: string;
}

const userDoc = (uid: string) => doc(db, 'users', uid);

// Firestore rejects `undefined` field values (even nested inside arrays/objects),
// but our Stamp/Volume types have several optional fields. Round-tripping
// through JSON strips any `undefined` values before writing.
const stripUndefined = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/**
 * Cloud-backed storage for the data that needs to follow the user across
 * devices (stamps, volumes, display name). Stored in a single Firestore
 * document per user, keyed by their Firebase Auth uid.
 */
export const CloudStorageService = {
  // Returns null only when the document is confirmed not to exist. If the
  // fetch itself fails, this throws instead of returning null — callers must
  // not treat "couldn't check" the same as "confirmed empty", since doing so
  // risks overwriting real cloud data with an empty local state on the next
  // sign-in from a fresh device.
  async getUserData(uid: string): Promise<UserData | null> {
    try {
      const snapshot = await getDoc(userDoc(uid));
      return snapshot.exists() ? (snapshot.data() as UserData) : null;
    } catch (error) {
      // Right after launch the device's network connection isn't always
      // ready yet, which Firestore reports as "client is offline" even
      // though the request would succeed moments later. Retry once after a
      // short delay before giving up.
      if (error instanceof Error && error.message.includes('client is offline')) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const snapshot = await getDoc(userDoc(uid));
        return snapshot.exists() ? (snapshot.data() as UserData) : null;
      }
      throw error;
    }
  },

  async setStamps(uid: string, stamps: Stamp[]): Promise<void> {
    try {
      await setDoc(userDoc(uid), { stamps: stripUndefined(stamps) }, { merge: true });
    } catch (error) {
      console.error('Error saving stamps to cloud:', error);
    }
  },

  async setVolumes(uid: string, volumes: Volume[]): Promise<void> {
    try {
      await setDoc(userDoc(uid), { volumes: stripUndefined(volumes) }, { merge: true });
    } catch (error) {
      console.error('Error saving volumes to cloud:', error);
    }
  },

  async setUserName(uid: string, userName: string): Promise<void> {
    try {
      await setDoc(userDoc(uid), { userName }, { merge: true });
    } catch (error) {
      console.error('Error saving user name to cloud:', error);
    }
  },
};
