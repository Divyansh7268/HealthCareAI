/**
 * VirtualCare Design System
 * Shared constants used across all screens for a consistent look.
 */

// ── Color Palette ─────────────────────────────────────────────
export const COLORS = {
  // Primaries
  brand:       '#1A3FE0',   // Deep royal blue — brand
  brandLight:  '#EEF2FF',   // Very light blue tint — bg highlights
  brandMid:    '#BFCFFF',   // Mid blue — borders, inactive
  green:       '#059669',   // Health worker accent
  greenLight:  '#ECFDF5',
  greenMid:    '#A7F3D0',

  // Neutrals
  navy:        '#0D1B4B',   // Headings
  ink:         '#1E293B',   // Body text
  muted:       '#64748B',   // Subtitles, meta
  subtle:      '#94A3B8',   // Placeholders, icons
  border:      '#E2E8F0',   // Card borders
  surface:     '#F8FAFF',   // Input backgrounds
  bg:          '#F4F7FF',   // Screen background
  white:       '#FFFFFF',

  // Status
  warning:     '#D97706',
  warningBg:   '#FFFBEB',
  warningBorder:'#FDE68A',
  success:     '#15803D',
  successBg:   '#DCFCE7',
  successBorder:'#BBF7D0',
  danger:      '#DC2626',
  dangerBg:    '#FEF2F2',
  dangerBorder:'#FECACA',
  inprogress:  '#2563EB',
  inprogressBg:'#EFF6FF',
  inprogressBorder:'#BFDBFE',
  orange:      '#EA580C',
  orangeBg:    '#FFF7ED',
  orangeBorder:'#FED7AA',
};

// ── Typography ────────────────────────────────────────────────
export const FONTS = {
  h1:    { fontSize: 28, fontWeight: '800', color: '#0D1B4B', letterSpacing: -0.5, lineHeight: 36 },
  h2:    { fontSize: 22, fontWeight: '800', color: '#0D1B4B', letterSpacing: -0.3, lineHeight: 30 },
  h3:    { fontSize: 18, fontWeight: '700', color: '#0D1B4B', letterSpacing: -0.2 },
  h4:    { fontSize: 16, fontWeight: '700', color: '#0D1B4B' },
  body:  { fontSize: 14.5, fontWeight: '400', color: '#64748B', lineHeight: 22 },
  bodyS: { fontSize: 13,   fontWeight: '400', color: '#64748B', lineHeight: 20 },
  label: { fontSize: 14,   fontWeight: '600', color: '#1E293B' },
  badge: { fontSize: 11,   fontWeight: '700' },
  btn:   { fontSize: 16,   fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
};

// ── Spacing ───────────────────────────────────────────────────
export const SPACING = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
};

// ── Radius ────────────────────────────────────────────────────
export const RADIUS = {
  sm:  8,
  md:  14,
  lg:  20,
  xl:  28,
  full: 999,
};

// ── Shadows ───────────────────────────────────────────────────
export const SHADOW = {
  sm: {
    shadowColor: '#0D1B4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0D1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  brand: {
    shadowColor: '#1A3FE0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
};
