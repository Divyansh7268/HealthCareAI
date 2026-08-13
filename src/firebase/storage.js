/**
 * src/firebase/storage.js
 *
 * Firebase Storage helper functions for VirtualCare.
 *
 * Storage path structure:
 *   medical_images/{visitId}/{filename}
 *   voice_memos/{visitId}/{filename}
 *   profile_photos/{uid}/{filename}
 *
 * Security: Storage rules must restrict uploads to authenticated users only.
 * See docs/database/storage-rules.md for recommended rules.
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from './config';

// ─────────────────────────────────────────────────────────────
// Upload a file with progress callback
// ─────────────────────────────────────────────────────────────
/**
 * Uploads a file (blob/uri) to Firebase Storage.
 * @param {string} storagePath   - Full path e.g. 'medical_images/visitId/photo.jpg'
 * @param {Blob|Uint8Array} file - The file to upload
 * @param {object} metadata      - e.g. { contentType: 'image/jpeg' }
 * @param {function} onProgress  - Called with (0–100) during upload
 * @returns {Promise<string>}    - Resolves with the download URL
 */
export function uploadFile(storagePath, file, metadata = {}, onProgress = null) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          );
          onProgress(progress);
        }
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      },
    );
  });
}

// ─────────────────────────────────────────────────────────────
// Medical Image Upload
// ─────────────────────────────────────────────────────────────
/**
 * Upload a medical image for a given visit.
 * Returns download URL.
 */
export async function uploadMedicalImage(visitId, imageUri, filename, onProgress) {
  const path = `medical_images/${visitId}/${filename}`;

  // Convert URI to blob for React Native
  const response = await fetch(imageUri);
  const blob = await response.blob();

  return uploadFile(path, blob, { contentType: 'image/jpeg' }, onProgress);
}

// ─────────────────────────────────────────────────────────────
// Voice Memo Upload
// ─────────────────────────────────────────────────────────────
export async function uploadVoiceMemo(visitId, audioUri, filename, onProgress) {
  const path = `voice_memos/${visitId}/${filename}`;
  const response = await fetch(audioUri);
  const blob = await response.blob();
  return uploadFile(path, blob, { contentType: 'audio/m4a' }, onProgress);
}

// ─────────────────────────────────────────────────────────────
// Profile Photo Upload
// ─────────────────────────────────────────────────────────────
export async function uploadProfilePhoto(uid, imageUri, onProgress) {
  const filename = `profile_${Date.now()}.jpg`;
  const path = `profile_photos/${uid}/${filename}`;
  const response = await fetch(imageUri);
  const blob = await response.blob();
  return uploadFile(path, blob, { contentType: 'image/jpeg' }, onProgress);
}

// ─────────────────────────────────────────────────────────────
// Get Download URL
// ─────────────────────────────────────────────────────────────
export async function getFileUrl(storagePath) {
  const storageRef = ref(storage, storagePath);
  return getDownloadURL(storageRef);
}

// ─────────────────────────────────────────────────────────────
// List files in a folder
// ─────────────────────────────────────────────────────────────
export async function listFiles(folderPath) {
  const folderRef = ref(storage, folderPath);
  const result = await listAll(folderRef);
  return Promise.all(
    result.items.map(async (itemRef) => ({
      name: itemRef.name,
      path: itemRef.fullPath,
      url: await getDownloadURL(itemRef),
    })),
  );
}

// ─────────────────────────────────────────────────────────────
// Delete a file
// ─────────────────────────────────────────────────────────────
export async function deleteFile(storagePath) {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
}
