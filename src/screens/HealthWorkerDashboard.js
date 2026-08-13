import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Rect } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../theme';
import { useAuthStore } from '../store/useAuthStore';

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
// Patient Data
// ─────────────────────────────────────────────────────────────
const ALL_PATIENTS = [
  { id: '1', initials: 'RK', name: 'Ramesh Kumar',  age: 52, gender: 'Male',   symptom: 'Fever, weakness', time: '10:42 AM', status: 'Doctor Review', avatarBg: COLORS.brandLight,  avatarText: COLORS.brand },
  { id: '2', initials: 'SD', name: 'Sunita Devi',   age: 46, gender: 'Female', symptom: 'Headache',        time: '09:35 AM', status: 'Completed',     avatarBg: COLORS.successBg,   avatarText: COLORS.success },
  { id: '3', initials: 'AS', name: 'Arun Singh',    age: 31, gender: 'Male',   symptom: 'Cough',           time: '09:10 AM', status: 'In Progress',   avatarBg: '#EDE9FE',          avatarText: '#7C3AED' },
  { id: '4', initials: 'PM', name: 'Priya Mehra',   age: 28, gender: 'Female', symptom: 'Back pain',       time: '08:50 AM', status: 'Consultation',  avatarBg: COLORS.orangeBg,    avatarText: COLORS.orange },
  { id: '5', initials: 'VK', name: 'Vijay Kapoor',  age: 60, gender: 'Male',   symptom: 'Chest pain',      time: '08:30 AM', status: 'Emergency',     avatarBg: COLORS.dangerBg,    avatarText: COLORS.danger },
];

const STATUS_FILTERS = ['All', 'In Progress', 'Doctor Review', 'Consultation', 'Completed', 'Emergency'];

const STATUS_MAP = {
  'Doctor Review': { bg: COLORS.warningBg,     text: COLORS.warning,  border: COLORS.warningBorder },
  'Completed':     { bg: COLORS.successBg,     text: COLORS.success,  border: COLORS.successBorder },
  'In Progress':   { bg: COLORS.inprogressBg,  text: COLORS.inprogress, border: COLORS.inprogressBorder },
  'Consultation':  { bg: COLORS.orangeBg,      text: COLORS.orange,   border: COLORS.orangeBorder },
  'Emergency':     { bg: COLORS.dangerBg,      text: COLORS.danger,   border: COLORS.dangerBorder },
};

// ─────────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { bg: COLORS.surface, text: COLORS.muted, border: COLORS.border };
  return (
    <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{status}</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Patient Card
// ─────────────────────────────────────────────────────────────
const PatientCard = ({ patient }) => (
  <TouchableOpacity style={styles.patientCard} activeOpacity={0.76}>
    <View style={[styles.patientAvatar, { backgroundColor: patient.avatarBg }]}>
      <Text style={[styles.patientInitials, { color: patient.avatarText }]}>{patient.initials}</Text>
    </View>
    <View style={styles.patientInfo}>
      <Text style={styles.patientName}>{patient.name}</Text>
      <Text style={styles.patientMeta}>Age {patient.age}  •  {patient.gender}</Text>
      <Text style={styles.patientSymptom}>{patient.symptom}</Text>
    </View>
    <View style={styles.patientRight}>
      <Text style={styles.patientTime}>{patient.time}</Text>
      <StatusBadge status={patient.status} />
    </View>
    <Ionicons name="chevron-forward" size={15} color={COLORS.border} style={{ marginLeft: 4 }} />
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────
export default function HealthWorkerDashboard({ navigation, workerName = 'Asha Devi' }) {
  const logout = useAuthStore((state) => state.logout);
  const [activeTab, setActiveTab]       = useState('Home');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery]   = useState('');

  const filtered = ALL_PATIENTS.filter((p) => {
    const matchFilter = activeFilter === 'All' || p.status === activeFilter;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.symptom.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* ── Top Header ───────────────────────── */}
      <View style={styles.topHeader}>
        {/* Back / Logout button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={COLORS.navy} />
        </TouchableOpacity>

        {/* Center — Logo + title */}
        <View style={styles.headerLeft}>
          <VCLogo size={30} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.headerBrand}>VirtualCare</Text>
            <Text style={styles.headerSub}>Health Worker Portal</Text>
          </View>
        </View>

        {/* Right — Notification bell */}
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.navy} />
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Main Content ─────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CTA Blue Banner */}
        <TouchableOpacity style={styles.ctaBanner} activeOpacity={0.88} onPress={() => navigation.navigate('PatientDetail')}>
          <View style={styles.ctaIconCircle}>
            <MaterialCommunityIcons name="account-plus" size={30} color={COLORS.brand} />
          </View>
          <View style={{ flex: 1, marginHorizontal: SPACING.md }}>
            <Text style={styles.ctaTitle}>Enter Patient Details</Text>
            <Text style={styles.ctaSubtitle}>Start a new patient assessment</Text>
          </View>
          <View style={styles.ctaArrow}>
            <Ionicons name="arrow-forward" size={20} color={COLORS.brand} />
          </View>
        </TouchableOpacity>

        {/* Section Header */}
        <View style={styles.sectionRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Text style={styles.sectionTitle}>Today's Patients</Text>
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>{ALL_PATIENTS.length} Patients</Text>
            </View>
          </View>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} activeOpacity={0.7}>
            <Text style={styles.viewAll}>View All</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.brand} />
          </TouchableOpacity>
        </View>

        {/* Search + Filter row */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={17} color={COLORS.subtle} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search today's patients"
              placeholderTextColor={COLORS.subtle}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterIconBtn} activeOpacity={0.8}>
            <Ionicons name="filter-outline" size={19} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* Status Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: SPACING.md }}
          contentContainerStyle={{ paddingRight: SPACING.md }}
        >
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.76}
            >
              <Text style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Patient List */}
        <View style={{ gap: SPACING.sm, marginBottom: SPACING.xl }}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={38} color={COLORS.border} />
              <Text style={styles.emptyText}>No patients found</Text>
            </View>
          ) : (
            filtered.map((p) => <PatientCard key={p.id} patient={p} />)
          )}
        </View>

        {/* More Section */}
        <Text style={styles.moreSectionTitle}>More</Text>
        <View style={{ gap: SPACING.sm, marginBottom: SPACING.lg }}>
          <TouchableOpacity style={styles.moreCard} activeOpacity={0.8}>
            <View style={[styles.moreIcon, { backgroundColor: COLORS.brandLight }]}>
              <Ionicons name="people-outline" size={24} color={COLORS.brand} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.moreTitle}>Patients</Text>
              <Text style={styles.moreSub}>View all patient records</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={COLORS.border} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.moreCard} activeOpacity={0.8}>
            <View style={[styles.moreIcon, { backgroundColor: COLORS.greenLight }]}>
              <Ionicons name="videocam-outline" size={24} color={COLORS.green} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.moreTitle}>Consultations</Text>
              <Text style={styles.moreSub}>Connect with doctors</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={COLORS.border} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Bottom Tab Bar ───────────────────── */}
      <View style={styles.tabBar}>
        {[
          { key: 'Home',          icon: 'home',     iconOut: 'home-outline' },
          { key: 'Patients',      icon: 'people',   iconOut: 'people-outline' },
          { key: 'Consultations', icon: 'videocam', iconOut: 'videocam-outline' },
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
                size={23}
                color={active ? COLORS.brand : COLORS.subtle}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.key}</Text>
              {active && <View style={styles.tabUnderline} />}
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
    backgroundColor: COLORS.bg,
  },

  // Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBrand: {
    ...FONTS.h4,
    fontSize: 17,
  },
  headerSub: {
    ...FONTS.bodyS,
    fontSize: 11,
    marginTop: 1,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  bellBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 40,
  },

  // CTA Banner
  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.xl,
    paddingVertical: 18,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW.brand,
  },
  ctaIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: COLORS.brandMid,
    marginTop: 3,
  },
  ctaArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section row
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.h3,
    fontSize: 17,
  },
  countChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countChipText: {
    ...FONTS.bodyS,
    fontWeight: '600',
    fontSize: 11,
  },
  viewAll: {
    ...FONTS.label,
    color: COLORS.brand,
    fontSize: 13,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    ...SHADOW.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ink,
    padding: 0,
  },
  filterIconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },

  // Filter tabs
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  filterTabText: {
    ...FONTS.bodyS,
    fontWeight: '600',
    color: COLORS.muted,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },

  // Patient card
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surface,
    ...SHADOW.sm,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  patientInitials: {
    fontSize: 15,
    fontWeight: '800',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    ...FONTS.h4,
    fontSize: 14,
    marginBottom: 2,
  },
  patientMeta: {
    ...FONTS.bodyS,
    fontSize: 12,
    marginBottom: 2,
  },
  patientSymptom: {
    ...FONTS.bodyS,
    fontSize: 12,
    color: COLORS.subtle,
    fontStyle: 'italic',
  },
  patientRight: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: SPACING.sm,
  },
  patientTime: {
    ...FONTS.bodyS,
    fontSize: 11,
    color: COLORS.subtle,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  badgeText: {
    ...FONTS.badge,
    fontSize: 10,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: {
    ...FONTS.bodyS,
    color: COLORS.border,
  },

  // More section
  moreSectionTitle: {
    ...FONTS.h3,
    fontSize: 17,
    marginBottom: SPACING.md,
  },
  moreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surface,
    ...SHADOW.sm,
  },
  moreIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreTitle: {
    ...FONTS.h4,
    fontSize: 14,
    marginBottom: 2,
  },
  moreSub: {
    ...FONTS.bodyS,
    fontSize: 12,
  },

  // Tab bar
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
    position: 'relative',
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
  tabUnderline: {
    position: 'absolute',
    bottom: -SPACING.sm,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.brand,
  },
});
