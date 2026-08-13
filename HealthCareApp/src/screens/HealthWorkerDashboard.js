import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Rect } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS as THEME_COLORS, FONTS as THEME_FONTS, RADIUS, SHADOW, SPACING } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { searchPatients } from '../api/patientApi';
import { startVideoCall } from '../utils/videoCall';
import { searchLocalPatients } from '../storage/repositories/patientRepo';

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
};

const FONTS = {
  ...THEME_FONTS,
  h1: { fontSize: 24, fontWeight: '800', color: COLORS.textDark },
  h2: { fontSize: 20, fontWeight: '700', color: COLORS.textDark },
  h3: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  body: { fontSize: 14, color: COLORS.textGray },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textDark },
};

// ─────────────────────────────────────────────────────────────
// Background Header Wave
// ─────────────────────────────────────────────────────────────
const HeaderWave = () => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Svg width={width} height={200} viewBox={`0 0 ${width} 200`}>
      <Path
        d={`M0 0 L0 120 Q ${width * 0.3} 160 ${width * 0.6} 100 T ${width} 120 L${width} 0 Z`}
        fill={COLORS.primaryLight}
        opacity={0.8}
      />
    </Svg>
  </View>
);

// ─────────────────────────────────────────────────────────────
// VirtualCare Logo
// ─────────────────────────────────────────────────────────────
const VCLogo = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path d="M8 18 L24 44 L40 18 L32 18 L24 32 L16 18 Z" fill={COLORS.primary} />
    <Path d="M22 2 h4 v6 h6 v4 h-6 v6 h-4 v-6 h-6 v-4 h6 z" fill={COLORS.primary} />
  </Svg>
);

const STATUS_FILTERS = ['All', 'In Progress', 'Doctor Review', 'Consultation', 'Completed', 'Emergency'];

const STATUS_MAP = {
  'Doctor Review': { bg: COLORS.warningBg,     text: COLORS.warning,  border: COLORS.warningBorder },
  'Completed':     { bg: COLORS.successBg,     text: COLORS.success,  border: COLORS.successBorder },
  'In Progress':   { bg: COLORS.inprogressBg,  text: COLORS.inprogress, border: COLORS.inprogressBorder },
  'Consultation':  { bg: COLORS.orangeBg,      text: COLORS.orange,   border: COLORS.orangeBorder },
  'Emergency':     { bg: COLORS.dangerBg,      text: COLORS.danger,   border: COLORS.dangerBorder },
};

function getFrontendStatus(patient) {
  if (patient.riskLevel === 'emergency') return 'Emergency';
  if (patient.doctorReviewStatus === 'review_required') return 'Doctor Review';
  if (patient.status === 'completed') return 'Completed';
  return 'In Progress';
}

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
const PatientCard = ({ patient, onPress }) => {
  const uiStatus = getFrontendStatus(patient);
  const initials = patient.name ? patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PT';
  return (
    <TouchableOpacity style={styles.patientCard} activeOpacity={0.76} onPress={onPress}>
      <View style={[styles.patientAvatar, { backgroundColor: COLORS.primaryLight }]}>
        <Text style={[styles.patientInitials, { color: COLORS.primary }]}>{initials}</Text>
      </View>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{patient.name || 'Unknown'}</Text>
        <Text style={styles.patientMeta}>Age {patient.age || '--'}  •  {patient.gender || '--'}</Text>
      </View>
      <View style={styles.patientRight}>
        <StatusBadge status={uiStatus} />
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.border} style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────
export default function HealthWorkerDashboard({ navigation, workerName = 'Asha Devi' }) {
  const logout = useAuthStore((state) => state.logout);
  const [activeTab, setActiveTab]       = useState('Home');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery]   = useState('');
  const isOnline = useNetworkStatus();
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await searchPatients(searchQuery);
      setPatients(data.patients || []);
    } catch (err) {
      console.log('Failed to fetch patients:', err.message);
      Alert.alert('Error', 'Failed to load patients. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [searchQuery]);

  const renderConsultTab = () => {
    // Filter patients who have a pending doctor review or ai_assessed status
    const pendingConsults = patients.filter(p => p.doctorReviewStatus === 'pending' || p.status === 'ai_assessed' || p.status === 'completed');
    
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ ...FONTS.h2, fontSize: 22, color: COLORS.textDark, marginBottom: 8 }}>Video Consultations</Text>
        <Text style={{ ...FONTS.body, color: COLORS.textGray, marginBottom: 20 }}>Connect with doctors for patient reviews.</Text>
        
        {pendingConsults.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 40 }}>
            <Ionicons name="videocam-outline" size={64} color={COLORS.border} />
            <Text style={{ marginTop: 16, color: COLORS.textGray, fontSize: 16 }}>No pending consultations</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {pendingConsults.map((p) => {
              // Find the most recent visit ID to use as the room ID
              const visitId = p.id; // Usually the patient document doesn't have the visit ID directly in searchPatients. Wait, searchPatients might just return patient basic details.
              // Assuming p.recentVisitId exists or we use patient ID for the room if visitId is missing.
              const roomId = p.recentVisitId || p.id;
              
              return (
                <View key={p.id} style={{
                  backgroundColor: COLORS.white,
                  borderRadius: RADIUS.lg,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  ...SHADOW.sm,
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...FONTS.h3, fontSize: 16, marginBottom: 4 }}>{p.name || 'Unknown Patient'}</Text>
                    <Text style={{ ...FONTS.body, fontSize: 13, color: COLORS.textGray }}>Status: {p.doctorReviewStatus === 'pending' ? 'Waiting for Doctor' : 'Ready to Join'}</Text>
                  </View>
                  <TouchableOpacity 
                    style={{
                      backgroundColor: COLORS.greenLight,
                      borderRadius: RADIUS.md,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    onPress={() => startVideoCall(roomId)}
                  >
                    <Ionicons name="videocam" size={18} color={COLORS.success} style={{ marginRight: 6 }} />
                    <Text style={{ color: COLORS.success, fontWeight: '700' }}>Join</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  };

  const filtered = patients.filter((p) => {
    const uiStatus = getFrontendStatus(p);
    const matchFilter = activeFilter === 'All' || uiStatus === activeFilter;
    return matchFilter;
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <HeaderWave />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* ── Top Header ───────────────────────── */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            <VCLogo size={36} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerBrand}>VirtualCare</Text>
              <Text style={styles.headerSub}>Health Worker Portal</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.networkBadge, { backgroundColor: isOnline ? '#16A34A' : '#D97706' }]}>
              <Text style={styles.networkBadgeText}>{isOnline ? 'ONLINE' : 'OFFLINE MODE'}</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={logout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Main Content ─────────────────────── */}
        {activeTab === 'Consult' ? (
          renderConsultTab()
        ) : (
          <ScrollView
            style={{ flex: 1, display: (activeTab === 'Home' || activeTab === 'Patients') ? 'flex' : 'none' }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Text */}
          <Text style={styles.welcomeText}>Hello, {workerName}!</Text>
          <Text style={styles.welcomeSub}>Let's help your community today.</Text>

          {/* CTA Blue Banner (Now Red) */}
          <TouchableOpacity style={styles.ctaBanner} activeOpacity={0.88} onPress={() => navigation.navigate('PatientDetail')}>
            <View style={styles.ctaIconCircle}>
              <MaterialCommunityIcons name="account-plus" size={30} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginHorizontal: 16 }}>
              <Text style={styles.ctaTitle}>Enter Patient Details</Text>
              <Text style={styles.ctaSubtitle}>Start a new patient assessment</Text>
            </View>
            <View style={styles.ctaArrow}>
              <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
            </View>
          </TouchableOpacity>

          {/* Section Header */}
          <View style={styles.sectionRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.sectionTitle}>Today's Patients</Text>
              <View style={styles.countChip}>
                <Text style={styles.countChipText}>{patients.length}</Text>
              </View>
            </View>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} activeOpacity={0.7}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Search Row */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color={COLORS.textGray} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search today's patients..."
                placeholderTextColor={COLORS.textGray}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterIconBtn} activeOpacity={0.8}>
              <Ionicons name="options-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Status Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
            contentContainerStyle={{ paddingRight: 20 }}
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
          <View style={{ gap: 12, marginBottom: 30 }}>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>No patients found</Text>
              </View>
            ) : (
              filtered.map((p) => (
                <PatientCard 
                  key={p.id} 
                  patient={p} 
                  onPress={() => navigation.navigate('PatientDetail', { patient: p })}
                />
              ))
            )}
          </View>

          {/* More Section */}
          <Text style={styles.moreSectionTitle}>Quick Actions</Text>
          <View style={{ gap: 12, marginBottom: 20 }}>
            <TouchableOpacity style={styles.moreCard} activeOpacity={0.8}>
              <View style={[styles.moreIcon, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="people-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.moreTitle}>Patient Directory</Text>
                <Text style={styles.moreSub}>View all historical records</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreCard} activeOpacity={0.8}>
              <View style={[styles.moreIcon, { backgroundColor: COLORS.greenLight }]}>
                <Ionicons name="videocam-outline" size={22} color={COLORS.green} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.moreTitle}>Pending Consultations</Text>
                <Text style={styles.moreSub}>Connect with available doctors</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
            </TouchableOpacity>
          </View>
        </ScrollView>
        )}

        {/* ── Bottom Tab Bar ───────────────────── */}
        <View style={styles.tabBar}>
          {[
            { key: 'Home',          icon: 'home',     iconOut: 'home-outline' },
            { key: 'Patients',      icon: 'people',   iconOut: 'people-outline' },
            { key: 'Consult',       icon: 'videocam', iconOut: 'videocam-outline' },
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
                  color={active ? COLORS.primary : COLORS.textGray}
                />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.key}</Text>
                {active && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  
  // Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBrand: {
    ...FONTS.h2,
    fontSize: 18,
    color: COLORS.primary,
  },
  headerSub: {
    ...FONTS.body,
    fontSize: 12,
  },
  networkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
  },
  networkBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  welcomeText: {
    ...FONTS.h1,
    marginBottom: 4,
  },
  welcomeSub: {
    ...FONTS.body,
    marginBottom: 24,
  },

  // CTA Banner
  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
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
    marginBottom: 16,
  },
  sectionTitle: {
    ...FONTS.h3,
    fontSize: 18,
  },
  countChip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countChipText: {
    ...FONTS.label,
    color: COLORS.primary,
    fontSize: 12,
  },
  viewAll: {
    ...FONTS.label,
    color: COLORS.primary,
    fontSize: 13,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    ...SHADOW.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textDark,
    padding: 0,
  },
  filterIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },

  // Filter tabs
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    ...FONTS.label,
    color: COLORS.textGray,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },

  // Patient card
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  patientInitials: {
    fontSize: 16,
    fontWeight: '700',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    ...FONTS.h3,
    fontSize: 15,
    marginBottom: 4,
  },
  patientMeta: {
    ...FONTS.body,
    fontSize: 13,
  },
  patientRight: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.textGray,
    marginTop: 12,
  },

  // More section
  moreSectionTitle: {
    ...FONTS.h3,
    fontSize: 18,
    marginBottom: 16,
  },
  moreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  moreIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreTitle: {
    ...FONTS.h3,
    fontSize: 15,
    marginBottom: 4,
  },
  moreSub: {
    ...FONTS.body,
    fontSize: 13,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabel: {
    ...FONTS.label,
    fontSize: 11,
    marginTop: 4,
    color: COLORS.textGray,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
  tabUnderline: {
    position: 'absolute',
    top: -12,
    width: '40%',
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: COLORS.primary,
  },
});
