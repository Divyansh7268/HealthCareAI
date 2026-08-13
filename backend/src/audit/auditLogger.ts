import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export interface AuditLogOptions {
  actorUid: string;
  actorRole: string;
  action: string;
  patientId?: string;
  visitId?: string;
  metadata?: Record<string, any>;
}

export const writeAuditLog = async (options: AuditLogOptions) => {
  try {
    const logRef = db.collection('auditLogs').doc();
    await logRef.set({
      ...options,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // We log the error but don't throw it, so we don't crash the main operation
    console.error('[Audit Logger] Failed to write audit log:', error);
  }
};
