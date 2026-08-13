import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

let dbInstance = null;

/**
 * Initialize and get the database connection.
 * Uses the new expo-sqlite API (SDK 54+).
 * 
 * @returns {Promise<SQLite.SQLiteDatabase>}
 */
export async function getDatabase() {
  if (dbInstance) return dbInstance;

  try {
    const db = await SQLite.openDatabaseAsync('virtualcare_offline.db');
    await runMigrations(db);
    dbInstance = db;
    return db;
  } catch (error) {
    console.error('Failed to initialize local database:', error);
    throw error;
  }
}
