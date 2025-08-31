import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../database/config.js';

const router = express.Router();

// Get all test results with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      orderNumber, 
      parameterId, 
      status, 
      round, 
      limit = 100, 
      offset = 0 
    } = req.query;
    
    let query = `
      SELECT 
        tr.id,
        tr.order_number,
        tr.parameter_id,
        tr.round,
        tr.stage,
        tr.value,
        tr.unit,
        tr.status,
        tr.operator_id,
        tr.comments,
        tr.attachments,
        tr.timestamp,
        pp.parameter_name,
        pp.unit,
        pp.acceptable_min,
        pp.acceptable_max,
        pp.warning_min,
        pp.warning_max,
        pp.critical_min,
        pp.critical_max,
        pp.product_name,
        pp.parameter_order,
        po.line_number
      FROM test_results tr
      LEFT JOIN product_parameters pp ON tr.parameter_id = pp.parameter_name
      LEFT JOIN production_orders po ON tr.order_number = po.order_number
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 0;
    
    if (orderNumber) {
      paramCount++;
      conditions.push(`tr.order_number = $${paramCount}`);
      params.push(orderNumber);
    }
    
    if (parameterId) {
      paramCount++;
      conditions.push(`tr.parameter_id = $${paramCount}`);
      params.push(parameterId);
    }
    
    if (status) {
      paramCount++;
      conditions.push(`tr.status = $${paramCount}`);
      params.push(status);
    }
    
    if (round) {
      paramCount++;
      conditions.push(`tr.round = $${paramCount}`);
      params.push(round);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY tr.timestamp DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

// Get single test result
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        tr.id,
        tr.order_number,
        tr.parameter_id,
        tr.round,
        tr.stage,
        tr.value,
        tr.unit,
        tr.status,
        tr.operator_id,
        tr.comments,
        tr.attachments,
        tr.timestamp,
        pp.parameter_name,
        pp.unit,
        pp.acceptable_min,
        pp.acceptable_max,
        pp.warning_min,
        pp.warning_max,
        pp.critical_min,
        pp.critical_max,
        pp.product_name,
        pp.parameter_order,
        po.line_number
       FROM test_results tr
       LEFT JOIN product_parameters pp ON tr.parameter_id = pp.parameter_name
       LEFT JOIN production_orders po ON tr.order_number = po.order_number
       WHERE tr.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test result not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching test result:', error);
    res.status(500).json({ error: 'Failed to fetch test result' });
  }
});

// Create new test result
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      orderNumber,
      parameterId, // This can be either test_parameters.id or product_parameters.parameter_name
      round,
      stage,
      value,
      unit,
      status,
      operatorId,
      comments,
      attachments = []
    } = req.body;
    
    // First, try to find the test_parameters.id for the given parameterId
    // If parameterId is already a test_parameters.id, it will find it
    // If parameterId is a parameter_name, it will find the corresponding test_parameters.id
    //const paramResult = await pool.query(
    //  'SELECT id FROM test_parameters WHERE id = $1 OR name = $1',
    //  [parameterId]
    //);
    console.log(parameterId);
    const paramResult = await pool.query(
      'SELECT parameter_name FROM product_parameters WHERE parameter_name = $1',
      [parameterId]
    );
    
    if (paramResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid parameter ID or parameter name not found in test_parameters' });
    }
    
    const actualParameterId = paramResult.rows[0].parameter_name;
    console.log(actualParameterId);
    // Generate unique ID
    const id = `TR${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const result = await pool.query(
      `INSERT INTO test_results (
        id, order_number, parameter_id, round, stage, value, unit, 
        status, operator_id, comments, attachments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [id, orderNumber, actualParameterId, round, stage, value, unit, status, operatorId, comments, attachments]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating test result:', error);
    if (error.code === '23503') { // Foreign key violation
      res.status(400).json({ error: 'Invalid order number or parameter ID' });
    } else {
      res.status(500).json({ error: 'Failed to create test result' });
    }
  }
});

// Update test result
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      value,
      unit,
      status,
      stage,
      comments,
      attachments
    } = req.body;
    
    const result = await pool.query(
      `UPDATE test_results 
       SET value = $1, unit = $2, status = $3, stage = $4, comments = $5, attachments = $6
       WHERE id = $7
       RETURNING *`,
      [value, unit, status, stage, comments, attachments, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test result not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating test result:', error);
    res.status(500).json({ error: 'Failed to update test result' });
  }
});

// Delete test result
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM test_results WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test result not found' });
    }
    
    res.json({ message: 'Test result deleted successfully' });
  } catch (error) {
    console.error('Error deleting test result:', error);
    res.status(500).json({ error: 'Failed to delete test result' });
  }
});

// Get test results by order and round
router.get('/order/:orderNumber/round/:round', authenticateToken, async (req, res) => {
  try {
    const { orderNumber, round } = req.params;
    
    const result = await pool.query(
      `SELECT 
        tr.*,
        pp.parameter_name,
        pp.unit
       FROM test_results tr
       LEFT JOIN product_parameters pp ON tr.parameter_id = pp.parameter_name
       WHERE tr.order_number = $1 AND tr.round = $2
       ORDER BY tr.timestamp`,
      [orderNumber, round]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching test results by round:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

// Debug endpoint to check test results data structure
router.get('/debug/:orderNumber', authenticateToken, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    console.log(`Debug: Checking test results for order ${orderNumber}`);
    
    // Check multiple possible sources
    const results = {};
    
    // 1. Check test_results table directly
    const directQuery = `
      SELECT * FROM test_results 
      WHERE order_number = $1 
      ORDER BY timestamp DESC 
      LIMIT 10
    `;
    const directResults = await pool.query(directQuery, [orderNumber]);
    results.direct_test_results = {
      count: directResults.rows.length,
      data: directResults.rows
    };
    
    // 2. Check with JOIN to test_parameters
    const joinQuery = `
      SELECT 
        tr.*,
        tp.name as parameter_name,
        tp.unit as parameter_unit,
        tp.category
      FROM test_results tr
      LEFT JOIN test_parameters tp ON tr.parameter_id = tp.id
      WHERE tr.order_number = $1
      ORDER BY tr.timestamp DESC
      LIMIT 10
    `;
    const joinResults = await pool.query(joinQuery, [orderNumber]);
    results.join_test_results = {
      count: joinResults.rows.length,
      data: joinResults.rows
    };
    
    // 3. Check if order exists in production_orders
    const orderQuery = `SELECT * FROM production_orders WHERE order_number = $1`;
    const orderResults = await pool.query(orderQuery, [orderNumber]);
    results.order_exists = {
      exists: orderResults.rows.length > 0,
      data: orderResults.rows
    };
    
    // 4. Check if order exists in plc_orders (batch_id)
    const plcOrderQuery = `SELECT * FROM plc_orders WHERE batch_id = $1`;
    const plcOrderResults = await pool.query(plcOrderQuery, [orderNumber]);
    results.plc_order_exists = {
      exists: plcOrderResults.rows.length > 0,
      data: plcOrderResults.rows
    };
    
    // 5. Check test_parameters table
    const parametersQuery = `SELECT id, name, unit, category FROM test_parameters LIMIT 10`;
    const parametersResults = await pool.query(parametersQuery);
    results.available_parameters = {
      count: parametersResults.rows.length,
      data: parametersResults.rows
    };
    
    res.json({
      success: true,
      order_number: orderNumber,
      debug_info: results
    });
    
  } catch (error) {
    console.error('Debug test results error:', error);
    res.status(500).json({ 
      error: 'Failed to debug test results', 
      details: error.message 
    });
  }
});

export default router; 