import { getDatabase } from '../database';
import { enqueueSyncOperation } from '../queue/syncQueue';

function generateUUID() {
  return 'local_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function createLocalPatient(patientData) {
  const db = await getDatabase();
  const localId = generateUUID();
  const createdAt = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO patients (localId, name, age, gender, phone, syncStatus, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [localId, patientData.name, patientData.age, patientData.gender, patientData.phone, createdAt, createdAt]
  );

  await enqueueSyncOperation({
    operationId: 'op_' + generateUUID(),
    entityType: 'patient',
    entityLocalId: localId,
    operationType: 'create',
    payload: patientData
  });

  return { id: localId, ...patientData };
}

export async function searchLocalPatients(query) {
  const db = await getDatabase();
  const q = `%${query}%`;
  return await db.getAllAsync(
    `SELECT * FROM patients WHERE name LIKE ? OR phone LIKE ? LIMIT 20`,
    [q, q]
  );
}

export async function getPatient(localId) {
  const db = await getDatabase();
  return await db.getFirstAsync(`SELECT * FROM patients WHERE localId = ?`, [localId]);
}
