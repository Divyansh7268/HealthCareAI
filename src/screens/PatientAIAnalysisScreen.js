import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../theme';
import BodyMap from '../components/BodyMap/BodyMap';

// ─────────────────────────────────────────────────────────────
// Audio Wave SVG Graphic
// ─────────────────────────────────────────────────────────────
const AudioWave = () => (
  <Svg width="80" height="24" viewBox="0 0 80 24" fill="none">
    <Rect x="4" y="8" width="2" height="8" rx="1" fill={COLORS.brand} />
    <Rect x="10" y="4" width="2" height="16" rx="1" fill={COLORS.brand} />
    <Rect x="16" y="10" width="2" height="4" rx="1" fill={COLORS.brand} />
    <Rect x="22" y="2" width="2" height="20" rx="1" fill={COLORS.brand} />
    <Rect x="28" y="6" width="2" height="12" rx="1" fill={COLORS.brand} />
    <Rect x="34" y="10" width="2" height="4" rx="1" fill={COLORS.brand} />
    <Rect x="40" y="0" width="2" height="24" rx="1" fill={COLORS.brand} />
    <Rect x="46" y="4" width="2" height="16" rx="1" fill={COLORS.brand} />
    <Rect x="52" y="8" width="2" height="8" rx="1" fill={COLORS.brand} />
    <Rect x="58" y="2" width="2" height="20" rx="1" fill={COLORS.brand} />
    <Rect x="64" y="6" width="2" height="12" rx="1" fill={COLORS.brand} />
    <Rect x="70" y="10" width="2" height="4" rx="1" fill={COLORS.brand} />
    <Rect x="76" y="8" width="2" height="8" rx="1" fill={COLORS.brand} />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// Vitals Input Card Component
// ─────────────────────────────────────────────────────────────
const VitalCard = ({ icon, title, value, unit, color, placeholder, isAnalyzed }) => (
  <View style={styles.vitalCard}>
    <View style={styles.vitalHeader}>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
      <Text style={styles.vitalTitle}>{title}</Text>
    </View>
    <View style={styles.vitalInputRow}>
      {isAnalyzed && value ? (
        <Text style={styles.vitalValue}>{value}</Text>
      ) : (
        <TextInput
          style={[styles.vitalInput, { color: COLORS.ink }]}
          placeholder={placeholder || '00'}
          placeholderTextColor={COLORS.subtle}
          keyboardType="numeric"
        />
      )}
      <Text style={styles.vitalUnit}>{unit}</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function PatientAIAnalysisScreen({ navigation, route }) {
  // patientId and visitId are passed from PatientDetailScreen after Firestore save
  const { patientId, visitId, patientName: routePatientName } = route?.params || {};
  const patientName = routePatientName || 'Patient';

  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Body Map state
  const [bodyLocations, setBodyLocations] = useState([]);

  const handleGenerateAI = () => {
    setIsAnalyzing(true);
    // Simulate AI processing delay of 2.5 seconds
    setTimeout(() => {
      setIsAnalyzing(false);
      // Later, when integrating real AI, we will send `bodyLocations` to Gemini,
      // and also to Firestore via `updateVisitData`.
      setIsAnalyzed(true);
    }, 2500);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* ── Page Header ───────────────────────── */}
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={COLORS.navy} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Title Area ──────────────────────── */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>AI-Assisted Assessment</Text>
            <Text style={styles.pageSubtitle}>Enter vitals, upload image and let AI assist you.</Text>
          </View>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={12} color={COLORS.success} />
            <Text style={styles.aiBadgeText}> AI Ready</Text>
          </View>
        </View>

        {/* ── Patient Profile Card ────────────── */}
        <View style={styles.patientCard}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientInitials}>RK</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.patientMeta}>Age 52  •  Male</Text>
            <Text style={styles.patientSubMeta}>Registered just now</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.7} onPress={() => navigation.goBack()}>
            <Text style={styles.editBtnText}>View / Edit </Text>
            <Ionicons name="pencil" size={12} color={COLORS.brand} />
          </TouchableOpacity>
        </View>

        {/* ── Section 1: Body Map ─────────────── */}
        <Text style={styles.sectionTitle}>1. Affected Body Areas</Text>
        <Text style={styles.sectionSubtitle}>Tap to select affected areas and add symptoms</Text>
        <BodyMap onSelectionsChange={setBodyLocations} />

        {/* ── Section 2: Image Upload ─────────── */}
        <Text style={styles.sectionTitle}>2. Upload Symptoms Image</Text>
        <View style={styles.uploadCard}>
          <View style={styles.uploadIconBox}>
            <Ionicons name="image-outline" size={28} color={COLORS.brand} />
            <View style={styles.uploadPlus}>
              <Ionicons name="add" size={12} color={COLORS.white} />
            </View>
          </View>
          <Text style={styles.uploadTitle}>Upload image</Text>
          <Text style={styles.uploadSub}>Upload a photo of symptoms{'\n'}(e.g., rash, swelling, injury etc.)</Text>
          <TouchableOpacity style={styles.chooseImgBtn} activeOpacity={0.8}>
            <Ionicons name="push-outline" size={16} color={COLORS.brand} style={{ marginRight: 6 }} />
            <Text style={styles.chooseImgText}>Choose Image</Text>
          </TouchableOpacity>
        </View>

        {/* ── Section 3: Voice Description ────── */}
        <Text style={styles.sectionTitle}>3. Describe the Problem (Voice)</Text>
        <View style={styles.voiceCard}>
          <TouchableOpacity style={styles.micBtn} activeOpacity={0.8}>
            <Ionicons name="mic" size={24} color={COLORS.brand} />
          </TouchableOpacity>
          <View style={styles.voiceTextContainer}>
            <Text style={styles.voiceTitle}>Tap the mic and describe the problem</Text>
            <Text style={styles.voiceSub}>Speak in Hindi or English</Text>
          </View>
          <AudioWave />
        </View>

        {/* ── Section 4: Vitals ───────────────── */}
        <Text style={styles.sectionTitle}>4. Vitals</Text>
        <View style={styles.vitalsGrid}>
          <VitalCard icon="thermometer" title="Temperature (°C)" value="98.6" unit="°C" color={COLORS.green} isAnalyzed={isAnalyzed} />
          <VitalCard icon="cards-heart" title="Blood Pressure" value="120/80" unit="mmHg" color={COLORS.danger} isAnalyzed={isAnalyzed} />
          <VitalCard icon="heart-pulse" title="Heart Rate" value="78" unit="bpm" color={COLORS.danger} isAnalyzed={isAnalyzed} />
          <VitalCard icon="water-percent" title="SpO2" value="98" unit="%" color={COLORS.brand} isAnalyzed={isAnalyzed} />
          <VitalCard icon="lungs" title="Respiratory Rate" value="18" unit="breaths/min" color="#9333EA" isAnalyzed={isAnalyzed} />
          <VitalCard icon="scale-bathroom" title="Weight (kg)" placeholder="Enter weight" unit="kg" color={COLORS.warning} isAnalyzed={isAnalyzed} />
        </View>

        {/* ── Generate Analysis Button / Loader ── */}
        {!isAnalyzed && !isAnalyzing && (
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={handleGenerateAI}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={18} color={COLORS.white} />
            <Text style={styles.generateBtnText}>Generate AI Analysis</Text>
          </TouchableOpacity>
        )}

        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Text style={styles.loadingText}>AI is analyzing symptoms...</Text>
            <Text style={styles.loadingSub}>Please wait a moment</Text>
          </View>
        )}

        {/* ── Section 5: AI Analysis ──────────── */}
        {isAnalyzed && (
          <>
            <Text style={styles.sectionTitle}>5. AI Analysis & Recommendation</Text>
            <View style={styles.aiAnalysisCard}>
              <View style={styles.aiContentRow}>
                
                {/* Left: Assessment */}
                <View style={styles.aiLeft}>
                  <Text style={styles.aiColTitle}>AI Assessment</Text>
                  <View style={styles.riskBadge}>
                    <Ionicons name="alert-circle-outline" size={16} color={COLORS.orange} />
                    <Text style={styles.riskBadgeText}> Moderate Risk</Text>
                  </View>
                  <Text style={styles.aiDesc}>
                    Based on the provided information, the condition appears to be moderate. Monitor the patient and follow recommended actions.
                  </Text>
                </View>

                {/* Vertical Divider */}
                <View style={styles.aiDivider} />

                {/* Right: Recommendations */}
                <View style={styles.aiRight}>
                  <Text style={styles.aiColTitle}>AI Recommendations</Text>
                  {[
                    'Paracetamol for fever',
                    'Increase fluid intake',
                    'Rest and hydration',
                    'Monitor temperature',
                    'If symptoms worsen, consult a doctor'
                  ].map((item, idx) => (
                    <View key={idx} style={styles.recRow}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.green} />
                      <Text style={styles.recText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Disclaimer */}
              <View style={styles.disclaimerRow}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.subtle} />
                <Text style={styles.disclaimerText}>
                  This is an AI-generated suggestion and not a medical diagnosis.
                </Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Actions ────────────────────── */}
      {isAnalyzed && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.sendBtn} onPress={() => navigation.navigate('HealthWorkerDashboard')} activeOpacity={0.85}>
            <Ionicons name="send-outline" size={18} color={COLORS.white} />
            <Text style={styles.sendBtnText}>Send to Doctor for Review</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextBtn} onPress={() => navigation.navigate('PatientDetail')} activeOpacity={0.85}>
            <Ionicons name="person-add-outline" size={18} color={COLORS.brand} />
            <Text style={styles.nextBtnText}>Next Patient</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.brand} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  pageHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

  // Title Area
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  pageTitle: {
    ...FONTS.h2,
    fontSize: 20,
    marginBottom: 2,
  },
  pageSubtitle: {
    ...FONTS.bodyS,
    color: COLORS.subtle,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
  },
  aiBadgeText: {
    ...FONTS.badge,
    color: COLORS.success,
    fontSize: 12,
  },

  // Patient Card
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    ...SHADOW.sm,
  },
  patientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  patientInitials: {
    ...FONTS.h3,
    color: COLORS.brand,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    ...FONTS.h4,
    fontSize: 16,
    marginBottom: 2,
  },
  patientMeta: {
    ...FONTS.bodyS,
    fontSize: 12,
  },
  patientSubMeta: {
    ...FONTS.bodyS,
    fontSize: 11,
    color: COLORS.subtle,
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brandLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  editBtnText: {
    ...FONTS.badge,
    color: COLORS.brand,
    fontSize: 12,
  },

  // Sections
  sectionTitle: {
    ...FONTS.h4,
    fontSize: 15,
    marginBottom: SPACING.md,
  },

  // Upload Section
  uploadCard: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.white,
    ...SHADOW.sm,
  },
  uploadIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  uploadPlus: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: COLORS.brand,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  uploadTitle: {
    ...FONTS.label,
    fontSize: 15,
    marginBottom: 4,
  },
  uploadSub: {
    ...FONTS.bodyS,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  chooseImgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.brandMid,
  },
  chooseImgText: {
    ...FONTS.label,
    color: COLORS.brand,
  },

  // Voice Section
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    ...SHADOW.sm,
  },
  micBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  voiceTextContainer: {
    flex: 1,
  },
  voiceTitle: {
    ...FONTS.label,
    fontSize: 14,
    marginBottom: 2,
  },
  voiceSub: {
    ...FONTS.bodyS,
    fontSize: 12,
  },

  // Vitals Section
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  vitalCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    ...SHADOW.sm,
  },
  vitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  vitalTitle: {
    ...FONTS.bodyS,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.navy,
  },
  vitalInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  vitalValue: {
    ...FONTS.h3,
    fontSize: 20,
  },
  vitalInput: {
    ...FONTS.h3,
    fontSize: 16,
    padding: 0,
    margin: 0,
    flex: 1,
  },
  vitalUnit: {
    ...FONTS.bodyS,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 3,
  },

  // AI Analysis Section
  aiAnalysisCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    ...SHADOW.sm,
    overflow: 'hidden',
  },
  aiContentRow: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  aiLeft: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  aiRight: {
    flex: 1,
    paddingLeft: SPACING.sm,
  },
  aiDivider: {
    width: 1,
    backgroundColor: COLORS.surface,
  },
  aiColTitle: {
    ...FONTS.label,
    fontSize: 13,
    marginBottom: SPACING.sm,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orangeBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  riskBadgeText: {
    ...FONTS.badge,
    color: COLORS.orange,
    fontSize: 12,
  },
  aiDesc: {
    ...FONTS.bodyS,
    fontSize: 12,
    lineHeight: 18,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 6,
  },
  recText: {
    ...FONTS.bodyS,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: 6,
  },
  disclaimerText: {
    ...FONTS.bodyS,
    fontSize: 11,
    color: COLORS.subtle,
  },

  // Bottom Actions
  bottomActions: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? 0 : SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    gap: SPACING.sm,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    paddingHorizontal: SPACING.md,
  },
  sendBtnText: {
    ...FONTS.btn,
    fontSize: 15,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.brandMid,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
  },
  nextBtnText: {
    ...FONTS.btn,
    color: COLORS.brand,
    fontSize: 15,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: 8,
    ...SHADOW.brand,
  },
  generateBtnText: {
    ...FONTS.btn,
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
    marginTop: SPACING.md,
    backgroundColor: COLORS.brandLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.brand + '30',
  },
  loadingText: {
    ...FONTS.h4,
    color: COLORS.brand,
    marginTop: SPACING.md,
    marginBottom: 4,
  },
  loadingSub: {
    ...FONTS.bodyS,
    color: COLORS.brandMid,
  },
});
