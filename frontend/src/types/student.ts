export interface StudentScreeningEntry {
  id: string;
  createdAt: string;

  // Student Information
  name: string;
  village: string;
  age: string;
  weight: string;
  height: string;
  classRoom: string;
  rollNo: string;
  careOf: string;

  // Student Photograph
  photoUri?: string;
  photoBase64?: string;

  // Health Evaluation
  ecg: string;
  echoHeart: string;
  advice: string;
}

export interface StudentFormErrors {
  name?: string;
  age?: string;
  classRoom?: string;
  rollNo?: string;
}

export type UserRole = 'worker' | 'patient' | null;

export interface PatientProfile {
  id: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  chronicConditions: string[];
  lastScreening?: string;
  nextDue?: string;
  photoUri?: string;
}

export interface MockPatientProfile {
  id: string;
  name: string;
  age: string;
  gender: string;
  conditions: string;
  lastScreening: string;
  nextDue: string;
  bmi: string;
  bloodPressure: string;
  bloodSugar: string;
  heartRate: string;
  photoUri?: string;
}

export type ScreenName =
  | 'dashboard'
  | 'history'
  | 'camp'
  | 'form'
  | 'preview'
  | 'patientHome'
  | 'userRecords'
  | 'userProfile'
  | 'roleSelection'
  | 'more';

export type TabName =
  | 'home'
  | 'history'
  | 'camp'
  | 'records'
  | 'profile'
  | 'more';
