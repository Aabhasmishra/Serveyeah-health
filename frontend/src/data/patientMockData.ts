import { MockPatientProfile } from '../types/student';

const MOCK_PATIENT_AVATAR_1 =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23E0F2FE"/><circle cx="100" cy="75" r="45" fill="%230284C7"/><path d="M30 185 c0 -45 35 -70 70 -70 s70 25 70 70 Z" fill="%230284C7"/><text x="100" y="82" font-family="Arial" font-size="28" fill="%23FFFFFF" text-anchor="middle" font-weight="bold">MP</text></svg>';

const MOCK_PATIENT_AVATAR_2 =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23FFEDD5"/><circle cx="100" cy="75" r="45" fill="%23EA580C"/><path d="M30 185 c0 -45 35 -70 70 -70 s70 25 70 70 Z" fill="%23EA580C"/><text x="100" y="82" font-family="Arial" font-size="28" fill="%23FFFFFF" text-anchor="middle" font-weight="bold">RP</text></svg>';

const MOCK_PATIENT_AVATAR_3 =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23CCFBF1"/><circle cx="100" cy="75" r="45" fill="%230F766E"/><path d="M30 185 c0 -45 35 -70 70 -70 s70 25 70 70 Z" fill="%230F766E"/><text x="100" y="82" font-family="Arial" font-size="28" fill="%23FFFFFF" text-anchor="middle" font-weight="bold">KS</text></svg>';

export const MOCK_PATIENT_PROFILES: MockPatientProfile[] = [
  {
    id: 'patient-1',
    name: 'Madhav Pawar',
    age: '58',
    gender: 'Male',
    conditions: 'Hypertension, Type 2 Diabetes',
    lastScreening: '2025-09-15',
    nextDue: '2026-09-15',
    bmi: '26.8',
    bloodPressure: '138/88 mmHg',
    bloodSugar: '142 mg/dL (Fasting)',
    heartRate: '78 bpm',
    photoUri: MOCK_PATIENT_AVATAR_1,
  },
  {
    id: 'patient-2',
    name: 'Priya Desai',
    age: '34',
    gender: 'Female',
    conditions: 'Anemia (Iron Deficiency)',
    lastScreening: '2025-08-20',
    nextDue: '2026-08-20',
    bmi: '22.1',
    bloodPressure: '118/76 mmHg',
    bloodSugar: '95 mg/dL (Fasting)',
    heartRate: '72 bpm',
    photoUri: MOCK_PATIENT_AVATAR_2,
  },
  {
    id: 'patient-3',
    name: 'Ramesh & Sunita Kulkarni',
    age: '62 & 59',
    gender: 'Couple',
    conditions: 'Hypertension, High Cholesterol',
    lastScreening: '2025-07-10',
    nextDue: '2026-07-10',
    bmi: '28.5 & 25.3',
    bloodPressure: '140/90 & 135/85 mmHg',
    bloodSugar: '128 & 110 mg/dL',
    heartRate: '80 & 74 bpm',
    photoUri: MOCK_PATIENT_AVATAR_3,
  },
];
