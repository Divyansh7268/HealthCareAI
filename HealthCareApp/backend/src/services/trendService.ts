/**
 * Trend Service — Longitudinal Patient Trend Analysis
 *
 * Compares the current visit against the patient's most recent prior visits.
 * Produces a FACTUAL structured diff.
 *
 * Design constraints:
 *  - Do NOT invent historical values.
 *  - Do NOT assume "lower is always better" without clinical context.
 *  - Summarise the direction of change. Let the AI interpret clinical meaning.
 *  - All vital comparisons use the most recent previous visit that recorded
 *    that particular vital, not necessarily the immediately prior visit.
 */

import { db } from '../config/firebase';
import { COLLECTIONS } from '../config/collections';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VitalChange {
  field: string;
  previousValue: string | number;
  currentValue: string | number;
  direction: 'increased' | 'decreased' | 'unchanged' | 'new_data';
  previousVisitDate: string;
  note?: string;  // clinical context hint, never a diagnosis
}

export interface SymptomChange {
  symptom: string;
  change: 'new' | 'resolved' | 'persisting';
  previousVisitDate?: string;
}

export interface BodyLocationChange {
  location: string;
  change: 'new' | 'resolved' | 'persisting';
  previousVisitDate?: string;
}

export interface DoctorDecisionEntry {
  visitDate: string;
  reviewStatus: string;
  action?: string;
  notes?: string;
}

export interface TrendResult {
  overallTrend: 'improving' | 'stable' | 'worsening' | 'unclear' | 'first_visit';
  comparedVisitCount: number;
  changes: VitalChange[];
  concerningChanges: VitalChange[];
  improvements: VitalChange[];
  unchangedFindings: VitalChange[];
  symptomChanges: SymptomChange[];
  bodyLocationChanges: BodyLocationChange[];
  doctorDecisionHistory: DoctorDecisionEntry[];
  summary: string;
}

export interface CurrentVisitInput {
  patientId: string;
  visitId: string;
  vitals?: Record<string, string | undefined>;    // strings as sent by the app
  symptoms?: string;                              // comma/sentence string from app
  bodyLocations?: Array<{                         // structured objects from app
    region?: { id: string; label: string; side: string };
    side?: string;
    view?: string;
    complaint?: string;
    severity?: string;
  }>;
  chiefComplaint?: string;
}

// ─── Vital metadata for correct clinical direction hints ──────────────────────

const VITAL_METADATA: Record<string, {
  label: string;
  higherIsWorse: boolean | null; // null = depends on context
  unit: string;
  normalMin?: number;
  normalMax?: number;
  note?: string;
}> = {
  temperature: {
    label: 'Temperature',
    higherIsWorse: null,
    unit: '°C',
    normalMin: 36.5,
    normalMax: 37.5,
    note: 'Elevation suggests fever/infection. Sub-normal may indicate shock or hypothermia.'
  },
  spO2: {
    label: 'SpO2 (Oxygen Saturation)',
    higherIsWorse: false,
    unit: '%',
    normalMin: 95,
    normalMax: 100,
    note: 'Values below 90% are clinically critical.'
  },
  heartRate: {
    label: 'Heart Rate',
    higherIsWorse: null,
    unit: 'bpm',
    normalMin: 60,
    normalMax: 100,
    note: 'Both tachycardia and bradycardia require clinical evaluation.'
  },
  respiratoryRate: {
    label: 'Respiratory Rate',
    higherIsWorse: null,
    unit: 'breaths/min',
    normalMin: 12,
    normalMax: 20,
    note: 'Both tachypnea and bradypnea require clinical evaluation.'
  },
  weight: {
    label: 'Weight',
    higherIsWorse: null,
    unit: 'kg',
    note: 'Rapid unintentional weight loss or gain can be clinically significant.'
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(ts: any): string {
  if (!ts) return 'unknown date';
  if (typeof ts === 'string') return ts;
  if (ts.toDate) return ts.toDate().toISOString();
  if (ts._seconds) return new Date(ts._seconds * 1000).toISOString();
  return 'unknown date';
}

/**
 * Parse a BP string like "120/80" into systolic (first number).
 * Returns null if unparseable.
 */
function parseSystolic(bp: string | null | undefined): number | null {
  if (!bp || typeof bp !== 'string') return null;
  const match = bp.match(/^(\d+)\//);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Compare two numeric vitals and return a VitalChange entry.
 * Direction is based purely on arithmetic difference — no clinical judgment.
 */
function compareNumericVital(
  field: string,
  prevValue: number | null | undefined,
  currValue: number | null | undefined,
  prevDate: string
): VitalChange | null {
  const meta = VITAL_METADATA[field];
  const label = meta?.label || field;
  const unit = meta?.unit || '';

  if (currValue == null) return null;          // no current data — skip
  if (prevValue == null) {                     // first time this vital is recorded
    return {
      field: label,
      previousValue: 'not recorded',
      currentValue: `${currValue}${unit}`,
      direction: 'new_data',
      previousVisitDate: prevDate,
      note: meta?.note
    };
  }

  const diff = currValue - prevValue;
  let direction: VitalChange['direction'] = 'unchanged';
  if (Math.abs(diff) > 0.01) {
    direction = diff > 0 ? 'increased' : 'decreased';
  }

  return {
    field: label,
    previousValue: `${prevValue}${unit}`,
    currentValue: `${currValue}${unit}`,
    direction,
    previousVisitDate: prevDate,
    note: meta?.note
  };
}

/**
 * Compare blood pressure strings.
 * Uses systolic as proxy for direction; records full strings for context.
 */
function compareBP(
  prevBP: string | null | undefined,
  currBP: string | null | undefined,
  prevDate: string
): VitalChange | null {
  if (currBP == null) return null;
  if (prevBP == null) {
    return {
      field: 'Blood Pressure',
      previousValue: 'not recorded',
      currentValue: currBP,
      direction: 'new_data',
      previousVisitDate: prevDate,
      note: 'Systolic ≥140 mmHg may indicate hypertension; <90 mmHg may indicate hypotension.'
    };
  }

  const prevSys = parseSystolic(prevBP);
  const currSys = parseSystolic(currBP);

  let direction: VitalChange['direction'] = 'unchanged';
  if (prevSys != null && currSys != null) {
    const diff = currSys - prevSys;
    if (Math.abs(diff) > 1) direction = diff > 0 ? 'increased' : 'decreased';
  } else {
    direction = prevBP === currBP ? 'unchanged' : 'increased'; // fallback — strings differ
  }

  return {
    field: 'Blood Pressure',
    previousValue: prevBP,
    currentValue: currBP,
    direction,
    previousVisitDate: prevDate,
    note: 'Systolic ≥140 mmHg may indicate hypertension; <90 mmHg may indicate hypotension.'
  };
}

// ─── Classify a vital change as concerning / improving / neutral ───────────────

function classifyVitalChange(change: VitalChange): 'concerning' | 'improving' | 'neutral' {
  const fieldKey = Object.keys(VITAL_METADATA).find(
    k => VITAL_METADATA[k].label === change.field
  );
  if (!fieldKey || change.direction === 'unchanged' || change.direction === 'new_data') return 'neutral';

  const meta = VITAL_METADATA[fieldKey];

  // SpO2: lower is always worse
  if (fieldKey === 'spO2' && meta.higherIsWorse === false) {
    return change.direction === 'decreased' ? 'concerning' : 'improving';
  }

  // For temperature, HR, RR, BP — use out-of-normal-range heuristic
  if (meta.normalMin != null && meta.normalMax != null) {
    const currentNum = parseFloat(String(change.currentValue));
    if (!isNaN(currentNum)) {
      const nowOutOfRange = currentNum < meta.normalMin || currentNum > meta.normalMax;
      const prevNum = parseFloat(String(change.previousValue));
      const wasOutOfRange = !isNaN(prevNum) && (prevNum < meta.normalMin || prevNum > meta.normalMax);
      if (nowOutOfRange && !wasOutOfRange) return 'concerning';
      if (!nowOutOfRange && wasOutOfRange) return 'improving';
    }
  }

  return 'neutral';
}

// ─── Overall trend computation ────────────────────────────────────────────────

function computeOverallTrend(
  concerning: VitalChange[],
  improving: VitalChange[],
  symptomChanges: SymptomChange[],
  isFirstVisit: boolean
): TrendResult['overallTrend'] {
  if (isFirstVisit) return 'first_visit';

  const newSymptoms = symptomChanges.filter(s => s.change === 'new').length;
  const resolvedSymptoms = symptomChanges.filter(s => s.change === 'resolved').length;

  const concernScore = concerning.length + newSymptoms;
  const improveScore = improving.length + resolvedSymptoms;

  if (concernScore === 0 && improveScore === 0) return 'stable';
  if (concernScore > 0 && improveScore === 0) return 'worsening';
  if (improveScore > 0 && concernScore === 0) return 'improving';
  return 'unclear'; // mixed signals
}

// ─── Core Trend Engine ────────────────────────────────────────────────────────

export async function computePatientTrend(
  current: CurrentVisitInput
): Promise<TrendResult> {
  const { patientId, visitId } = current;

  // Normalise incoming data from the validator's raw types
  const vitals = current.vitals || {};

  // symptoms may be a string sentence — split into tokens for diffing
  const symptomsRaw = current.symptoms || '';
  const symptoms: string[] = typeof symptomsRaw === 'string'
    ? symptomsRaw.split(/[,;]+/).map(s => s.trim()).filter(Boolean)
    : (symptomsRaw as unknown as string[]);

  // bodyLocations are structured objects — extract region label as identifier
  const bodyLocationsRaw = current.bodyLocations || [];
  const bodyLocations: string[] = (bodyLocationsRaw as any[]).map(
    (loc: any) => loc?.region?.label || loc?.region?.id || String(loc)
  ).filter(Boolean);

  // ── Fetch previous visits (max 5, exclude current) ────────────────────────
  const visitsSnap = await db
    .collection(COLLECTIONS.PATIENTS)
    .doc(patientId)
    .collection(COLLECTIONS.VISITS)
    .orderBy('createdAt', 'desc')
    .limit(6)
    .get();

  const previousVisits = visitsSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as any))
    .filter(v => v.id !== visitId)
    .slice(0, 5);

  // First visit shortcut
  if (previousVisits.length === 0) {
    return {
      overallTrend: 'first_visit',
      comparedVisitCount: 0,
      changes: [],
      concerningChanges: [],
      improvements: [],
      unchangedFindings: [],
      symptomChanges: (symptoms).map(s => ({ symptom: s, change: 'new' as const })),
      bodyLocationChanges: (bodyLocations).map(l => ({ location: l, change: 'new' as const })),
      doctorDecisionHistory: [],
      summary: 'This is the patient\'s first recorded visit. No longitudinal comparison is available.'
    };
  }

  const mostRecent = previousVisits[0];
  const prevDate = toDateStr(mostRecent.createdAt);

  // ── Vital Comparisons ─────────────────────────────────────────────────────
  const allVitalChanges: VitalChange[] = [];

  const prevVitals = mostRecent.vitals || {};

  // Numeric vitals — vitals come in as strings from the app; parse to numbers
  for (const field of ['temperature', 'spO2', 'heartRate', 'respiratoryRate', 'weight'] as const) {
    const currRaw = vitals?.[field];
    const prevRaw = prevVitals?.[field];
    const curr = currRaw != null && currRaw !== '' ? parseFloat(String(currRaw)) : null;
    const prev = prevRaw != null && prevRaw !== '' ? parseFloat(String(prevRaw)) : null;
    const change = compareNumericVital(field, isNaN(prev as number) ? null : prev, isNaN(curr as number) ? null : curr, prevDate);
    if (change) allVitalChanges.push(change);
  }

  // Blood pressure (string)
  const bpChange = compareBP(
    prevVitals?.bloodPressure ? String(prevVitals.bloodPressure) : null,
    vitals?.bloodPressure ? String(vitals.bloodPressure) : null,
    prevDate
  );
  if (bpChange) allVitalChanges.push(bpChange);

  // ── Classify vital changes ────────────────────────────────────────────────
  const concerning: VitalChange[] = [];
  const improving: VitalChange[] = [];
  const unchanged: VitalChange[] = [];
  const otherChanges: VitalChange[] = [];

  for (const vc of allVitalChanges) {
    if (vc.direction === 'unchanged') { unchanged.push(vc); continue; }
    if (vc.direction === 'new_data') { otherChanges.push(vc); continue; }
    const cls = classifyVitalChange(vc);
    if (cls === 'concerning') concerning.push(vc);
    else if (cls === 'improving') improving.push(vc);
    else otherChanges.push(vc);
  }

  // ── Symptom Diff ──────────────────────────────────────────────────────────
  const prevSymptoms: string[] = Array.isArray(mostRecent.symptoms) ? mostRecent.symptoms : [];
  const currSymptomsNorm = symptoms.map(s => s.toLowerCase().trim());
  const prevSymptomsNorm = prevSymptoms.map(s => s.toLowerCase().trim());

  const symptomChanges: SymptomChange[] = [];

  for (const s of currSymptomsNorm) {
    if (prevSymptomsNorm.includes(s)) {
      symptomChanges.push({ symptom: s, change: 'persisting', previousVisitDate: prevDate });
    } else {
      symptomChanges.push({ symptom: s, change: 'new' });
    }
  }
  for (const s of prevSymptomsNorm) {
    if (!currSymptomsNorm.includes(s)) {
      symptomChanges.push({ symptom: s, change: 'resolved', previousVisitDate: prevDate });
    }
  }

  // ── Body Location Diff ────────────────────────────────────────────────────
  const prevLocations: string[] = Array.isArray(mostRecent.bodyLocations) ? mostRecent.bodyLocations : [];
  const currLocsNorm = bodyLocations.map(l => l.toLowerCase().trim());
  const prevLocsNorm = prevLocations.map(l => l.toLowerCase().trim());

  const bodyLocationChanges: BodyLocationChange[] = [];

  for (const loc of currLocsNorm) {
    if (prevLocsNorm.includes(loc)) {
      bodyLocationChanges.push({ location: loc, change: 'persisting', previousVisitDate: prevDate });
    } else {
      bodyLocationChanges.push({ location: loc, change: 'new' });
    }
  }
  for (const loc of prevLocsNorm) {
    if (!currLocsNorm.includes(loc)) {
      bodyLocationChanges.push({ location: loc, change: 'resolved', previousVisitDate: prevDate });
    }
  }

  // ── Doctor Decision History ───────────────────────────────────────────────
  const doctorDecisionHistory: DoctorDecisionEntry[] = previousVisits
    .filter(v => v.doctorReviewStatus && v.doctorReviewStatus !== 'not_required')
    .map(v => ({
      visitDate: toDateStr(v.createdAt),
      reviewStatus: v.doctorReviewStatus,
      action: v.doctorAction?.action,
      notes: v.doctorNotes || v.doctorAction?.notes
    }));

  // ── Overall Trend ─────────────────────────────────────────────────────────
  const overallTrend = computeOverallTrend(concerning, improving, symptomChanges, false);

  // ── Human-readable summary ────────────────────────────────────────────────
  const summaryParts: string[] = [`Compared against ${previousVisits.length} previous visit(s).`];
  if (concerning.length > 0) {
    summaryParts.push(`Concerning vital changes: ${concerning.map(c => c.field).join(', ')}.`);
  }
  if (improving.length > 0) {
    summaryParts.push(`Improving vital readings: ${improving.map(c => c.field).join(', ')}.`);
  }
  const newSymptoms = symptomChanges.filter(s => s.change === 'new');
  if (newSymptoms.length > 0) {
    summaryParts.push(`New symptoms since last visit: ${newSymptoms.map(s => s.symptom).join(', ')}.`);
  }
  const resolvedSymptoms = symptomChanges.filter(s => s.change === 'resolved');
  if (resolvedSymptoms.length > 0) {
    summaryParts.push(`Symptoms that resolved: ${resolvedSymptoms.map(s => s.symptom).join(', ')}.`);
  }
  if (summaryParts.length === 1) summaryParts.push('No significant changes detected in tracked vitals or symptoms.');

  return {
    overallTrend,
    comparedVisitCount: previousVisits.length,
    changes: otherChanges,
    concerningChanges: concerning,
    improvements: improving,
    unchangedFindings: unchanged,
    symptomChanges,
    bodyLocationChanges,
    doctorDecisionHistory,
    summary: summaryParts.join(' ')
  };
}
