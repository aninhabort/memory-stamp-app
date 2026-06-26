import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { STORAGE_KEYS } from '../services/storage';

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
      setIsAuthenticated(true);
      setUserId(session.user.id);
      setUserEmail(session.user.email ?? null);
      setHasAccount(true);

      // Load user name from AsyncStorage
      try {
        const storedName = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
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

    // Clear any leftover local data from a previously logged-in account on
    // this device, so the new account starts with a clean passport.
    await AsyncStorage.multiRemove([STORAGE_KEYS.STAMPS, STORAGE_KEYS.VOLUMES]);

    // Store user name in AsyncStorage (kept outside Supabase Auth's own profile fields)
    await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name);

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

    // Clear user name from AsyncStorage (stamps data is preserved)
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_NAME);

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
