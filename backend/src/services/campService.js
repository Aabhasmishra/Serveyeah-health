// Camp service - database operations for camps
import { query } from '../db/pool.js';

function sanitizeCamp(camp) {
  return camp; // No sensitive fields to remove
}

export async function createCamp(data) {
  const {
    camp_name,
    camp_category,
    camp_date,
    camp_location,
    organizer_institution_1,
    organizer_institution_2,
    association_details,
    venue_name,
    venue_address,
    max_capacity,
    created_by,
  } = data;

  // Validate required fields
  if (!camp_name || !camp_date || !camp_location) {
    throw new Error('camp_name, camp_date, and camp_location are required');
  }

  // Validate created_by references existing worker if provided
  if (created_by) {
    const worker = await query('SELECT id FROM workers WHERE id = $1', [created_by]);
    if (worker.rows.length === 0) {
      throw new Error('Created by worker does not exist');
    }
  }

  const result = await query(
    `INSERT INTO camps (
      camp_name, camp_category, camp_date, camp_location,
      organizer_institution_1, organizer_institution_2, association_details,
      venue_name, venue_address, max_capacity, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,
    [
      camp_name,
      camp_category || null,
      camp_date,
      camp_location,
      organizer_institution_1 || null,
      organizer_institution_2 || null,
      association_details || null,
      venue_name || null,
      venue_address || null,
      max_capacity || null,
      created_by || null,
    ]
  );

  return sanitizeCamp(result.rows[0]);
}

export async function getCampById(id) {
  const result = await query('SELECT * FROM camps WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return sanitizeCamp(result.rows[0]);
}

export async function getAllCamps({ limit = 50, offset = 0, activeOnly = false } = {}) {
  let sql = 'SELECT * FROM camps';
  const params = [];

  if (activeOnly) {
    sql += ' WHERE is_active = true';
  }

  sql += ' ORDER BY camp_date DESC LIMIT $1 OFFSET $2';
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows.map(sanitizeCamp);
}

export async function updateCamp(id, data) {
  const allowedFields = [
    'camp_name', 'camp_category', 'camp_date', 'camp_location',
    'organizer_institution_1', 'organizer_institution_2', 'association_details',
    'venue_name', 'venue_address', 'max_capacity', 'is_active'
  ];

  const updates = [];
  const values = [];
  let paramIndex = 1;

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

  values.push(id);
  const sql = `UPDATE camps SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const result = await query(sql, values);

  if (result.rows.length === 0) return null;
  return sanitizeCamp(result.rows[0]);
}

export async function deactivateCamp(id) {
  const result = await query(
    'UPDATE camps SET is_active = false WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rows.length === 0) return null;
  return sanitizeCamp(result.rows[0]);
}

export async function incrementRegisteredCount(id) {
  const result = await query(
    'UPDATE camps SET registered_count = registered_count + 1 WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rows.length === 0) return null;
  return sanitizeCamp(result.rows[0]);
}

export default {
  createCamp,
  getCampById,
  getAllCamps,
  updateCamp,
  deactivateCamp,
  incrementRegisteredCount,
};