# Firestore Security Rules

Copy these rules into Firebase Console → Firestore Database → Rules.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Helper functions ─────────────────────────────────────
    function isSignedIn() {
      return request.auth != null;
    }

    function isRole(role) {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }

    function isDoctor()      { return isRole('doctor'); }
    function isHealthWorker(){ return isRole('healthworker'); }
    function isAdmin()       { return isRole('admin'); }
    function isOwner(uid)    { return isSignedIn() && request.auth.uid == uid; }

    // ── Users collection ─────────────────────────────────────
    match /users/{uid} {
      allow read:   if isOwner(uid) || isDoctor() || isAdmin();
      allow create: if isSignedIn() && isOwner(uid); // set during registration
      allow update: if isOwner(uid) || isAdmin();
      allow delete: if isAdmin();
    }

    // ── Patients collection ──────────────────────────────────
    match /patients/{patientId} {
      allow read:   if isHealthWorker() || isDoctor() || isAdmin();
      allow create: if isHealthWorker();
      allow update: if isHealthWorker() || isDoctor();
      allow delete: if isAdmin();
    }

    // ── Visits collection ────────────────────────────────────
    match /visits/{visitId} {
      allow read:   if isHealthWorker() || isDoctor() || isAdmin();
      allow create: if isHealthWorker();
      allow update: if isHealthWorker() || isDoctor();
      allow delete: if isAdmin();
    }

    // ── Vitals collection ────────────────────────────────────
    match /vitals/{vitalsId} {
      allow read:   if isHealthWorker() || isDoctor() || isAdmin();
      allow create: if isHealthWorker();
      allow update: if isDoctor() || isAdmin();
      allow delete: if isAdmin();
    }

    // ── Assessments collection ───────────────────────────────
    match /assessments/{assessmentId} {
      allow read:   if isHealthWorker() || isDoctor() || isAdmin();
      allow create: if isHealthWorker(); // created after AI response from backend
      allow update: if isDoctor();       // doctors can approve/edit/reject
      allow delete: if isAdmin();
    }

    // ── Audit logs ───────────────────────────────────────────
    match /audit_logs/{logId} {
      allow read:   if isAdmin();
      allow create: if isSignedIn(); // clients write logs; no update/delete
      allow update, delete: if false; // immutable
    }
  }
}
```

## Storage Rules

Copy into Firebase Console → Storage → Rules.

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    match /medical_images/{visitId}/{filename} {
      allow read, write: if request.auth != null;
    }

    match /voice_memos/{visitId}/{filename} {
      allow read, write: if request.auth != null;
    }

    match /profile_photos/{uid}/{filename} {
      allow read:  if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
