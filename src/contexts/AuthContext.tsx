import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasAccount, setHasAccount] = useState(false);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        // User is signed in
        setIsAuthenticated(true);
        setUserEmail(user.email);
        setHasAccount(true);

        // Load user name from AsyncStorage
        try {
          const storedName = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
          setUserName(storedName);
        } catch (error) {
          console.error('Error loading user name:', error);
        }
      } else {
        // User is signed out
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserName(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const signup = async (name: string, email: string, password: string) => {
    try {
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Store user name in AsyncStorage (Firebase doesn't store display names by default)
      await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name);

      // State will be updated by onAuthStateChanged listener
      setUserName(name);
      setHasAccount(true);
    } catch (error: any) {
      console.error('Error signing up:', error);

      // Provide user-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }

      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // State will be updated by onAuthStateChanged listener
    } catch (error: any) {
      console.error('Error logging in:', error);

      // Provide user-friendly error messages
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      }

      throw error;
    }
  };

  const logout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);

      // Clear user name from AsyncStorage (stamps data is preserved)
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_NAME);

      // State will be updated by onAuthStateChanged listener
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
