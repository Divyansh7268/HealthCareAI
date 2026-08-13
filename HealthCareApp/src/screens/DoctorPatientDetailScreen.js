import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../theme';

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle, color }) => (
  <View style={styles.sectionHeader}>
    <MaterialCommunityIcons name={icon} size={20} color={color} />
    <Text style={[styles.sectionTitle, { color }]}>
      {title} <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </Text>
  </View>
);

const VitalBox = ({ icon, value, unit, label, color }) => (
  <View style={styles.vitalBox}>
    <MaterialCommunityIcons name={icon} size={24} color={color} style={{ marginBottom: 6 }} />
    <Text style={styles.vitalValue}>
      {value} <Text style={styles.vitalUnit}>{unit}</Text>
    </Text>
    <Text style={styles.vitalLabel}>{label}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────
export default function DoctorPatientDetailScreen({ navigation, route }) {
  // Use dummy data if no patient is passed
  const p = route?.params?.patient || {
    name: 'Ramesh Kumar',
    age: 52,
    gender: 'Male',
    phone: '9876543210',
    date: '12 May 2026, 10:30 AM',
    queryId: 'QRY01245',
    avatarInitials: 'RK',
    avatarColor: '#F59E0B',
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* ── Header ───────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Details</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.navy} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Card ────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow1}>
            <View style={[styles.avatar, { backgroundColor: p.avatarColor + '20' }]}>
              <Text style={[styles.avatarText, { color: p.avatarColor }]}>{p.avatarInitials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>{p.name}</Text>
              <Text style={styles.patientMeta}>{p.age} Years  •  {p.gender}</Text>
            </View>
            <View style={styles.queryBadge}>
              <Text style={styles.queryBadgeText}>Query ID: {p.queryId}</Text>
            </View>
          </View>
          
          <View style={styles.profileRow2}>
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={14} color={COLORS.subtle} />
              <Text style={styles.infoText}>{p.phone}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.subtle} />
              <Text style={styles.infoText}>{p.date}</Text>
            </View>
          </View>
        </View>

        {/* ── Problem Card ────────────────────── */}
        <View style={[styles.card, { borderColor: COLORS.brand + '20' }]}>
          <SectionHeader icon="account-alert-outline" title="Problem" subtitle="(As per Patient)" color={COLORS.brand} />
          <Text style={styles.bodyText}>Fever, headache and body pain</Text>
        </View>

        {/* ── Patient Reported Voice ──────────── */}
        <View style={[styles.card, { borderColor: '#8B5CF620', backgroundColor: '#F5F3FF50' }]}>
          <SectionHeader icon="microphone-outline" title="Patient Reported" subtitle="(As per Patient Voice)" color="#8B5CF6" />
          <View style={styles.bulletList}>
            {[
              'Having fever since 2 days',
              'Severe headache',
              'Body pain and weakness',
              'No appetite',
              'Feeling cold'
            ].map((item, idx) => (
              <View key={idx} style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bodyText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Vitals ──────────────────────────── */}
        <View style={[styles.card, { borderColor: COLORS.success + '20', backgroundColor: COLORS.greenLight + '30' }]}>
          <SectionHeader icon="heart-pulse" title="Vitals" subtitle="(At Time of Assessment)" color={COLORS.success} />
          
          <View style={styles.vitalsGrid}>
            <VitalBox icon="thermometer" value="98.6" unit="°F" label="Temperature" color={COLORS.success} />
            <VitalBox icon="cards-heart-outline" value="78" unit="bpm" label="Heart Rate" color={COLORS.danger} />
            <VitalBox icon="stethoscope" value="120/80" unit="BP" label="BP" color={COLORS.success} />
            <VitalBox icon="lungs" value="18" unit="/min" label="Resp. Rate" color="#8B5CF6" />
            <VitalBox icon="water-outline" value="98" unit="%" label="SpO2" color={COLORS.brand} />
          </View>
        </View>

        {/* ── AI Diagnosis ────────────────────── */}
        <View style={[styles.card, { borderColor: '#8B5CF620', backgroundColor: '#F5F3FF' }]}>
          <SectionHeader icon="sparkles" title="AI Diagnosis" subtitle="(By AI)" color="#8B5CF6" />
          
          <View style={styles.aiRow}>
            {/* Left */}
            <View style={styles.aiLeft}>
              <Text style={styles.aiLabel}>Possible Condition</Text>
              <Text style={styles.aiCondition}>Viral Fever</Text>
              
              <Text style={[styles.aiLabel, { marginTop: SPACING.md }]}>Confidence Score</Text>
              <View style={styles.progressRow}>
                <Text style={styles.confidenceScore}>85%</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '85%' }]} />
                </View>
              </View>
            </View>

            {/* Vertical Line */}
            <View style={styles.aiDivider} />

            {/* Right */}
            <View style={styles.aiRight}>
              <Text style={styles.aiLabel}>Severity Level</Text>
              <View style={styles.severityBadge}>
                <Ionicons name="alert-circle-outline" size={14} color={COLORS.orange} />
                <Text style={styles.severityText}> Moderate</Text>
              </View>

              <Text style={[styles.aiLabel, { marginTop: SPACING.md }]}>AI Recommendation</Text>
              <Text style={styles.aiRecText}>
                Rest, hydration, paracetamol for fever.{'\n'}Monitor if symptoms worsen.
              </Text>
            </View>
          </View>

          {/* Banner */}
          <View style={styles.aiBanner}>
            <View style={styles.aiBannerIcon}>
              <Ionicons name="information" size={14} color={COLORS.white} />
            </View>
            <Text style={styles.aiBannerText}>
              This is an AI generated diagnosis based on the provided data and not a final medical advice.
            </Text>
          </View>
        </View>

        {/* ── Doctor Action ───────────────────── */}
        <Text style={styles.actionTitle}>Doctor Action</Text>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.success, backgroundColor: COLORS.greenLight }]} activeOpacity={0.7}>
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
            <Text style={[styles.actionBtnText, { color: COLORS.success }]}>Approve AI Diagnose</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.danger, backgroundColor: COLORS.dangerBg }]} activeOpacity={0.7}>
            <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
            <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Reject AI Diagnose</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.orange, backgroundColor: COLORS.orangeBg }]} activeOpacity={0.7}>
            <Ionicons name="pencil-outline" size={16} color={COLORS.orange} />
            <Text style={[styles.actionBtnText, { color: COLORS.orange }]}>Edit AI Diagnose</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Fixed Button ─────────────── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.completeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
          <Text style={styles.completeBtnText}>Diagnose Completed</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  iconBtn: {
    padding: SPACING.sm,
  },
  headerTitle: {
    ...FONTS.h3,
    fontSize: 18,
  },
  scrollContent: {
    padding: SPACING.lg,
  },

  // ── Profile Card
  profileCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOW.sm,
  },
  profileRow1: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    ...FONTS.h3,
    fontSize: 18,
  },
  patientName: {
    ...FONTS.h3,
    fontSize: 17,
    marginBottom: 2,
  },
  patientMeta: {
    ...FONTS.bodyS,
    fontSize: 12,
  },
  queryBadge: {
    backgroundColor: COLORS.brandLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  queryBadgeText: {
    ...FONTS.badge,
    color: COLORS.brand,
    fontSize: 11,
  },
  profileRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    ...FONTS.bodyS,
    fontSize: 12,
    color: COLORS.navy,
  },

  // ── Generic Card
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.h4,
    fontSize: 14,
  },
  sectionSubtitle: {
    ...FONTS.bodyS,
    fontSize: 12,
    fontWeight: '400',
  },
  bodyText: {
    ...FONTS.body,
    fontSize: 14,
    color: COLORS.ink,
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.ink,
    marginLeft: 4,
  },

  // ── Vitals
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  vitalBox: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    ...SHADOW.sm,
  },
  vitalValue: {
    ...FONTS.h3,
    fontSize: 16,
    marginTop: 4,
  },
  vitalUnit: {
    ...FONTS.bodyS,
    fontSize: 10,
  },
  vitalLabel: {
    ...FONTS.bodyS,
    fontSize: 10,
    color: COLORS.subtle,
    marginTop: 2,
  },

  // ── AI Diagnosis
  aiRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
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
    backgroundColor: '#8B5CF630',
  },
  aiLabel: {
    ...FONTS.label,
    fontSize: 11,
    color: COLORS.subtle,
    marginBottom: 4,
  },
  aiCondition: {
    ...FONTS.h3,
    fontSize: 16,
    color: '#8B5CF6',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceScore: {
    ...FONTS.h4,
    fontSize: 13,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#8B5CF630',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orangeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  severityText: {
    ...FONTS.badge,
    color: COLORS.orange,
    fontSize: 11,
  },
  aiRecText: {
    ...FONTS.bodyS,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.navy,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBE5FC',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  aiBannerIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerText: {
    flex: 1,
    ...FONTS.bodyS,
    fontSize: 11,
    color: '#6D28D9',
  },

  // ── Doctor Action
  actionTitle: {
    ...FONTS.h4,
    fontSize: 14,
    marginBottom: SPACING.md,
    marginLeft: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  actionBtnText: {
    ...FONTS.badge,
    fontSize: 10,
    textAlign: 'center',
  },

  // ── Bottom Fixed Bar
  bottomBar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? 0 : SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    gap: 8,
  },
  completeBtnText: {
    ...FONTS.btn,
    fontSize: 16,
  },
});
