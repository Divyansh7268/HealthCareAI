/**
 * src/firebase/config.js
 *
 * Firebase initialization using Expo environment variables.
 * Uses AsyncStorage for auth session persistence across app restarts.
 *
 * Setup:
 *   1. Copy .env.example → .env
 *   2. Fill in your Firebase project values from Firebase Console
 *   3. Run: npx expo start -c
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initialisation on hot-reload
let app;
let auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Initialize Auth with AsyncStorage persistence so login survives app restarts
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);

// Storage requires Blaze plan. Null-safe export so app works without it.
export const storage = firebaseConfig.storageBucket ? getStorage(app) : null;

export default app;
