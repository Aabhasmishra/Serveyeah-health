import { StudentScreeningEntry } from '../types/student';

// Default mock photos encoded as SVG Data URIs for offline independence and immediate demo rendering
const MOCK_AVATAR_1 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23E0F2FE"/><circle cx="100" cy="75" r="45" fill="%230284C7"/><path d="M30 185 c0 -45 35 -70 70 -70 s70 25 70 70 Z" fill="%230284C7"/><text x="100" y="82" font-family="Arial" font-size="28" fill="%23FFFFFF" text-anchor="middle" font-weight="bold">ASP</text></svg>';

const MOCK_AVATAR_2 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23CCFBF1"/><circle cx="100" cy="75" r="45" fill="%230F766E"/><path d="M30 185 c0 -45 35 -70 70 -70 s70 25 70 70 Z" fill="%230F766E"/><text x="100" y="82" font-family="Arial" font-size="28" fill="%23FFFFFF" text-anchor="middle" font-weight="bold">SDS</text></svg>';

export const INITIAL_STUDENT_ENTRIES: StudentScreeningEntry[] = [
  {
    id: 'demo-entry-1',
    createdAt: '2026-10-08T09:30:00.000Z',
    name: 'Aarav Sachin Patil',
    village: 'Nanose',
    age: '12',
    weight: '38 kg',
    height: '142 cm',
    classRoom: '7th A',
    rollNo: '18',
    careOf: 'Sachin Patil (Father)',
    photoUri: MOCK_AVATAR_1,
    ecg: 'Within Normal Limits',
    echoHeart: 'Normal cardiac anatomy & function. No shunt / VSD.',
    advice: 'Good health. Maintain regular physical activities and balanced nutrition. Routine pediatric follow-up in 1 year.',
  },
  {
    id: 'demo-entry-2',
    createdAt: '2026-10-08T10:15:00.000Z',
    name: 'Sanvi Deepak Shinde',
    village: 'Parali',
    age: '10',
    weight: '29 kg',
    height: '131 cm',
    classRoom: '5th B',
    rollNo: '09',
    careOf: 'Deepak Shinde (Father)',
    photoUri: MOCK_AVATAR_2,
    ecg: 'Normal Sinus Rhythm',
    echoHeart: 'Normal study. Structurally normal heart, good LV systolic function.',
    advice: 'Advised iron-rich dietary intake. Re-evaluate annually.',
  },
];
