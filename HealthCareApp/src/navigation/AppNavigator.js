import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { onAuthStateChange, getUserProfile } from '../firebase/auth';

// Screens
import RoleSelectionScreen          from '../screens/RoleSelectionScreen';
import LoginFormScreen              from '../screens/LoginFormScreen';
import HealthWorkerRegistrationStep1 from '../screens/HealthWorkerRegistrationStep1';
import HealthWorkerDashboard        from '../screens/HealthWorkerDashboard';
import PatientDetailScreen          from '../screens/PatientDetailScreen';
import PatientAIAnalysisScreen      from '../screens/PatientAIAnalysisScreen';
import AIAnalysisResultScreen       from '../screens/AIAnalysisResultScreen';
import DoctorDashboard              from '../screens/DoctorDashboard';
import DoctorPatientDetailScreen    from '../screens/DoctorPatientDetailScreen';

const Stack = createNativeStackNavigator();

// ─────────────────────────────────────────────────────────────
// Loading Splash (shown while Firebase restores auth session)
// ─────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4FF' }}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// App Navigator
// ─────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { loggedInUser, selectedRole, isAuthLoading, login, setAuthLoading } = useAuthStore();

  // Listen to Firebase auth state changes for session persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Restore the user profile (which includes role) from Firestore
          const profile = await getUserProfile(firebaseUser.uid);
          login(profile);
        } catch (err) {
          // Profile not found — user is authenticated but has no Firestore doc.
          // This can happen if registration was interrupted. Sign out gracefully.
          console.warn('AppNavigator: No Firestore profile found.', err.message);
          setAuthLoading(false);
        }
      } else {
        setAuthLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Show loading splash while restoring session
  if (isAuthLoading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* ── Unauthenticated ───────────────── */}
        {!loggedInUser ? (
          <>
            <Stack.Screen name="RoleSelection"                component={RoleSelectionScreen} />
            <Stack.Screen name="LoginForm"                    component={LoginFormScreen} />
            <Stack.Screen name="HealthWorkerRegistrationStep1" component={HealthWorkerRegistrationStep1} />
          </>
        ) : selectedRole === 'doctor' ? (
          /* ── Doctor Flow ──────────────────── */
          <>
            <Stack.Screen name="DoctorDashboard"       component={DoctorDashboard} />
            <Stack.Screen name="DoctorPatientDetail"   component={DoctorPatientDetailScreen} />
          </>
        ) : (
          /* ── Health Worker Flow ───────────── */
          <>
            <Stack.Screen name="HealthWorkerDashboard" component={HealthWorkerDashboard} />
            <Stack.Screen name="PatientDetail"         component={PatientDetailScreen} />
            <Stack.Screen name="PatientAIAnalysis"     component={PatientAIAnalysisScreen} />
            <Stack.Screen name="AIAnalysisResult"      component={AIAnalysisResultScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
