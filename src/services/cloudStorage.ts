import { supabase } from '../config/supabase';
import { Stamp, Volume } from '../types';

export interface UserData {
  stamps?: Stamp[];
  volumes?: Volume[];
  userName?: string;
}

interface UserDataRow {
  stamps: Stamp[] | null;
  volumes: Volume[] | null;
  user_name: string | null;
}

/**
 * Cloud-backed storage for the data that needs to follow the user across
 * devices (stamps, volumes, display name). Stored in a single Postgres row
 * per user (`user_data`), keyed by their Supabase Auth user id.
 */
export const CloudStorageService = {
  // Returns null only when the row is confirmed not to exist. If the
  // fetch itself fails, this throws instead of returning null — callers must
  // not treat "couldn't check" the same as "confirmed empty", since doing so
  // risks overwriting real cloud data with an empty local state on the next
  // sign-in from a fresh device.
  async getUserData(uid: string): Promise<UserData | null> {
    const fetchRow = async () => {
      const { data, error } = await supabase
        .from('user_data')
        .select('stamps, volumes, user_name')
        .eq('user_id', uid)
        .maybeSingle<UserDataRow>();
      if (error) throw error;
      return data;
    };

    let row: UserDataRow | null;
    try {
      row = await fetchRow();
    } catch (error) {
      // Right after launch the device's network connection isn't always
      // ready yet. Retry once after a short delay before giving up.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      row = await fetchRow();
    }

    if (!row) return null;
    return {
      stamps: row.stamps ?? undefined,
      volumes: row.volumes ?? undefined,
      userName: row.user_name ?? undefined,
    };
  },

  async setStamps(uid: string, stamps: Stamp[]): Promise<void> {
    const { error } = await supabase
      .from('user_data')
      .upsert({ user_id: uid, stamps }, { onConflict: 'user_id' });
    if (error) console.error('Error saving stamps to cloud:', error);
  },

  async setVolumes(uid: string, volumes: Volume[]): Promise<void> {
    const { error } = await supabase
      .from('user_data')
      .upsert({ user_id: uid, volumes }, { onConflict: 'user_id' });
    if (error) console.error('Error saving volumes to cloud:', error);
  },

  async setUserName(uid: string, userName: string): Promise<void> {
    const { error } = await supabase
      .from('user_data')
      .upsert({ user_id: uid, user_name: userName }, { onConflict: 'user_id' });
    if (error) console.error('Error saving user name to cloud:', error);
  },
};
