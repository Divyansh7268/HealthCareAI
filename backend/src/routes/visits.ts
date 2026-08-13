import { Router } from 'express';
import { analyzeVisit } from '../controllers/visitController';
import { authenticate } from '../middleware/auth';

import uploadRoutes from './uploads';

const router = Router();

// Mount uploads router with mergeParams so it can access :visitId
router.use('/:visitId/uploads', uploadRoutes);

/**
 * POST /api/v1/visits/:visitId/analyze
 * 
 * Triggers the full AI assessment pipeline.
 * Requires: Bearer token from Firebase Auth.
 * Body: { patientId, symptoms, vitals, bodyLocations, ... }
 */
router.post('/:visitId/analyze', authenticate, analyzeVisit);

export default router;
