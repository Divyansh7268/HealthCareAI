import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';

const AUDIT_COLLECTION = 'auditLogs';

export type AuditAction = 
  | 'AI_ASSESSMENT_GENERATED' 
  | 'PATIENT_CREATED' 
  | 'VISIT_CREATED' 
  | 'PRESCRIPTION_ADDED'
  | 'DOCTOR_APPROVED'
  | 'DOCTOR_REJECTED'
  | 'DOCTOR_EDITED'
  | 'DOCTOR_REQUESTED_INFO';

export async function createAuditLog(
  action: AuditAction,
  userId: string,
  targetId: string, // e.g., visitId, patientId
  details: Record<string, any> = {}
): Promise<void> {
  try {
    await db.collection(AUDIT_COLLECTION).add({
      action,
      userId,
      targetId,
      details,
      timestamp: FieldValue.serverTimestamp(),
    });
    console.log(`[AuditService] Logged action: ${action} for target: ${targetId}`);
  } catch (err) {
    // We intentionally don't throw here to avoid failing the main business transaction if auditing fails,
    // but we log it as a critical error.
    console.error(`[AuditService] CRITICAL ERROR - Failed to save audit log for action: ${action}`, err);
  }
}
