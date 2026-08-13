import { buildClinicalContext } from '../clinicalContextService';
import { db } from '../../config/firebase';

// Mock Firebase DB
jest.mock('../../config/firebase', () => {
  return {
    db: {
      collection: jest.fn(),
    }
  };
});

describe('Clinical Context Service', () => {
  let mockPatientGet: jest.Mock;
  let mockVisitsGet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPatientGet = jest.fn();
    mockVisitsGet = jest.fn();

    const mockDoc = {
      get: mockPatientGet,
      collection: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };

    (db.collection as jest.Mock).mockImplementation((collName: string) => {
      if (collName === 'patients') {
        return {
          doc: jest.fn().mockReturnValue(mockDoc)
        };
      }
      return {
        get: mockVisitsGet
      };
    });
    
    // Wire visits query to return mockVisitsGet when .get() is called on the collection chain
    mockDoc.get = mockPatientGet;
    mockDoc.collection = jest.fn().mockReturnValue({
      orderBy: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: mockVisitsGet
        })
      })
    });
  });

  it('should throw an error if patient is missing', async () => {
    mockPatientGet.mockResolvedValue({ exists: false });

    await expect(buildClinicalContext('p1')).rejects.toThrow('Patient not found');
  });

  it('should return context for a new patient with no visits', async () => {
    mockPatientGet.mockResolvedValue({
      exists: true,
      data: () => ({ age: 30, gender: 'male', medicalHistory: ['Asthma'] })
    });
    
    mockVisitsGet.mockResolvedValue({ docs: [] });

    const context = await buildClinicalContext('p1');

    expect(context.patientProfile.age).toBe(30);
    expect(context.medicalHistory).toContain('Asthma');
    expect(context.recentVisits.length).toBe(0);
  });

  it('should aggregate 1 previous visit', async () => {
    mockPatientGet.mockResolvedValue({
      exists: true,
      data: () => ({ age: 30 })
    });

    const mockVisit = {
      id: 'v1',
      createdAt: { toDate: () => new Date('2026-08-10T10:00:00Z') },
      chiefComplaint: 'Fever',
      status: 'completed',
      possibleConditions: [{ name: 'Flu' }],
      ruleEngineFlags: [{ description: 'High temp' }]
    };

    mockVisitsGet.mockResolvedValue({
      docs: [{ id: 'v1', data: () => mockVisit }]
    });

    const context = await buildClinicalContext('p1', 'v_current');

    expect(context.recentVisits.length).toBe(1);
    expect(context.previousClinicalFindings.length).toBe(1);
    expect(context.relevantTrends.length).toBe(1);
  });

  it('should exclude the current visit from recentVisits', async () => {
    mockPatientGet.mockResolvedValue({
      exists: true,
      data: () => ({})
    });

    const mockVisit1 = { id: 'v_current', data: () => ({ chiefComplaint: 'Current' }) };
    const mockVisit2 = { id: 'v1', data: () => ({ chiefComplaint: 'Past' }) };

    mockVisitsGet.mockResolvedValue({
      docs: [mockVisit1, mockVisit2]
    });

    const context = await buildClinicalContext('p1', 'v_current');

    expect(context.recentVisits.length).toBe(1);
    expect(context.recentVisits[0].id).toBe('v1');
  });

  it('should truncate visits to RECENT_VISIT_LIMIT', async () => {
    process.env.RECENT_VISIT_LIMIT = '2'; // Set limit for test

    mockPatientGet.mockResolvedValue({ exists: true, data: () => ({}) });

    // Create 4 mock visits
    const docs = Array.from({ length: 4 }).map((_, i) => ({
      id: `v${i}`,
      data: () => ({ chiefComplaint: `Complaint ${i}` })
    }));

    mockVisitsGet.mockResolvedValue({ docs });

    const context = await buildClinicalContext('p1');

    expect(context.recentVisits.length).toBe(2); // Only first 2 due to limit
  });
});
