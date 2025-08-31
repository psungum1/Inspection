import express from 'express';
const router = express.Router();
import pool from '../database/config.js';

// Get all test stages
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, "order", is_active, 
             created_at, updated_at
      FROM test_stages 
      ORDER BY "order", name
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching test stages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test stages'
    });
  }
});

// Create new test stage
router.post('/', async (req, res) => {
  try {
    const { name, description, order } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Stage name is required'
      });
    }

    // Check if stage name already exists
    const existingStage = await pool.query(
      'SELECT id FROM test_stages WHERE name = $1',
      [name]
    );

    if (existingStage.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Stage name already exists'
      });
    }

    const result = await pool.query(`
      INSERT INTO test_stages (name, description, "order", is_active)
      VALUES ($1, $2, $3, true)
      RETURNING id, name, description, "order", is_active, created_at, updated_at
    `, [name, description || null, order || 1]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating test stage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test stage'
    });
  }
});

// Update test stage
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, order, isActive } = req.body;

    // Check if stage exists
    const existingStage = await pool.query(
      'SELECT id FROM test_stages WHERE id = $1',
      [id]
    );

    if (existingStage.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Test stage not found'
      });
    }

    // Check if new name conflicts with existing stages (excluding current stage)
    if (name) {
      const nameConflict = await pool.query(
        'SELECT id FROM test_stages WHERE name = $1 AND id != $2',
        [name, id]
      );

      if (nameConflict.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Stage name already exists'
        });
      }
    }

    // Build update query dynamically
    let updateQuery = 'UPDATE test_stages SET updated_at = CURRENT_TIMESTAMP';
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateQuery += `, name = $${++paramCount}`;
      values.push(name);
    }

    if (description !== undefined) {
      updateQuery += `, description = $${++paramCount}`;
      values.push(description);
    }

    if (order !== undefined) {
      updateQuery += `, "order" = $${++paramCount}`;
      values.push(order);
    }

    if (isActive !== undefined) {
      updateQuery += `, is_active = $${++paramCount}`;
      values.push(isActive);
    }

    updateQuery += ` WHERE id = $1`;
    values.unshift(id);

    // Execute update
    await pool.query(updateQuery, values);

    // Get updated stage
    const result = await pool.query(`
      SELECT id, name, description, "order", is_active, 
             created_at, updated_at
      FROM test_stages 
      WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating test stage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update test stage'
    });
  }
});

// Delete test stage
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if stage exists
    const existingStage = await pool.query(
      'SELECT id FROM test_stages WHERE id = $1',
      [id]
    );

    if (existingStage.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Test stage not found'
      });
    }

    // Check if stage is being used in test results
    const usedStage = await pool.query(`
      SELECT COUNT(*) as count 
      FROM test_results 
      WHERE stage = $1
    `, [id]);

    if (usedStage.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete stage: It is being used in test results'
      });
    }

    // Delete the stage
    await pool.query('DELETE FROM test_stages WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Test stage deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting test stage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete test stage'
    });
  }
});

export default router;
