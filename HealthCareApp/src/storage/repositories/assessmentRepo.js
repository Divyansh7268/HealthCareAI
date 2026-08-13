import { getDatabase } from '../database';
import { enqueueSyncOperation } from '../queue/syncQueue';

function generateUUID() {
  return 'local_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function saveOfflineAssessment(visitLocalId, assessmentResult) {
  const db = await getDatabase();
  const localId = generateUUID();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO offline_assessments (localId, visitLocalId, assessmentData, createdAt, syncStatus)
     VALUES (?, ?, ?, ?, 'pending')`,
    [localId, visitLocalId, JSON.stringify(assessmentResult), createdAt]
  );

  await enqueueSyncOperation({
    operationId: 'op_' + generateUUID(),
    entityType: 'assessment',
    entityLocalId: localId,
    operationType: 'create',
    payload: { visitId: visitLocalId, assessment: assessmentResult }
  });
}
