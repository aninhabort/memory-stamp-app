// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDIUwaBYfPyWyHTc50i_8lvXkGjBdqf2z0",
  authDomain: "memory-stamp-1f796.firebaseapp.com",
  projectId: "memory-stamp-1f796",
  storageBucket: "memory-stamp-1f796.firebasestorage.app",
  messagingSenderId: "235022536388",
  appId: "1:235022536388:web:c2b07f2e423c61ec328391",
  measurementId: "G-FEDBQN7K4L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with React Native persistence
// so auth state is read from AsyncStorage locally instead of hitting the network on startup
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export default app;
