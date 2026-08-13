import { runDeterministicRules } from '../ruleEngine';

describe('Rule Engine Orchestrator', () => {
  it('should aggregate all rules into a single output', () => {
    const patientData = {
      age: 45,
      symptoms: ['severe chest pain'],
      vitals: {
        spO2: '88', // Emergency
        heartRate: '110' // Urgent
      }
    };

    const output = runDeterministicRules(patientData);

    expect(output.critical).toBe(true);
    expect(output.riskFlags.length).toBeGreaterThan(0);
    expect(output.missingCriticalData.length).toBe(0); // age is present, not a respiratory fever
    expect(output.ruleTriggered.length).toBe(3); // chest pain, spO2, hr
  });

  it('should not flag critical if only urgent flags exist', () => {
    const patientData = {
      age: 22,
      symptoms: ['head injury'], // Urgent
      vitals: {
        spO2: '98' // Normal
      }
    };

    const output = runDeterministicRules(patientData);

    expect(output.critical).toBe(false);
    expect(output.riskFlags.some(f => f.includes('[URGENT]'))).toBe(true);
  });
});
