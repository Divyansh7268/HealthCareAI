# VirtualCare - Current Architecture Report

## 1. Project Overview
The current project is a React Native + Expo application serving as a UI mockup/demo for an AI Rural Virtual Clinic. It relies on hardcoded dummy data and simulated UI states to demonstrate the flow.

## 2. Directory Structure
```
HealthCareApp/
├── App.js                     # Root entry point & custom state-based navigation
├── app.json                   # Expo configuration
├── package.json               # Dependencies (React Native, Expo, Vector Icons)
├── assets/                    # Image mockups and icons
└── src/
    ├── theme.js               # Centralized design system (COLORS, FONTS, SHADOW, SPACING)
    └── screens/               # UI components
        ├── RoleSelectionScreen.js
        ├── LoginFormScreen.js
        ├── HealthWorkerRegistrationStep1.js
        ├── HealthWorkerDashboard.js
        ├── PatientDetailScreen.js
        ├── PatientAIAnalysisScreen.js
        ├── DoctorDashboard.js
        └── DoctorPatientDetailScreen.js
```

## 3. Navigation Flow
The app does **not** currently use a standard navigation library (like `react-navigation`). Instead, it uses custom React state inside `App.js`:
- `screen` (string): Defines which component to render.
- `selectedRole` (string): Tracks whether 'doctor' or 'healthworker' was selected.
- `loggedInUser` (object): Tracks the simulated logged-in user.

### Current Screen Relationships
```
roleSelection
 ├── Doctor
 │    └── loginForm (doctor)
 │         └── doctorDashboard
 │              └── doctorPatientDetail
 │
 └── Health Worker
      └── loginForm (healthworker)
           └── hwDashboard
                └── patientDetail (Start new patient assessment)
                     └── aiAnalysis (Simulated AI processing)
           └── hwRegistrationStep1 (Sign up route)
```
Screen transitions are handled by passing callback functions as props (e.g., `onLoginPress`, `onBack`, `onComplete`).

## 4. Existing Components & State Management
- **State Management:** Fully localized inside individual screen components (e.g., `useState` for toggling tabs, forms, and simulated AI loading spinners) and lifted to `App.js` for navigation. No Redux, Context, or Zustand exists.
- **Styling:** Relies on `react-native` `StyleSheet` and centralized tokens imported from `src/theme.js`.
- **Dummy Data:** Found throughout the screens (e.g., `DOCTOR_QUERIES`, `ALL_PATIENTS`, dummy vitals, and mock credentials for login).

## 5. Missing Functionality (To be implemented)
- **Networking/API:** None. No `fetch` or `axios` calls exist.
- **Backend/Database:** None. The app does not currently communicate with any backend, Firebase, or external API.
- **Authentication:** Simulated via dummy hardcoded credentials in `LoginFormScreen.js`. No JWT or Firebase Auth.
- **AI Processing:** Simulated using a `setTimeout` function inside `PatientAIAnalysisScreen.js`.
- **Offline Support:** No persistence layer (like AsyncStorage, SQLite, or WatermelonDB) exists.
