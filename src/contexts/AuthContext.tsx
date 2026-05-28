import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../services/storage';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userName: string | null;
  userEmail: string | null;
  hasAccount: boolean;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = '@memory_stamp_auth';
const USER_EMAIL_KEY = '@memory_stamp_user_email';
const USER_PASSWORD_KEY = '@memory_stamp_user_password';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasAccount, setHasAccount] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const [authStatus, storedName, storedEmail] = await Promise.all([
        AsyncStorage.getItem(AUTH_KEY),
        AsyncStorage.getItem(STORAGE_KEYS.USER_NAME),
        AsyncStorage.getItem(USER_EMAIL_KEY),
      ]);

      // Check if account exists
      if (storedEmail) {
        setHasAccount(true);
      }

      // Check if authenticated
      if (authStatus === 'true' && storedName && storedEmail) {
        setIsAuthenticated(true);
        setUserName(storedName);
        setUserEmail(storedEmail);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(AUTH_KEY, 'true'),
        AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name),
        AsyncStorage.setItem(USER_EMAIL_KEY, email),
        AsyncStorage.setItem(USER_PASSWORD_KEY, password),
      ]);
      setIsAuthenticated(true);
      setUserName(name);
      setUserEmail(email);
      setHasAccount(true);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Get stored credentials
      const [storedEmail, storedPassword, storedName] = await Promise.all([
        AsyncStorage.getItem(USER_EMAIL_KEY),
        AsyncStorage.getItem(USER_PASSWORD_KEY),
        AsyncStorage.getItem(STORAGE_KEYS.USER_NAME),
      ]);

      // Validate credentials
      if (storedEmail !== email) {
        throw new Error('Invalid email address');
      }

      if (storedPassword !== password) {
        throw new Error('Incorrect password');
      }

      // Set authenticated
      await AsyncStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setUserName(storedName);
      setUserEmail(storedEmail);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        AUTH_KEY,
        STORAGE_KEYS.USER_NAME,
        USER_EMAIL_KEY,
        USER_PASSWORD_KEY,
      ]);
      setIsAuthenticated(false);
      setUserName(null);
      setUserEmail(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
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
