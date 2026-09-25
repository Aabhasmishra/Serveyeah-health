// User service - database operations for shree_raj_health_users
import { query } from '../db/pool.js';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

export async function createUser(data) {
  const {
    full_name,
    email,
    phone,
    date_of_birth,
    gender,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    blood_group,
    allergies,
    chronic_conditions,
    medications,
    password,
    photo_url,
  } = data;

  // Validate required fields
  if (!full_name || !password) {
    throw new Error('full_name and password are required');
  }

  // Check email uniqueness if provided
  if (email) {
    const existing = await query('SELECT id FROM shree_raj_health_users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new Error('Email already registered');
    }
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await query(
    `INSERT INTO shree_raj_health_users (
      full_name, email, phone, date_of_birth, gender, address,
      emergency_contact_name, emergency_contact_phone, blood_group,
      allergies, chronic_conditions, medications, password_hash, photo_url
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    RETURNING *`,
    [
      full_name,
      email || null,
      phone || null,
      date_of_birth || null,
      gender || null,
      address || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
      blood_group || null,
      allergies || null,
      chronic_conditions || null,
      medications || null,
      password_hash,
      photo_url || null,
    ]
  );

  return sanitizeUser(result.rows[0]);
}

export async function getUserById(id) {
  const result = await query('SELECT * FROM shree_raj_health_users WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return sanitizeUser(result.rows[0]);
}

export async function getAllUsers({ limit = 50, offset = 0, activeOnly = false } = {}) {
  let sql = 'SELECT * FROM shree_raj_health_users';
  const params = [];

  if (activeOnly) {
    sql += ' WHERE is_active = true';
  }

  sql += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows.map(sanitizeUser);
}

export async function updateUser(id, data) {
  const allowedFields = [
    'full_name', 'email', 'phone', 'date_of_birth', 'gender', 'address',
    'emergency_contact_name', 'emergency_contact_phone', 'blood_group',
    'allergies', 'chronic_conditions', 'medications', 'photo_url', 'is_active'
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

  // Check email uniqueness if being updated
  if (data.email) {
    const existing = await query('SELECT id FROM shree_raj_health_users WHERE email = $1 AND id != $2', [data.email, id]);
    if (existing.rows.length > 0) {
      throw new Error('Email already registered');
    }
  }

  values.push(id);
  const sql = `UPDATE shree_raj_health_users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const result = await query(sql, values);

  if (result.rows.length === 0) return null;
  return sanitizeUser(result.rows[0]);
}

export async function deactivateUser(id) {
  const result = await query(
    'UPDATE shree_raj_health_users SET is_active = false WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rows.length === 0) return null;
  return sanitizeUser(result.rows[0]);
}

export async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

export default {
  createUser,
  getUserById,
  getAllUsers,
  updateUser,
  deactivateUser,
  verifyPassword,
};