import { Router } from 'express';
import visitRoutes from './visits';

const router = Router();

// Visits: /api/visits/:visitId/analyze
router.use('/visits', visitRoutes);

export default router;
