import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { writeAuditLog } from '../audit/auditLogger';

const PATIENTS_COLLECTION = 'patients';

export const createPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, age, gender, phone, village, district, state } = req.body;
    const user = (req as any).user;
    const workerUid = user.uid;

    if (!name || !age || !phone) {
      return res.status(400).json({ error: 'Name, age, and phone are required' });
    }

    // Duplicate Check: Same worker, same phone
    const q = db.collection(PATIENTS_COLLECTION)
      .where('createdBy', '==', workerUid)
      .where('phone', '==', phone);
    
    const snap = await q.get();

    if (!snap.empty) {
      const existing = snap.docs[0];
      return res.status(200).json({
        message: 'Patient already exists',
        patient: { id: existing.id, ...existing.data() },
      });
    }

    const patientData = {
      name: name.trim(),
      age: parseInt(age, 10),
      gender: gender || 'unknown',
      phone: phone.trim(),
      village: village || null,
      district: district || null,
      state: state || null,
      createdBy: workerUid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isActive: true,
    };

    const docRef = await db.collection(PATIENTS_COLLECTION).add(patientData);
    
    await writeAuditLog({
      actorUid: workerUid,
      actorRole: user.role || 'health_worker',
      action: 'PATIENT_CREATED',
      patientId: docRef.id,
      metadata: { phone }
    });
    
    return res.status(201).json({
      message: 'Patient created successfully',
      patient: { id: docRef.id, ...patientData },
    });
  } catch (error) {
    next(error);
  }
};

export const getPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const docRef = await db.collection(PATIENTS_COLLECTION).doc(patientId).get();

    if (!docRef.exists) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    return res.status(200).json({
      patient: { id: docRef.id, ...docRef.data() }
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const user = (req as any).user;
    
    // 1. Get Patient Profile
    const patientDoc = await db.collection(PATIENTS_COLLECTION).doc(patientId).get();
    if (!patientDoc.exists) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    const profile = { id: patientDoc.id, ...patientDoc.data() };

    // 2. Get Visit Summary (Sub-collection)
    const visitsSnap = await db.collection(PATIENTS_COLLECTION)
      .doc(patientId)
      .collection('visits')
      .get(); // Sorting locally if composite index is missing, or using plain fetch

    let visits = visitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Local sort to avoid index requirements
    visits.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA; // desc
    });

    // 3. AI Assessments and Doctor Decisions could be aggregated here or fetched specifically
    // For now, return visits which contain riskLevel and doctorReviewStatus.

    await writeAuditLog({
      actorUid: user.uid,
      actorRole: user.role || 'health_worker',
      action: 'HISTORY_ACCESSED',
      patientId: patientId
    });

    return res.status(200).json({
      patient: profile,
      visits: visits
    });
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const updates = req.body;
    const user = (req as any).user;
    
    delete updates.createdBy;
    delete updates.createdAt;
    
    updates.updatedAt = FieldValue.serverTimestamp();

    await db.collection(PATIENTS_COLLECTION).doc(patientId).update(updates);

    await writeAuditLog({
      actorUid: user.uid,
      actorRole: user.role || 'health_worker',
      action: 'PATIENT_UPDATED',
      patientId: patientId
    });

    return res.status(200).json({ message: 'Patient updated successfully' });
  } catch (error) {
    next(error);
  }
};
