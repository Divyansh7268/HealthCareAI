import React from 'react';
import { Path, Rect, Circle, Ellipse, G } from 'react-native-svg';

// Base style properties for unselected regions
const baseProps = {
  fill: '#E2E8F0',    // Light gray mannequin
  stroke: '#94A3B8',  // Darker gray outline
  strokeWidth: 1.5,
};

// ──────────────────────────────────────────────────────────────────
// FRONT VIEW DEFINITIONS
// Coordinate space: viewBox="0 0 200 400"
// ──────────────────────────────────────────────────────────────────
export const FRONT_REGIONS = [
  {
    id: 'head',
    label: 'Head',
    side: 'center',
    element: (props) => <Circle cx="100" cy="40" r="25" {...baseProps} {...props} />
  },
  {
    id: 'neck',
    label: 'Neck',
    side: 'center',
    element: (props) => <Rect x="90" y="60" width="20" height="20" {...baseProps} {...props} />
  },
  {
    id: 'chest',
    label: 'Chest',
    side: 'center',
    // Using a path for a slightly tapered chest
    element: (props) => <Path d="M70,80 L130,80 L125,120 L75,120 Z" {...baseProps} strokeLinejoin="round" {...props} />
  },
  {
    id: 'abdomen',
    label: 'Abdomen',
    side: 'center',
    element: (props) => <Path d="M75,120 L125,120 L120,165 L80,165 Z" {...baseProps} strokeLinejoin="round" {...props} />
  },
  {
    id: 'right_shoulder', // Note: from patient's perspective, right is on the left of screen
    label: 'Right Shoulder',
    side: 'right',
    element: (props) => <Circle cx="65" cy="85" r="14" {...baseProps} {...props} />
  },
  {
    id: 'left_shoulder',
    label: 'Left Shoulder',
    side: 'left',
    element: (props) => <Circle cx="135" cy="85" r="14" {...baseProps} {...props} />
  },
  {
    id: 'right_arm',
    label: 'Right Arm',
    side: 'right',
    element: (props) => <Rect x="51" y="99" width="18" height="65" rx="9" transform="rotate(10 60 99)" {...baseProps} {...props} />
  },
  {
    id: 'left_arm',
    label: 'Left Arm',
    side: 'left',
    element: (props) => <Rect x="131" y="99" width="18" height="65" rx="9" transform="rotate(-10 140 99)" {...baseProps} {...props} />
  },
  {
    id: 'right_hand',
    label: 'Right Hand',
    side: 'right',
    element: (props) => <Circle cx="40" cy="180" r="12" {...baseProps} {...props} />
  },
  {
    id: 'left_hand',
    label: 'Left Hand',
    side: 'left',
    element: (props) => <Circle cx="160" cy="180" r="12" {...baseProps} {...props} />
  },
  {
    id: 'right_thigh',
    label: 'Right Thigh',
    side: 'right',
    element: (props) => <Rect x="80" y="165" width="19" height="70" rx="6" {...baseProps} {...props} />
  },
  {
    id: 'left_thigh',
    label: 'Left Thigh',
    side: 'left',
    element: (props) => <Rect x="101" y="165" width="19" height="70" rx="6" {...baseProps} {...props} />
  },
  {
    id: 'right_knee',
    label: 'Right Knee',
    side: 'right',
    element: (props) => <Circle cx="89.5" cy="245" r="11" {...baseProps} {...props} />
  },
  {
    id: 'left_knee',
    label: 'Left Knee',
    side: 'left',
    element: (props) => <Circle cx="110.5" cy="245" r="11" {...baseProps} {...props} />
  },
  {
    id: 'right_leg',
    label: 'Right Leg',
    side: 'right',
    element: (props) => <Rect x="81.5" y="256" width="16" height="65" rx="5" {...baseProps} {...props} />
  },
  {
    id: 'left_leg',
    label: 'Left Leg',
    side: 'left',
    element: (props) => <Rect x="102.5" y="256" width="16" height="65" rx="5" {...baseProps} {...props} />
  },
  {
    id: 'right_foot',
    label: 'Right Foot',
    side: 'right',
    element: (props) => <Ellipse cx="89.5" cy="330" rx="14" ry="9" {...baseProps} {...props} />
  },
  {
    id: 'left_foot',
    label: 'Left Foot',
    side: 'left',
    element: (props) => <Ellipse cx="110.5" cy="330" rx="14" ry="9" {...baseProps} {...props} />
  }
];

// ──────────────────────────────────────────────────────────────────
// BACK VIEW DEFINITIONS
// Same layout, but patient perspective is flipped (right is on the right)
// ──────────────────────────────────────────────────────────────────
export const BACK_REGIONS = [
  {
    id: 'head_back',
    label: 'Back of Head',
    side: 'center',
    element: (props) => <Circle cx="100" cy="40" r="25" {...baseProps} {...props} />
  },
  {
    id: 'neck_back',
    label: 'Nape',
    side: 'center',
    element: (props) => <Rect x="90" y="60" width="20" height="20" {...baseProps} {...props} />
  },
  {
    id: 'upper_back',
    label: 'Upper Back',
    side: 'center',
    element: (props) => <Path d="M70,80 L130,80 L125,120 L75,120 Z" {...baseProps} strokeLinejoin="round" {...props} />
  },
  {
    id: 'lower_back',
    label: 'Lower Back',
    side: 'center',
    element: (props) => <Path d="M75,120 L125,120 L120,165 L80,165 Z" {...baseProps} strokeLinejoin="round" {...props} />
  },
  {
    id: 'left_shoulder_back',
    label: 'Left Shoulder (Back)',
    side: 'left',
    element: (props) => <Circle cx="65" cy="85" r="14" {...baseProps} {...props} />
  },
  {
    id: 'right_shoulder_back',
    label: 'Right Shoulder (Back)',
    side: 'right',
    element: (props) => <Circle cx="135" cy="85" r="14" {...baseProps} {...props} />
  },
  {
    id: 'left_arm_back',
    label: 'Left Arm (Back)',
    side: 'left',
    element: (props) => <Rect x="51" y="99" width="18" height="65" rx="9" transform="rotate(10 60 99)" {...baseProps} {...props} />
  },
  {
    id: 'right_arm_back',
    label: 'Right Arm (Back)',
    side: 'right',
    element: (props) => <Rect x="131" y="99" width="18" height="65" rx="9" transform="rotate(-10 140 99)" {...baseProps} {...props} />
  },
  {
    id: 'left_hand_back',
    label: 'Left Hand (Back)',
    side: 'left',
    element: (props) => <Circle cx="40" cy="180" r="12" {...baseProps} {...props} />
  },
  {
    id: 'right_hand_back',
    label: 'Right Hand (Back)',
    side: 'right',
    element: (props) => <Circle cx="160" cy="180" r="12" {...baseProps} {...props} />
  },
  {
    id: 'left_thigh_back',
    label: 'Left Thigh (Back)',
    side: 'left',
    element: (props) => <Rect x="80" y="165" width="19" height="70" rx="6" {...baseProps} {...props} />
  },
  {
    id: 'right_thigh_back',
    label: 'Right Thigh (Back)',
    side: 'right',
    element: (props) => <Rect x="101" y="165" width="19" height="70" rx="6" {...baseProps} {...props} />
  },
  {
    id: 'left_knee_back',
    label: 'Left Knee (Back)',
    side: 'left',
    element: (props) => <Circle cx="89.5" cy="245" r="11" {...baseProps} {...props} />
  },
  {
    id: 'right_knee_back',
    label: 'Right Knee (Back)',
    side: 'right',
    element: (props) => <Circle cx="110.5" cy="245" r="11" {...baseProps} {...props} />
  },
  {
    id: 'left_calf',
    label: 'Left Calf',
    side: 'left',
    element: (props) => <Rect x="81.5" y="256" width="16" height="65" rx="5" {...baseProps} {...props} />
  },
  {
    id: 'right_calf',
    label: 'Right Calf',
    side: 'right',
    element: (props) => <Rect x="102.5" y="256" width="16" height="65" rx="5" {...baseProps} {...props} />
  },
  {
    id: 'left_heel',
    label: 'Left Heel',
    side: 'left',
    element: (props) => <Ellipse cx="89.5" cy="330" rx="14" ry="9" {...baseProps} {...props} />
  },
  {
    id: 'right_heel',
    label: 'Right Heel',
    side: 'right',
    element: (props) => <Ellipse cx="110.5" cy="330" rx="14" ry="9" {...baseProps} {...props} />
  }
];
