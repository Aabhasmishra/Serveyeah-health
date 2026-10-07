// Household survey service - database operations for household_surveys.
//
// This is a port of the supplied Django implementation (surveys/models.py,
// surveys/serializers.py and the create/stats halves of surveys/views.py) onto
// this project's Express + PostgreSQL stack. The validation rules, wording and
// option keys are kept identical so the survey form and the public HTML page
// behave the same against either backend.
//
// THREE DELIBERATE DIFFERENCES FROM THE DJANGO VERSION
// ----------------------------------------------------
// 1. patient_id is assigned by the PostgreSQL trigger created in
//    scripts/migrate-survey-backend.js, not by a counter row locked with
//    SELECT ... FOR UPDATE. The insert therefore omits patient_id entirely and
//    reads the generated PS000001 back with RETURNING. This matches how every
//    other ID here is generated (persons_id_seq, screenings_id_seq, ...).
//
// 2. worker_ref and camp_ref are real foreign keys here rather than free-text
//    VARCHAR(64). They are verified against the workers and camps tables, the
//    same way createScreening verifies camp_id and worker_id, so a typo cannot
//    silently split a per-worker count in two.
//
// 3. All validation problems are reported together instead of one per request.
//    Django raised from the first failure, which meant a worker fixing a typo
//    discovered the next one only after another round trip. The field keys and
//    messages are unchanged - only the number of round trips is.
//
// ERROR SHAPE
// -----------
// Plain `new Error(message)` for the cases the controller matches on text
// (e.g. 'Worker not found'), matching screeningService. Validation failures are
// a single error carrying `code`, `statusCode` and a `details` object keyed by
// the Django field name, so the caller can map them straight back to form fields.
//
// This service owns all SQL. It must stay the only place that touches
// household_surveys.

import { query } from '../db/pool.js';

// ---------------------------------------------------------------------------
// Option sets and limits, ported from surveys/models.py field definitions.
// ---------------------------------------------------------------------------

/** VISIT_CHOICES keys. */
export const SURVEY_VISIT_KEYS = [
  'none',
  'fever',
  'dental',
  'skin',
  'gynaec',
  'fracture',
  'heart',
  'dialysis',
  'other',
];

/** TEST_CHOICES keys. */
export const SURVEY_TEST_KEYS = ['none', 'blood', 'xray', 'ct', 'other'];

/** INSURANCE_CHOICES values. */
export const SURVEY_INSURANCE_TYPES = ['none', 'govt', 'private', 'both'];

const SURVEY_LANGUAGES = ['en', 'hi', 'mr'];
const SURVEY_SOURCES = ['web', 'app'];

/** Model field maximums. */
const MAX_NAME = 120;
const MAX_VILLAGE = 120;
const MAX_OTHER = 200;
/** worker_ref / camp_ref are VARCHAR(10) foreign keys. */
const MAX_REF = 10;
/** PositiveSmallIntegerField(max_value=30) on each of the three counts. */
const MAX_MEMBERS = 30;

/** MOBILE_RE: a 10-digit Indian mobile number. */
const MOBILE_RE = /^[6-9]\d{9}$/;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** Collapse runs of whitespace to single spaces, as Python's " ".join(s.split()). */
function collapseWhitespace(value) {
  return String(value).trim().replace(/\s+/g, ' ');
}

/**
 * Python's str.title(), applied per word: capitalise the first character and
 * lower-case the rest. Villages are normalised this way so "nanose" and
 * "Nanose " group as one village in the stats count. Characters without a case
 * (Devanagari, for instance) pass through untouched.
 */
function titleCase(value) {
  return collapseWhitespace(value)
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

/** Read a count field: a whole number, or 0 when absent. */
function normalizeCount(value, field, errors) {
  if (value === undefined || value === null || value === '') return 0;

  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(parsed)) {
    errors[field] = ['A whole number is required.'];
    return 0;
  }
  if (parsed < 0 || parsed > MAX_MEMBERS) {
    errors[field] = [`Must be between 0 and ${MAX_MEMBERS}.`];
    return 0;
  }
  return parsed;
}

/**
 * Port of serializers._clean_multi, returning the problem instead of raising so
 * that the visits group and the tests group are both reported in one response.
 *
 * Rules, unchanged: the value must be a non-empty list; duplicates are dropped
 * while keeping order; unknown keys are rejected; and 'none' cannot be combined
 * with any other option.
 */
function cleanMulti(value, allowed, field, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors[field] = ['Choose at least one option.'];
    return [];
  }

  const deduped = [...new Set(value)];

  const unknown = deduped.filter((entry) => !allowed.includes(entry)).map((entry) => String(entry));
  if (unknown.length > 0) {
    errors[field] = [`Unknown option(s): ${unknown.join(', ')}`];
    return [];
  }

  if (deduped.includes('none') && deduped.length > 1) {
    errors[field] = ["'none' cannot be combined with other options."];
    return [];
  }

  return deduped;
}

/**
 * The 'Others' free-text box. Required when 'other' is ticked, and cleared
 * otherwise, exactly as serializers.validate did.
 */
function normalizeOtherText(value, keys, otherField, errors) {
  const text = isBlank(value) ? '' : collapseWhitespace(value).slice(0, MAX_OTHER);

  if (keys.includes('other') && !text) {
    errors[otherField] = ["Please describe 'Others'."];
  }

  return keys.includes('other') ? text : '';
}

/** A required free-text field, whitespace-collapsed and length-capped. */
function normalizeRequiredText(value, field, maxLength) {
  if (isBlank(value)) {
    return null;
  }

  const text = collapseWhitespace(value);
  if (text.length > maxLength) {
    return text.slice(0, maxLength);
  }
  return text;
}

/**
 * Whether this submission came from the hidden anti-bot field. The public HTML
 * form sends `website`; the native app form does not, so this is normally
 * false. Exported so the controller can short-circuit with the same
 * 201 { ok: true, patient_id: '' } the Django view returned, without consuming
 * a patient ID.
 */
export function isHoneypotSubmission(data) {
  const website = data && data.website;
  if (isBlank(website)) return false;
  return String(website).length > 0;
}

// ---------------------------------------------------------------------------
// Validation and normalisation
// ---------------------------------------------------------------------------

/**
 * Validate and normalise a survey submission.
 *
 * @throws {Error} with `code = 'VALIDATION_ERROR'`, `statusCode = 400` and a
 *   `details` object keyed by the Django field name.
 * @returns {object} the row values ready for INSERT.
 */
export function normalizeAndValidateSurvey(data) {
  const input = data && typeof data === 'object' ? data : {};
  const errors = {};

  // --- Field-level checks. All of them run so one response lists them all. ---

  const respondentName = normalizeRequiredText(input.respondent_name, 'respondent_name', MAX_NAME);
  if (respondentName === null) {
    errors.respondent_name = ['Required.'];
  }

  const villageRaw = normalizeRequiredText(input.village, 'village', MAX_VILLAGE);
  if (villageRaw === null) {
    errors.village = ['Required.'];
  }

  const mobile = isBlank(input.mobile) ? '' : String(input.mobile).trim();
  if (!mobile) {
    errors.mobile = ['This field is required.'];
  } else if (!MOBILE_RE.test(mobile)) {
    errors.mobile = ['Enter a valid 10-digit Indian mobile number.'];
  }

  const males = normalizeCount(input.males, 'males', errors);
  const females = normalizeCount(input.females, 'females', errors);
  const children = normalizeCount(input.children_under_12, 'children_under_12', errors);

  const insurance = isBlank(input.insurance) ? '' : String(input.insurance).trim();
  if (!insurance) {
    errors.insurance = ['This field is required.'];
  } else if (!SURVEY_INSURANCE_TYPES.includes(insurance)) {
    errors.insurance = [`Must be one of: ${SURVEY_INSURANCE_TYPES.join(', ')}.`];
  }

  // BooleanField(required=True): present and true, not merely truthy.
  const consent =
    input.consent === true || input.consent === 'true' || input.consent === 1 || input.consent === '1';
  if (!consent) {
    errors.consent = ['Consent is required.'];
  }

  // validate_language coerced rather than rejected: anything unknown becomes 'en'.
  const languageRaw = isBlank(input.language) ? '' : String(input.language).trim();
  const language = SURVEY_LANGUAGES.includes(languageRaw) ? languageRaw : 'en';

  const sourceRaw = isBlank(input.source) ? '' : String(input.source).trim();
  if (sourceRaw && !SURVEY_SOURCES.includes(sourceRaw)) {
    errors.source = [`Must be one of: ${SURVEY_SOURCES.join(', ')}.`];
  }
  const source = sourceRaw || 'web';

  // --- Object-level checks, in the order serializers.validate ran them. ---

  if (males + females + children === 0) {
    errors.non_field_errors = ['Add at least one family member.'];
  }

  const doctorVisits = cleanMulti(input.doctor_visits, SURVEY_VISIT_KEYS, 'doctor_visits', errors);
  const doctorVisitOther = normalizeOtherText(
    input.doctor_visit_other,
    doctorVisits,
    'doctor_visit_other',
    errors
  );

  const pathologyTests = cleanMulti(input.pathology_tests, SURVEY_TEST_KEYS, 'pathology_tests', errors);
  const pathologyOther = normalizeOtherText(
    input.pathology_other,
    pathologyTests,
    'pathology_other',
    errors
  );

  // --- References. Length-capped here, existence checked against the DB. ---

  const workerRef = isBlank(input.worker_ref) ? null : String(input.worker_ref).trim().slice(0, MAX_REF);
  const campRef = isBlank(input.camp_ref) ? null : String(input.camp_ref).trim().slice(0, MAX_REF);

  if (Object.keys(errors).length > 0) {
    const error = new Error('Survey validation failed');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    error.details = errors;
    throw error;
  }

  return {
    respondent_name: respondentName,
    village: titleCase(villageRaw),
    mobile,
    males,
    females,
    children_under_12: children,
    insurance,
    doctor_visits: doctorVisits,
    doctor_visit_other: doctorVisitOther,
    pathology_tests: pathologyTests,
    pathology_other: pathologyOther,
    consent,
    language,
    source,
    worker_ref: workerRef,
    camp_ref: campRef,
  };
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

async function verifyWorkerExists(workerId) {
  const result = await query('SELECT id FROM workers WHERE id = $1', [workerId]);
  return result.rows.length > 0;
}

async function verifyCampExists(campId) {
  const result = await query('SELECT id FROM camps WHERE id = $1', [campId]);
  return result.rows.length > 0;
}

/** Shape a row for the API, adding the computed total the serializer exposed. */
function presentSurvey(row) {
  return {
    ...row,
    total_members: Number(row.males) + Number(row.females) + Number(row.children_under_12),
  };
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Store one household survey.
 *
 * patient_id is left out of the INSERT on purpose: the BEFORE INSERT trigger
 * assigns PS000001, PS000002, ... and RETURNING gives it straight back, so the
 * generated ID is always the one that was actually stored.
 */
export async function createHouseholdSurvey(data) {
  const row = normalizeAndValidateSurvey(data);

  if (row.camp_ref && !(await verifyCampExists(row.camp_ref))) {
    throw new Error('Camp not found');
  }

  if (row.worker_ref && !(await verifyWorkerExists(row.worker_ref))) {
    throw new Error('Worker not found');
  }

  const result = await query(
    `
      INSERT INTO household_surveys (
        respondent_name, village, mobile,
        males, females, children_under_12,
        insurance, doctor_visits, doctor_visit_other,
        pathology_tests, pathology_other,
        consent, language, source,
        worker_ref, camp_ref
      )
      VALUES (
        $1, $2, $3,
        $4, $5, $6,
        $7, $8::jsonb, $9,
        $10::jsonb, $11,
        $12, $13, $14,
        $15, $16
      )
      RETURNING *
    `,
    [
      row.respondent_name,
      row.village,
      row.mobile,
      row.males,
      row.females,
      row.children_under_12,
      row.insurance,
      JSON.stringify(row.doctor_visits),
      row.doctor_visit_other,
      JSON.stringify(row.pathology_tests),
      row.pathology_other,
      row.consent,
      row.language,
      row.source,
      row.worker_ref,
      row.camp_ref,
    ]
  );

  return presentSurvey(result.rows[0]);
}

/**
 * Aggregate counts for the app: how many responses, how many in the last 7 days,
 * and how many distinct villages. Counts only, so it carries no PII.
 *
 * All three come from one query so `total` and `last_7_days` can never disagree,
 * and `villages` is a count of distinct village names rather than a list, which
 * is what the survey screens display.
 *
 * @param {object}  [filters]
 * @param {string}  [filters.worker] worker id, e.g. W0001
 * @param {string}  [filters.camp]   camp id, e.g. C0001
 */
export async function getHouseholdSurveyStats(filters = {}) {
  const params = [];
  const clauses = [];

  if (!isBlank(filters.worker)) {
    params.push(String(filters.worker).trim());
    clauses.push(`worker_ref = $${params.length}`);
  }

  if (!isBlank(filters.camp)) {
    params.push(String(filters.camp).trim());
    clauses.push(`camp_ref = $${params.length}`);
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  const result = await query(
    `
      SELECT
        count(*)::int AS total,
        count(*) FILTER (
          WHERE submitted_at >= NOW() - INTERVAL '7 days'
        )::int AS last_7_days,
        count(DISTINCT village)::int AS villages
      FROM household_surveys
      ${whereSql}
    `,
    params
  );

  const row = result.rows[0] || {};
  return {
    total: Number(row.total || 0),
    last_7_days: Number(row.last_7_days || 0),
    villages: Number(row.villages || 0),
  };
}
