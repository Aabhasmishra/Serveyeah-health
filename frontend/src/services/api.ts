// API Service - Frontend connection to ServeYeah Health Backend
import { StudentScreeningEntry, InsuranceType } from '../types/student';
import { formatDateDdMmYyyy, formatTimestampWithTimeDdMmYyyy } from '../utils/dateFormat';
import { calculateAgeFromDob } from '../utils/dateOfBirth';
import {
  formatInvestigationIds,
  parseInvestigationIds,
} from '../constants/recommendedInvestigations';
import {
  ApiResponse,
  User,
  Worker,
  Camp,
  Screening,
  CreateScreeningData,
  UpdateScreeningData,
  PersonLookupResult,
  isApiSuccess,
} from '../types/api';

// ============================================
// Configuration
// ============================================

const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL;
const IS_DEV = __DEV__;

// Validate and resolve API base URL
function resolveApiBaseUrl(): string {
  if (!RAW_API_URL) {
    if (IS_DEV) {
      // Development fallback - only in dev mode
      return 'http://localhost:3000/api';
    }
    // Production: MUST have EXPO_PUBLIC_API_URL set
    throw new Error(
      'EXPO_PUBLIC_API_URL is not set. Configure it in eas.json or .env. ' +
      'Production builds must not fall back to localhost.'
    );
  }

  const url = RAW_API_URL.trim();
  
  // Block localhost/private IPs in production
  if (!IS_DEV) {
    const lower = url.toLowerCase();
    const blockedPatterns = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '192.168.',
      '10.',
      '172.16.',
      '172.17.',
      '172.18.',
      '172.19.',
      '172.20.',
      '172.21.',
      '172.22.',
      '172.23.',
      '172.24.',
      '172.25.',
      '172.26.',
      '172.27.',
      '172.28.',
      '172.29.',
      '172.30.',
      '172.31.',
      '.local',
    ];
    
    for (const pattern of blockedPatterns) {
      if (lower.includes(pattern)) {
        throw new Error(
          `Production API URL blocked: "${url}" contains "${pattern}". ` +
          'Production builds must use a public HTTPS URL. ' +
          'Set EXPO_PUBLIC_API_URL to your production backend URL.'
        );
      }
    }
    
    // Enforce HTTPS in production
    if (!url.startsWith('https://')) {
      throw new Error(
        `Production API URL must use HTTPS: "${url}". ` +
        'Set EXPO_PUBLIC_API_URL to a valid HTTPS URL.'
      );
    }
  }

  // Ensure no trailing slash
  return url.replace(/\/$/, '');
}

const API_BASE_URL = resolveApiBaseUrl();

// Development test IDs (replace with authentication later)
const DEV_USER_ID = process.env.EXPO_PUBLIC_DEV_USER_ID || 'U0018';
const DEV_WORKER_ID = process.env.EXPO_PUBLIC_DEV_WORKER_ID || 'W0001';
const DEV_CAMP_ID = process.env.EXPO_PUBLIC_DEV_CAMP_ID || 'C0001';

// ============================================
// Request Helper with Logging
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

  const method = fetchOptions.method || 'GET';
  const fullUrl = url.toString();
  const startTime = Date.now();

  // Development: log outgoing request
  if (IS_DEV) {
    console.log(`[API] ${method} ${fullUrl}`);
  }

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      headers: defaultHeaders,
    });

    const duration = Date.now() - startTime;
    const data = await response.json();

    // Development: log response
    if (IS_DEV) {
      console.log(`[API] ${method} ${fullUrl} → ${response.status} (${duration}ms)`);
    }

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
    const duration = Date.now() - startTime;
    
    // Development: log error
    if (IS_DEV) {
      console.log(`[API] ${method} ${fullUrl} → ERROR (${duration}ms):`, error);
    }

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

  // Existing Patient: find an existing person by mobile number.
  // Read-only — the backend never creates a person here.
  getPersonByMobile: (mobileNumber: string) =>
    get<PersonLookupResult>(`/screenings/person/mobile/${encodeURIComponent(mobileNumber)}`),

  getByPerson: (personId: string, params?: { limit?: number; offset?: number; is_active?: boolean; from_date?: string; to_date?: string }) =>
    get<Screening[]>(`/screenings/person/${encodeURIComponent(personId)}`, params),

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
// Household Surveys API
// ============================================
//
// Backend mount (mainServer.js): app.use('/api/surveys/household', surveyRoutes)
// so the actual paths, given that API_BASE_URL already ends in `/api`, are:
//   POST /surveys/household/        → /api/surveys/household/
//   GET  /surveys/household/stats/  → /api/surveys/household/stats/
//
// Field names, enum values and option keys mirror
// backend/src/services/surveyService.js (normalizeAndValidateSurvey) — that file
// is the source of truth for what the endpoint accepts.

/** Insurance choices, matching surveys/models.py INSURANCE_CHOICES. */
export type HouseholdSurveyInsurance = 'none' | 'govt' | 'private' | 'both';

/** doctor_visits keys, matching SURVEY_VISIT_KEYS on the backend. */
export type HouseholdSurveyVisitKey =
  | 'none'
  | 'fever'
  | 'dental'
  | 'skin'
  | 'gynaec'
  | 'fracture'
  | 'heart'
  | 'dialysis'
  | 'other';

/** pathology_tests keys, matching SURVEY_TEST_KEYS on the backend. */
export type HouseholdSurveyTestKey = 'none' | 'blood' | 'xray' | 'ct' | 'other';

/** Supported UI languages. The backend coerces unknown values to 'en'. */
export type HouseholdSurveyLanguage = 'en' | 'hi' | 'mr';

/** Submission source. The native app always sends 'app'. */
export type HouseholdSurveySource = 'web' | 'app';

/**
 * Request body for POST /api/surveys/household/.
 *
 * `worker_ref` and `camp_ref` are optional VARCHAR(10) foreign keys: the backend
 * verifies them against the workers / camps tables only when present. Leaving
 * them out (or sending '') is accepted.
 */
export type HouseholdSurveyPayload = {
  respondent_name: string;
  village: string;
  mobile: string;
  males: number;
  females: number;
  children_under_12: number;
  insurance: HouseholdSurveyInsurance;
  doctor_visits: HouseholdSurveyVisitKey[];
  doctor_visit_other: string;
  pathology_tests: HouseholdSurveyTestKey[];
  pathology_other: string;
  consent: boolean;
  language: HouseholdSurveyLanguage;
  source: HouseholdSurveySource;
  worker_ref?: string;
  camp_ref?: string;
};

/**
 * Row shape returned by the survey API. This mirrors the columns selected from
 * household_surveys plus the computed `total_members` added by presentSurvey().
 * `patient_id` is generated by the PostgreSQL BEFORE INSERT trigger.
 * `worker_ref` / `camp_ref` come back as null when the submission did not carry
 * them.
 */
export type HouseholdSurveyRecord = {
  patient_id: string;
  respondent_name: string;
  village: string;
  mobile: string;
  males: number;
  females: number;
  children_under_12: number;
  insurance: HouseholdSurveyInsurance;
  doctor_visits: HouseholdSurveyVisitKey[];
  doctor_visit_other: string;
  pathology_tests: HouseholdSurveyTestKey[];
  pathology_other: string;
  consent: boolean;
  language: HouseholdSurveyLanguage;
  source: HouseholdSurveySource;
  worker_ref: string | null;
  camp_ref: string | null;
  submitted_at: string;
  total_members: number;
};

/** Response of GET /api/surveys/household/stats/ — aggregate counts only. */
export type HouseholdSurveyStats = {
  total: number;
  last_7_days: number;
  villages: number;
};

export const surveysApi = {
  /**
   * POST /api/surveys/household/
   * Store one household survey. Returns the created row (including the
   * generated patient_id) on success. On failure the standard
   * `{ success: false, error: { message, code, details } }` shape is returned
   * by the shared request helper — `VALIDATION_ERROR` carries a `details`
   * object keyed by the backend field names.
   */
  createHousehold: (data: HouseholdSurveyPayload) =>
    post<HouseholdSurveyRecord>('/surveys/household/', data),

  /**
   * GET /api/surveys/household/stats/?worker=W0001&camp=C0001
   * Aggregate counts only (total, last_7_days, villages). Carries no PII.
   * An unknown worker or camp id is not an error: it simply matches no rows
   * and reports zeros.
   */
  getHouseholdStats: (params?: { worker?: string; camp?: string }) =>
    get<HouseholdSurveyStats>('/surveys/household/stats/', params),
};

// ============================================
// Utility Functions
// ============================================

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

/**
 * Date formatting helper for backend DATE fields.
 *
 * Every date the app shows is DD-MM-YYYY (e.g. 10-12-2026), so this delegates
 * to the one central formatter rather than building a locale string. The
 * `options` parameter is accepted for backwards compatibility but intentionally
 * ignored: allowing a caller to opt out of DD-MM-YYYY is how screens drift
 * apart. Use formatTimestampWithTimeDdMmYyyy when the time is also wanted.
 */
export function formatBackendDate(dateString: string | null | undefined): string {
  return formatDateDdMmYyyy(dateString);
}

/**
 * Format a full timestamp (created_at / updated_at) as DD-MM-YYYY in local
 * time. Retained for the record-metadata rows in Screening Details.
 */
export function formatBackendTimestamp(dateString: string | null | undefined): string {
  return formatTimestampWithTimeDdMmYyyy(dateString);
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

// Age is computed in one place only. A second implementation drifted between UTC
// and local calendar parts, which made two screens disagree about the same
// person's age. `calculateAgeFromDob` returns a number or null, so it is
// normalised to the string shape the screens expect here.
export function computeAgeFromDob(dob: string | null | undefined): string {
  const age = calculateAgeFromDob(dob);
  return age === null ? '' : String(age);
}

// Convert backend Screening -> frontend StudentScreeningEntry for existing preview mechanism
export function mapScreeningToEntry(screening: Screening): StudentScreeningEntry {
  return {
    id: screening.id,
    createdAt: screening.created_at,
    name: screening.person_name || screening.person?.name || '',
    mobileNumber: screening.mobile_number ?? undefined,
    village: screening.camp?.camp_name ?? screening.village ?? '',
    age: screening.age_years != null ? String(screening.age_years) : '',
    weight: screening.weight != null ? String(screening.weight) : '',
    height: screening.height != null ? String(screening.height) : '',
    classRoom: screening.class_room ?? '',
    rollNo: screening.roll_no ?? '',
    careOf: screening.care_of ?? '',
    isStudent: screening.is_student ?? false,
    // These must stay in step with localEntryToScreening in ScreeningDetailsScreen.
    // When they were missing here, every API-backed record printed and previewed
    // with a blank date of birth and "No" insurance while Screening Details showed
    // the real values.
    dateOfBirth: screening.date_of_birth ?? undefined,
    hasHealthInsurance: screening.has_health_insurance ?? false,
    insuranceType: screening.insurance_type ?? '',
    recommendedInvestigations: screening.recommended_investigations ?? undefined,
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
  mobileNumber?: string;
  village: string;
  dateOfBirth?: string;
  age: string;
  weight: string;
  height: string;
  classRoom: string;
  rollNo: string;
  careOf: string;
  isStudent?: boolean;
  hasHealthInsurance?: boolean;
  insuranceType?: InsuranceType | '';
  ecg: string;
  echoHeart: string;
  advice: string;
  recommendedInvestigations?: string;
}): Omit<CreateScreeningData, 'person_name'> {
  const weightNum = extractNumericValue(formData.weight);
  const heightNum = extractNumericValue(formData.height);
  const ageNum = extractNumericValue(formData.age);
  const isStudent = !!formData.isStudent;
  const insuranceType: InsuranceType | '' = isStudent ? '' : formData.insuranceType ?? '';

  // Calculate BMI if both height and weight are available
  let bmi: number | undefined;
  if (weightNum !== null && heightNum !== null && heightNum > 0) {
    const heightInMeters = heightNum / 100;
    bmi = Math.round((weightNum / (heightInMeters * heightInMeters)) * 100) / 100;
  }

  return {
    // Age is always derived from the date of birth; age_years is only sent as a
    // fallback for legacy records that have no date of birth on file.
    date_of_birth: formData.dateOfBirth?.trim() || undefined,
    age_years: formData.dateOfBirth?.trim() ? undefined : (ageNum ?? undefined),
    mobile_number: formData.mobileNumber?.trim() || '',
    is_student: isStudent,
    // Govt / Private store their type; None stores no coverage at all, sent as
    // an explicit null so the request carries the choice rather than omitting it.
    has_health_insurance: !isStudent && !!insuranceType,
    insurance_type: !isStudent && insuranceType ? insuranceType : null,
    village: formData.village || undefined,
    // Class and Roll No. only apply to students
    class_room: isStudent ? formData.classRoom || undefined : undefined,
    roll_no: isStudent ? formData.rollNo || undefined : undefined,
    care_of: formData.careOf || undefined,
    height: heightNum ?? undefined,
    weight: weightNum ?? undefined,
    bmi,
    ecg: formData.ecg || undefined,
    echo_heart: formData.echoHeart || undefined,
    advice: formData.advice || undefined,
    recommended_investigations: formatInvestigationIds(
      parseInvestigationIds(formData.recommendedInvestigations)
    ),
    screening_date: formatDateForApi(new Date()),
  };
}
