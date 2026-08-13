# Offline-First Architecture

VirtualCare implements an offline-first architecture for health workers in remote locations with poor or intermittent connectivity.

## Overview

The core philosophy is **append-only local data capture** combined with a **deterministic local rule engine**. 
We do NOT run generative AI on the device, nor do we attempt to mock it. Instead, the offline mode falls back to medically validated, deterministic clinical scoring systems (NEWS2, GCS) and hardcoded red-flag rules.

## Core Components

1. **Local SQLite Database (`src/storage/database.js`)**
   - Stores patients, visits, vitals, symptoms, media, and offline assessments.
   - Initialized via `expo-sqlite` (SDK 54 async API).
   
2. **Sync Queue (`src/storage/queue/syncQueue.js`)**
   - Every offline write operation is immediately written to the local database and enqueued as an operation.
   - Operations track `entityType`, `operationType`, and payload.

3. **Sync Manager (`src/storage/sync/syncManager.js`)**
   - Triggered automatically via `@react-native-community/netinfo` when the device regains internet connection.
   - Processes the queue in order (FIFO).
   - Resolves conflicts using an append-only strategy where server data is never destructively overwritten by stale local data.

4. **Clinical Rule Engine (`src/clinical/offlineAssessment.js`)**
   - A pure-JavaScript implementation of clinical scoring.
   - Integrates **NEWS2** (RCP 2017) and **GCS** (Teasdale & Jennett).
   - Validates outlier vitals.
   - Scans text for Emergency Red Flags (e.g., "chest pain", "unconscious").

## Security & Privacy

Since managed Expo does not support full SQLite encryption without ejecting (e.g. SQLCipher), the offline mode uses a data minimisation strategy:
- Only patients registered on the current device are stored locally.
- No historical cloud patient data is pulled down to the device unless explicitly synced for a visit.
- Auth tokens are stored securely in `expo-secure-store`.
- Medical media (photos, audio) is saved to the app's local sandboxed file system and synced to Firebase Cloud Storage via signed URLs upon reconnection.

## Limitations

- The offline trend comparison is limited to visits stored in the local SQLite database. It cannot compare against historical visits that only exist in Firestore.
- Audio transcriptions cannot run offline. The raw audio is saved and will be uploaded/transcribed when online.
