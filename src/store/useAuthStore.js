import { create } from 'zustand';
import { signOut } from '../firebase/auth';

export const useAuthStore = create((set) => ({
  loggedInUser: null,
  selectedRole: null, // 'doctor' | 'healthworker' | null
  isAuthLoading: true, // true while checking Firebase auth state on app start

  setSelectedRole: (role) => set({ selectedRole: role }),

  /** Called by the Firebase onAuthStateChanged listener in AppNavigator */
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),

  /**
   * Called after a successful Firebase sign-in.
   * userData = { uid, email, name, role, ... }
   */
  login: (userData) => set({
    loggedInUser: userData,
    selectedRole: userData.role,
    isAuthLoading: false,
  }),

  /**
   * Signs out from Firebase and clears local state.
   */
  logout: async () => {
    try {
      await signOut();
    } catch (e) {
      console.warn('Sign-out error:', e.message);
    }
    set({ loggedInUser: null, selectedRole: null, isAuthLoading: false });
  },
}));
