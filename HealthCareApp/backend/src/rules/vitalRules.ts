/**
 * Vital Signs Rules
 * 
 * Sources:
 * - SpO2: WHO Guidelines for oxygen therapy (Critical < 90%, Urgent < 94%)
 * - Heart Rate (Adults): ACLS guidelines (Critical > 150 or < 50, Urgent > 100)
 * - Respiratory Rate: qSOFA / SIRS criteria (Critical > 30 or < 10, Urgent > 20)
 * - Temperature: CDC/WHO (Critical >= 104F or < 95F, Urgent >= 100.4F)
 */

export interface RuleFlag {
  id: string;
  description: string;
  level: 'emergency' | 'urgent' | 'warning';
}

export function evaluateVitals(vitals: any): RuleFlag[] {
  const flags: RuleFlag[] = [];
  if (!vitals) return flags;

  // 1. SpO2
  if (vitals.spO2) {
    const spo2 = parseFloat(vitals.spO2);
    if (!isNaN(spo2)) {
      if (spo2 < 90) flags.push({ id: 'V_SPO2_EMERGENCY', description: `SpO2 is critically low (${spo2}%)`, level: 'emergency' });
      else if (spo2 < 94) flags.push({ id: 'V_SPO2_URGENT', description: `SpO2 is low (${spo2}%)`, level: 'urgent' });
    }
  }

  // 2. Heart Rate (Adult assumptions for now)
  if (vitals.heartRate) {
    const hr = parseFloat(vitals.heartRate);
    if (!isNaN(hr)) {
      if (hr > 150) flags.push({ id: 'V_HR_HIGH_EMERGENCY', description: `Heart rate is critically high (${hr} bpm)`, level: 'emergency' });
      else if (hr < 50) flags.push({ id: 'V_HR_LOW_EMERGENCY', description: `Heart rate is critically low (${hr} bpm)`, level: 'emergency' });
      else if (hr > 100) flags.push({ id: 'V_HR_HIGH_URGENT', description: `Heart rate is elevated (${hr} bpm)`, level: 'urgent' });
    }
  }

  // 3. Respiratory Rate
  if (vitals.respiratoryRate) {
    const rr = parseFloat(vitals.respiratoryRate);
    if (!isNaN(rr)) {
      if (rr > 30) flags.push({ id: 'V_RR_HIGH_EMERGENCY', description: `Respiratory rate is critically high (${rr}/min)`, level: 'emergency' });
      else if (rr < 10) flags.push({ id: 'V_RR_LOW_EMERGENCY', description: `Respiratory rate is critically low (${rr}/min)`, level: 'emergency' });
      else if (rr > 20) flags.push({ id: 'V_RR_HIGH_URGENT', description: `Respiratory rate is elevated (${rr}/min)`, level: 'urgent' });
    }
  }

  // 4. Temperature (Fahrenheit assumed for these specific thresholds)
  if (vitals.temperature) {
    const temp = parseFloat(vitals.temperature);
    if (!isNaN(temp)) {
      if (temp >= 104) flags.push({ id: 'V_TEMP_HIGH_EMERGENCY', description: `Temperature is critically high (${temp}°F)`, level: 'emergency' });
      else if (temp < 95) flags.push({ id: 'V_TEMP_LOW_EMERGENCY', description: `Temperature is critically low (${temp}°F)`, level: 'emergency' });
      else if (temp >= 100.4) flags.push({ id: 'V_TEMP_HIGH_URGENT', description: `Patient has a fever (${temp}°F)`, level: 'urgent' });
    }
  }

  return flags;
}
