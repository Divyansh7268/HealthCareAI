import { getDatabase } from '../database';

/**
 * Enqueue an operation to sync with the backend later.
 * 
 * @param {object} param
 * @param {string} param.operationId - Unique UUID for the operation
 * @param {string} param.entityType - 'patient', 'visit', 'media', 'assessment'
 * @param {string} param.entityLocalId
 * @param {string} param.operationType - 'create', 'update', 'upload'
 * @param {object} param.payload - Data to send to server
 */
export async function enqueueSyncOperation({ operationId, entityType, entityLocalId, operationType, payload }) {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO sync_queue (operationId, entityType, entityLocalId, operationType, payload, status, retryCount, createdAt)
     VALUES (?, ?, ?, ?, ?, 'pending', 0, ?)`,
    [operationId, entityType, entityLocalId, operationType, JSON.stringify(payload), createdAt]
  );
}

export async function getPendingOperations() {
  const db = await getDatabase();
  return await db.getAllAsync(`
    SELECT * FROM sync_queue 
    WHERE status IN ('pending', 'failed') AND retryCount < 5 
    ORDER BY createdAt ASC
  `);
}

export async function markOperationSynced(operationId) {
  const db = await getDatabase();
  await db.runAsync(`UPDATE sync_queue SET status = 'synced' WHERE operationId = ?`, [operationId]);
}

export async function markOperationFailed(operationId, incrementRetry = true) {
  const db = await getDatabase();
  if (incrementRetry) {
    await db.runAsync(`UPDATE sync_queue SET status = 'failed', retryCount = retryCount + 1 WHERE operationId = ?`, [operationId]);
  } else {
    await db.runAsync(`UPDATE sync_queue SET status = 'failed' WHERE operationId = ?`, [operationId]);
  }
}
