import { db } from '../config/firebase';

export interface ClinicalContext {
  patientProfile: any;
  medicalHistory: any[];
  recentVisits: any[];
  previousClinicalFindings: any[];
  previousDoctorDecisions: any[];
  treatmentHistory: any[];
  relevantTrends: any[];
}

export async function buildClinicalContext(
  patientId: string,
  currentVisitId?: string
): Promise<ClinicalContext> {
  const limit = parseInt(process.env.RECENT_VISIT_LIMIT || '5', 10);

  const context: ClinicalContext = {
    patientProfile: {},
    medicalHistory: [],
    recentVisits: [],
    previousClinicalFindings: [],
    previousDoctorDecisions: [],
    treatmentHistory: [],
    relevantTrends: []
  };

  // 1. Get Patient Profile
  const patientDoc = await db.collection('patients').doc(patientId).get();
  if (!patientDoc.exists) {
    throw new Error('Patient not found');
  }
  
  const patientData = patientDoc.data() || {};
  context.patientProfile = {
    id: patientId,
    age: patientData.age,
    gender: patientData.gender,
    bloodGroup: patientData.bloodGroup,
    allergies: patientData.allergies || []
  };

  context.medicalHistory = patientData.medicalHistory || [];

  // 2. Fetch past visits
  let visitsQuery = db.collection('patients').doc(patientId).collection('visits')
    .orderBy('createdAt', 'desc')
    .limit(limit + (currentVisitId ? 1 : 0)); // fetch one extra in case currentVisitId is in the list

  const visitsSnap = await visitsQuery.get();
  
  const visits = visitsSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as any))
    .filter((v: any) => v.id !== currentVisitId)
    .slice(0, limit);

  // 3. Aggregate data from visits
  for (const visit of visits) {
    const visitDate = visit.createdAt?.toDate ? visit.createdAt.toDate().toISOString() : 'Unknown';
    
    // Recent Visits Summary
    context.recentVisits.push({
      id: visit.id,
      date: visitDate,
      chiefComplaint: visit.chiefComplaint || 'None provided',
      status: visit.status
    });

    // Previous Clinical Findings & Treatment History
    if (visit.possibleConditions && visit.possibleConditions.length > 0) {
      context.previousClinicalFindings.push({
        visitDate,
        conditions: visit.possibleConditions,
        riskLevel: visit.riskLevel
      });
    }

    if (visit.ruleEngineFlags && visit.ruleEngineFlags.length > 0) {
      context.relevantTrends.push({
        visitDate,
        flags: visit.ruleEngineFlags.map((f: any) => f.description)
      });
    }

    if (visit.treatmentSuggestions && visit.treatmentSuggestions.length > 0) {
      context.treatmentHistory.push({
        visitDate,
        treatments: visit.treatmentSuggestions
      });
    }

    // Doctor Decisions
    if (visit.doctorReviewStatus === 'reviewed' && visit.doctorNotes) {
      context.previousDoctorDecisions.push({
        visitDate,
        notes: visit.doctorNotes
      });
    }
  }

  return context;
}
