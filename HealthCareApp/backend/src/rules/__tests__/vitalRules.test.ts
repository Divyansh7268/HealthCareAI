import { evaluateVitals } from '../vitalRules';

describe('Vital Sign Rules', () => {
  it('should flag critical SpO2 (<90%)', () => {
    const flags = evaluateVitals({ spO2: '89' });
    expect(flags).toContainEqual(expect.objectContaining({
      level: 'emergency',
      id: 'V_SPO2_EMERGENCY'
    }));
  });

  it('should flag urgent SpO2 (<94%)', () => {
    const flags = evaluateVitals({ spO2: '93' });
    expect(flags).toContainEqual(expect.objectContaining({
      level: 'urgent',
      id: 'V_SPO2_URGENT'
    }));
  });

  it('should not flag normal SpO2', () => {
    const flags = evaluateVitals({ spO2: '98' });
    expect(flags.length).toBe(0);
  });

  it('should flag critical HR (>150)', () => {
    const flags = evaluateVitals({ heartRate: '155' });
    expect(flags).toContainEqual(expect.objectContaining({ level: 'emergency' }));
  });

  it('should flag urgent Temp (>=100.4)', () => {
    const flags = evaluateVitals({ temperature: '101' });
    expect(flags).toContainEqual(expect.objectContaining({ level: 'urgent' }));
  });
});
