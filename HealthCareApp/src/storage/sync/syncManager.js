import { getPendingOperations, markOperationSynced, markOperationFailed } from '../queue/syncQueue';
import { processUploadOperation } from './uploadManager';
import apiClient from '../../api/apiClient';

let isSyncing = false;

export async function processSyncQueue() {
  if (isSyncing) return;
  isSyncing = true;
  
  try {
    const pendingOps = await getPendingOperations();
    if (pendingOps.length === 0) {
      isSyncing = false;
      return;
    }

    console.log(`[SyncManager] Found ${pendingOps.length} pending operations. Starting sync...`);

    for (const op of pendingOps) {
      try {
        const payload = JSON.parse(op.payload);
        
        switch (op.entityType) {
          case 'patient':
            if (op.operationType === 'create') {
              await apiClient.post('/patients', payload);
            }
            break;
            
          case 'visit':
            if (op.operationType === 'create') {
              // Real sync logic would map local IDs to server IDs.
              // For simplicity in this demo prototype, we assume server respects local IDs or we use a mapping table.
              await apiClient.post(`/patients/${payload.patientId}/visits`, payload);
            } else if (op.operationType === 'update') {
              await apiClient.patch(`/patients/${payload.patientId}/visits/${op.entityLocalId}`, payload);
            }
            break;
            
          case 'media':
            if (op.operationType === 'upload') {
              await processUploadOperation(op);
            }
            break;

          case 'assessment':
            if (op.operationType === 'create') {
              // Call the real analyzeVisit endpoint to trigger Gemini now that we are online
              await apiClient.post(`/visits/${payload.visitId}/analyze`, payload.assessment);
            }
            break;
            
          default:
            console.warn(`[SyncManager] Unknown entity type: ${op.entityType}`);
        }

        await markOperationSynced(op.operationId);
        console.log(`[SyncManager] Successfully synced ${op.operationId}`);
        
      } catch (err) {
        console.error(`[SyncManager] Failed to sync ${op.operationId}:`, err);
        await markOperationFailed(op.operationId);
      }
    }
  } catch (err) {
    console.error('[SyncManager] Sync process error:', err);
  } finally {
    isSyncing = false;
  }
}
