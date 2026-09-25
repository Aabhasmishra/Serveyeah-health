// Worker service - database operations for workers
import { query } from '../db/pool.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

function sanitizeWorker(worker) {
  const { password_hash, ...safe } = worker;
  return safe;
}

export async function createWorker(data) {
  const {
    employee_id,
    full_name,
    email,
    phone,
    role,
    department,
    qualification,
    experience_years,
    date_of_joining,
    password,
  } = data;

  // Validate required fields
  if (!employee_id || !full_name || !password) {
    throw new Error('employee_id, full_name, and password are required');
  }

  // Check employee_id uniqueness
  const existingEmp = await query('SELECT id FROM workers WHERE employee_id = $1', [employee_id]);
  if (existingEmp.rows.length > 0) {
    throw new Error('Employee ID already exists');
  }

  // Check email uniqueness if provided
  if (email) {
    const existingEmail = await query('SELECT id FROM workers WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      throw new Error('Email already registered');
    }
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await query(
    `INSERT INTO workers (
      employee_id, full_name, email, phone, role, department,
      qualification, experience_years, date_of_joining, password_hash
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *`,
    [
      employee_id,
      full_name,
      email || null,
      phone || null,
      role || 'health_worker',
      department || null,
      qualification || null,
      experience_years || 0,
      date_of_joining || null,
      password_hash,
    ]
  );

  return sanitizeWorker(result.rows[0]);
}

export async function getWorkerById(id) {
  const result = await query('SELECT * FROM workers WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return sanitizeWorker(result.rows[0]);
}

export async function getAllWorkers({ limit = 50, offset = 0, activeOnly = false } = {}) {
  let sql = 'SELECT * FROM workers';
  const params = [];

  if (activeOnly) {
    sql += ' WHERE is_active = true';
  }

  sql += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows.map(sanitizeWorker);
}

export async function updateWorker(id, data) {
  const allowedFields = [
    'employee_id', 'full_name', 'email', 'phone', 'role', 'department',
    'qualification', 'experience_years', 'date_of_joining', 'is_active'
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

  // Check employee_id uniqueness if being updated
  if (data.employee_id) {
    const existing = await query('SELECT id FROM workers WHERE employee_id = $1 AND id != $2', [data.employee_id, id]);
    if (existing.rows.length > 0) {
      throw new Error('Employee ID already exists');
    }
  }

  // Check email uniqueness if being updated
  if (data.email) {
    const existing = await query('SELECT id FROM workers WHERE email = $1 AND id != $2', [data.email, id]);
    if (existing.rows.length > 0) {
      throw new Error('Email already registered');
    }
  }

  values.push(id);
  const sql = `UPDATE workers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const result = await query(sql, values);

  if (result.rows.length === 0) return null;
  return sanitizeWorker(result.rows[0]);
}

export async function deactivateWorker(id) {
  const result = await query(
    'UPDATE workers SET is_active = false WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rows.length === 0) return null;
  return sanitizeWorker(result.rows[0]);
}

export async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

export default {
  createWorker,
  getWorkerById,
  getAllWorkers,
  updateWorker,
  deactivateWorker,
  verifyPassword,
};