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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { registerPatientAndStartVisit } from '../services/patientService';

// ── Development mode flag ─────────────────────────────────────
// Set to false before production release
const DEV_MODE = true;

// ─────────────────────────────────────────────────────────────
// VirtualCare Logo (small)
// ─────────────────────────────────────────────────────────────
const VCLogo = ({ size = 28 }) => (
  <Svg width={size} height={size * 1.1} viewBox="0 0 44 48" fill="none">
    <Rect x="20" y="0" width="5" height="13" rx="2.5" fill="#10B981" />
    <Rect x="14.5" y="4" width="16" height="5" rx="2.5" fill="#10B981" />
    <Path d="M4 16 L22 44 L40 16 Q38 12 35 14 L22 38 L9 14 Q6 12 4 16 Z" fill={COLORS.brand} />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// Info Banner (blue tint)
// ─────────────────────────────────────────────────────────────
const InfoBanner = ({ icon, title, subtitle, accent = COLORS.brand, bgColor = COLORS.brandLight }) => (
  <View style={[styles.infoBanner, { backgroundColor: bgColor, borderColor: accent + '30' }]}>
    <View style={[styles.infoBannerIcon, { backgroundColor: accent + '18' }]}>
      <Ionicons name={icon} size={22} color={accent} />
    </View>
    <View style={{ flex: 1, marginLeft: SPACING.md }}>
      <Text style={[styles.infoBannerTitle, { color: accent }]}>{title}</Text>
      <Text style={styles.infoBannerSub}>{subtitle}</Text>
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
  { name: 'Ramesh Kumar',  age: '52', phone: '9876543210', icon: 'RK', color: COLORS.brand },
  { name: 'Sunita Devi',   age: '46', phone: '9812345678', icon: 'SD', color: COLORS.green },
  { name: 'Arun Singh',    age: '31', phone: '9988776655', icon: 'AS', color: '#7C3AED' },
];

// ─────────────────────────────────────────────────────────────
// Dev Auto-fill Card (only shown when DEV_MODE = true)
// Fills form fields only — does NOT create any real patient record
// ─────────────────────────────────────────────────────────────
const DevAutoFillCard = ({ onSelect }) => (
  <View style={[styles.dummyCard, { borderColor: '#F59E0B40', borderStyle: 'dashed' }]}>
    <View style={styles.dummyCardHeader}>
      <View style={[styles.dummyIconBox, { backgroundColor: '#FEF3C7' }]}>
        <Ionicons name="code-slash-outline" size={18} color="#D97706" />
      </View>
      <View style={{ flex: 1, marginLeft: 2 }}>
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* ── Page Header ───────────────────────── */}
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={COLORS.navy} />
        </TouchableOpacity>
        <View style={styles.logoRow}>
          <VCLogo size={28} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.headerBrand}>VirtualCare</Text>
            <Text style={styles.headerSub}>Health Worker Portal</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
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
          <Text style={styles.pageTitle}>Enter Patient Details</Text>
          <Text style={styles.pageSubtitle}>Start a new patient assessment</Text>

          {/* ── Info Banner ─────────────────── */}
          <InfoBanner
            icon="information-circle-outline"
            title="Fill in basic details"
            subtitle="This helps us provide better AI-assisted support and doctor consultation."
            accent={COLORS.brand}
            bgColor={COLORS.brandLight}
          />

          {/* ── Dev Auto-fill (DEV_MODE only) ── */}
          {DEV_MODE && <DevAutoFillCard onSelect={handleDevAutoFill} />}

          {/* ── Patient Name ─────────────────── */}
          <View style={styles.fieldGroup}>
            <FieldLabel label="Patient Name" required />
            <View style={[styles.inputBox, patientName.length > 0 && { borderColor: COLORS.brand }]}>
              <Ionicons name="person-outline" size={18} color={COLORS.subtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter patient full name"
                placeholderTextColor={COLORS.subtle}
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
            <View style={[styles.inputBox, patientAge.length > 0 && { borderColor: COLORS.brand }]}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.subtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter patient age"
                placeholderTextColor={COLORS.subtle}
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
            <View style={[styles.inputBox, phone.length > 0 && { borderColor: COLORS.brand }]}>
              <Ionicons name="call-outline" size={18} color={COLORS.subtle} style={styles.inputIcon} />
              {/* +91 prefix with dropdown chevron */}
              <TouchableOpacity style={styles.prefixBox} activeOpacity={0.7}>
                <Text style={styles.prefixText}>+91</Text>
                <Ionicons name="chevron-down" size={13} color={COLORS.muted} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
              <View style={styles.prefixDivider} />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.subtle}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* ── Safety Card ──────────────────── */}
          <InfoBanner
            icon="shield-checkmark-outline"
            title="Your data is safe"
            subtitle="Patient information is stored securely and used only for healthcare purposes."
            accent={COLORS.green}
            bgColor={COLORS.greenLight}
          />

          {/* Bottom spacer so button doesn't overlap last card */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Fixed Bottom Button ─────────────── */}
        <SafeAreaView edges={['bottom']} style={styles.bottomBtnWrapper}>
          <TouchableOpacity
            style={[styles.saveBtn, SHADOW.brand, isSaving && { opacity: 0.7 }]}
            activeOpacity={0.86}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 10 }} />
            ) : (
              <Ionicons name="save-outline" size={20} color={COLORS.white} style={{ marginRight: 10 }} />
            )}
            <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save & Continue'}</Text>
            {!isSaving && <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 10 }} />}
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // ── Header ────────────────────────────────
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBrand: {
    ...FONTS.h4,
    fontSize: 16,
  },
  headerSub: {
    ...FONTS.bodyS,
    fontSize: 11,
    marginTop: 1,
  },

  // ── Scroll Content ────────────────────────
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.white,
  },

  // ── Page Title ────────────────────────────
  pageTitle: {
    ...FONTS.h1,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  pageSubtitle: {
    ...FONTS.body,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },

  // ── Info / Safety Banner ──────────────────
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  infoBannerIcon: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoBannerTitle: {
    ...FONTS.label,
    fontSize: 14.5,
    marginBottom: 4,
  },
  infoBannerSub: {
    ...FONTS.bodyS,
    lineHeight: 19,
  },

  // ── Field Group ───────────────────────────
  fieldGroup: {
    marginBottom: SPACING.xl,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    ...FONTS.label,
    fontSize: 15,
  },
  requiredStar: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.danger,
  },

  // ── Input Box ─────────────────────────────
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 15 : 11,
    ...SHADOW.sm,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.ink,
    padding: 0,
  },
  inputSuffix: {
    ...FONTS.label,
    color: COLORS.muted,
    fontSize: 14,
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
    color: COLORS.ink,
  },
  prefixDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },

  // ── Bottom Button ─────────────────────────
  bottomBtnWrapper: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.xl,
    paddingVertical: 17,
  },
  saveBtnText: {
    ...FONTS.btn,
    fontSize: 17,
  },

  // ── Dummy Data Card ───────────────────────
  dummyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    ...SHADOW.sm,
  },
  dummyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dummyIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dummyCardTitle: {
    ...FONTS.h4,
    fontSize: 14,
    flex: 1,
  },
  dummyCardSub: {
    ...FONTS.bodyS,
    fontSize: 12,
  },
  dummyList: {
    gap: 10,
  },
  dummyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dummyAvatar: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dummyAvatarText: {
    ...FONTS.badge,
    fontSize: 14,
  },
  dummyInfo: {
    flex: 1,
  },
  dummyName: {
    ...FONTS.label,
    fontSize: 14,
    marginBottom: 2,
  },
  dummyMeta: {
    ...FONTS.bodyS,
    fontSize: 11,
  },
  fillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  fillBtnText: {
    ...FONTS.badge,
    color: COLORS.white,
    fontSize: 11,
  },
});
