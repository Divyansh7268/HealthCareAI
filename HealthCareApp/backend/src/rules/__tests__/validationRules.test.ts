import { checkMissingData } from '../validationRules';

describe('Validation Rules', () => {
  it('should flag missing age', () => {
    const missing = checkMissingData({});
    expect(missing).toContain('age');
  });

  it('should flag missing SpO2 if respiratory symptoms present', () => {
    const missing = checkMissingData({
      age: 30,
      symptoms: ['shortness of breath']
    });
    expect(missing).toContain('spO2 (required for respiratory symptoms)');
  });

  it('should flag missing temperature if fever symptoms present', () => {
    const missing = checkMissingData({
      age: 30,
      symptoms: ['high fever']
    });
    expect(missing).toContain('temperature (required for fever symptoms)');
  });

  it('should return empty if all required data is present', () => {
    const missing = checkMissingData({
      age: 30,
      symptoms: ['shortness of breath', 'high fever'],
      vitals: { spO2: '98', temperature: '101' }
    });
    expect(missing.length).toBe(0);
  });
});
