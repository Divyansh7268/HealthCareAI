import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleAuth';
import {
  getPendingCases,
  getCaseDetail,
  getPatientProfile,
  approveCase,
  rejectCase,
  editCase,
  requestMoreInfo
} from '../controllers/doctorController';

const router = Router();

// All doctor routes require authentication AND the 'doctor' role
router.use(authenticate);
router.use(requireRole('doctor'));

// Cases
router.get('/cases', getPendingCases);
router.get('/cases/:visitId', getCaseDetail);

// Patient Details
router.get('/patients/:patientId', getPatientProfile);
router.get('/patients/:patientId/history', getPatientProfile); // using the same controller for simplicity

// Actions on cases
router.post('/cases/:visitId/approve', approveCase);
router.post('/cases/:visitId/reject', rejectCase);
router.post('/cases/:visitId/edit', editCase);
router.post('/cases/:visitId/request-more-information', requestMoreInfo);

export default router;
