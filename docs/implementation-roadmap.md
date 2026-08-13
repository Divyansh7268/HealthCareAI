# Implementation Roadmap: VirtualCare Backend & AI Integration

## 1. Goal
Convert the existing static UI mockups into a fully functional, cloud-backed mobile application utilizing Firebase (Auth, Firestore, Storage), a Node.js + Express backend, and the Google Gemini Multimodal AI.

## 2. Recommended Folder Structure
To support the full stack, the project should be reorganized logically into client and server boundaries:

```
VirtualCare/
├── mobile/                  # Existing Expo React Native app
│   ├── src/
│   │   ├── api/             # Axios/fetch services for calling the backend
│   │   ├── navigation/      # React Navigation setup (replaces custom App.js state)
│   │   ├── store/           # Global state management (Zustand/Redux)
│   │   ├── screens/         # (Existing) UI Screens
│   │   ├── components/      # Reusable UI components
│   │   ├── theme.js         # (Existing) Theme
│   │   └── utils/           # Helper functions, offline storage helpers
│   └── App.js               # Entry point (Navigation Container)
│
└── backend/                 # Node.js + Express + Firebase Admin Backend
    ├── src/
    │   ├── controllers/     # Route logic (AI, Patients, Vitals)
    │   ├── routes/          # Express route definitions
    │   ├── services/        # Gemini AI & Firebase logic
    │   ├── middlewares/     # Firebase Auth verification
    │   └── config/          # Firebase Admin & Gemini configuration
    ├── package.json
    └── server.js
```

## 3. Phase-by-Phase Implementation Plan

### Phase 1: Navigation & State Foundation (Mobile)
*DO NOT alter existing UI/Styles. Only restructure the underlying scaffolding.*
- **Action:** Install and configure `react-navigation` (Stack and Bottom Tabs).
- **Action:** Replace the custom string-based `screen` state in `App.js` with standard React Navigation flows.
- **Action:** Set up global state management (e.g., Zustand) to manage `loggedInUser` and `selectedRole`.

### Phase 2: Firebase Authentication & Storage Setup (Backend + Mobile)
- **Action:** Initialize Firebase project and integrate Firebase JS SDK into the `mobile` app.
- **Action:** Implement real Firebase Authentication (Email/Password) to replace dummy credentials in `LoginFormScreen` and `HealthWorkerRegistrationStep1`.
- **Action:** Set up Firebase Storage rules to allow medical image and voice memo uploads.

### Phase 3: Firestore Database Design (Backend Setup)
- **Action:** Design the NoSQL Firestore schema:
  - `users`: (Doctors, Health Workers)
  - `patients`: Demographics, patient history
  - `visits`: Multiple visits per patient, linked to the `patients` collection.
  - `vitals`: Associated with a specific `visit`.
  - `assessments`: AI generated reports, risk levels, doctor approval statuses.
  - `audit_logs`: Tracking all changes for security and compliance.

### Phase 4: Node.js Backend & Gemini AI Integration
- **Action:** Create the `backend/` Node.js + Express server.
- **Action:** Set up Firebase Admin SDK to verify Auth tokens sent from the mobile app.
- **Action:** Integrate **Gemini Multimodal AI** via `services/aiService.js`.
  - Define system prompts for generating structured assessments based on text (voice transcriptions), vitals, and medical images.
- **Action:** Create API endpoints:
  - `POST /api/analyze-patient` (Triggers Gemini with patient data, vitals, images)
  - `GET /api/queries` (Fetches pending assessments for doctors)

### Phase 5: Connect Frontend to Real Data
- **Action:** Update `HealthWorkerDashboard` to fetch real patients from Firestore.
- **Action:** Implement Voice Input: Add microphone recording capability and integrate speech-to-text.
- **Action:** Implement Body-Map Interaction: Allow touching a body map to select symptoms and upload local medical images.
- **Action:** Connect `PatientAIAnalysisScreen` to the `/api/analyze-patient` endpoint instead of the `setTimeout` mock. Display actual AI severity, recommendations, and safety rules.

### Phase 6: Doctor Portal & Approval Workflows
- **Action:** Update `DoctorDashboard` to fetch pending assessments from Firestore.
- **Action:** Update `DoctorPatientDetailScreen` to display real AI results and allow the doctor to `Approve`, `Reject`, or `Edit` the diagnosis.
- **Action:** Implement Push Notifications to alert Doctors when a new high-risk assessment is generated, and alert Health Workers when a Doctor approves a diagnosis.
- **Action:** Build a web version of the Doctor Portal (optional, if required beyond mobile) using Expo Web or a separate React app pointing to the same Firestore.

### Phase 7: Offline Support & Audit Logging
- **Action:** Implement local caching (e.g., WatermelonDB or AsyncStorage) so Health Workers can record vitals and symptoms offline.
- **Action:** Build sync logic: When the network reconnects, push cached visits/vitals to Firestore.
- **Action:** Implement server-side audit logs to record every AI evaluation, doctor edit, and data access event for medical compliance.
