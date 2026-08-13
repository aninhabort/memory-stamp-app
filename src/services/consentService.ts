import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from '../constants/legal';

const PENDING_INTENT_KEY = '@memory_stamp_app:pendingConsent';
const PENDING_INTENT_TTL_MS = 60 * 60 * 1000; // 1 hour

export type ConsentSource = 'signup_email' | 'signup_google' | 'gate';

interface PendingConsentIntent {
  termsVersion: string;
  privacyVersion: string;
  consentedAt: string; // device-clock ISO timestamp, informational only
  source: ConsentSource;
}

interface ConsentRow {
  id: string;
  user_id: string;
  terms_version: string;
  privacy_version: string;
  source: string;
  consented_at: string;
}

/**
 * Records and checks acceptance of the Terms of Service / Privacy Policy.
 * Consent history lives in Supabase (`user_consents`, append-only — see the
 * SQL script delivered alongside this feature), so this mirrors the
 * throws-on-real-failure shape of CloudStorageService for the writes that
 * matter, while the reconciliation helpers below are deliberately
 * best-effort: ConsentGateScreen is the actual guarantee that every
 * authenticated session has a current consent record, not this fast path.
 */
export const ConsentService = {
  /**
   * Captures "the user just checked the box and tapped Create Account /
   * Google" before any Supabase session exists yet (email confirmation can
   * delay the session by an unknown amount of time). Not user-scoped —
   * there's no userId to scope it to at this point.
   */
  async recordIntent(source: ConsentSource): Promise<void> {
    const intent: PendingConsentIntent = {
      termsVersion: CURRENT_TERMS_VERSION,
      privacyVersion: CURRENT_PRIVACY_VERSION,
      consentedAt: new Date().toISOString(),
      source,
    };
    try {
      await AsyncStorage.setItem(PENDING_INTENT_KEY, JSON.stringify(intent));
    } catch (error) {
      console.warn('Could not record pending consent intent:', error);
    }
  },

  async clearIntent(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PENDING_INTENT_KEY);
    } catch (error) {
      console.warn('Could not clear pending consent intent:', error);
    }
  },

  async getPendingIntent(): Promise<PendingConsentIntent | null> {
    try {
      const stored = await AsyncStorage.getItem(PENDING_INTENT_KEY);
      if (!stored) return null;
      const intent: PendingConsentIntent = JSON.parse(stored);
      const age = Date.now() - new Date(intent.consentedAt).getTime();
      if (age > PENDING_INTENT_TTL_MS || age < 0) return null;
      return intent;
    } catch (error) {
      console.warn('Could not read pending consent intent:', error);
      return null;
    }
  },

  async getLatestConsent(uid: string): Promise<ConsentRow | null> {
    const { data, error } = await supabase
      .from('user_consents')
      .select('id, user_id, terms_version, privacy_version, source, consented_at')
      .eq('user_id', uid)
      .order('consented_at', { ascending: false })
      .limit(1)
      .maybeSingle<ConsentRow>();
    if (error) throw error;
    return data;
  },

  isCurrent(row: ConsentRow | null): boolean {
    if (!row) return false;
    return row.terms_version === CURRENT_TERMS_VERSION && row.privacy_version === CURRENT_PRIVACY_VERSION;
  },

  async insertConsent(uid: string, source: ConsentSource, clientRecordedAt?: string): Promise<void> {
    const { error } = await supabase.from('user_consents').insert({
      user_id: uid,
      terms_version: CURRENT_TERMS_VERSION,
      privacy_version: CURRENT_PRIVACY_VERSION,
      source,
      client_recorded_at: clientRecordedAt ?? null,
    });
    if (error) throw error;
  },

  /**
   * Best-effort fast path, called from AuthContext.applySession(): if a
   * fresh pending intent exists on this device and the account doesn't have
   * a current-version consent row yet, persist it and clear the flag. Never
   * throws — this only skips showing ConsentGateScreen in the common case,
   * it never substitutes for it.
   */
  async reconcilePendingIntent(uid: string): Promise<void> {
    try {
      const intent = await this.getPendingIntent();
      if (!intent) return;
      const latest = await this.getLatestConsent(uid);
      if (this.isCurrent(latest)) {
        await this.clearIntent();
        return;
      }
      await this.insertConsent(uid, intent.source, intent.consentedAt);
      await this.clearIntent();
    } catch (error) {
      console.warn('Could not reconcile pending consent intent:', error);
    }
  },

  /**
   * True if this session must be routed through the blocking consent gate.
   * Fails open (returns false) on a network/read error so a legitimate user
   * already using the app isn't locked out by a connectivity blip — it
   * re-checks on the next session change.
   */
  async needsGate(uid: string): Promise<boolean> {
    try {
      const latest = await this.getLatestConsent(uid);
      return !this.isCurrent(latest);
    } catch (error) {
      console.warn('Could not check consent status, failing open:', error);
      return false;
    }
  },
};
