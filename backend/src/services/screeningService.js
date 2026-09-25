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

async function verifyUserExists(userId) {
  const result = await query('SELECT id FROM shree_raj_health_users WHERE id = $1', [userId]);
  return result.rows.length > 0;
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
    photo_url,
    screening_date,
    notes,
  } = data;

  // Validate required fields
  if (!user_id) {
    throw new Error('user_id is required');
  }

  // Verify user exists
  if (!(await verifyUserExists(user_id))) {
    throw new Error('User not found');
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
      user_id, camp_id, worker_id, village, class_room, roll_no, care_of,
      height, weight, bmi, blood_pressure, blood_sugar, heart_rate,
      ecg, echo_heart, advice, photo_url, screening_date, notes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
    RETURNING *`,
    [
      user_id,
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
      photo_url || null,
      screening_date || null,
      notes || null,
    ]
  );

  return sanitizeScreening(result.rows[0]);
}

export async function getScreeningById(id) {
  const result = await query(`
    SELECT s.*,
      u.id as user_id, u.full_name as user_full_name, u.phone as user_phone,
      c.id as camp_id, c.camp_name, c.camp_date,
      w.id as worker_id, w.full_name as worker_full_name
    FROM shree_raj_health_screenings s
    LEFT JOIN shree_raj_health_users u ON s.user_id = u.id
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
      u.id as user_id, u.full_name as user_full_name, u.phone as user_phone,
      c.id as camp_id, c.camp_name, c.camp_date,
      w.id as worker_id, w.full_name as worker_full_name
    FROM shree_raj_health_screenings s
    LEFT JOIN shree_raj_health_users u ON s.user_id = u.id
    LEFT JOIN camps c ON s.camp_id = c.id
    LEFT JOIN workers w ON s.worker_id = w.id
  `;
  
  const params = [];
  const conditions = [];
  let paramIndex = 1;

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
    'camp_id', 'worker_id', 'village', 'class_room', 'roll_no', 'care_of',
    'height', 'weight', 'bmi', 'blood_pressure', 'blood_sugar', 'heart_rate',
    'ecg', 'echo_heart', 'advice', 'photo_url', 'screening_date', 'notes', 'is_active'
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
      values.push(value);
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
  return sanitizeScreening(result.rows[0]);
}

export async function deactivateScreening(id) {
  const result = await query(
    'UPDATE shree_raj_health_screenings SET is_active = false WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rows.length === 0) return null;
  return sanitizeScreening(result.rows[0]);
}

function formatScreeningResponse(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    camp_id: row.camp_id,
    worker_id: row.worker_id,
    user: row.user_id ? {
      id: row.user_id,
      full_name: row.user_full_name,
      phone: row.user_phone,
    } : null,
    camp: row.camp_id ? {
      id: row.camp_id,
      camp_name: row.camp_name,
      camp_date: row.camp_date,
    } : null,
    worker: row.worker_id ? {
      id: row.worker_id,
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
  getScreeningById,
  getAllScreenings,
  getScreeningsByUserId,
  getScreeningsByCampId,
  getScreeningsByWorkerId,
  updateScreening,
  deactivateScreening,
};