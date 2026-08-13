import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../config/collections';
import { getCaseDetails, getPatientHistory, recordDoctorReview } from '../services/doctorService';

/**
 * GET /api/v1/doctor/cases
 * Fetch cases pending doctor review
 */
export async function getPendingCases(req: Request, res: Response) {
  try {
    // For simplicity, fetch all visits where doctorReviewStatus is 'review_required'
    const casesSnap = await db.collection(COLLECTIONS.VISITS)
      .where('doctorReviewStatus', '==', 'review_required')
      .limit(50)
      .get();
      
    const cases = casesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return res.status(200).json({ success: true, cases });
  } catch (error: any) {
    console.error('[DoctorController] getPendingCases error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch cases', details: error.message });
  }
}

/**
 * GET /api/v1/doctor/cases/:visitId
 */
export async function getCaseDetail(req: Request, res: Response) {
  try {
    const { visitId } = req.params;
    const details = await getCaseDetails(visitId);
    return res.status(200).json({ success: true, ...details });
  } catch (error: any) {
    console.error('[DoctorController] getCaseDetail error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch case details', details: error.message });
  }
}

/**
 * GET /api/v1/doctor/patients/:patientId
 */
export async function getPatientProfile(req: Request, res: Response) {
  try {
    const { patientId } = req.params;
    const history = await getPatientHistory(patientId);
    return res.status(200).json({ success: true, ...history });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch patient history', details: error.message });
  }
}

/**
 * POST /api/v1/doctor/cases/:visitId/approve
 */
export async function approveCase(req: Request, res: Response) {
  try {
    const { visitId } = req.params;
    const { patientId, originalAiAssessmentId, finalAssessment, notes } = req.body;
    const doctorId = (req as any).user.uid;

    if (!patientId) return res.status(400).json({ error: 'patientId is required' });

    const reviewId = await recordDoctorReview(visitId, patientId, doctorId, 'approved', {
      originalAiAssessmentId,
      finalAssessment,
      notes
    });

    return res.status(200).json({ success: true, reviewId, message: 'Case approved successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to approve case', details: error.message });
  }
}

/**
 * POST /api/v1/doctor/cases/:visitId/reject
 */
export async function rejectCase(req: Request, res: Response) {
  try {
    const { visitId } = req.params;
    const { patientId, originalAiAssessmentId, reason } = req.body;
    const doctorId = (req as any).user.uid;

    if (!patientId || !reason) return res.status(400).json({ error: 'patientId and reason are required' });

    const reviewId = await recordDoctorReview(visitId, patientId, doctorId, 'rejected', {
      originalAiAssessmentId,
      reason
    });

    return res.status(200).json({ success: true, reviewId, message: 'Case rejected' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to reject case', details: error.message });
  }
}

/**
 * POST /api/v1/doctor/cases/:visitId/edit
 */
export async function editCase(req: Request, res: Response) {
  try {
    const { visitId } = req.params;
    const { patientId, originalAiAssessmentId, editedAssessment, notes } = req.body;
    const doctorId = (req as any).user.uid;

    if (!patientId || !editedAssessment) return res.status(400).json({ error: 'patientId and editedAssessment are required' });

    const reviewId = await recordDoctorReview(visitId, patientId, doctorId, 'edited', {
      originalAiAssessmentId,
      editedAssessment,
      notes
    });

    return res.status(200).json({ success: true, reviewId, message: 'Case edited and saved successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to edit case', details: error.message });
  }
}

/**
 * POST /api/v1/doctor/cases/:visitId/request-more-information
 */
export async function requestMoreInfo(req: Request, res: Response) {
  try {
    const { visitId } = req.params;
    const { patientId, reason } = req.body;
    const doctorId = (req as any).user.uid;

    if (!patientId || !reason) return res.status(400).json({ error: 'patientId and reason are required' });

    const reviewId = await recordDoctorReview(visitId, patientId, doctorId, 'requested_info', {
      reason
    });

    return res.status(200).json({ success: true, reviewId, message: 'More information requested' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to request info', details: error.message });
  }
}
