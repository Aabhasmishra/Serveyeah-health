import { MockPatientProfile } from '../types/student';
import { MOCK_PATIENT_PROFILES } from '../data/patientMockData';

export const mockPatientService = {
  getAll: (): MockPatientProfile[] => MOCK_PATIENT_PROFILES,

  getById: (id: string): MockPatientProfile | undefined =>
    MOCK_PATIENT_PROFILES.find((p) => p.id === id),

  getByIndex: (index: number): MockPatientProfile | undefined =>
    MOCK_PATIENT_PROFILES[index],
};
