import { getDatabase } from '../database';
import { enqueueSyncOperation } from '../queue/syncQueue';

function generateUUID() {
  return 'local_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function createLocalVisit(patientLocalId) {
  const db = await getDatabase();
  const localId = generateUUID();
  const createdAt = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO visits (localId, patientLocalId, status, syncStatus, createdAt, updatedAt)
     VALUES (?, ?, 'pending', 'pending', ?, ?)`,
    [localId, patientLocalId, createdAt, createdAt]
  );

  await enqueueSyncOperation({
    operationId: 'op_' + generateUUID(),
    entityType: 'visit',
    entityLocalId: localId,
    operationType: 'create',
    payload: { patientId: patientLocalId }
  });

  return { id: localId, patientId: patientLocalId };
}

export async function updateLocalVisitData(visitLocalId, payload) {
  const db = await getDatabase();
  const updatedAt = new Date().toISOString();
  
  await db.runAsync(
    `UPDATE visits SET status = ?, updatedAt = ?, syncStatus = 'pending' WHERE localId = ?`,
    [payload.status || 'pending', updatedAt, visitLocalId]
  );

  // Vitals
  if (payload.vitals) {
    await db.runAsync(
      `INSERT OR REPLACE INTO vitals (localId, visitLocalId, temperature, bloodPressure, heartRate, spO2, respiratoryRate, weight, syncStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [visitLocalId + '_vitals', visitLocalId, payload.vitals.temperature, payload.vitals.bloodPressure, payload.vitals.heartRate, payload.vitals.spO2, payload.vitals.respiratoryRate, payload.vitals.weight]
    );
  }

  // Symptoms
  if (payload.symptoms) {
    await db.runAsync(
      `INSERT OR REPLACE INTO symptoms (localId, visitLocalId, symptomsText, duration, additionalNotes, syncStatus)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [visitLocalId + '_symptoms', visitLocalId, payload.symptoms, payload.duration, payload.additionalNotes]
    );
  }

  // Enqueue Update
  await enqueueSyncOperation({
    operationId: 'op_' + generateUUID(),
    entityType: 'visit',
    entityLocalId: visitLocalId,
    operationType: 'update',
    payload
  });
}
