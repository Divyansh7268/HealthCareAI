# VirtualCare Backend API

The VirtualCare backend is a robust Node.js/Express server written in TypeScript. It securely manages patient records, handles clinical visits, and orchestrates the AI analysis pipeline for rural health workers.

## Prerequisites

- Node.js (v18+)
- npm

## Local Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the `backend/` directory based on `.env.example`.

   ```env
   PORT=3000
   GEMINI_API_KEY=your_google_ai_studio_api_key
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```

3. **Firebase Admin Configuration:**
   - Go to your Firebase Console (Project: virtualcare-81442).
   - Navigate to **Project Settings > Service Accounts**.
   - Click **Generate new private key** to download the JSON credentials.
   - Paste the entire JSON file content into the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable on a single line.

## Development Commands

- **Start Development Server:** (Watches for changes and restarts automatically)
  ```bash
  npm run dev
  ```
- **Build for Production:**
  ```bash
  npm run build
  ```
- **Start Production Server:**
  ```bash
  npm start
  ```
- **Type Checking:**
  ```bash
  npx tsc --noEmit
  ```

## Available Endpoints

All API endpoints are prefixed with `/api/v1`. Authentication is required for all endpoints using a Firebase ID token sent in the `Authorization: Bearer <token>` header.

### Auth & Users
- `POST /api/v1/auth/session` - Verify session/token
- `GET  /api/v1/auth/users/me` - Get current authenticated user profile

### Patients
- `POST  /api/v1/patients` - Register a new patient
- `GET   /api/v1/patients/:patientId` - Get patient details
- `GET   /api/v1/patients/:patientId/history` - Get patient's clinical history (visits)
- `PATCH /api/v1/patients/:patientId` - Update patient details

### Visits
- `POST  /api/v1/patients/:patientId/visits` - Create a new clinical visit
- `GET   /api/v1/patients/:patientId/visits/:visitId` - Get details of a specific visit
- `PATCH /api/v1/patients/:patientId/visits/:visitId` - Update visit details (e.g., adding vitals, symptoms)

### AI Analysis
- `POST  /api/v1/visits/:visitId/analyze` - Trigger the Gemini AI analysis pipeline for a visit.

## Security & Architecture

- **No API Keys in App:** The mobile application contains no sensitive API keys. All communication with Gemini AI happens securely on the server.
- **Firebase Auth:** React Native handles user login and acquires ID tokens. The backend verifies these tokens via the Firebase Admin SDK.
- **Role-Based Access:** Configurable middleware ensures only authorized Health Workers or Doctors can perform specific actions.
- **Rate Limiting:** Global rate limiting is applied to prevent abuse.
