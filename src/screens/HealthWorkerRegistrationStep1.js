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
import Svg, { Path, Rect, Circle, Ellipse } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../theme';
import { useAuthStore } from '../store/useAuthStore';

// ─────────────────────────────────────────────────────────────
// VirtualCare Logo
// ─────────────────────────────────────────────────────────────
const VCLogo = ({ size = 28 }) => (
  <Svg width={size} height={size * 1.1} viewBox="0 0 44 48" fill="none">
    <Rect x="20" y="0" width="5" height="13" rx="2.5" fill="#10B981" />
    <Rect x="14.5" y="4" width="16" height="5" rx="2.5" fill="#10B981" />
    <Path d="M4 16 L22 44 L40 16 Q38 12 35 14 L22 38 L9 14 Q6 12 4 16 Z" fill={COLORS.brand} />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// Nurse Avatar
// ─────────────────────────────────────────────────────────────
const NurseAvatar = () => (
  <Svg width={80} height={88} viewBox="0 0 80 88" fill="none">
    {/* Nurse cap */}
    <Path d="M22 24 Q22 11 40 11 Q58 11 58 24" fill={COLORS.white} stroke={COLORS.brand} strokeWidth="1.5" />
    {/* Cap cross vertical */}
    <Rect x="37.5" y="14" width="5" height="11" rx="2" fill={COLORS.brand} />
    {/* Cap cross horizontal */}
    <Rect x="33" y="18" width="14" height="5" rx="2" fill={COLORS.brand} />
    {/* Dark hair */}
    <Path d="M22 28 L20 46 Q18 51 20 53" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" fill="none" />
    <Path d="M58 28 L60 46 Q62 51 60 53" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" fill="none" />
    <Path d="M22 28 Q22 24 40 24 Q58 24 58 28 L60 44 Q54 50 40 50 Q26 50 20 44 Z" fill="#1E293B" />
    {/* Face */}
    <Ellipse cx="40" cy="34" rx="14" ry="16" fill="#FDDCB5" />
    {/* Eyes */}
    <Circle cx="35" cy="32" r="2" fill="#1E293B" />
    <Circle cx="45" cy="32" r="2" fill="#1E293B" />
    {/* Smile */}
    <Path d="M35 40 Q40 44 45 40" stroke="#C47A5A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Neck */}
    <Rect x="36" y="48" width="8" height="8" rx="2" fill="#FDDCB5" />
    {/* Uniform */}
    <Path d="M18 88 Q18 64 28 58 L33 56 L40 60 L47 56 L52 58 Q62 64 62 88 Z" fill={COLORS.brandMid} stroke={COLORS.brand} strokeWidth="1.2" />
    {/* Collar V */}
    <Path d="M33 56 L40 65 L47 56" stroke={COLORS.brand} strokeWidth="1.8" fill="none" />
    {/* Cross badge */}
    <Rect x="36" y="66" width="9" height="9" rx="2" fill="white" stroke="#10B981" strokeWidth="1.5" />
    <Rect x="39" y="68" width="3" height="5" rx="1" fill="#10B981" />
    <Rect x="37.5" y="69.5" width="6" height="2" rx="1" fill="#10B981" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// Step Indicator
// ─────────────────────────────────────────────────────────────
const StepIndicator = () => (
  <View style={styles.stepWrapper}>
    <View style={styles.stepRow}>
      {/* Step 1 - active */}
      <View style={styles.stepActive}>
        <View style={styles.stepActiveDot} />
      </View>
      <View style={[styles.stepLine, { backgroundColor: COLORS.border }]} />
      <View style={styles.stepArrow}>
        <Ionicons name="arrow-forward" size={12} color={COLORS.subtle} />
      </View>
      <View style={[styles.stepLine, { backgroundColor: COLORS.border }]} />
      {/* Step 2 - inactive */}
      <View style={styles.stepInactive} />
    </View>
    <View style={styles.stepLabelRow}>
      <Text style={styles.stepLabelActive}>Personal Details</Text>
      <Text style={styles.stepLabelInactive}>Professional Details</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Input Field
// ─────────────────────────────────────────────────────────────
const InputField = ({ label, iconName, placeholder, value, onChangeText, keyboardType = 'default', secureTextEntry = false, showToggle = false, isShowing = false, onToggle, prefix, optional = false }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>
      {label}
      {optional && <Text style={styles.optionalLabel}> (optional)</Text>}
    </Text>
    <View style={[styles.inputBox, value.length > 0 && { borderColor: COLORS.green }]}>
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
        autoCapitalize="none"
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
// Main Screen Component
// ─────────────────────────────────────────────────────────────
export default function HealthWorkerRegistrationStep1({ navigation }) {
  const login = useAuthStore((state) => state.login);
  
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone]           = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleContinue = () => {
    if (!firstName.trim()) { Alert.alert('Required', 'Please enter your full name.'); return; }
    if (!phone.trim())    { Alert.alert('Required', 'Please enter your phone number.'); return; }
    if (!password.trim()) { Alert.alert('Required', 'Please create a password.'); return; }
    if (password !== confirmPass) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    
    // Simulate logging in immediately for now
    login({ name: firstName, phone, email, role: 'healthworker' });
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
          {/* ── Header ───────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
            <View style={styles.logoRow}>
              <VCLogo size={28} />
              <Text style={styles.headerBrand}>VirtualCare</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* ── Tagline ─────────────────────── */}
          <Text style={styles.tagline}>Connecting communities to better healthcare.</Text>

          {/* ── Nurse Avatar ─────────────────── */}
          <View style={styles.avatarContainer}>
            <NurseAvatar />
          </View>

          {/* ── Title ───────────────────────── */}
          <Text style={styles.heading}>Create your Health{'\n'}Worker Account</Text>
          <Text style={styles.subheading}>
            Register to manage patients and connect with qualified doctors.
          </Text>

          {/* ── Step Progress ────────────────── */}
          <View style={styles.stepTextRow}>
            <Text style={styles.stepText}>Step 1 of 2</Text>
          </View>
          <StepIndicator />

          {/* ── Section ─────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Text style={styles.sectionSub}>Tell us a little about yourself.</Text>
          </View>

          {/* ── Form Fields ─────────────────── */}
          <View style={styles.form}>
            <InputField 
              label="Full Name" 
              iconName="person-outline" 
              placeholder="e.g. Asha Devi" 
              value={firstName} 
              onChangeText={setFirstName} 
            />
            <InputField label="Phone Number" iconName="call-outline" placeholder="Enter your mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" prefix="+91" />
            <InputField label="Email Address" iconName="mail-outline" placeholder="Enter your email address" value={email} onChangeText={setEmail} keyboardType="email-address" optional />
            <InputField label="Create Password" iconName="lock-closed-outline" placeholder="Create a secure password" value={password} onChangeText={setPassword} secureTextEntry showToggle isShowing={showPass} onToggle={() => setShowPass(!showPass)} />
            <InputField label="Confirm Password" iconName="lock-closed-outline" placeholder="Re-enter your password" value={confirmPass} onChangeText={setConfirmPass} secureTextEntry showToggle isShowing={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
          </View>

          {/* ── Continue Button ──────────────── */}
          <TouchableOpacity
            style={[styles.primaryBtn, SHADOW.brand]}
            activeOpacity={0.85}
            onPress={handleContinue}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          {/* ── Footer ───────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={onLoginPress} activeOpacity={0.7}>
              <Text style={styles.footerLink}> Login →</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: SPACING.sm,
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

  // Tagline
  tagline: {
    ...FONTS.bodyS,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },

  // Avatar
  avatarContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: COLORS.brandLight,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 3,
    borderColor: COLORS.brandMid,
    overflow: 'hidden',
  },

  // Title
  heading: {
    ...FONTS.h2,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subheading: {
    ...FONTS.body,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },

  // Step
  stepTextRow: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  stepText: {
    ...FONTS.h4,
    color: COLORS.brand,
  },
  stepWrapper: {
    marginBottom: SPACING.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },
  stepLine: {
    flex: 1,
    height: 2,
  },
  stepArrow: {
    marginHorizontal: 6,
  },
  stepInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  stepLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stepLabelActive: {
    ...FONTS.bodyS,
    fontWeight: '700',
    color: COLORS.brand,
  },
  stepLabelInactive: {
    ...FONTS.bodyS,
    color: COLORS.subtle,
  },

  // Section
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.h3,
    marginBottom: 4,
  },
  sectionSub: {
    ...FONTS.bodyS,
  },

  // Form
  form: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldLabel: {
    ...FONTS.label,
  },
  optionalLabel: {
    fontWeight: '400',
    color: COLORS.subtle,
    fontSize: 13,
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

  // Button
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    marginBottom: SPACING.lg,
  },
  primaryBtnText: {
    ...FONTS.btn,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    ...FONTS.body,
    fontSize: 14,
  },
  footerLink: {
    ...FONTS.body,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brand,
  },
});
