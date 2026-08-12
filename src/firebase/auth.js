/**
 * src/firebase/auth.js
 *
 * Firebase Authentication service functions.
 *
 * Roles are stored in Firestore under /users/{uid} rather than in custom
 * claims (claims require the Admin SDK on the backend).  The mobile app
 * reads the role after sign-in to route the user correctly.
 *
 * Supported roles: 'doctor' | 'healthworker' | 'admin'
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// ─────────────────────────────────────────────────────────────
// Sign In
// ─────────────────────────────────────────────────────────────
/**
 * Sign in with email + password.
 * Returns { uid, email, role, name } on success.
 * Throws a structured error on failure.
 */
export async function signIn(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    // Fetch the user profile (includes role) from Firestore
    const profile = await getUserProfile(uid);
    return profile;
  } catch (error) {
    throw parseAuthError(error);
  }
}

// ─────────────────────────────────────────────────────────────
// Register (new user)
// ─────────────────────────────────────────────────────────────
/**
 * Register a new user with email + password and store their profile + role.
 * @param {string} email
 * @param {string} password
 * @param {string} name        - Display name
 * @param {'doctor'|'healthworker'|'admin'} role
 * @param {object} [extraData] - Any additional profile fields
 */
export async function register(email, password, name, role, extraData = {}) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    const profileData = {
      uid,
      email,
      name,
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      ...extraData,
    };

    // Persist profile in Firestore
    await setDoc(doc(db, 'users', uid), profileData);

    return { uid, email, name, role };
  } catch (error) {
    throw parseAuthError(error);
  }
}

// ─────────────────────────────────────────────────────────────
// Sign Out
// ─────────────────────────────────────────────────────────────
export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw parseAuthError(error);
  }
}

// ─────────────────────────────────────────────────────────────
// Get current authenticated user (with Firestore profile)
// ─────────────────────────────────────────────────────────────
/**
 * Returns the Firestore profile for the currently signed-in user,
 * or null if no user is signed in.
 */
export async function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) return null;
  return getUserProfile(user.uid);
}

// ─────────────────────────────────────────────────────────────
// Get user profile from Firestore
// ─────────────────────────────────────────────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) {
    throw new Error('User profile not found in database. Contact your administrator.');
  }
  return { uid, ...snap.data() };
}

// ─────────────────────────────────────────────────────────────
// Auth state listener
// ─────────────────────────────────────────────────────────────
/**
 * Subscribe to auth state changes.
 * Calls callback(user) when auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ─────────────────────────────────────────────────────────────
// Password Reset
// ─────────────────────────────────────────────────────────────
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw parseAuthError(error);
  }
}

// ─────────────────────────────────────────────────────────────
// Error parser — converts Firebase codes to human-readable messages
// ─────────────────────────────────────────────────────────────
function parseAuthError(error) {
  const messages = {
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/invalid-email':          'The email address is not valid.',
    'auth/too-many-requests':      'Too many failed attempts. Please try again later.',
    'auth/email-already-in-use':   'An account with this email already exists.',
    'auth/weak-password':          'Password should be at least 6 characters.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/invalid-credential':     'Invalid credentials. Check your email and password.',
  };
  const message = messages[error.code] || error.message || 'Authentication failed.';
  return new Error(message);
}
