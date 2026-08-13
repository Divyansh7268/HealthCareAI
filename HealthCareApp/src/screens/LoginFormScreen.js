import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { signIn } from '../firebase/auth';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#E11D48', // Health Worker Red
  primaryLight: '#FFF1F2',
  doctorPrimary: '#2563EB', // Doctor Blue
  doctorLight: '#EFF6FF',
  textDark: '#1E293B',
  textGray: '#64748B',
  white: '#FFFFFF',
  bg: '#FAFAFA',
  border: '#E2E8F0',
  inputBg: '#FFFFFF',
};

const FONTS = {
  h1: { fontSize: 28, fontWeight: '800', color: COLORS.textDark },
  h2: { fontSize: 24, fontWeight: '700', color: COLORS.textDark },
  h3: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },
  body: { fontSize: 14, color: COLORS.textGray, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
};

// ─────────────────────────────────────────────────────────────
// Background Waves SVG
// ─────────────────────────────────────────────────────────────
const BackgroundWaves = ({ accentLight }) => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Path
        d={`M0 0 L0 ${height * 0.25} Q ${width * 0.3} ${height * 0.3} ${width * 0.4} 0 Z`}
        fill={accentLight}
        opacity={0.7}
      />
      <Path
        d={`M0 ${height} L0 ${height * 0.85} Q ${width * 0.5} ${height * 0.95} ${width} ${height * 0.8} L${width} ${height} Z`}
        fill={accentLight}
        opacity={0.5}
      />
    </Svg>
  </View>
);

// ─────────────────────────────────────────────────────────────
// New VirtualCare Logo (Dynamic Color)
// ─────────────────────────────────────────────────────────────
const VCLogo = ({ size = 42, color = COLORS.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path d="M8 18 L24 44 L40 18 L32 18 L24 32 L16 18 Z" fill={color} />
    <Path d="M22 2 h4 v6 h6 v4 h-6 v6 h-4 v-6 h-6 v-4 h6 z" fill={color} />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// Dummy credentials
// ─────────────────────────────────────────────────────────────
const DUMMY_CREDENTIALS = {
  doctor: {
    email: 'dr.sharma@virtualcare.org',
    password: 'Doctor@2024',
    name: 'Dr. Rajesh Sharma',
  },
  healthworker: {
    email: 'asha.worker@virtualcare.org',
    password: 'Health@2024',
    name: 'Asha Devi',
  },
};

// ─────────────────────────────────────────────────────────────
// Input Field
// ─────────────────────────────────────────────────────────────
const InputField = ({ label, iconName, placeholder, value, onChangeText, keyboardType = 'default', secureTextEntry = false, showToggle = false, isShowing = false, onToggle, accent }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputBox, value.length > 0 && { borderColor: accent }]}>
      <View style={styles.inputIconBox}>
        <Ionicons name={iconName} size={18} color={accent} />
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry && !isShowing}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggle} style={{ padding: 4 }}>
          <Ionicons name={isShowing ? 'eye-outline' : 'eye-off-outline'} size={18} color={accent} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────
export default function LoginFormScreen({ navigation }) {
  const selectedRole = useAuthStore((state) => state.selectedRole);
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic Theme based on role (Fallback to Health Worker if null)
  const isDoctor = selectedRole === 'doctor';
  const role = selectedRole || 'healthworker';
  const accent = isDoctor ? COLORS.doctorPrimary : COLORS.primary;
  const accentLight = isDoctor ? COLORS.doctorLight : COLORS.primaryLight;
  const roleLabel = isDoctor ? 'Doctor' : 'Health Worker';
  const dummyCreds = DUMMY_CREDENTIALS[role];

  const handleUseDummyCreds = () => {
    if (dummyCreds) {
      setEmail(dummyCreds.email);
      setPassword(dummyCreds.password);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const userData = await signIn(email.trim().toLowerCase(), password);
      login(userData);
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <BackgroundWaves accentLight={accentLight} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Header ───────────────────────────── */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
              <View style={{ width: 24 }} />
            </View>

            {/* ── Brand & Welcome ─────────────────── */}
            <View style={styles.welcomeSection}>
              <VCLogo size={48} color={accent} />
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSub}>Sign in to your {roleLabel.toLowerCase()} account</Text>
            </View>

            {/* ── Login Card ─────────────────────── */}
            <View style={styles.loginCard}>
              
              {/* Role Pill */}
              <View style={[styles.rolePill, { backgroundColor: accentLight }]}>
                <Ionicons name={isDoctor ? "medical" : "heart"} size={14} color={accent} />
                <Text style={[styles.rolePillText, { color: accent }]}>{roleLabel} Login</Text>
              </View>

              <View style={styles.form}>
                <InputField
                  label="Email Address"
                  iconName="mail-outline"
                  placeholder="name@virtualcare.org"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  accent={accent}
                />
                <InputField
                  label="Password"
                  iconName="lock-closed-outline"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  showToggle
                  isShowing={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                  accent={accent}
                />
              </View>

              <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7}>
                <Text style={[styles.forgotText, { color: accent }]}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: accent }, isLoading && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.primaryBtnText}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
                {!isLoading && <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />}
              </TouchableOpacity>

              {/* Demo Button */}
              <TouchableOpacity style={styles.demoLinkRow} onPress={handleUseDummyCreds} activeOpacity={0.7}>
                <Ionicons name="key-outline" size={16} color={COLORS.textGray} />
                <Text style={styles.demoLinkText}>Use Demo Credentials</Text>
              </TouchableOpacity>

            </View>

            {/* ── Create Account (Only for Health Worker) ── */}
            {!isDoctor && (
              <View style={styles.createAccountRow}>
                <Text style={styles.createAccountText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('HealthWorkerRegistrationStep1')} activeOpacity={0.7}>
                  <Text style={[styles.createAccountLink, { color: accent }]}>Register Here</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    padding: 4,
  },

  // Welcome Section
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    ...FONTS.h1,
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeSub: {
    ...FONTS.body,
    textAlign: 'center',
  },

  // Login Card
  loginCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
    gap: 6,
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Form Fields
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    ...FONTS.label,
    fontSize: 13,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  inputIconBox: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    padding: 0,
  },

  // Forgot
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Button
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Demo Link
  demoLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  demoLinkText: {
    ...FONTS.body,
    fontSize: 13,
    fontWeight: '500',
  },

  // Create Account
  createAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  createAccountText: {
    ...FONTS.body,
    fontSize: 14,
  },
  createAccountLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
