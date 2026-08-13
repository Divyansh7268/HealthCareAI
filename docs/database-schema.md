# VirtualCare — Firestore Database Schema

## Design Principles

> Patient data lives in OUR Firestore. NEVER in the AI provider.
> AI models can be replaced without losing any patient history.
> Doctor decisions are stored separately from AI output and are the source of truth.

## Collection Overview

| Collection | Purpose |
|---|---|
| `users` | User profiles + roles |
| `patients` | Patient demographics |
| `patients/{id}/visits` | Visit history per patient |
| `visits` | Top-level visits (doctor queries) |
| `visits/{id}/aiAssessments` | AI-generated analysis |
| `visits/{id}/doctorReviews` | Doctor final decision |
| `treatments` | Prescribed treatments |
| `referrals` | Facility referrals |
| `followUps` | Scheduled follow-ups |
| `notifications` | In-app alerts |
| `auditLogs` | Immutable audit trail |

## patients/{patientId}
- name, age, gender, phone, village, district, state
- bloodGroup, allergies[], chronicConditions[]
- emergencyContact: { name, phone, relation }
- createdBy (HW uid), createdAt, updatedAt, isActive

## visits/{visitId}  [also mirrored to patients/{id}/visits/{visitId}]
- patientId, healthWorkerId, clinicId
- symptoms[], chiefComplaint, voiceTranscript
- vitals: { temperature, bloodPressureSys, bloodPressureDia, heartRate, spo2, respiratoryRate, weight, recordedAt }
- bodyLocations[]: { bodyRegion, side, coordinates, complaint, severity }
- medicalImageRefs[] (Storage paths)
- status: draft | submitted | ai_analyzed | pending_doctor | completed
- riskLevel: low | medium | high | critical | null
- doctorReviewStatus: not_required | pending | approved | rejected | needs_info

## visits/{visitId}/aiAssessments/{assessmentId}  [AI OUTPUT ONLY - not source of truth]
- modelProvider, modelName, modelVersion  (so models can be swapped)
- riskLevel, possibleConditions[], redFlags[], supportingFindings[]
- missingInformation[], recommendedNextStep, doctorReviewRequired
- reasoning, rawResponse, status: ai_draft | approved | rejected

## visits/{visitId}/doctorReviews/{reviewId}  [SOURCE OF TRUTH]
- finalDecision: approved | rejected | modified
- diagnosis, treatmentPlan, medications[], doctorNotes
- agreedWithAI (boolean), aiOverrideReason
- referralRequired, followUpRequired, followUpInDays

## treatments/{treatmentId}
- visitId, patientId, prescribedBy
- medications[]: { name, dose, frequency, duration }
- startDate, endDate, status: active | completed | discontinued

## referrals/{referralId}
- visitId, patientId, referredTo, facilityType
- urgency: emergency | urgent | routine
- status: pending | accepted | completed | cancelled

## followUps/{followUpId}
- visitId, patientId, scheduledDate, reason
- status: scheduled | completed | missed | cancelled

## notifications/{notificationId}
- recipientUid, type, title, message, data{}, isRead

## auditLogs/{logId}  [IMMUTABLE - write only]
- action, uid, patientId, visitId, assessmentId, timestamp
