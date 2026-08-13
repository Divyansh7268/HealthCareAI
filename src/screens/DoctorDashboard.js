import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../theme';
import { useAuthStore } from '../store/useAuthStore';

// ─────────────────────────────────────────────────────────────
// Dummy Data
// ─────────────────────────────────────────────────────────────
const DOCTOR_QUERIES = [
  {
    id: 1,
    name: 'Ramesh Kumar',
    age: 52,
    gender: 'Male',
    symptoms: 'Fever, headache and body pain',
    time: '10:30 AM',
    date: '12 May 2026',
    risk: 'High',
    avatarInitials: 'RK',
    avatarColor: '#F59E0B',
  },
  {
    id: 2,
    name: 'Sarla Devi',
    age: 45,
    gender: 'Female',
    symptoms: 'Cough, sore throat and fatigue',
    time: '10:15 AM',
    date: '12 May 2026',
    risk: 'Medium',
    avatarInitials: 'SD',
    avatarColor: '#10B981',
  },
  {
    id: 3,
    name: 'Arjun Singh',
    age: 28,
    gender: 'Male',
    symptoms: 'Stomach pain and acidity',
    time: '09:45 AM',
    date: '12 May 2026',
    risk: 'Low',
    avatarInitials: 'AS',
    avatarColor: COLORS.brand,
  },
  {
    id: 4,
    name: 'Kamla Bai',
    age: 60,
    gender: 'Female',
    symptoms: 'Joint pain in knees and back',
    time: '09:20 AM',
    date: '12 May 2026',
    risk: 'Medium',
    avatarInitials: 'KB',
    avatarColor: '#8B5CF6',
  },
  {
    id: 5,
    name: 'Vikram Yadav',
    age: 16,
    gender: 'Male',
    symptoms: 'Skin rash and itching',
    time: '08:50 AM',
    date: '12 May 2026',
    risk: 'Low',
    avatarInitials: 'VY',
    avatarColor: '#EC4899',
  },
  {
    id: 6,
    name: 'Meena Kumari',
    age: 34,
    gender: 'Female',
    symptoms: 'Dizziness and weakness',
    time: '08:30 AM',
    date: '12 May 2026',
    risk: 'High',
    avatarInitials: 'MK',
    avatarColor: COLORS.danger,
  }
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const getRiskColor = (risk) => {
  switch (risk) {
    case 'High': return COLORS.danger;
    case 'Medium': return COLORS.warning;
    case 'Low': return COLORS.success;
    default: return COLORS.muted;
  }
};

const getRiskBg = (risk) => {
  switch (risk) {
    case 'High': return COLORS.dangerBg;
    case 'Medium': return COLORS.warningBg;
    case 'Low': return COLORS.greenLight;
    default: return COLORS.surface;
  }
};

// ─────────────────────────────────────────────────────────────
// Query Card Component
// ─────────────────────────────────────────────────────────────
const QueryCard = ({ query, onView }) => (
  <View style={styles.card}>
    {/* Left Column: Avatar + Details */}
    <View style={styles.cardLeft}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: query.avatarColor + '20' }]}>
        <Text style={[styles.avatarText, { color: query.avatarColor }]}>{query.avatarInitials}</Text>
      </View>
      
      {/* Patient Info */}
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{query.name}</Text>
        <Text style={styles.patientMeta}>{query.age} Years  •  {query.gender}</Text>
        <Text style={styles.patientSymptoms}>{query.symptoms}</Text>
        
        {/* Vitals Badge */}
        <View style={styles.vitalsBadge}>
          <Text style={styles.vitalsBadgeText}>Vitals Available</Text>
        </View>
      </View>
    </View>

    {/* Right Column: Time, Risk, View Button */}
    <View style={styles.cardRight}>
      <View style={styles.dateTimeContainer}>
        <Text style={styles.timeText}>{query.time}</Text>
        <Text style={styles.dateText}>{query.date}</Text>
      </View>

      <View style={styles.actionRow}>
        <View style={[styles.riskBadge, { backgroundColor: getRiskBg(query.risk) }]}>
          <Text style={[styles.riskText, { color: getRiskColor(query.risk) }]}>{query.risk}</Text>
        </View>
        <TouchableOpacity style={styles.viewBtn} activeOpacity={0.7} onPress={() => onView(query)}>
          <Ionicons name="eye-outline" size={14} color={COLORS.brand} style={{ marginRight: 4 }} />
          <Text style={styles.viewBtnText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────
export default function DoctorDashboard({ navigation }) {
  const logout = useAuthStore((state) => state.logout);
  const [activeTab, setActiveTab] = useState('Queries');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* ── Top Header ───────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={logout} activeOpacity={0.7}>
          <Ionicons name="menu" size={28} color={COLORS.navy} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Doctor Dashboard</Text>
        
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={26} color={COLORS.navy} />
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>12</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Title Section ─────────────────────── */}
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.pageTitle}>Patient Queries</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>12</Text>
              </View>
            </View>
            <Text style={styles.pageSubtitle}>Review and respond to patient queries</Text>
          </View>

          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
            <Ionicons name="funnel-outline" size={16} color={COLORS.navy} style={{ marginRight: 6 }} />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* ── Queries List ─────────────────────── */}
        <View style={styles.listContainer}>
          {DOCTOR_QUERIES.map(q => (
            <QueryCard key={q.id} query={q} onView={() => navigation.navigate('DoctorPatientDetail')} />
          ))}
        </View>

      </ScrollView>

      {/* ── Bottom Tab Bar ───────────────────── */}
      <View style={styles.tabBar}>
        {[
          { key: 'Queries',  icon: 'calendar', iconOut: 'calendar-outline' },
          { key: 'Patients', icon: 'person',   iconOut: 'person-outline' },
          { key: 'Settings', icon: 'settings', iconOut: 'settings-outline' },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={active ? tab.icon : tab.iconOut}
                size={24}
                color={active ? COLORS.brand : COLORS.muted}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.key}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // ── Header ───────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  menuBtn: {
    padding: 4,
  },
  headerTitle: {
    ...FONTS.h3,
    fontSize: 18,
  },
  bellBtn: {
    padding: 4,
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  bellBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },

  // ── Scroll Content ───────────────────────
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: 40,
  },

  // ── Title Area ───────────────────────────
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  titleLeft: {
    flex: 1,
  },
  pageTitle: {
    ...FONTS.h2,
    fontSize: 22,
    marginRight: 8,
  },
  countBadge: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    ...FONTS.badge,
    color: COLORS.white,
    fontSize: 12,
  },
  pageSubtitle: {
    ...FONTS.bodyS,
    color: COLORS.subtle,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: {
    ...FONTS.label,
    fontSize: 13,
  },

  // ── List Container ───────────────────────
  listContainer: {
    gap: SPACING.md,
  },

  // ── Query Card ───────────────────────────
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surface,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  cardLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    ...FONTS.h4,
    fontSize: 16,
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
    marginBottom: 4,
  },
  patientSymptoms: {
    ...FONTS.bodyS,
    color: COLORS.navy,
    fontSize: 13,
    marginBottom: 8,
  },
  vitalsBadge: {
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  vitalsBadgeText: {
    ...FONTS.badge,
    color: COLORS.success,
    fontSize: 10,
  },

  // Card Right Side
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: SPACING.sm,
  },
  dateTimeContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    ...FONTS.label,
    fontSize: 12,
  },
  dateText: {
    ...FONTS.bodyS,
    fontSize: 10,
    color: COLORS.subtle,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  riskText: {
    ...FONTS.badge,
    fontSize: 10,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.brandMid,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.brandLight,
  },
  viewBtnText: {
    ...FONTS.label,
    color: COLORS.brand,
    fontSize: 12,
  },

  // ── Tab Bar ──────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    paddingBottom: Platform.OS === 'ios' ? 24 : SPACING.sm,
    paddingTop: SPACING.sm,
    ...SHADOW.md,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    ...FONTS.bodyS,
    fontSize: 11,
    marginTop: 3,
    color: COLORS.subtle,
  },
  tabLabelActive: {
    color: COLORS.brand,
    fontWeight: '700',
  },
});
