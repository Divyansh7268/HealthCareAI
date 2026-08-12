import { Router } from 'express';
import { requireAuth } from '../middleware/roleAuth';
import { initUpload, completeUpload, deleteUpload } from '../controllers/uploadController';

// These routes will be mounted under /api/v1/visits/:visitId/uploads
const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post('/init', initUpload);
router.post('/complete', completeUpload);
router.delete('/:fileId', deleteUpload);

export default router;
