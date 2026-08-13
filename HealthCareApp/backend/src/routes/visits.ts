import { Router } from 'express';
import { analyzeVisit, sendToDoctor } from '../controllers/visitController';
import { transcribeVisitAudio } from '../controllers/voiceController';
import { authenticate } from '../middleware/auth';
import { requireAuth } from '../middleware/roleAuth';

import uploadRoutes from './uploads';

const router = Router();

// Mount uploads router with mergeParams so it can access :visitId
router.use('/:visitId/uploads', uploadRoutes);

/**
 * POST /api/v1/visits/:visitId/analyze
 * 
 * Triggers the full AI assessment pipeline.
 */
router.post('/:visitId/analyze', authenticate, analyzeVisit);

/**
 * POST /api/v1/visits/:visitId/transcribe
 * 
 * Transcribes audio via Gemini Flash and saves transcript.
 */
router.post('/:visitId/transcribe', requireAuth, transcribeVisitAudio);

/**
 * POST /api/v1/visits/:visitId/send-to-doctor
 * 
 * Sends the visit to the doctor for review.
 */
router.post('/:visitId/send-to-doctor', authenticate, sendToDoctor);

export default router;
