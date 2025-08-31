import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../database/config.js';

const router = express.Router();

// Get all test parameters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM test_parameters ORDER BY category, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching test parameters:', error);
    res.status(500).json({ error: 'Failed to fetch test parameters' });
  }
});

// Get single test parameter
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM test_parameters WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test parameter not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching test parameter:', error);
    res.status(500).json({ error: 'Failed to fetch test parameter' });
  }
});

// Create new test parameter
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      id,
      name,
      unit,
      minValue,
      maxValue,
      warningMin,
      warningMax,
      category,
      description
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO test_parameters (
        id, name, unit, min_value, max_value, warning_min, warning_max, category, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [id, name, unit, minValue, maxValue, warningMin, warningMax, category, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating test parameter:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Test parameter ID already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create test parameter' });
    }
  }
});

// Update test parameter
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      unit,
      minValue,
      maxValue,
      warningMin,
      warningMax,
      category,
      description
    } = req.body;
    
    const result = await pool.query(
      `UPDATE test_parameters 
       SET name = $1, unit = $2, min_value = $3, max_value = $4, 
           warning_min = $5, warning_max = $6, category = $7, description = $8
       WHERE id = $9
       RETURNING *`,
      [name, unit, minValue, maxValue, warningMin, warningMax, category, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test parameter not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating test parameter:', error);
    res.status(500).json({ error: 'Failed to update test parameter' });
  }
});

// Delete test parameter
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if parameter is used in test results
    const usageResult = await pool.query(
      'SELECT COUNT(*) as count FROM test_results WHERE parameter_id = $1',
      [id]
    );
    
    if (parseInt(usageResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete parameter that has associated test results' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM test_parameters WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test parameter not found' });
    }
    
    res.json({ message: 'Test parameter deleted successfully' });
  } catch (error) {
    console.error('Error deleting test parameter:', error);
    res.status(500).json({ error: 'Failed to delete test parameter' });
  }
});

// Get parameters by category
router.get('/category/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM test_parameters WHERE category = $1 ORDER BY name',
      [category]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching parameters by category:', error);
    res.status(500).json({ error: 'Failed to fetch parameters' });
  }
});

// Get parameter categories
router.get('/categories/list', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM test_parameters ORDER BY category'
    );
    
    const categories = result.rows.map(row => row.category);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching parameter categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router; 