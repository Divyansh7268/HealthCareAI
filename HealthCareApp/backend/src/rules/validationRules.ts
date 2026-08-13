/**
 * Validation Rules
 * 
 * Ensures required data is present based on the provided inputs.
 * Returns missing critical data fields.
 */

export function checkMissingData(patientData: any): string[] {
  const missing: string[] = [];

  if (!patientData.age) {
    missing.push('age');
  }

  const symptomsList = Array.isArray(patientData.symptoms) 
    ? patientData.symptoms 
    : (typeof patientData.symptoms === 'string' ? [patientData.symptoms] : []);

  const hasRespiratorySymptoms = symptomsList.some((s: string) => 
    s.toLowerCase().includes('breath') || 
    s.toLowerCase().includes('cough') || 
    s.toLowerCase().includes('wheez')
  );

  if (hasRespiratorySymptoms && (!patientData.vitals || !patientData.vitals.spO2)) {
    missing.push('spO2 (required for respiratory symptoms)');
  }

  const hasFeverSymptoms = symptomsList.some((s: string) => 
    s.toLowerCase().includes('fever') || 
    s.toLowerCase().includes('hot') || 
    s.toLowerCase().includes('chills')
  );

  if (hasFeverSymptoms && (!patientData.vitals || !patientData.vitals.temperature)) {
    missing.push('temperature (required for fever symptoms)');
  }

  return missing;
}
