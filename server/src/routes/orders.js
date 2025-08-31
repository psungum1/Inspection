import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../database/config.js';
import { getSqlServerConnection } from '../database/sqlServer.js';

const router = express.Router();

// Search orders (MUST be before any parameterized routes)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { 
      query, 
      status, 
      lineNumber, 
      operatorId, 
      startDate, 
      endDate,
      limit = 20 
    } = req.query;
    
    let sqlQuery = `
      SELECT 
        po.*,
        COUNT(tr.id) as test_results_count
      FROM production_orders po
      LEFT JOIN test_results tr ON po.order_number = tr.order_number
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 0;
    
    // Search by query (order number, operator ID, or partial matches)
    if (query) {
      paramCount++;
      conditions.push(`(
        po.order_number ILIKE $${paramCount} OR 
        po.operator_id ILIKE $${paramCount} OR
        po.order_number ILIKE $${paramCount + 1}
      )`);
      params.push(`%${query}%`, `${query}%`);
      paramCount++;
    }
    
    if (status) {
      paramCount++;
      conditions.push(`po.status = $${paramCount}`);
      params.push(status);
    }
    
    if (lineNumber) {
      paramCount++;
      conditions.push(`po.line_number = $${paramCount}`);
      params.push(lineNumber);
    }
    
    if (operatorId) {
      paramCount++;
      conditions.push(`po.operator_id ILIKE $${paramCount}`);
      params.push(`%${operatorId}%`);
    }
    
    if (startDate) {
      paramCount++;
      conditions.push(`po.production_date_time >= $${paramCount}`);
      params.push(startDate);
    }
    
    if (endDate) {
      paramCount++;
      conditions.push(`po.production_date_time <= $${paramCount}`);
      params.push(endDate);
    }
    
    if (conditions.length > 0) {
      sqlQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sqlQuery += ` GROUP BY po.order_number ORDER BY po.created_at DESC LIMIT $${paramCount + 1}`;
    params.push(limit);
    
    const result = await pool.query(sqlQuery, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching orders:', error);
    res.status(500).json({ error: 'Failed to search orders' });
  }
});

// Search PLC orders from plc_orders table
router.get('/plc/search', authenticateToken, async (req, res) => {
  try {
    const { 
      query, 
      batchId, 
      productId, 
      recipeId, 
      startDate, 
      endDate,
      limit = 20 
    } = req.query;
    
    let sqlQuery = `
      SELECT 
        po.*,
        CASE 
          WHEN po.Log_Close_DT_UTC IS NULL THEN 'active'
          ELSE 'completed'
        END as status,
        COUNT(tr.id) as test_results_count
      FROM plc_orders po
      LEFT JOIN test_results tr ON po.Batch_ID = tr.order_number
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 0;
    
    // Search by query (Batch_ID, Product_Name, Recipe_Name, or partial matches)
    if (query) {
      paramCount++;
      conditions.push(`(
        po.Batch_ID ILIKE $${paramCount} OR 
        po.Product_Name ILIKE $${paramCount} OR
        po.Recipe_Name ILIKE $${paramCount} OR
        po.Campaign_ID ILIKE $${paramCount} OR
        po.Lot_ID ILIKE $${paramCount}
      )`);
      params.push(`%${query}%`);
    }
    
    if (batchId) {
      paramCount++;
      conditions.push(`po.Batch_ID ILIKE $${paramCount}`);
      params.push(`%${batchId}%`);
    }
    
    if (productId) {
      paramCount++;
      conditions.push(`po.Product_ID = $${paramCount}`);
      params.push(productId);
    }
    
    if (recipeId) {
      paramCount++;
      conditions.push(`po.Recipe_ID = $${paramCount}`);
      params.push(recipeId);
    }
    
    if (startDate) {
      paramCount++;
      conditions.push(`po.Log_Open_DT_UTC >= $${paramCount}`);
      params.push(startDate);
    }
    
    if (endDate) {
      paramCount++;
      conditions.push(`po.Log_Open_DT_UTC <= $${paramCount}`);
      params.push(endDate);
    }
    
    if (conditions.length > 0) {
      sqlQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sqlQuery += ` GROUP BY po.Batch_Log_ID ORDER BY po.Log_Open_DT_UTC DESC LIMIT $${paramCount + 1}`;
    params.push(limit);
    
    const result = await pool.query(sqlQuery, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching PLC orders:', error);
    res.status(500).json({ error: 'Failed to search PLC orders' });
  }
});

// Distinct PLC product names for dropdown (optionally filtered by date range and only names with test results)
router.get('/plc/product-names', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, onlyWithResults } = req.query;

    let sqlQuery = `
      SELECT 
        po.Product_Name as product_name,
        COUNT(DISTINCT po.Batch_Log_ID) as order_count,
        COUNT(tr.id) as test_results_count
      FROM plc_orders po
      LEFT JOIN test_results tr ON po.Batch_ID = tr.order_number
    `;

    const conditions = [];
    const params = [];
    let paramCount = 0;

    if (startDate) {
      paramCount++;
      conditions.push(`po.Log_Open_DT_UTC >= $${paramCount}`);
      params.push(startDate);
    }
    if (endDate) {
      paramCount++;
      conditions.push(`po.Log_Open_DT_UTC <= $${paramCount}`);
      params.push(endDate);
    }

    if (conditions.length > 0) {
      sqlQuery += ` WHERE ${conditions.join(' AND ')}`;
    }

    sqlQuery += ` GROUP BY po.Product_Name`;

    if (onlyWithResults && (onlyWithResults === '1' || onlyWithResults === 'true')) {
      sqlQuery = `SELECT * FROM (${sqlQuery}) t WHERE t.test_results_count > 0`;
    }

    sqlQuery += ` ORDER BY product_name ASC`;

    const result = await pool.query(sqlQuery, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching PLC product names:', error);
    res.status(500).json({ error: 'Failed to fetch PLC product names' });
  }
});

// Test results joined with PLC orders filtered by product name (and optional parameter, operators, date range)
router.get('/plc/test-results-by-product', authenticateToken, async (req, res) => {
  try {
    const { productName, parameterId, operatorIds, startDate, endDate, limit = 1000 } = req.query;

    if (!productName) {
      return res.status(400).json({ error: 'productName is required' });
    }

    let query = `
      SELECT 
        tr.*,
        po.Product_Name as product_name,
        po.Batch_ID as batch_id,
        po.Log_Open_DT_UTC as log_open_dt_utc,
        po.Log_Close_DT_UTC as log_close_dt_utc
      FROM test_results tr
      JOIN plc_orders po ON po.Batch_ID = tr.order_number
      WHERE po.Product_Name ILIKE $1
    `;
    const params = [`%${productName}%`];
    let paramCount = 1;

    if (parameterId) {
      paramCount++;
      query += ` AND tr.parameter_id = $${paramCount}`;
      params.push(parameterId);
    }

    if (operatorIds) {
      // operatorIds can be comma-separated string
      const ops = String(operatorIds).split(',').map((s) => s.trim()).filter(Boolean);
      if (ops.length > 0) {
        const placeholders = ops.map((_, idx) => `$${paramCount + idx + 1}`).join(',');
        query += ` AND tr.operator_id IN (${placeholders})`;
        params.push(...ops);
        paramCount += ops.length;
      }
    }

    if (startDate) {
      paramCount++;
      query += ` AND po.Log_Open_DT_UTC >= $${paramCount}`;
      params.push(startDate);
    }
    if (endDate) {
      paramCount++;
      query += ` AND po.Log_Open_DT_UTC <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY tr.timestamp ASC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching test results by product name:', error);
    res.status(500).json({ error: 'Failed to fetch test results by product' });
  }
});

// Get all orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, lineNumber, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        po.*,
        COUNT(tr.id) as test_results_count
      FROM production_orders po
      LEFT JOIN test_results tr ON po.order_number = tr.order_number
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      conditions.push(`po.status = $${paramCount}`);
      params.push(status);
    }
    
    if (lineNumber) {
      paramCount++;
      conditions.push(`po.line_number = $${paramCount}`);
      params.push(lineNumber);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY po.order_number ORDER BY po.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get all orders with test results
router.get('/with-results', authenticateToken, async (req, res) => {
  try {
    const { status, lineNumber, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        po.*,
        COUNT(tr.id) as test_results_count,
        JSON_AGG(
          CASE WHEN tr.id IS NOT NULL THEN
            JSON_BUILD_OBJECT(
              'id', tr.id,
              'parameterId', tr.parameter_id,
              'round', tr.round,
              'value', tr.value,
              'unit', tr.unit,
              'timestamp', tr.timestamp,
              'operatorId', tr.operator_id,
              'status', tr.status,
              'comments', tr.comments,
              'parameterName', tp.name,
              'parameterUnit', tp.unit
            )
          ELSE NULL END
        ) FILTER (WHERE tr.id IS NOT NULL) as test_results
      FROM production_orders po
      LEFT JOIN test_results tr ON po.order_number = tr.order_number
      LEFT JOIN test_parameters tp ON tr.parameter_id = tp.id
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      conditions.push(`po.status = $${paramCount}`);
      params.push(status);
    }
    
    if (lineNumber) {
      paramCount++;
      conditions.push(`po.line_number = $${paramCount}`);
      params.push(lineNumber);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY po.order_number ORDER BY po.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Process the results to handle null test_results arrays
    const processedResults = result.rows.map(row => ({
      ...row,
      test_results: row.test_results || []
    }));
    
    res.json(processedResults);
  } catch (error) {
    console.error('Error fetching orders with test results:', error);
    res.status(500).json({ error: 'Failed to fetch orders with test results' });
  }
});

// Get single order with test results
router.get('/:orderNumber/with-results', authenticateToken, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    // Get order details
    const orderResult = await pool.query(
      'SELECT * FROM production_orders WHERE order_number = $1',
      [orderNumber]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get test results for this order
    const testResultsResult = await pool.query(
      `SELECT tr.*, tp.name as parameter_name, tp.unit as parameter_unit
       FROM test_results tr
       JOIN test_parameters tp ON tr.parameter_id = tp.id
       WHERE tr.order_number = $1
       ORDER BY tr.round ASC, tr.timestamp DESC`,
      [orderNumber]
    );
    
    const order = orderResult.rows[0];
    order.testResults = testResultsResult.rows;
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order with test results:', error);
    res.status(500).json({ error: 'Failed to fetch order with test results' });
  }
});

// Get single order with test results
router.get('/:orderNumber', authenticateToken, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    // Get order details
    const orderResult = await pool.query(
      'SELECT * FROM production_orders WHERE order_number = $1',
      [orderNumber]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get test results for this order
    const testResultsResult = await pool.query(
      `SELECT tr.*, tp.name as parameter_name, tp.unit as parameter_unit
       FROM test_results tr
       JOIN test_parameters tp ON tr.parameter_id = tp.id
       WHERE tr.order_number = $1
       ORDER BY tr.timestamp DESC`,
      [orderNumber]
    );
    
    const order = orderResult.rows[0];
    order.testResults = testResultsResult.rows;
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { orderNumber, lineNumber, productionDateTime, operatorId } = req.body;
    
    const result = await pool.query(
      `INSERT INTO production_orders (order_number, line_number, production_date_time, operator_id, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [orderNumber, lineNumber, productionDateTime, operatorId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Order number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create order' });
    }
  }
});

// Update order status
router.patch('/:orderNumber/status', authenticateToken, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(
      'UPDATE production_orders SET status = $1 WHERE order_number = $2 RETURNING *',
      [status, orderNumber]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Delete order (admin only)
router.delete('/:orderNumber', authenticateToken, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const result = await pool.query(
      'DELETE FROM production_orders WHERE order_number = $1 RETURNING *',
      [orderNumber]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Bulk import orders
router.post('/bulk-import', authenticateToken, async (req, res) => {
  try {
    const { orders } = req.body;
    
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ error: 'Orders array is required and must not be empty' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      const errors = [];
      const duplicates = [];
      
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const { orderNumber, lineNumber, productionDateTime, operatorId } = order;
        
        try {
          // Check if order already exists
          const existingOrder = await client.query(
            'SELECT order_number FROM production_orders WHERE order_number = $1',
            [orderNumber]
          );
          
          if (existingOrder.rows.length > 0) {
            duplicates.push(orderNumber);
            continue;
          }
          
          // Insert new order
          const result = await client.query(
            `INSERT INTO production_orders (order_number, line_number, production_date_time, operator_id, status)
             VALUES ($1, $2, $3, $4, 'active')
             RETURNING *`,
            [orderNumber, lineNumber, productionDateTime, operatorId]
          );
          
          results.push(result.rows[0]);
        } catch (error) {
          errors.push({
            row: i + 1,
            orderNumber,
            field: 'general',
            message: error.message,
            code: 'INSERT_ERROR'
          });
        }
      }
      
      await client.query('COMMIT');
      
      res.status(200).json({
        success: true,
        totalRows: orders.length,
        successfulRows: results.length,
        errors,
        duplicates,
        importedOrders: results
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error bulk importing orders:', error);
    res.status(500).json({ error: 'Failed to bulk import orders' });
  }
});

// ตัวอย่าง route ดึง orders จาก SQL Server
router.get('/sqlserver/batchdetail', async (req, res) => {
  try {
    const { batchId } = req.query;
    if (!batchId) return res.status(400).json({ error: 'batchId is required' });
    const pool = await getSqlServerConnection();
    const result = await pool.request()
      .input('batchId', batchId)
      .query("select * from BatchIdLog b left join ProcessVar p on b.Batch_Log_ID=p.Batch_Log_ID where Parameter_ID='PH' and b.Batch_ID = @batchId");
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Server error:', err);
    res.status(500).json({ error: 'SQL Server query failed', details: err.message });
  }
});

// ดึง batch id และ unit ที่ Log_Close_DT_UTC เป็น null (batch ที่ยังไม่ close)
router.get('/sqlserver/batchlist', async (req, res) => {
  try {
    const pool = await getSqlServerConnection();
    const result = await pool.request()
      .query("SELECT DISTINCT b.Batch_ID, p.UnitOrConnection FROM BatchIdLog b LEFT JOIN ProcessVar p ON b.Batch_Log_ID = p.Batch_Log_ID WHERE p.Parameter_ID = 'PH' AND b.Log_Close_DT_UTC IS NULL");
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Server error:', err);
    res.status(500).json({ error: 'SQL Server query failed', details: err.message });
  }
});

// Get unique parameter_id values from ProcessVar (optionally filtered by batchId)
router.get('/sqlserver/parameters', async (req, res) => {
  try {
    const { batchId } = req.query;
    const pool = await getSqlServerConnection();
    let query = 'SELECT DISTINCT p.Parameter_ID FROM ProcessVar p';
    let request = pool.request();
    
    if (batchId) {
      query += ' LEFT JOIN BatchIdLog b ON p.Batch_Log_ID = b.Batch_Log_ID WHERE b.Batch_ID = @batchId';
      request = request.input('batchId', batchId);
    }
    
    const result = await request.query(query);
    // Return as array of parameter_id values
    res.json(result.recordset.map(row => row.Parameter_ID));
  } catch (err) {
    console.error('SQL Server error:', err);
    res.status(500).json({ error: 'SQL Server query failed', details: err.message });
  }
});

// Get parameter data for any parameter_id (not just PH)
router.get('/sqlserver/parameter-data', async (req, res) => {
  try {
    const { batchId, parameterId } = req.query;
    if (!batchId) return res.status(400).json({ error: 'batchId is required' });
    if (!parameterId) return res.status(400).json({ error: 'parameterId is required' });
    
    const pool = await getSqlServerConnection();
    const result = await pool.request()
      .input('batchId', batchId)
      .input('parameterId', parameterId)
      .query(`
        SELECT 
          b.Batch_ID,
          p.UnitOrConnection,
          p.DateTime,
          p.Target_Value,
          p.Actual_Value,
          p.Parameter_ID
        FROM BatchIdLog b 
        LEFT JOIN ProcessVar p ON b.Batch_Log_ID = p.Batch_Log_ID 
        WHERE p.Parameter_ID = @parameterId 
        AND b.Batch_ID = @batchId
        ORDER BY p.DateTime
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Server error:', err);
    res.status(500).json({ error: 'SQL Server query failed', details: err.message });
  }
});

// Get PLC order with test results by Batch_ID
router.get('/plc/:batchId/with-results', authenticateToken, async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Get PLC order details
    const orderResult = await pool.query(
      `SELECT 
        po.*,
        CASE 
          WHEN po.Log_Close_DT_UTC IS NULL THEN 'active'
          ELSE 'completed'
        END as status
       FROM plc_orders po
       WHERE po.Batch_ID = $1`,
      [batchId]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'PLC Order not found' });
    }
    
    // Get test results for this batch ID
    const testResultsResult = await pool.query(
      `SELECT tr.*, tp.name as parameter_name, tp.unit as parameter_unit
       FROM test_results tr
       LEFT JOIN test_parameters tp ON tr.parameter_id = tp.id
       WHERE tr.order_number = $1
       ORDER BY tr.round ASC, tr.timestamp DESC`,
      [batchId]
    );
    
    const order = orderResult.rows[0];
    order.testResults = testResultsResult.rows;
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching PLC order with test results:', error);
    res.status(500).json({ error: 'Failed to fetch PLC order with test results' });
  }
});

// Order analysis by batch pattern (RE1_1 or RE1_6) with PH & TCC data
router.get('/analysis/batch-pattern', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, batchPattern, batchId, lotId } = req.query;

    // Validate inputs: allow either (startDate & endDate) OR (batchId/lotId)
    if (!(batchId || lotId) && (!startDate || !endDate)) {
      return res.status(400).json({ error: 'Provide either startDate & endDate, or batchId/lotId' });
    }

    // Build conditions for batch pattern filtering
    let whereClauses = [];
    const params = [];
    let paramCount = 0;

    // Date range condition (only when start/end provided and not searching by specific ids)
    const useDateRange = !batchId && !lotId && startDate && endDate;
    if (useDateRange) {
      paramCount++; params.push(startDate);
      whereClauses.push(`po.Log_Open_DT_UTC >= $${paramCount}`);
      paramCount++; params.push(endDate);
      whereClauses.push(`po.Log_Open_DT_UTC <= $${paramCount}`);
    }

    // Batch pattern condition
    if (['1', '2', '3', '4', '5', '6'].includes(batchPattern)) {
      paramCount++; params.push(batchPattern);
      whereClauses.push(`RIGHT(po.Lot_ID, 1) = $${paramCount}`);
    }

    // Batch_ID filter (ILIKE for partial)
    if (batchId) {
      paramCount++; params.push(`%${batchId}%`);
      whereClauses.push(`po.Batch_ID ILIKE $${paramCount}`);
    }

    // Lot_ID filter (ILIKE for partial)
    if (lotId) {
      paramCount++; params.push(`%${lotId}%`);
      whereClauses.push(`po.Lot_ID ILIKE $${paramCount}`);
    }

    // Get PLC orders filtered by batch pattern and date range
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const ordersQuery = `
      SELECT 
        po.*,
        CASE 
          WHEN po.Log_Close_DT_UTC IS NULL THEN 'active'
          ELSE 'completed'
        END as status,
        RIGHT(po.Lot_ID, 1) as lot_suffix
      FROM plc_orders po
      ${whereSql}
      ORDER BY po.Log_Open_DT_UTC DESC
    `;

    const ordersResult = await pool.query(ordersQuery, params);
    
    if (ordersResult.rows.length === 0) {
      return res.json({
        orders: [],
        phData: [],
        tccData: [],
        summary: {
          totalOrders: 0,
          activeOrders: 0,
          completedOrders: 0,
          batchPattern: batchPattern || 'all',
          phDataPoints: 0,
          tccDataPoints: 0,
          dateRange: {
            startDate: startDate || null,
            endDate: endDate || null
          }
        }
      });
    }

    // Get PH and TCC data for each order using SQL Server
    const sqlPool = await getSqlServerConnection();
    const phData = [];
    const tccData = [];

    for (const order of ordersResult.rows) {
      const batchId = order.batch_id;
      const orderStartTime = order.log_open_dt_utc;
      const orderEndTime = order.log_close_dt_utc || new Date().toISOString();

      // Determine the appropriate tag name based on lot suffix
      const lotSuffix = order.lot_suffix;
      const phTagName = `RE1_${lotSuffix}_PHB.PV`;
      const tccTagName = `RE1_${lotSuffix}_TCC.PV`;

      try {
        // Get PH data
        const phQuery = `
          USE runtime;
          SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
            Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
          FROM (
            SELECT *
            FROM History
            WHERE History.TagName = '${phTagName}'
              AND wwRetrievalMode = 'Cyclic'
              AND wwCycleCount = 100
              AND wwQualityRule = 'Extended'
              AND wwVersion = 'Latest'
              AND DateTime >= '${orderStartTime}'
              AND DateTime <= '${orderEndTime}'
          ) temp
          WHERE temp.StartDateTime >= '${orderStartTime}'
          ORDER BY DateTime ASC
        `;

        const phResult = await sqlPool.request().query(phQuery);
        
        // Add batch information to PH data
        phResult.recordset.forEach(record => {
          phData.push({
            ...record,
            batch_id: batchId,
            lot_suffix: lotSuffix,
            order_start: orderStartTime,
            order_end: orderEndTime
          });
        });

        // Get TCC data
        const tccQuery = `
          USE runtime;
          SELECT temp.TagName, DateTime = convert(nvarchar, DateTime, 21), Value, vValue,
            Quality, QualityDetail = temp.QualityDetail, QualityString, wwResolution, StartDateTime
          FROM (
            SELECT *
            FROM History
            WHERE History.TagName = '${tccTagName}'
              AND wwRetrievalMode = 'Cyclic'
              AND wwCycleCount = 100
              AND wwQualityRule = 'Extended'
              AND wwVersion = 'Latest'
              AND DateTime >= '${orderStartTime}'
              AND DateTime <= '${orderEndTime}'
          ) temp
          WHERE temp.StartDateTime >= '${orderStartTime}'
          ORDER BY DateTime ASC
        `;

        const tccResult = await sqlPool.request().query(tccQuery);
        
        // Add batch information to TCC data
        tccResult.recordset.forEach(record => {
          tccData.push({
            ...record,
            batch_id: batchId,
            lot_suffix: lotSuffix,
            order_start: orderStartTime,
            order_end: orderEndTime
          });
        });

      } catch (sqlError) {
        console.error(`Error fetching PH/TCC data for batch ${batchId}:`, sqlError);
        // Continue with next order even if one fails
      }
    }

    // Generate summary statistics
    const summary = {
      totalOrders: ordersResult.rows.length,
      activeOrders: ordersResult.rows.filter(o => o.status === 'active').length,
      completedOrders: ordersResult.rows.filter(o => o.status === 'completed').length,
      batchPattern: batchPattern || 'all',
      phDataPoints: phData.length,
      tccDataPoints: tccData.length,
      dateRange: { startDate: startDate || null, endDate: endDate || null }
    };

    res.json({
      orders: ordersResult.rows,
      phData,
      tccData,
      summary
    });

  } catch (error) {
    console.error('Error in batch pattern analysis:', error);
    res.status(500).json({ error: 'Failed to perform batch pattern analysis' });
  }
});

export default router; 