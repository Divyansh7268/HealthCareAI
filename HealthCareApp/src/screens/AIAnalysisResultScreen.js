import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS as THEME_COLORS, FONTS as THEME_FONTS } from '../theme';

const { width } = Dimensions.get('window');

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
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
};

const FONTS = {
  ...THEME_FONTS,
  h1: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  h2: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },
  h3: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  body: { fontSize: 14, color: COLORS.textGray, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
};

function riskColor(level) {
  switch(level?.toLowerCase()) {
    case 'critical': return '#DC2626';
    case 'high':     return '#EA580C';
    case 'moderate': return '#D97706';
    case 'low':      return '#16A34A';
    default:         return COLORS.primary;
  }
}

function riskBgColor(level) {
  switch(level?.toLowerCase()) {
    case 'critical': return '#FEF2F2';
    case 'high':     return '#FFF7ED';
    case 'moderate': return '#FEF3C7';
    case 'low':      return '#F0FDF4';
    default:         return COLORS.primaryLight;
  }
}

// ─────────────────────────────────────────────────────────────
// Helper to parse the AI Result
// ─────────────────────────────────────────────────────────────
export default function AIAnalysisResultScreen({ navigation, route }) {
  const { aiResult, patientName } = route?.params || {};
  
  if (!aiResult) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>No AI data available.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, padding: 10, backgroundColor: COLORS.primary, borderRadius: 8 }}>
            <Text style={{ color: 'white' }}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  // Parse real data
  const riskLevel = aiResult.riskLevel || 'Unknown';
  const displayRisk = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) + ' Risk';
  const currentRiskColor = riskColor(riskLevel);
  const currentRiskBg = riskBgColor(riskLevel);
  
  const recommendations = aiResult.nextSteps || [];
  const possibleConditions = aiResult.possibleConditions || [];
  const redFlags = aiResult.redFlags || [];
  const missingInfo = aiResult.missingInformation || [];

  const formattedRecs = typeof recommendations[0] === 'string' 
    ? recommendations.map((r, i) => ({
        icon: i === 0 ? 'pill' : i === 1 ? 'water-outline' : i === 2 ? 'bed-outline' : 'medical-outline',
        text: r
      }))
    : recommendations;

  const handleNextPatient = () => {
    navigation.navigate('HealthWorkerDashboard');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* ── Header ────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Analysis & Recommendation</Text>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color={COLORS.primary} />
            <Text style={styles.aiBadgeText}> AI Complete</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* ── AI Assessment Section (Risk Level) ────────── */}
          <Text style={styles.sectionTitle}>AI ASSESSMENT</Text>
          <View style={[styles.riskCard, { backgroundColor: currentRiskBg }]}>
            <View style={styles.riskHeader}>
              <View style={[styles.riskIconCircle, { borderColor: currentRiskColor }]}>
                <Ionicons name="alert-circle-outline" size={36} color={currentRiskColor} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[styles.riskLabel, { color: currentRiskColor }]}>RISK LEVEL</Text>
                <Text style={[styles.riskValue, { color: currentRiskColor }]}>{displayRisk}</Text>
              </View>
              <Ionicons name="shield-outline" size={40} color={currentRiskColor + '20'} style={{ position: 'absolute', right: -10, top: 0 }} />
            </View>
            <Text style={styles.riskDescription}>
              Based on the provided information, the urgency is {aiResult.urgency?.toUpperCase() || 'NORMAL'}. Monitor the patient and follow recommended actions.
            </Text>
          </View>

          {/* ── Red Flags ────────── */}
          {redFlags.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>RED FLAGS DETECTED</Text>
              <View style={[styles.recsCard, { backgroundColor: COLORS.dangerBg, borderColor: COLORS.danger, borderWidth: 1 }]}>
                {redFlags.map((flag, index) => (
                  <View key={index} style={[styles.recRow, index !== redFlags.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#FCA5A5' }]}>
                    <Ionicons name="warning-outline" size={20} color={COLORS.danger} style={{ marginRight: 12 }} />
                    <Text style={[styles.recText, { color: COLORS.danger, fontWeight: '600' }]}>{flag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── Possible Conditions ────────── */}
          {possibleConditions.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>POSSIBLE CONDITIONS</Text>
              <View style={styles.recsCard}>
                {possibleConditions.map((cond, index) => (
                  <View key={index} style={[styles.recRow, index !== possibleConditions.length - 1 && styles.recRowBorder, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Ionicons name="medkit-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                      <Text style={[styles.recText, { fontWeight: '700' }]}>{cond.condition} ({cond.probability})</Text>
                    </View>
                    {cond.supportingFindings?.length > 0 && (
                      <Text style={{ fontSize: 13, color: COLORS.textGray, paddingLeft: 26 }}>
                        Supports: {cond.supportingFindings.join(', ')}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── AI Recommendations ───── */}
          {formattedRecs.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>AI RECOMMENDATIONS</Text>
              <View style={styles.recsCard}>
                {formattedRecs.map((rec, index) => (
                  <View key={index} style={[styles.recRow, index !== formattedRecs.length - 1 && styles.recRowBorder]}>
                    <View style={styles.recIconCircle}>
                      <MaterialCommunityIcons name={rec.icon || 'circle-medium'} size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.recText}>{rec.text}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── Missing Information ────────── */}
          {missingInfo.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: COLORS.warning }]}>MISSING INFORMATION</Text>
              <View style={[styles.recsCard, { backgroundColor: COLORS.warningBg, borderColor: COLORS.warning, borderWidth: 1 }]}>
                {missingInfo.map((info, index) => (
                  <View key={index} style={[styles.recRow, index !== missingInfo.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#FDE68A' }]}>
                    <Ionicons name="help-circle-outline" size={20} color={COLORS.warning} style={{ marginRight: 12 }} />
                    <Text style={[styles.recText, { color: '#B45309' }]}>{info}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── Disclaimer Banner ────────────── */}
          <View style={styles.disclaimerBanner}>
            <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.disclaimerText}>
              {aiResult.disclaimer || "This is an AI-generated suggestion and not a medical diagnosis."}
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── Fixed Bottom Button ────────────── */}
        <View style={styles.bottomBtnWrapper}>
          <TouchableOpacity
            style={styles.nextBtn}
            activeOpacity={0.85}
            onPress={handleNextPatient}
          >
            <Ionicons name="person-add-outline" size={22} color={COLORS.white} style={{ position: 'absolute', left: 24 }} />
            <Text style={styles.nextBtnText}>Next Patient</Text>
            <Ionicons name="arrow-forward" size={22} color={COLORS.white} style={{ position: 'absolute', right: 24 }} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    padding: 6,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    ...FONTS.h3,
    fontSize: 15,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  aiBadgeText: {
    ...FONTS.label,
    fontSize: 12,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  sectionTitle: {
    ...FONTS.label,
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 20,
  },

  // Risk Card
  riskCard: {
    borderRadius: 16,
    padding: 24,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  riskIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  riskLabel: {
    ...FONTS.label,
    fontSize: 12,
    marginBottom: 4,
  },
  riskValue: {
    ...FONTS.h1,
    fontSize: 24,
  },
  riskDescription: {
    ...FONTS.body,
    color: COLORS.textDark,
    lineHeight: 24,
  },

  // Recommendations / Generic Card
  recsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  recRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  recIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  recText: {
    ...FONTS.body,
    color: COLORS.textDark,
    flex: 1,
  },

  // Disclaimer
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  disclaimerText: {
    ...FONTS.body,
    fontSize: 13,
    color: COLORS.textGray,
    flex: 1,
    marginLeft: 12,
  },

  // Bottom Button
  bottomBtnWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: 'transparent',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CC0000',
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: '#CC0000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  nextBtnText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
