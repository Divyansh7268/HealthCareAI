import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Rect, Circle, Ellipse } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../theme';
import { useAuthStore } from '../store/useAuthStore';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// VirtualCare Logo
// ─────────────────────────────────────────────────────────────
const VCLogo = ({ size = 40 }) => (
  <Svg width={size} height={size * 1.1} viewBox="0 0 44 48" fill="none">
    <Rect x="20" y="0" width="5" height="13" rx="2.5" fill="#10B981" />
    <Rect x="14.5" y="4" width="16" height="5" rx="2.5" fill="#10B981" />
    <Path d="M4 16 L22 44 L40 16 Q38 12 35 14 L22 38 L9 14 Q6 12 4 16 Z" fill={COLORS.brand} />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// Doctor Avatar SVG (line art, blue)
// ─────────────────────────────────────────────────────────────
const DoctorAvatar = () => (
  <Svg width={72} height={80} viewBox="0 0 72 80" fill="none">
    {/* Head */}
    <Ellipse cx="36" cy="22" rx="14" ry="15" stroke={COLORS.brand} strokeWidth="2" fill={COLORS.brandLight} />
    {/* Hair */}
    <Path d="M22 20 C22 10 50 10 50 20" stroke={COLORS.brand} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Ears */}
    <Path d="M22 22 C19 22 18 27 22 27" stroke={COLORS.brand} strokeWidth="1.8" fill="none" />
    <Path d="M50 22 C53 22 54 27 50 27" stroke={COLORS.brand} strokeWidth="1.8" fill="none" />
    {/* Neck */}
    <Path d="M32 36 V42 M40 36 V42" stroke={COLORS.brand} strokeWidth="2" />
    {/* Collar */}
    <Path d="M28 42 L36 50 L44 42" stroke={COLORS.brand} strokeWidth="2" fill="none" />
    {/* Body left */}
    <Path d="M12 80 C12 62 24 52 30 48" stroke={COLORS.brand} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    {/* Body right */}
    <Path d="M60 80 C60 62 48 52 42 48" stroke={COLORS.brand} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    {/* Lapels */}
    <Path d="M30 48 L28 62 M42 48 L44 62" stroke={COLORS.brand} strokeWidth="1.8" />
    {/* Stethoscope left arc */}
    <Path d="M22 52 C18 62 24 70 30 70 C32 70 33 68.5 33 67" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    {/* Stethoscope right arc */}
    <Path d="M50 52 C54 62 48 70 42 70 C40 70 39 68.5 39 67" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    {/* Chest piece */}
    <Circle cx="36" cy="67" r="4" stroke="#3B82F6" strokeWidth="2" fill="white" />
    <Circle cx="36" cy="67" r="1.5" fill="#3B82F6" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// Health Worker Avatar SVG (line art, green)
// ─────────────────────────────────────────────────────────────
const HealthWorkerAvatar = () => (
  <Svg width={72} height={80} viewBox="0 0 72 80" fill="none">
    {/* Hair bun */}
    <Circle cx="36" cy="10" r="6" stroke={COLORS.green} strokeWidth="2" fill={COLORS.greenLight} />
    {/* Head */}
    <Ellipse cx="36" cy="24" rx="14" ry="15" stroke={COLORS.green} strokeWidth="2" fill={COLORS.greenLight} />
    {/* Earrings */}
    <Circle cx="22" cy="26" r="2.5" stroke={COLORS.green} strokeWidth="1.5" fill="none" />
    <Circle cx="50" cy="26" r="2.5" stroke={COLORS.green} strokeWidth="1.5" fill="none" />
    {/* Neck */}
    <Path d="M32 38 V44 M40 38 V44" stroke={COLORS.green} strokeWidth="2" />
    {/* Collar V */}
    <Path d="M28 44 L36 53 L44 44" stroke={COLORS.green} strokeWidth="2" fill="none" />
    {/* Sash / saree drape */}
    <Path d="M24 52 L52 74" stroke={COLORS.green} strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M26 52 L54 74" stroke="#34D399" strokeWidth="1.2" strokeLinecap="round" />
    {/* Body */}
    <Path d="M12 80 C12 62 24 53 30 50" stroke={COLORS.green} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <Path d="M60 80 C60 62 48 53 42 50" stroke={COLORS.green} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    {/* Cross badge */}
    <Rect x="40" y="58" width="14" height="14" rx="4" fill="white" stroke="#10B981" strokeWidth="1.8" />
    <Rect x="46" y="61" width="3" height="8" rx="1.5" fill="#10B981" />
    <Rect x="43" y="64" width="9" height="3" rx="1.5" fill="#10B981" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────
// Reusable Role Card
// ─────────────────────────────────────────────────────────────
const RoleCard = ({ avatar, title, description, accent, onPress }) => (
  <TouchableOpacity
    style={[styles.roleCard, { borderColor: accent + '30' }]}
    activeOpacity={0.82}
    onPress={onPress}
  >
    {/* Avatar box */}
    <View style={[styles.roleAvatarBox, { backgroundColor: accent + '15' }]}>
      {avatar}
    </View>

    {/* Text */}
    <View style={styles.roleCardBody}>
      <Text style={styles.roleCardTitle}>{title}</Text>
      <Text style={styles.roleCardDesc}>{description}</Text>
    </View>

    {/* Arrow */}
    <View style={[styles.roleArrow, { borderColor: accent + '25' }]}>
      <Ionicons name="chevron-forward" size={18} color={accent} />
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
    navigation.navigate('LoginForm');
  };

  const handleLoginPress = () => {
    setSelectedRole(null);
    navigation.navigate('LoginForm');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Brand Header ─────────────────── */}
        <View style={styles.brandHeader}>
          <VCLogo size={42} />
          <View style={styles.brandTextBlock}>
            <Text style={styles.brandName}>VirtualCare</Text>
            <Text style={styles.brandTagline}>Connecting communities to better healthcare.</Text>
          </View>
        </View>

        {/* ── Heading ──────────────────────── */}
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>How will you use{'\n'}VirtualCare?</Text>
          <Text style={styles.subheading}>Choose your role to get started.</Text>
        </View>

        {/* ── Role Cards ───────────────────── */}
        <View style={styles.cardsBlock}>
          <RoleCard
            avatar={<DoctorAvatar />}
            title="I'm a Doctor"
            description="Review patient cases and provide remote consultations."
            accent={COLORS.brand}
            onPress={() => handleSelectRole('doctor')}
          />
          <RoleCard
            avatar={<HealthWorkerAvatar />}
            title="I'm a Health Worker"
            description="Assess patients, record health information and connect with doctors."
            accent={COLORS.green}
            onPress={() => handleSelectRole('healthworker')}
          />
        </View>

        {/* ── Footer ───────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={handleLoginPress} activeOpacity={0.7}>
            <Text style={styles.footerLink}> Login →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },

  // Brand header
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  brandTextBlock: {
    alignItems: 'flex-start',
  },
  brandName: {
    ...FONTS.h2,
    fontSize: 26,
  },
  brandTagline: {
    ...FONTS.bodyS,
    marginTop: 2,
  },

  // Heading
  headingBlock: {
    marginBottom: SPACING.xl,
  },
  heading: {
    ...FONTS.h1,
    textAlign: 'center',
  },
  subheading: {
    ...FONTS.body,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  // Role cards
  cardsBlock: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    padding: SPACING.md,
    ...SHADOW.md,
  },
  roleAvatarBox: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  roleCardBody: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  roleCardTitle: {
    ...FONTS.h4,
    marginBottom: 4,
  },
  roleCardDesc: {
    ...FONTS.bodyS,
    lineHeight: 19,
  },
  roleArrow: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: SPACING.lg,
  },
  footerText: {
    ...FONTS.body,
    fontSize: 14,
  },
  footerLink: {
    ...FONTS.body,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brand,
  },
});
