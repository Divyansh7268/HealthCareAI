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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS as THEME_COLORS, FONTS as THEME_FONTS, RADIUS, SHADOW, SPACING } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { registerPatientAndStartVisit } from '../services/patientService';

const { width, height } = Dimensions.get('window');

// ── Development mode flag ─────────────────────────────────────
const DEV_MODE = true;

// ─────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────
const COLORS = {
  ...THEME_COLORS,
  primary: '#E11D48',
  primaryLight: '#FFF1F2',
  textDark: '#1E293B',
  textGray: '#64748B',
  bg: '#FAFAFA',
  white: '#FFFFFF',
  border: '#E2E8F0',
  inputBg: '#FFFFFF',
};

const FONTS = {
  ...THEME_FONTS,
  h1: { fontSize: 24, fontWeight: '800', color: COLORS.textDark },
  h2: { fontSize: 20, fontWeight: '700', color: COLORS.textDark },
  h3: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
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
// VirtualCare Logo (small)
// ─────────────────────────────────────────────────────────────
const VCLogo = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path d="M8 18 L24 44 L40 18 L32 18 L24 32 L16 18 Z" fill={COLORS.primary} />
    <Path d="M22 2 h4 v6 h6 v4 h-6 v6 h-4 v-6 h-6 v-4 h6 z" fill={COLORS.primary} />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// Info Banner
// ─────────────────────────────────────────────────────────────
const InfoBanner = ({ icon, title, subtitle, accent = COLORS.primary, bgColor = COLORS.primaryLight }) => (
  <View style={[styles.infoBanner, { backgroundColor: bgColor }]}>
    <View style={[styles.infoBannerIcon, { backgroundColor: accent + '20' }]}>
      <Ionicons name={icon} size={22} color={accent} />
    </View>
    <View style={{ flex: 1, marginLeft: 16 }}>
      <Text style={[styles.infoBannerTitle, { color: accent }]}>{title}</Text>
      <Text style={[styles.infoBannerSub, { color: accent }]}>{subtitle}</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Field Label with required asterisk
// ─────────────────────────────────────────────────────────────
const FieldLabel = ({ label, required }) => (
  <View style={styles.fieldLabelRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {required && <Text style={styles.requiredStar}> *</Text>}
  </View>
);

// ─────────────────────────────────────────────────────────────
// Dummy Patient Data
// ─────────────────────────────────────────────────────────────
const DUMMY_PATIENTS = [
  { name: 'Ramesh Kumar',  age: '52', phone: '9876543210', icon: 'RK', color: COLORS.primary },
  { name: 'Sunita Devi',   age: '46', phone: '9812345678', icon: 'SD', color: '#10B981' },
  { name: 'Arun Singh',    age: '31', phone: '9988776655', icon: 'AS', color: '#8B5CF6' },
];

// ─────────────────────────────────────────────────────────────
// Dev Auto-fill Card (only shown when DEV_MODE = true)
// ─────────────────────────────────────────────────────────────
const DevAutoFillCard = ({ onSelect }) => (
  <View style={[styles.dummyCard, { borderColor: '#F59E0B60', borderStyle: 'dashed' }]}>
    <View style={styles.dummyCardHeader}>
      <View style={[styles.dummyIconBox, { backgroundColor: '#FEF3C7' }]}>
        <Ionicons name="code-slash-outline" size={18} color="#D97706" />
      </View>
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={[styles.dummyCardTitle, { color: '#D97706' }]}>DEV MODE — Auto-fill Only</Text>
        <Text style={styles.dummyCardSub}>Fills form only. Real data saved to Firestore.</Text>
      </View>
    </View>
    <View style={styles.dummyList}>
      {DUMMY_PATIENTS.map((p, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.dummyRow}
          onPress={() => onSelect(p)}
          activeOpacity={0.78}
        >
          <View style={[styles.dummyAvatar, { backgroundColor: p.color + '18' }]}>
            <Text style={[styles.dummyAvatarText, { color: p.color }]}>{p.icon}</Text>
          </View>
          <View style={styles.dummyInfo}>
            <Text style={styles.dummyName}>{p.name}</Text>
            <Text style={styles.dummyMeta}>Age {p.age}  •  📞 +91 {p.phone}</Text>
          </View>
          <View style={[styles.fillBtn, { backgroundColor: p.color }]}>
            <Text style={styles.fillBtnText}>Fill</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export default function PatientDetailScreen({ navigation }) {
  const loggedInUser = useAuthStore((s) => s.loggedInUser);

  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge]   = useState('');
  const [phone, setPhone]             = useState('');
  const [isSaving, setIsSaving]       = useState(false);

  // Dev-only: fills form fields for quick testing
  const handleDevAutoFill = (p) => {
    setPatientName(p.name);
    setPatientAge(p.age);
    setPhone(p.phone);
  };

  const handleSave = async () => {
    // ── Validation ────────────────────────────────────────────
    if (!patientName.trim()) {
      Alert.alert('Required', 'Please enter the patient full name.');
      return;
    }
    if (!patientAge.trim() || isNaN(parseInt(patientAge, 10))) {
      Alert.alert('Required', 'Please enter a valid patient age.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Required', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSaving(true);
    try {
      const { patientId, visitId, isExistingPatient } =
        await registerPatientAndStartVisit(
          { name: patientName, age: patientAge, phone },
          loggedInUser.uid,
        );

      // Inform health worker if this is a returning patient
      if (isExistingPatient) {
        Alert.alert(
          'Existing Patient Found',
          `A patient record for "${patientName}" with this phone already exists. A new visit has been created for them.`,
          [{ text: 'Continue', onPress: () => navigate(patientId, visitId) }],
        );
      } else {
        navigate(patientId, visitId);
      }
    } catch (error) {
      console.error('[PatientDetailScreen] Save error:', error);
      Alert.alert(
        'Save Failed',
        error.message || 'Could not save patient data. Please check your connection and try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const navigate = (patientId, visitId) => {
    navigation.navigate('PatientAIAnalysis', { patientId, visitId, patientName });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <BackgroundWaves />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* ── Page Header ───────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <View style={{ width: 24 }} />
        </View>

        {/* ── Scrollable Content ────────────────── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Page Title ──────────────────── */}
            <View style={styles.titleSection}>
              <Text style={styles.pageTitle}>Enter Patient Details</Text>
              <Text style={styles.pageSubtitle}>Start a new patient assessment</Text>
            </View>

            {/* ── Info Banner ─────────────────── */}
            <InfoBanner
              icon="information-circle-outline"
              title="Fill in basic details"
              subtitle="This helps us provide better AI-assisted support and doctor consultation."
            />

            {/* ── Dev Auto-fill (DEV_MODE only) ── */}
            {DEV_MODE && <DevAutoFillCard onSelect={handleDevAutoFill} />}

            {/* ── Form Card ───────────────────── */}
            <View style={styles.formCard}>
              
              {/* ── Patient Name ─────────────────── */}
              <View style={styles.fieldGroup}>
                <FieldLabel label="Patient Name" required />
                <View style={[styles.inputBox, patientName.length > 0 && { borderColor: COLORS.primary }]}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="person-outline" size={18} color={COLORS.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter patient full name"
                    placeholderTextColor="#94A3B8"
                    value={patientName}
                    onChangeText={setPatientName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* ── Patient Age ──────────────────── */}
              <View style={styles.fieldGroup}>
                <FieldLabel label="Patient Age" required />
                <View style={[styles.inputBox, patientAge.length > 0 && { borderColor: COLORS.primary }]}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter patient age"
                    placeholderTextColor="#94A3B8"
                    value={patientAge}
                    onChangeText={setPatientAge}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={styles.inputSuffix}>Years</Text>
                </View>
              </View>

              {/* ── Phone Number ─────────────────── */}
              <View style={styles.fieldGroup}>
                <FieldLabel label="Phone Number" required />
                <View style={[styles.inputBox, phone.length > 0 && { borderColor: COLORS.primary }]}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="call-outline" size={18} color={COLORS.primary} />
                  </View>
                  <TouchableOpacity style={styles.prefixBox} activeOpacity={0.7}>
                    <Text style={styles.prefixText}>+91</Text>
                    <Ionicons name="chevron-down" size={14} color={COLORS.textGray} style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                  <View style={styles.prefixDivider} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    placeholderTextColor="#94A3B8"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

            </View>

            {/* ── Safety Notice ──────────────────── */}
            <View style={styles.safetyNotice}>
              <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.textGray} />
              <Text style={styles.safetyNoticeText}>Data is securely stored for healthcare purposes</Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* ── Fixed Bottom Button ─────────────── */}
          <View style={styles.bottomBtnWrapper}>
            <TouchableOpacity
              style={[styles.saveBtn, isLoading && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 10 }} />
              ) : (
                <Ionicons name="save-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
              )}
              <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save & Continue'}</Text>
              {!isSaving && <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const isLoading = false;

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ── Header ────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },

  // ── Scroll Content ────────────────────────
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  // ── Page Title ────────────────────────────
  titleSection: {
    marginBottom: 24,
  },
  pageTitle: {
    ...FONTS.h1,
    marginBottom: 8,
  },
  pageSubtitle: {
    ...FONTS.body,
  },

  // ── Info / Safety Banner ──────────────────
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoBannerTitle: {
    ...FONTS.label,
    fontSize: 15,
    marginBottom: 4,
  },
  infoBannerSub: {
    ...FONTS.body,
    fontSize: 13,
    lineHeight: 18,
  },

  // ── Form Card ─────────────────────────────
  formCard: {
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

  // ── Field Group ───────────────────────────
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    ...FONTS.label,
  },
  requiredStar: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ── Input Box ─────────────────────────────
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
    fontSize: 15,
    color: COLORS.textDark,
    padding: 0,
  },
  inputSuffix: {
    ...FONTS.label,
    color: COLORS.textGray,
    marginLeft: 8,
  },

  // ── Phone prefix ──────────────────────────
  prefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  prefixText: {
    ...FONTS.label,
    fontSize: 15,
  },
  prefixDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },

  // ── Safety Notice ─────────────────────────
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  safetyNoticeText: {
    ...FONTS.body,
    fontSize: 13,
  },

  // ── Bottom Button ─────────────────────────
  bottomBtnWrapper: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Dummy Data Card ───────────────────────
  dummyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surface,
    padding: 16,
    marginBottom: 24,
  },
  dummyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dummyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dummyCardTitle: {
    ...FONTS.h3,
    fontSize: 14,
  },
  dummyCardSub: {
    ...FONTS.body,
    fontSize: 12,
  },
  dummyList: {
    gap: 12,
  },
  dummyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dummyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dummyAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dummyInfo: {
    flex: 1,
  },
  dummyName: {
    ...FONTS.label,
    fontSize: 14,
    marginBottom: 4,
  },
  dummyMeta: {
    ...FONTS.body,
    fontSize: 12,
  },
  fillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fillBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
