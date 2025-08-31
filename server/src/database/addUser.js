import pool from './config.js';
import bcrypt from 'bcrypt';

const addUser = async (name, email, password, role = 'admin') => {
  const client = await pool.connect();
  try {
    const password_hash = await bcrypt.hash(password, 10);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, true)`,
      [name, email, password_hash, role]
    );
    console.log('✅ User added successfully!');
  } catch (error) {
    console.error('❌ Error adding user:', error);
  } finally {
    client.release();
  }
};

// Example usage:
addUser('Admin User', 'admin@smscor.com', 'tiger1310', 'admin'); 