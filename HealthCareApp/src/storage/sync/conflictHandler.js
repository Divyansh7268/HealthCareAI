import { getDatabase } from '../database';

/**
 * Handles conflicts between local changes and server changes.
 */
export async function detectAndHandleConflict(entityType, entityLocalId, serverData, localData) {
  // Append-only for clinical records.
  // Real conflict handling requires business logic per entity type.
  // For visits, we never destructively overwrite server data.
  // If server has newer data, we mark local as conflict to prevent overwriting server.
  
  const db = await getDatabase();
  await db.runAsync(`UPDATE ${entityType === 'visit' ? 'visits' : 'patients'} SET syncStatus = 'conflict' WHERE localId = ?`, [entityLocalId]);
  
  console.warn(`[Sync] Conflict detected for ${entityType} ${entityLocalId}. Marked as conflict.`);
}
