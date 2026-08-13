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
import Svg, { Path, Rect, Circle, Ellipse } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#E11D48', // The main red
  primaryLight: '#FFF1F2',
  textDark: '#1E293B',
  textGray: '#64748B',
  white: '#FFFFFF',
  bg: '#FAFAFA',
  border: '#E2E8F0',
  inputBg: '#FFFFFF',
};

const FONTS = {
  h1: { fontSize: 24, fontWeight: '800', color: COLORS.textDark },
  h2: { fontSize: 20, fontWeight: '700', color: COLORS.textDark },
  body: { fontSize: 14, color: COLORS.textGray, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
};

// ─────────────────────────────────────────────────────────────
// Background Waves SVG
// ─────────────────────────────────────────────────────────────
const BackgroundWaves = () => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Path
        d={`M0 0 L0 ${height * 0.25} Q ${width * 0.3} ${height * 0.3} ${width * 0.4} 0 Z`}
        fill={COLORS.primaryLight}
        opacity={0.7}
      />
      <Path
        d={`M0 ${height} L0 ${height * 0.85} Q ${width * 0.5} ${height * 0.95} ${width} ${height * 0.8} L${width} ${height} Z`}
        fill={COLORS.primaryLight}
        opacity={0.5}
      />
    </Svg>
  </View>
);

// ─────────────────────────────────────────────────────────────
// New VirtualCare Logo (Red V with Cross)
// ─────────────────────────────────────────────────────────────
const VCLogo = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path d="M8 18 L24 44 L40 18 L32 18 L24 32 L16 18 Z" fill={COLORS.primary} />
    <Path d="M22 2 h4 v6 h6 v4 h-6 v6 h-4 v-6 h-6 v-4 h6 z" fill={COLORS.primary} />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// Nurse Avatar SVG (Red Outline Style)
// ─────────────────────────────────────────────────────────────
const NurseAvatar = () => (
  <Svg width={72} height={80} viewBox="0 0 72 80" fill="none">
    <Circle cx="36" cy="10" r="6" stroke={COLORS.primary} strokeWidth="2" fill={COLORS.primaryLight} />
    <Ellipse cx="36" cy="24" rx="14" ry="15" stroke={COLORS.primary} strokeWidth="2" fill={COLORS.primaryLight} />
    <Circle cx="22" cy="26" r="2.5" stroke={COLORS.primary} strokeWidth="1.5" fill="none" />
    <Circle cx="50" cy="26" r="2.5" stroke={COLORS.primary} strokeWidth="1.5" fill="none" />
    <Path d="M32 38 V44 M40 38 V44" stroke={COLORS.primary} strokeWidth="2" />
    <Path d="M28 44 L36 53 L44 44" stroke={COLORS.primary} strokeWidth="2" fill="none" />
    <Path d="M24 52 L52 74" stroke={COLORS.primary} strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M26 52 L54 74" stroke={COLORS.primary} strokeWidth="1.2" strokeLinecap="round" />
    <Path d="M12 80 C12 62 24 53 30 50" stroke={COLORS.primary} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <Path d="M60 80 C60 62 48 53 42 50" stroke={COLORS.primary} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <Rect x="40" y="58" width="14" height="14" rx="4" fill="white" stroke={COLORS.primary} strokeWidth="1.8" />
    <Rect x="46" y="61" width="3" height="8" rx="1.5" fill={COLORS.primary} />
    <Rect x="43" y="64" width="9" height="3" rx="1.5" fill={COLORS.primary} />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// Step Indicator
// ─────────────────────────────────────────────────────────────
const StepIndicator = () => (
  <View style={styles.stepWrapper}>
    <View style={styles.stepPill}>
      <Text style={styles.stepPillText}>Step 1 of 2</Text>
    </View>
    <View style={styles.stepRow}>
      <View style={styles.stepLineActive} />
      <View style={styles.stepActiveDot} />
      <View style={styles.stepLineInactive} />
      <View style={styles.stepArrow}>
        <Ionicons name="arrow-forward" size={14} color={COLORS.textGray} />
      </View>
      <View style={styles.stepLineInactive} />
      <View style={styles.stepInactiveDot} />
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
    <View style={[styles.inputBox, value.length > 0 && { borderColor: COLORS.primary }]}>
      <View style={styles.inputIconBox}>
        <Ionicons name={iconName} size={18} color={COLORS.primary} />
      </View>
      {prefix ? (
        <>
          <View style={styles.prefixDivider} />
          <Text style={styles.prefixText}>{prefix}</Text>
        </>
      ) : null}
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
          <Ionicons name={isShowing ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.primary} />
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
  const setSelectedRole = useAuthStore((state) => state.setSelectedRole);
  
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
  
  const handleLoginPress = () => {
    setSelectedRole(null);
    navigation.navigate('LoginForm');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <BackgroundWaves />
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
              <View style={styles.logoRow}>
                <VCLogo size={32} />
                <Text style={styles.brandNameText}>
                  <Text style={{ color: COLORS.textDark }}>Virtual</Text>
                  <Text style={{ color: COLORS.primary }}>Care</Text>
                </Text>
              </View>
              <View style={{ width: 24 }} />
            </View>

            {/* ── Tagline ─────────────────────── */}
            <Text style={styles.tagline}>Connecting communities to better healthcare.</Text>

            {/* ── Nurse Avatar ─────────────────── */}
            <View style={styles.avatarContainer}>
              <NurseAvatar />
            </View>

            {/* ── Title ───────────────────────── */}
            <Text style={styles.heading}>Create your <Text style={{ color: COLORS.primary }}>Health Worker</Text> Account</Text>
            <Text style={styles.subheading}>
              Register to manage patients and connect with qualified doctors.
            </Text>

            {/* ── Step Progress ────────────────── */}
            <StepIndicator />

            {/* ── Card for Form ───────────────── */}
            <View style={styles.formCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                  <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                  <Text style={styles.sectionSub}>Tell us a little about yourself.</Text>
                </View>
              </View>

              <View style={styles.form}>
                <InputField 
                  label="Full Name" 
                  iconName="person-outline" 
                  placeholder="Enter your full name" 
                  value={firstName} 
                  onChangeText={setFirstName} 
                />
                <InputField 
                  label="Phone Number" 
                  iconName="call-outline" 
                  placeholder="Enter your mobile number" 
                  value={phone} 
                  onChangeText={setPhone} 
                  keyboardType="phone-pad" 
                  prefix="+91" 
                />
                <InputField 
                  label="Email Address" 
                  iconName="mail-outline" 
                  placeholder="Enter your email address" 
                  value={email} 
                  onChangeText={setEmail} 
                  keyboardType="email-address" 
                  optional 
                />
                <InputField 
                  label="Create Password" 
                  iconName="lock-closed-outline" 
                  placeholder="Create a secure password" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                  showToggle 
                  isShowing={showPass} 
                  onToggle={() => setShowPass(!showPass)} 
                />
                <InputField 
                  label="Confirm Password" 
                  iconName="lock-closed-outline" 
                  placeholder="Re-enter your password" 
                  value={confirmPass} 
                  onChangeText={setConfirmPass} 
                  secureTextEntry 
                  showToggle 
                  isShowing={showConfirm} 
                  onToggle={() => setShowConfirm(!showConfirm)} 
                />
              </View>

              {/* ── Continue Button ──────────────── */}
              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.85}
                onPress={handleContinue}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      {/* ── Footer ───────────────────────── */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={handleLoginPress} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.footerLink}>Login</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 80, // For footer
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    padding: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandNameText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  // Tagline
  tagline: {
    ...FONTS.body,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Avatar
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  // Title
  heading: {
    ...FONTS.h1,
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    ...FONTS.body,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },

  // Step
  stepWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  stepPillText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  stepLineActive: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.primary,
  },
  stepActiveDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  stepLineInactive: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
  },
  stepArrow: {
    marginHorizontal: 10,
  },
  stepInactiveDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  stepLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  stepLabelActive: {
    ...FONTS.body,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  stepLabelInactive: {
    ...FONTS.body,
    fontSize: 12,
    color: COLORS.textGray,
  },

  // Form Card
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sectionTitle: {
    ...FONTS.label,
    fontSize: 16,
  },
  sectionSub: {
    ...FONTS.body,
    fontSize: 13,
  },

  // Form Fields
  form: {
    gap: 16,
    marginBottom: 24,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    ...FONTS.label,
    fontSize: 13,
  },
  optionalLabel: {
    fontWeight: '400',
    color: COLORS.textGray,
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
    fontSize: 14,
    color: COLORS.textDark,
    padding: 0,
  },

  // Button
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Footer
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  footerText: {
    color: COLORS.textGray,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
