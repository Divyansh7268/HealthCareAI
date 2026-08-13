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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { signIn } from '../firebase/auth';

// ─────────────────────────────────────────────────────────────
// VirtualCare Logo
// ─────────────────────────────────────────────────────────────
const VCLogo = ({ size = 32 }) => (
  <Svg width={size} height={size * 1.1} viewBox="0 0 44 48" fill="none">
    <Rect x="20" y="0" width="5" height="13" rx="2.5" fill="#10B981" />
    <Rect x="14.5" y="4" width="16" height="5" rx="2.5" fill="#10B981" />
    <Path d="M4 16 L22 44 L40 16 Q38 12 35 14 L22 38 L9 14 Q6 12 4 16 Z" fill={COLORS.brand} />
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
const InputField = ({ label, iconName, placeholder, value, onChangeText, keyboardType = 'default', secureTextEntry = false, showToggle = false, isShowing = false, onToggle, prefix, optional = false, accent }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>
      {label}
      {optional && <Text style={styles.optionalLabel}> (optional)</Text>}
    </Text>
    <View style={[styles.inputBox, value.length > 0 && { borderColor: accent || COLORS.brand }]}>
      <Ionicons name={iconName} size={17} color={COLORS.subtle} style={{ marginRight: 10 }} />
      {prefix ? (
        <>
          <View style={styles.prefixDivider} />
          <Text style={styles.prefixText}>{prefix}</Text>
        </>
      ) : null}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.subtle}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry && !isShowing}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'none'}
        autoCorrect={false}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggle} style={{ padding: 4 }}>
          <Ionicons name={isShowing ? 'eye-outline' : 'eye-off-outline'} size={17} color={COLORS.subtle} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Demo Credentials Card
// ─────────────────────────────────────────────────────────────
const DemoCredsCard = ({ creds, accent, onUse }) => (
  <TouchableOpacity
    style={[styles.demoCard, { borderColor: accent + '35', backgroundColor: accent + '08' }]}
    onPress={onUse}
    activeOpacity={0.85}
  >
    <View style={[styles.demoIconBox, { backgroundColor: accent + '18' }]}>
      <Ionicons name="key-outline" size={18} color={accent} />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={[styles.demoTitle, { color: accent }]}>Demo Credentials</Text>
      <Text style={styles.demoRow}>📧 {creds.email}</Text>
      <Text style={styles.demoRow}>🔑 {creds.password}</Text>
    </View>
    <View style={[styles.useBtn, { backgroundColor: accent }]}>
      <Text style={styles.useBtnText}>Tap to fill</Text>
    </View>
  </TouchableOpacity>
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

  const isDoctor = selectedRole === 'doctor';
  const role = selectedRole;
  const accent = isDoctor ? COLORS.brand : COLORS.green;
  const roleLabel = isDoctor ? 'Doctor' : 'Health Worker';
  const dummyCreds = role ? DUMMY_CREDENTIALS[role] : null;

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
      // Firebase Authentication — verifies credentials against Firebase
      const userData = await signIn(email.trim().toLowerCase(), password);
      login(userData); // updates Zustand store, triggers navigation
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Page Header ─────────────────── */}
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={COLORS.navy} />
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <VCLogo size={28} />
              <Text style={styles.headerBrand}>VirtualCare</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* ── Role Badge ──────────────────── */}
          <View style={[styles.rolePill, { backgroundColor: accent + '15', borderColor: accent + '30' }]}>
            <View style={[styles.roleDot, { backgroundColor: accent }]} />
            <Text style={[styles.rolePillText, { color: accent }]}>{roleLabel}</Text>
          </View>

          {/* ── Heading ─────────────────────── */}
          <Text style={styles.heading}>Sign in to{'\n'}VirtualCare</Text>
          <Text style={styles.subheading}>
            Access your {roleLabel.toLowerCase()} dashboard with your credentials.
          </Text>

          {/* ── Demo Credentials ────────────── */}
          {dummyCreds && (
            <DemoCredsCard creds={dummyCreds} accent={accent} onUse={handleUseDummyCreds} />
          )}

          {/* ── Form ────────────────────────── */}
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

          {/* Forgot */}
          <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7}>
            <Text style={[styles.forgotText, { color: accent }]}>Forgot password?</Text>
          </TouchableOpacity>

          {/* ── Sign In Button ───────────────── */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: accent }, SHADOW.brand, isLoading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.primaryBtnText}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
            {!isLoading && <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />}
          </TouchableOpacity>

          {/* ── Divider ─────────────────────── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── OTP Button ──────────────────── */}
          <TouchableOpacity style={[styles.outlineBtn, { borderColor: accent + '50' }]} activeOpacity={0.8}>
            <Ionicons name="phone-portrait-outline" size={18} color={accent} />
            <Text style={[styles.outlineBtnText, { color: accent }]}>Login with OTP</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },

  // Header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBrand: {
    ...FONTS.h3,
    fontSize: 18,
  },

  // Role pill
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
    gap: 7,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
  },
  rolePillText: {
    ...FONTS.badge,
    fontSize: 13,
    letterSpacing: 0.3,
  },

  // Heading
  heading: {
    ...FONTS.h1,
    marginBottom: SPACING.sm,
  },
  subheading: {
    ...FONTS.body,
    marginBottom: SPACING.lg,
  },

  // Demo card
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  demoIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoTitle: {
    ...FONTS.label,
    fontSize: 13,
    marginBottom: 4,
  },
  demoRow: {
    ...FONTS.bodyS,
    fontSize: 12,
  },
  useBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  useBtnText: {
    ...FONTS.badge,
    color: COLORS.white,
    fontSize: 12,
  },

  // Form
  form: {
    gap: SPACING.md,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldLabel: {
    ...FONTS.label,
  },
  optionalLabel: {
    ...FONTS.bodyS,
    fontWeight: '400',
    color: COLORS.subtle,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    ...SHADOW.sm,
  },
  prefixDivider: {
    width: 1,
    height: 18,
    backgroundColor: COLORS.border,
    marginRight: 10,
  },
  prefixText: {
    ...FONTS.label,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.ink,
    padding: 0,
  },

  // Forgot
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  forgotText: {
    ...FONTS.label,
    fontSize: 13,
  },

  // Primary button
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    marginBottom: SPACING.lg,
  },
  primaryBtnText: {
    ...FONTS.btn,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerLabel: {
    ...FONTS.bodyS,
    color: COLORS.subtle,
  },

  // Outline button
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    paddingVertical: 14,
    gap: 8,
  },
  outlineBtnText: {
    ...FONTS.btn,
    fontSize: 15,
  },
});
