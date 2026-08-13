import * as SQLite from 'expo-sqlite';

/**
 * Define the schema version for migrations.
 * Increment this whenever the database schema changes.
 */
const SCHEMA_VERSION = 1;

/**
 * Execute all necessary migrations.
 * @param {SQLite.SQLiteDatabase} db
 */
export async function runMigrations(db) {
  // Use a PRAGMA user_version to track schema version
  let currentVersion = 0;
  try {
    const res = await db.getFirstAsync('PRAGMA user_version;');
    currentVersion = res.user_version || 0;
  } catch (e) {
    console.warn('Could not read user_version, assuming 0');
  }

  if (currentVersion >= SCHEMA_VERSION) {
    return; // Already up to date
  }

  console.log(`Migrating local database from version ${currentVersion} to ${SCHEMA_VERSION}`);

  if (currentVersion === 0) {
    // Initial schema setup
    await db.execAsync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS patients (
        localId TEXT PRIMARY KEY,
        serverId TEXT UNIQUE,
        name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        phone TEXT,
        syncStatus TEXT DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS visits (
        localId TEXT PRIMARY KEY,
        serverId TEXT UNIQUE,
        patientLocalId TEXT NOT NULL,
        status TEXT,
        doctorReviewStatus TEXT,
        syncStatus TEXT DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY(patientLocalId) REFERENCES patients(localId) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS vitals (
        localId TEXT PRIMARY KEY,
        visitLocalId TEXT NOT NULL,
        temperature TEXT,
        bloodPressure TEXT,
        heartRate TEXT,
        spO2 TEXT,
        respiratoryRate TEXT,
        weight TEXT,
        syncStatus TEXT DEFAULT 'pending',
        FOREIGN KEY(visitLocalId) REFERENCES visits(localId) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS symptoms (
        localId TEXT PRIMARY KEY,
        visitLocalId TEXT NOT NULL,
        symptomsText TEXT,
        duration TEXT,
        additionalNotes TEXT,
        syncStatus TEXT DEFAULT 'pending',
        FOREIGN KEY(visitLocalId) REFERENCES visits(localId) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS body_locations (
        localId TEXT PRIMARY KEY,
        visitLocalId TEXT NOT NULL,
        regionId TEXT,
        regionLabel TEXT,
        side TEXT,
        view TEXT,
        complaint TEXT,
        severity TEXT,
        syncStatus TEXT DEFAULT 'pending',
        FOREIGN KEY(visitLocalId) REFERENCES visits(localId) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS media_attachments (
        localId TEXT PRIMARY KEY,
        serverId TEXT UNIQUE,
        visitLocalId TEXT NOT NULL,
        fileUri TEXT NOT NULL,
        mediaType TEXT NOT NULL,
        mimeType TEXT,
        syncStatus TEXT DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        FOREIGN KEY(visitLocalId) REFERENCES visits(localId) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS offline_assessments (
        localId TEXT PRIMARY KEY,
        visitLocalId TEXT NOT NULL,
        assessmentData TEXT NOT NULL, -- JSON string
        createdAt TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'pending',
        FOREIGN KEY(visitLocalId) REFERENCES visits(localId) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        operationId TEXT PRIMARY KEY,
        entityType TEXT NOT NULL,
        entityLocalId TEXT NOT NULL,
        operationType TEXT NOT NULL,
        payload TEXT, -- JSON string
        status TEXT DEFAULT 'pending',
        retryCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      );
    `);
  }

  // Update version
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
}
