import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

// Firebase Admin is initialized once and used throughout the backend.
// It uses a Service Account for secure server-side access with full privileges,
// bypassing the Firestore Security Rules that the mobile client must respect.
if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. ' +
      'Download your Firebase service account key from the Firebase Console ' +
      '(Project Settings > Service Accounts) and set it as a JSON string in backend/.env'
    );
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`,
  });

  console.log('[Firebase Admin] Initialized for project:', serviceAccount.project_id);
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export default admin;
