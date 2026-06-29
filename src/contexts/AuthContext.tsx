import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { StorageService } from '../services/storage';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  hasAccount: boolean;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasAccount, setHasAccount] = useState(false);

  const applySession = async (session: Session | null) => {
    if (session?.user) {
      const uid = session.user.id;
      // One-time, best-effort migration of this device's pre-namespacing
      // local data into this account's own keys. Must finish before userId
      // is published, since every hook gates its storage reads on userId
      // being set and reads from the now-namespaced keys.
      await StorageService.migrateLegacyData(uid);

      setIsAuthenticated(true);
      setUserId(uid);
      setUserEmail(session.user.email ?? null);
      setHasAccount(true);

      // Load user name from this account's own namespaced storage
      try {
        const storedName = await StorageService.getUserName(uid);
        setUserName(storedName);
      } catch (error) {
        console.error('Error loading user name:', error);
      }
    } else {
      setIsAuthenticated(false);
      setUserId(null);
      setUserEmail(null);
      setUserName(null);
    }
  };

  // Listen to Supabase auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signup = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      // Match on the API's stable error code rather than the message text —
      // messages like "email rate limit exceeded" contain the word "email"
      // and would otherwise be misreported as an invalid email address.
      switch (error.code) {
        case 'user_already_exists':
        case 'email_exists':
          throw new Error('This email is already registered');
        case 'weak_password':
          throw new Error('Password should be at least 6 characters');
        case 'email_address_invalid':
          throw new Error('Invalid email address');
        case 'over_email_send_rate_limit':
          throw new Error('Too many attempts. Please wait a few minutes and try again.');
        case 'signup_disabled':
          throw new Error('Sign ups are currently disabled.');
        default:
          throw new Error(error.message);
      }
    }

    // Email confirmation is enabled in the Supabase project — there's no
    // session yet, so there's nothing to log in to until the user confirms.
    if (!data.session) {
      throw new Error('Check your email to confirm your account before signing in.');
    }

    // Each account's local data lives under its own namespaced storage key
    // (see services/storage.ts), so a brand-new account is naturally
    // isolated from whatever a previous account left on this device —
    // there's nothing to clear here.
    const uid = data.session.user.id;
    await StorageService.setUserName(uid, name);

    // State will be updated by onAuthStateChange listener
    setUserName(name);
    setHasAccount(true);
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      switch (error.code) {
        case 'invalid_credentials':
          throw new Error('Invalid email or password');
        case 'email_not_confirmed':
          throw new Error('Please confirm your email before signing in.');
        case 'over_request_rate_limit':
          throw new Error('Too many failed attempts. Please try again later.');
        default:
          throw new Error(error.message);
      }
    }

    // State will be updated by onAuthStateChange listener
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
      throw error;
    }

    // Nothing to clear: this account's data lives under its own namespaced
    // storage key, so the next account signed into this device can only
    // ever read its own keys, never this one's.
    // State will be updated by onAuthStateChange listener
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userId,
        userName,
        userEmail,
        hasAccount,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
