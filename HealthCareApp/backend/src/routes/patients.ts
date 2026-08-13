import { Router } from 'express';
import { requireAuth } from '../middleware/roleAuth';
import { createPatient, getPatients, getPatient, getPatientHistory, updatePatient } from '../controllers/patientController';
import { createVisit, getVisitById, updateVisit } from '../controllers/visitController';

const router = Router();

// Protect all patient routes
router.use(requireAuth);

// Patient CRUD
router.post('/', createPatient);
router.get('/', getPatients);
router.get('/:patientId', getPatient);
router.get('/:patientId/history', getPatientHistory);
router.patch('/:patientId', updatePatient);

// Visit CRUD for a specific patient
router.post('/:patientId/visits', createVisit);
router.get('/:patientId/visits/:visitId', getVisitById);
router.patch('/:patientId/visits/:visitId', updateVisit);

export default router;
