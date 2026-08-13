import { evaluateRedFlags } from '../redFlagRules';

describe('Red Flag Rules', () => {
  it('should flag emergency keywords in symptoms', () => {
    const flags = evaluateRedFlags({ symptoms: ['patient is unconscious'] });
    expect(flags).toContainEqual(expect.objectContaining({
      level: 'emergency'
    }));
  });

  it('should flag urgent keywords in history', () => {
    const flags = evaluateRedFlags({ history: 'had a broken bone last year' });
    expect(flags).toContainEqual(expect.objectContaining({
      level: 'urgent'
    }));
  });

  it('should aggregate and flag keywords from transcript', () => {
    const flags = evaluateRedFlags({ transcript: 'he complained of chest pain' });
    expect(flags).toContainEqual(expect.objectContaining({
      level: 'emergency'
    }));
  });

  it('should return empty array if no keywords are matched', () => {
    const flags = evaluateRedFlags({ symptoms: ['mild headache'] });
    expect(flags.length).toBe(0);
  });
});
