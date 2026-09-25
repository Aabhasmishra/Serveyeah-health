// API response types matching backend structures

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export interface User {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  blood_group: string | null;
  allergies: string | null;
  chronic_conditions: string | null;
  medications: string | null;
  photo_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  employee_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department: string | null;
  qualification: string | null;
  experience_years: number;
  date_of_joining: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Camp {
  id: string;
  camp_name: string;
  camp_category: string | null;
  camp_date: string;
  camp_location: string;
  organizer_institution_1: string | null;
  organizer_institution_2: string | null;
  association_details: string | null;
  venue_name: string | null;
  venue_address: string | null;
  is_active: boolean;
  max_capacity: number | null;
  registered_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScreeningUser {
  id: string;
  full_name: string;
  phone: string | null;
}

export interface ScreeningCamp {
  id: string;
  camp_name: string;
  camp_date: string;
}

export interface ScreeningWorker {
  id: string;
  full_name: string;
}

export interface Screening {
  id: string;
  user_id: string;
  camp_id: string | null;
  worker_id: string | null;
  village: string | null;
  class_room: string | null;
  roll_no: string | null;
  care_of: string | null;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  blood_pressure: string | null;
  blood_sugar: string | null;
  heart_rate: number | null;
  ecg: string | null;
  echo_heart: string | null;
  advice: string | null;
  photo_url: string | null;
  screening_date: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: ScreeningUser;
  camp?: ScreeningCamp;
  worker?: ScreeningWorker;
}

export interface CreateScreeningData {
  user_id: string;
  camp_id?: string;
  worker_id?: string;
  village?: string;
  class_room?: string;
  roll_no?: string;
  care_of?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  blood_pressure?: string;
  blood_sugar?: string;
  heart_rate?: number;
  ecg?: string;
  echo_heart?: string;
  advice?: string;
  photo_url?: string;
  screening_date?: string;
  notes?: string;
}

export interface UpdateScreeningData {
  camp_id?: string;
  worker_id?: string;
  village?: string;
  class_room?: string;
  roll_no?: string;
  care_of?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  blood_pressure?: string;
  blood_sugar?: string;
  heart_rate?: number;
  ecg?: string;
  echo_heart?: string;
  advice?: string;
  photo_url?: string;
  screening_date?: string;
  notes?: string;
  is_active?: boolean;
}

// Type guards for checking API response success
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true } {
  return response.success === true;
}

export function isApiError(response: ApiResponse<unknown>): response is ApiResponse<unknown> & { success: false; error: { message: string; code: string; details?: unknown } } {
  return response.success === false;
}