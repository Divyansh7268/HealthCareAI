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
import Svg, { Path, Rect, Circle, Ellipse, Defs, LinearGradient, Stop, G } from 'react-native-svg';
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
};

const FONTS = {
  h1: { fontSize: 28, fontWeight: '800', color: COLORS.textDark },
  h2: { fontSize: 24, fontWeight: '700', color: COLORS.textDark },
  body: { fontSize: 15, color: COLORS.textGray, lineHeight: 22 },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.textDark },
};

// ─────────────────────────────────────────────────────────────
// Background Waves SVG
// ─────────────────────────────────────────────────────────────
const BackgroundWaves = () => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Top Left Light Red Blob */}
      <Path
        d={`M0 0 L0 ${height * 0.25} Q ${width * 0.3} ${height * 0.3} ${width * 0.4} 0 Z`}
        fill={COLORS.primaryLight}
        opacity={0.7}
      />
      {/* Bottom Red Wave */}
      <Path
        d={`M0 ${height} L0 ${height * 0.85} Q ${width * 0.5} ${height * 0.95} ${width} ${height * 0.8} L${width} ${height} Z`}
        fill={COLORS.primary}
      />
    </Svg>
  </View>
);

// ─────────────────────────────────────────────────────────────
// New VirtualCare Logo (Red V with Cross)
// ─────────────────────────────────────────────────────────────
const VCLogo = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    {/* V Shape */}
    <Path d="M8 18 L24 44 L40 18 L32 18 L24 32 L16 18 Z" fill={COLORS.primary} />
    {/* Medical Cross */}
    <Path d="M22 2 h4 v6 h6 v4 h-6 v6 h-4 v-6 h-6 v-4 h6 z" fill={COLORS.primary} />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// Doctor Avatar SVG (Red Outline)
// ─────────────────────────────────────────────────────────────
const DoctorAvatar = () => (
  <Svg width={72} height={80} viewBox="0 0 72 80" fill="none">
    <Ellipse cx="36" cy="22" rx="14" ry="15" stroke={COLORS.primary} strokeWidth="2" fill={COLORS.primaryLight} />
    <Path d="M22 20 C22 10 50 10 50 20" stroke={COLORS.primary} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <Path d="M22 22 C19 22 18 27 22 27" stroke={COLORS.primary} strokeWidth="1.8" fill="none" />
    <Path d="M50 22 C53 22 54 27 50 27" stroke={COLORS.primary} strokeWidth="1.8" fill="none" />
    <Path d="M32 36 V42 M40 36 V42" stroke={COLORS.primary} strokeWidth="2" />
    <Path d="M28 42 L36 50 L44 42" stroke={COLORS.primary} strokeWidth="2" fill="none" />
    <Path d="M12 80 C12 62 24 52 30 48" stroke={COLORS.primary} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <Path d="M60 80 C60 62 48 52 42 48" stroke={COLORS.primary} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <Path d="M30 48 L28 62 M42 48 L44 62" stroke={COLORS.primary} strokeWidth="1.8" />
    <Path d="M22 52 C18 62 24 70 30 70 C32 70 33 68.5 33 67" stroke={COLORS.primary} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <Path d="M50 52 C54 62 48 70 42 70 C40 70 39 68.5 39 67" stroke={COLORS.primary} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <Circle cx="36" cy="67" r="4" stroke={COLORS.primary} strokeWidth="2" fill="white" />
    <Circle cx="36" cy="67" r="1.5" fill={COLORS.primary} />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// Health Worker Avatar SVG (Red Outline)
// ─────────────────────────────────────────────────────────────
const HealthWorkerAvatar = () => (
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
// Reusable Role Card
// ─────────────────────────────────────────────────────────────
const RoleCard = ({ avatar, title, description, onPress }) => (
  <TouchableOpacity style={styles.roleCard} activeOpacity={0.9} onPress={onPress}>
    <View style={styles.roleCardBorder} />
    <View style={styles.roleCardContent}>
      <View style={styles.roleAvatarBox}>
        {avatar}
      </View>
      <View style={styles.roleCardBody}>
        <Text style={styles.roleCardTitle}>{title}</Text>
        <View style={styles.roleCardLine} />
        <Text style={styles.roleCardDesc}>{description}</Text>
      </View>
      <View style={styles.roleArrow}>
        <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
      </View>
    </View>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────
export default function RoleSelectionScreen({ navigation }) {
  const setSelectedRole = useAuthStore((state) => state.setSelectedRole);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    if (role === 'healthworker') {
      navigation.navigate('HealthWorkerRegistrationStep1');
    } else {
      navigation.navigate('LoginForm');
    }
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Brand Header ─────────────────── */}
          <View style={styles.brandHeader}>
            <View style={styles.logoRow}>
              <VCLogo size={42} />
              <Text style={styles.brandNameText}>
                <Text style={{ color: COLORS.textDark }}>Virtual</Text>
                <Text style={{ color: COLORS.primary }}>Care</Text>
              </Text>
            </View>
            <Text style={styles.brandTagline}>Connecting communities to better healthcare.</Text>
          </View>

          {/* ── Heading ──────────────────────── */}
          <View style={styles.headingBlock}>
            <Text style={styles.heading}>How will you use</Text>
            <Text style={[styles.heading, { color: COLORS.primary }]}>VirtualCare?</Text>
            <Text style={styles.subheading}>Choose your role to get started.</Text>
          </View>

          {/* ── Role Cards ───────────────────── */}
          <View style={styles.cardsBlock}>
            <RoleCard
              avatar={<DoctorAvatar />}
              title="I'm a Doctor"
              description="Review patient cases and provide remote consultations."
              onPress={() => handleSelectRole('doctor')}
            />
            <RoleCard
              avatar={<HealthWorkerAvatar />}
              title="I'm a Health Worker"
              description="Assess patients, record health information and connect with doctors."
              onPress={() => handleSelectRole('healthworker')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* ── Bottom Footer inside Wave ──────── */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={handleLoginPress} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.footerLink}>Login</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.white} style={{ marginLeft: 4 }} />
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 100, // Space for footer
  },
  
  // Header
  brandHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  brandNameText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    ...FONTS.body,
    textAlign: 'center',
  },

  // Heading
  headingBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heading: {
    ...FONTS.h1,
    textAlign: 'center',
    lineHeight: 34,
  },
  subheading: {
    ...FONTS.body,
    textAlign: 'center',
    marginTop: 12,
  },

  // Role cards
  cardsBlock: {
    gap: 20,
  },
  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  roleCardBorder: {
    position: 'absolute',
    left: 0,
    top: 20,
    bottom: 20,
    width: 6,
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingLeft: 28,
  },
  roleAvatarBox: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  roleCardBody: {
    flex: 1,
  },
  roleCardTitle: {
    ...FONTS.label,
    fontSize: 18,
    marginBottom: 8,
  },
  roleCardLine: {
    width: 24,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginBottom: 12,
  },
  roleCardDesc: {
    ...FONTS.body,
    fontSize: 13,
    lineHeight: 20,
  },
  roleArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginLeft: 12,
  },

  // Footer
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20, // For safe area
  },
  footerText: {
    color: COLORS.white,
    fontSize: 15,
  },
  footerLink: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
