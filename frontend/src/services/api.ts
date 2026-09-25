// API Service - Frontend connection to ServeYeah Health Backend
import { StudentScreeningEntry } from '../types/student';
import {
  ApiResponse,
  User,
  Worker,
  Camp,
  Screening,
  CreateScreeningData,
  UpdateScreeningData,
  isApiSuccess,
} from '../types/api';

// ============================================
// Configuration
// ============================================

const DEFAULT_API_URL = 'http://localhost:3000/api';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

// Development test IDs (replace with authentication later)
const DEV_USER_ID = process.env.EXPO_PUBLIC_DEV_USER_ID || 'U0018';
const DEV_WORKER_ID = process.env.EXPO_PUBLIC_DEV_WORKER_ID || 'W0001';
const DEV_CAMP_ID = process.env.EXPO_PUBLIC_DEV_CAMP_ID || 'C0001';

// ============================================
// Request Helper
// ============================================

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { params, headers, ...fetchOptions } = options;

  // Build URL with query parameters
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  try {
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers: defaultHeaders,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle backend error format
      const errorMessage = data?.error?.message || data?.message || `HTTP ${response.status}: ${response.statusText}`;
      const errorCode = data?.error?.code || 'REQUEST_FAILED';
      return {
        success: false,
        data: null as unknown as T,
        error: {
          message: errorMessage,
          code: errorCode,
          details: data?.error?.details,
        },
      };
    }

    // Ensure consistent response structure
    if (data && typeof data === 'object' && 'success' in data) {
      return data as ApiResponse<T>;
    }

    // Backend might return raw data in some cases
    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('NetworkError')) {
      return {
        success: false,
        data: null as unknown as T,
        error: {
          message: 'Network error. Please check your connection and ensure the backend server is running.',
          code: 'NETWORK_ERROR',
        },
      };
    }
    return {
      success: false,
      data: null as unknown as T,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

// GET helper
function get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
  return request<T>(endpoint, { method: 'GET', params });
}

// POST helper
function post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// PATCH helper
function patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  return request<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// ============================================
// Users API
// ============================================

export const usersApi = {
  create: (data: Partial<User> & { password: string }) => post<User>('/users', data),

  getById: (id: string) => get<User>(`/users/${id}`),

  getAll: (params?: { limit?: number; offset?: number; activeOnly?: boolean }) =>
    get<User[]>('/users', params),

  update: (id: string, data: Partial<User>) => patch<User>(`/users/${id}`, data),

  deactivate: (id: string) => patch<User>(`/users/${id}/deactivate`, {}),

  // Development helper
  getDevUser: () => get<User>(`/users/${DEV_USER_ID}`),
};

// ============================================
// Workers API
// ============================================

export const workersApi = {
  create: (data: Partial<Worker> & { employee_id: string; full_name: string; password: string }) =>
    post<Worker>('/workers', data),

  getById: (id: string) => get<Worker>(`/workers/${id}`),

  getAll: (params?: { limit?: number; offset?: number; activeOnly?: boolean }) =>
    get<Worker[]>('/workers', params),

  update: (id: string, data: Partial<Worker>) => patch<Worker>(`/workers/${id}`, data),

  deactivate: (id: string) => patch<Worker>(`/workers/${id}/deactivate`, {}),

  // Development helper
  getDevWorker: () => get<Worker>(`/workers/${DEV_WORKER_ID}`),
};

// ============================================
// Camps API
// ============================================

export const campsApi = {
  create: (data: Partial<Camp>) => post<Camp>('/camps', data),

  getById: (id: string) => get<Camp>(`/camps/${id}`),

  getAll: (params?: { limit?: number; offset?: number; activeOnly?: boolean }) =>
    get<Camp[]>('/camps', params),

  update: (id: string, data: Partial<Camp>) => patch<Camp>(`/camps/${id}`, data),

  deactivate: (id: string) => patch<Camp>(`/camps/${id}/deactivate`, {}),

  // Development helper
  getDevCamp: () => get<Camp>(`/camps/${DEV_CAMP_ID}`),
};

// ============================================
// Screenings API
// ============================================

export const screeningsApi = {
  create: (data: CreateScreeningData) => post<Screening>('/screenings', data),

  getById: (id: string) => get<Screening>(`/screenings/${id}`),

  getAll: (params?: {
    user_id?: string;
    camp_id?: string;
    worker_id?: string;
    is_active?: boolean;
    from_date?: string;
    to_date?: string;
    limit?: number;
    offset?: number;
  }) => get<Screening[]>('/screenings', params),

  getByUser: (userId: string, params?: { limit?: number; offset?: number; is_active?: boolean; from_date?: string; to_date?: string }) =>
    get<Screening[]>(`/screenings/user/${userId}`, params),

  getByCamp: (campId: string, params?: { limit?: number; offset?: number; is_active?: boolean; from_date?: string; to_date?: string }) =>
    get<Screening[]>(`/screenings/camp/${campId}`, params),

  getByWorker: (workerId: string, params?: { limit?: number; offset?: number; is_active?: boolean; from_date?: string; to_date?: string }) =>
    get<Screening[]>(`/screenings/worker/${workerId}`, params),

  update: (id: string, data: UpdateScreeningData) => patch<Screening>(`/screenings/${id}`, data),

  deactivate: (id: string) => patch<Screening>(`/screenings/${id}/deactivate`, {}),

  // Development helpers
  getDevUserScreenings: (params?: { limit?: number; offset?: number }) =>
    get<Screening[]>(`/screenings/user/${DEV_USER_ID}`, params),

  getDevWorkerScreenings: (params?: { limit?: number; offset?: number }) =>
    get<Screening[]>(`/screenings/worker/${DEV_WORKER_ID}`, params),

  getDevCampScreenings: (params?: { limit?: number; offset?: number }) =>
    get<Screening[]>(`/screenings/camp/${DEV_CAMP_ID}`, params),

  createDevScreening: (data: Omit<CreateScreeningData, 'user_id' | 'camp_id' | 'worker_id'>) =>
    post<Screening>('/screenings', {
      ...data,
      user_id: DEV_USER_ID,
      camp_id: DEV_CAMP_ID,
      worker_id: DEV_WORKER_ID,
    }),
};

// ============================================
// Utility Functions
// ============================================

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getDevUserId(): string {
  return DEV_USER_ID;
}

export function getDevWorkerId(): string {
  return DEV_WORKER_ID;
}

export function getDevCampId(): string {
  return DEV_CAMP_ID;
}

// Helper to extract data from successful API response
export function unwrapApiResponse<T>(response: ApiResponse<T>): T | null {
  if (isApiSuccess(response)) {
    return response.data;
  }
  return null;
}

// Helper to get error message from failed API response
export function getApiErrorMessage(response: ApiResponse<unknown>): string {
  return response.error?.message || 'An unknown error occurred';
}

// Date formatting helper for backend DATE fields
// Backend returns DATE as "YYYY-MM-DD" but may serialize as "YYYY-MM-DDTHH:mm:ss.sssZ"
// This helper extracts the date part correctly without timezone shifting
export function formatBackendDate(dateString: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return '—';

  // Parse as local date to avoid timezone shift
  // If the string contains 'T', it's an ISO datetime - extract date part
  const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;

  try {
    const [year, month, day] = datePart.split('-').map(Number);
    if (year && month && day) {
      const date = new Date(year, month - 1, day); // month is 0-indexed
      return date.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        ...options,
      });
    }
  } catch {
    // Fall through to fallback
  }

  // Fallback: try parsing directly
  try {
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch {
    return dateString;
  }
}

// Format date for API requests (YYYY-MM-DD)
export function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Extract numeric value from strings like "38 kg" or "142 cm"
export function extractNumericValue(value: string): number | null {
  const match = value.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

// Compute age from a backend DATE/ISO string without timezone drift
export function computeAgeFromDob(dob: string | null | undefined): string {
  if (!dob) return '';
  const datePart = dob.includes('T') ? dob.split('T')[0] : dob;
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return '';
  const today = new Date();
  let age = today.getFullYear() - y;
  const md = today.getMonth() + 1 - m;
  if (md < 0 || (md === 0 && today.getDate() < d)) age--;
  return age >= 0 ? String(age) : '';
}

// Convert backend Screening -> frontend StudentScreeningEntry for existing preview mechanism
export function mapScreeningToEntry(screening: Screening): StudentScreeningEntry {
  return {
    id: screening.id,
    createdAt: screening.created_at,
    name: screening.user?.full_name ?? '',
    village: screening.camp?.camp_name ?? screening.village ?? '',
    age: '',
    weight: screening.weight != null ? String(screening.weight) : '',
    height: screening.height != null ? String(screening.height) : '',
    classRoom: screening.class_room ?? '',
    rollNo: screening.roll_no ?? '',
    careOf: screening.care_of ?? '',
    photoUri: screening.photo_url ?? undefined,
    ecg: screening.ecg ?? '',
    echoHeart: screening.echo_heart ?? '',
    advice: screening.advice ?? '',
  };
}

// Normalize a backend DATE field to "YYYY-MM-DD" for input fields
export function toDateInput(dob: string | null | undefined): string {
  if (!dob) return '';
  return dob.includes('T') ? dob.split('T')[0] : dob;
}

// Convert frontend StudentScreeningEntry to backend CreateScreeningData
export function mapFormDataToScreening(formData: {
  name: string;
  village: string;
  age: string;
  weight: string;
  height: string;
  classRoom: string;
  rollNo: string;
  careOf: string;
  ecg: string;
  echoHeart: string;
  advice: string;
}): Omit<CreateScreeningData, 'user_id' | 'camp_id' | 'worker_id'> {
  const weightNum = extractNumericValue(formData.weight);
  const heightNum = extractNumericValue(formData.height);

  // Calculate BMI if both height and weight are available
  let bmi: number | undefined;
  if (weightNum !== null && heightNum !== null && heightNum > 0) {
    const heightInMeters = heightNum / 100;
    bmi = Math.round((weightNum / (heightInMeters * heightInMeters)) * 100) / 100;
  }

  return {
    village: formData.village || undefined,
    class_room: formData.classRoom || undefined,
    roll_no: formData.rollNo || undefined,
    care_of: formData.careOf || undefined,
    height: heightNum ?? undefined,
    weight: weightNum ?? undefined,
    bmi,
    ecg: formData.ecg || undefined,
    echo_heart: formData.echoHeart || undefined,
    advice: formData.advice || undefined,
    screening_date: formatDateForApi(new Date()),
  };
}