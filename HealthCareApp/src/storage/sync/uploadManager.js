import { uploadFile } from '../../api/visitApi';

export async function processUploadOperation(operation) {
  const payload = JSON.parse(operation.payload);
  const { visitId, patientId, fileUri, fileType, mimeType } = payload;
  
  try {
    await uploadFile(visitId, patientId, fileUri, fileType, mimeType);
    return true;
  } catch (error) {
    console.error(`[UploadManager] Failed to upload ${fileUri}:`, error);
    throw error;
  }
}
