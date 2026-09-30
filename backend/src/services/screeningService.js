// Screening service - database operations for shree_raj_health_screenings
import { query } from '../db/pool.js';

function calculateBMI(height, weight) {
  if (height && weight) {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return Math.round(bmi * 100) / 100;
  }
  return null;
}

function sanitizeScreening(screening) {
  return screening;
}

function normalizeAge(age) {
  if (age === undefined || age === null || age === '') return null;
  const parsed = parseInt(age, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// Recommended investigations are stored as a single comma-separated string of
// catalogue IDs, e.g. "4,19,22,46,48". Normalise to a de-duplicated, ascending,
// numeric-ID list so the stored value is canonical and safe to compare.
// Accepts a string or an array of IDs/numeric strings.
//
// The catalogue is a fixed list of 52 investigations, mirrored by
// frontend/src/constants/recommendedInvestigations.ts. IDs outside that range are
// dropped so the field can never accumulate junk or future-unknown values.
const MIN_INVESTIGATION_ID = 1;
const MAX_INVESTIGATION_ID = 52;

function normalizeRecommendedInvestigations(value) {
  if (value === undefined || value === null || value === '') return null;

  const parts = Array.isArray(value) ? value : String(value).split(',');

  const ids = new Set();
  for (const part of parts) {
    const trimmed = String(part).trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) continue;
    const parsed = parseInt(trimmed, 10);
    if (
      Number.isFinite(parsed) &&
      parsed >= MIN_INVESTIGATION_ID &&
      parsed <= MAX_INVESTIGATION_ID
    ) {
      ids.add(parsed);
    }
  }

  if (ids.size === 0) return null;
  return [...ids].sort((a, b) => a - b).join(',');
}

async function verifyCampExists(campId) {
  const result = await query('SELECT id FROM camps WHERE id = $1', [campId]);
  return result.rows.length > 0;
}

async function verifyWorkerExists(workerId) {
  const result = await query('SELECT id FROM workers WHERE id = $1', [workerId]);
  return result.rows.length > 0;
}

export async function createScreening(data) {
  const {
    person_id,
    person_name,
    age_years,
    mobile_number,
    is_student,
    user_id,
    camp_id,
    worker_id,
    village,
    class_room,
    roll_no,
    care_of,
    height,
    weight,
    bmi,
    blood_pressure,
    blood_sugar,
    heart_rate,
    ecg,
    echo_heart,
    advice,
    recommended_investigations,
    photo_url,
    screening_date,
    notes,
  } = data;

  // The person's name is stored directly on the screening record.
  // person_id is optional; when omitted the DB trigger generates a new P-prefixed id.
  if (!person_name || !String(person_name).trim()) {
    throw new Error('person_name is required');
  }

  // Verify camp exists if provided
  if (camp_id && !(await verifyCampExists(camp_id))) {
    throw new Error('Camp not found');
  }

  // Verify worker exists if provided
  if (worker_id && !(await verifyWorkerExists(worker_id))) {
    throw new Error('Worker not found');
  }

  // Calculate BMI if height and weight provided but BMI not provided
  let calculatedBmi = bmi;
  if (!calculatedBmi && height && weight) {
    calculatedBmi = calculateBMI(height, weight);
  }

  const result = await query(
    `INSERT INTO shree_raj_health_screenings (
      person_id, person_name, age_years, mobile_number, is_student,
      user_id, camp_id, worker_id, village, class_room, roll_no, care_of,
      height, weight, bmi, blood_pressure, blood_sugar, heart_rate,
      ecg, echo_heart, advice, recommended_investigations, photo_url, screening_date, notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
    RETURNING *`,
    [
      person_id || null,
      String(person_name).trim(),
      normalizeAge(age_years),
      mobile_number || null,
      is_student === undefined ? false : !!is_student,
      // Legacy field: retained for migration purposes only, no longer required.
      user_id || null,
      camp_id || null,
      worker_id || null,
      village || null,
      class_room || null,
      roll_no || null,
      care_of || null,
      height || null,
      weight || null,
      calculatedBmi,
      blood_pressure || null,
      blood_sugar || null,
      heart_rate || null,
      ecg || null,
      echo_heart || null,
      advice || null,
      normalizeRecommendedInvestigations(recommended_investigations),
      photo_url || null,
      screening_date || null,
      notes || null,
    ]
  );

  return sanitizeScreening(formatScreeningResponse(result.rows[0]));
}

// Mobile numbers are stored and searched as a bare 10-digit numeric value with no
// country code or separators (e.g. "9876543210").
//
// The only requirement is exactly 10 digits, numeric characters only. There is
// deliberately no leading-digit rule, so "1234567890" and "0123456789" are
// valid. Nothing is stripped to make an invalid value valid: an input containing
// spaces, hyphens or letters between digits is rejected rather than cleaned up,
// and a country code is never added.
const MOBILE_PATTERN = /^\d{10}$/;

function normalizeMobileNumber(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return MOBILE_PATTERN.test(trimmed) ? trimmed : null;
}

/**
 * Look up an existing person by mobile number for the Old Entry flow.
 *
 * This is read-only: it never creates a person and never modifies a screening.
 * A person's identity is their person_id; the profile fields are read from that
 * person's most recent screening, because there is no separate persons table.
 *
 * If several distinct person_ids share the mobile number, none is silently
 * chosen: matchCount > 1 and `person` is null, and `matches` carries enough
 * detail for the caller to ask the worker which person they meant.
 */
export async function findPersonByMobile(mobileNumber) {
  const normalized = normalizeMobileNumber(mobileNumber);
  if (!normalized) {
    const error = new Error('Please enter a valid 10-digit mobile number.');
    error.statusCode = 400;
    error.code = 'INVALID_MOBILE';
    throw error;
  }

  const personIds = (
    await query(
      `SELECT DISTINCT person_id
       FROM shree_raj_health_screenings
       WHERE mobile_number = $1 AND person_id IS NOT NULL
       ORDER BY person_id`,
      [normalized]
    )
  ).rows.map((row) => row.person_id);

  if (personIds.length === 0) {
    return {
      mobile_number: normalized,
      match_count: 0,
      person: null,
      screenings: [],
      matches: [],
    };
  }

  // Profile fields come from each person's most recent screening.
  const summaries = await query(
    `SELECT DISTINCT ON (person_id)
       person_id, person_name, mobile_number, age_years, is_student, screening_date
     FROM shree_raj_health_screenings
     WHERE person_id = ANY($1)
     ORDER BY person_id, screening_date DESC, created_at DESC`,
    [personIds]
  );

  // Reuse the existing read path so screening rows are shaped identically
  // everywhere instead of duplicating the response mapping.
  const screeningsByPerson = new Map();
  for (const personId of personIds) {
    screeningsByPerson.set(
      personId,
      await getScreeningsByPersonId(personId, { limit: 100, offset: 0 })
    );
  }

  const matches = summaries.rows.map((row) => ({
    person_id: row.person_id,
    name: row.person_name,
    mobile_number: row.mobile_number,
    age_years: row.age_years,
    is_student: row.is_student,
    last_screening_date: row.screening_date,
    screening_count: (screeningsByPerson.get(row.person_id) || []).length,
  }));

  if (matches.length > 1) {
    // Ambiguous: hand back every candidate rather than picking one.
    return {
      mobile_number: normalized,
      match_count: matches.length,
      person: null,
      screenings: [],
      matches,
    };
  }

  const person = matches[0];
  return {
    mobile_number: normalized,
    match_count: 1,
    person: {
      id: person.person_id,
      name: person.name,
      mobile_number: person.mobile_number,
      age_years: person.age_years,
      is_student: person.is_student,
    },
    screenings: screeningsByPerson.get(person.person_id) || [],
    matches,
  };
}

export async function getScreeningById(id) {
  const result = await query(`
    SELECT s.*,
      c.id as joined_camp_id, c.camp_name, c.camp_date,
      w.id as joined_worker_id, w.full_name as worker_full_name
    FROM shree_raj_health_screenings s
    LEFT JOIN camps c ON s.camp_id = c.id
    LEFT JOIN workers w ON s.worker_id = w.id
    WHERE s.id = $1
  `, [id]);

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return formatScreeningResponse(row);
}

export async function getAllScreenings(options = {}) {
  const {
    person_id,
    user_id,
    camp_id,
    worker_id,
    is_active,
    from_date,
    to_date,
    limit = 50,
    offset = 0,
  } = options;

  let sql = `
    SELECT s.*,
      c.id as joined_camp_id, c.camp_name, c.camp_date,
      w.id as joined_worker_id, w.full_name as worker_full_name
    FROM shree_raj_health_screenings s
    LEFT JOIN camps c ON s.camp_id = c.id
    LEFT JOIN workers w ON s.worker_id = w.id
  `;

  const params = [];
  const conditions = [];
  let paramIndex = 1;

  if (person_id) {
    conditions.push(`s.person_id = $${paramIndex}`);
    params.push(person_id);
    paramIndex++;
  }

  if (user_id) {
    conditions.push(`s.user_id = $${paramIndex}`);
    params.push(user_id);
    paramIndex++;
  }

  if (camp_id) {
    conditions.push(`s.camp_id = $${paramIndex}`);
    params.push(camp_id);
    paramIndex++;
  }
  
  if (worker_id) {
    conditions.push(`s.worker_id = $${paramIndex}`);
    params.push(worker_id);
    paramIndex++;
  }
  
  if (is_active !== undefined) {
    conditions.push(`s.is_active = $${paramIndex}`);
    params.push(is_active);
    paramIndex++;
  }
  
  if (from_date) {
    conditions.push(`s.screening_date >= $${paramIndex}`);
    params.push(from_date);
    paramIndex++;
  }
  
  if (to_date) {
    conditions.push(`s.screening_date <= $${paramIndex}`);
    params.push(to_date);
    paramIndex++;
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ` ORDER BY s.screening_date DESC, s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  
  return result.rows.map(formatScreeningResponse);
}

export async function getScreeningsByPersonId(personId, options = {}) {
  return getAllScreenings({ ...options, person_id: personId });
}

export async function getScreeningsByUserId(userId, options = {}) {
  return getAllScreenings({ ...options, user_id: userId });
}

export async function getScreeningsByCampId(campId, options = {}) {
  return getAllScreenings({ ...options, camp_id: campId });
}

export async function getScreeningsByWorkerId(workerId, options = {}) {
  return getAllScreenings({ ...options, worker_id: workerId });
}

export async function updateScreening(id, data) {
  const allowedFields = [
    'person_id', 'person_name', 'age_years', 'mobile_number', 'is_student',
    'camp_id', 'worker_id', 'village', 'class_room', 'roll_no', 'care_of',
    'height', 'weight', 'bmi', 'blood_pressure', 'blood_sugar', 'heart_rate',
    'ecg', 'echo_heart', 'advice', 'recommended_investigations', 'photo_url', 'screening_date', 'notes', 'is_active'
  ];

  const updates = [];
  const values = [];
  let paramIndex = 1;

  // Track if height or weight is being updated
  const heightUpdated = data.height !== undefined;
  const weightUpdated = data.weight !== undefined;
  const bmiProvided = data.bmi !== undefined;

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updates.push(`${key} = $${paramIndex}`);
      values.push(
        key === 'age_years'
          ? normalizeAge(value)
          : key === 'recommended_investigations'
            ? normalizeRecommendedInvestigations(value)
            : value
      );
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  // Verify camp_id if provided
  if (data.camp_id && !(await verifyCampExists(data.camp_id))) {
    throw new Error('Camp not found');
  }

  // Verify worker_id if provided
  if (data.worker_id && !(await verifyWorkerExists(data.worker_id))) {
    throw new Error('Worker not found');
  }

  // Recalculate BMI if height/weight updated and BMI not explicitly provided
  if ((heightUpdated || weightUpdated) && !bmiProvided) {
    // Get current screening to check existing height/weight
    const current = await query('SELECT height, weight FROM shree_raj_health_screenings WHERE id = $1', [id]);
    if (current.rows.length > 0) {
      const newHeight = data.height !== undefined ? data.height : current.rows[0].height;
      const newWeight = data.weight !== undefined ? data.weight : current.rows[0].weight;
      const newBmi = calculateBMI(newHeight, newWeight);
      if (newBmi !== null) {
        // Add BMI to updates
        updates.push(`bmi = $${paramIndex}`);
        values.push(newBmi);
        paramIndex++;
      }
    }
  }

  values.push(id);
  const sql = `UPDATE shree_raj_health_screenings SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const result = await query(sql, values);

  if (result.rows.length === 0) return null;
  return sanitizeScreening(formatScreeningResponse(result.rows[0]));
}

export async function deactivateScreening(id) {
  const result = await query(
    'UPDATE shree_raj_health_screenings SET is_active = false WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rows.length === 0) return null;
  return sanitizeScreening(formatScreeningResponse(result.rows[0]));
}

function formatScreeningResponse(row) {
  return {
    id: row.id,
    person_id: row.person_id,
    person_name: row.person_name,
    age_years: row.age_years,
    mobile_number: row.mobile_number,
    is_student: row.is_student,
    // Legacy field kept for migration purposes; no longer used to resolve identity.
    user_id: row.user_id,
    camp_id: row.camp_id,
    worker_id: row.worker_id,
    person: {
      id: row.person_id,
      name: row.person_name,
      mobile_number: row.mobile_number,
      age_years: row.age_years,
      is_student: row.is_student,
    },
    camp: row.camp_id ? {
      id: row.joined_camp_id ?? row.camp_id,
      camp_name: row.camp_name,
      camp_date: row.camp_date,
    } : null,
    worker: row.worker_id ? {
      id: row.joined_worker_id ?? row.worker_id,
      full_name: row.worker_full_name,
    } : null,
    village: row.village,
    class_room: row.class_room,
    roll_no: row.roll_no,
    care_of: row.care_of,
    height: row.height,
    weight: row.weight,
    bmi: row.bmi,
    blood_pressure: row.blood_pressure,
    blood_sugar: row.blood_sugar,
    heart_rate: row.heart_rate,
    ecg: row.ecg,
    echo_heart: row.echo_heart,
    advice: row.advice,
    recommended_investigations: row.recommended_investigations ?? null,
    photo_url: row.photo_url,
    screening_date: row.screening_date,
    notes: row.notes,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export default {
  createScreening,
  findPersonByMobile,
  getScreeningById,
  getAllScreenings,
  getScreeningsByPersonId,
  getScreeningsByUserId,
  getScreeningsByCampId,
  getScreeningsByWorkerId,
  updateScreening,
  deactivateScreening,
};
