import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../database/config.js';

const router = express.Router();

// Get a preference by key for current user
router.get('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query(
      'SELECT pref_value FROM user_preferences WHERE user_id = $1 AND pref_key = $2',
      [req.user.id, key]
    );
    if (result.rows.length === 0) {
      return res.json(null);
    }
    res.json(result.rows[0].pref_value);
  } catch (error) {
    console.error('Error fetching user preference:', error);
    res.status(500).json({ error: 'Failed to fetch user preference' });
  }
});

// Upsert a preference by key for current user
router.put('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const prefValue = req.body;

    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, pref_key, pref_value)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (user_id, pref_key)
       DO UPDATE SET pref_value = EXCLUDED.pref_value, updated_at = CURRENT_TIMESTAMP
       RETURNING id, user_id, pref_key, pref_value, created_at, updated_at`,
      [req.user.id, key, prefValue]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving user preference:', error);
    res.status(500).json({ error: 'Failed to save user preference' });
  }
});

export default router;


