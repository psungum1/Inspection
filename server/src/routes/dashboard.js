import express from 'express';
import pool from '../database/config.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    // Get active orders count from plc_orders (Log_Close_DT_UTC IS NULL)
    const activeOrdersResult = await pool.query(
      'SELECT COUNT(*) as count FROM plc_orders WHERE Log_Close_DT_UTC IS NULL'
    );
    const activeOrders = parseInt(activeOrdersResult.rows[0].count);

    // Get completed orders today from plc_orders (DATE(Log_Close_DT_UTC) = today)
    const today = new Date().toISOString().split('T')[0];
    const completedTodayResult = await pool.query(
      'SELECT COUNT(*) as count FROM plc_orders WHERE DATE(Log_Close_DT_UTC) = $1',
      [today]
    );
    const completedToday = parseInt(completedTodayResult.rows[0].count);

    // Get tests pending: active plc_orders that do not have any test_results yet
    const pendingTestsResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM plc_orders po
       WHERE po.Log_Close_DT_UTC IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM test_results tr WHERE tr.order_number = po.Batch_ID
         )`
    );
    const testsPending = parseInt(pendingTestsResult.rows[0].count || 0);

    // Get quality compliance
    const qualityResult = await pool.query(`
      SELECT 
        COUNT(*) as total_tests,
        COUNT(CASE WHEN status = 'pass' THEN 1 END) as passed_tests
      FROM test_results
    `);
    
    const totalTests = parseInt(qualityResult.rows[0].total_tests);
    const passedTests = parseInt(qualityResult.rows[0].passed_tests);
    const qualityCompliance = totalTests > 0 ? (passedTests / totalTests) * 100 : 100;

    // Get line utilization from plc_orders
    // Rule:
    // - Determine line by RIGHT(lot_id, 1) => 1..6
    // - Consider only active orders where Log_Close_DT_UTC IS NULL
    // - If a line has at least one active order => 100%, else 0%
    // - Provide a product_name sample for each line (NULL if none)
    // - Also provide lot_id and batch_id for active lines
    const lineUtilizationQuery = await pool.query(`
      WITH lines AS (
        SELECT generate_series(1, 6) AS line
      ),
      active AS (
        SELECT RIGHT(lot_id, 1)::int AS line, product_name, lot_id, batch_id
        FROM plc_orders
        WHERE Log_Close_DT_UTC IS NULL
      )
      SELECT 
        l.line,
        CASE WHEN COUNT(a.line) > 0 THEN 100 ELSE 0 END AS percent,
        MAX(a.product_name) AS product_name,
        MAX(a.lot_id) AS lot_id,
        MAX(a.batch_id) AS batch_id
      FROM lines l
      LEFT JOIN active a ON a.line = l.line
      GROUP BY l.line
      ORDER BY l.line
    `);

    const lineUtilization = {};
    lineUtilizationQuery.rows.forEach(row => {
      lineUtilization[row.line] = {
        percent: parseFloat(row.percent),
        productName: row.product_name || null,
        lotId: row.lot_id || null,
        batchId: row.batch_id || null
      };
    });

    // Calculate total rounds for active orders
    const totalRoundsResult = await pool.query(`
      SELECT 
        po.line_number,
        COUNT(DISTINCT tr.round) as total_rounds
      FROM production_orders po
      LEFT JOIN test_results tr ON po.order_number = tr.order_number
      WHERE po.status = 'active'
      GROUP BY po.line_number
    `);

    let totalRoundsActiveOrders = 0;
    totalRoundsResult.rows.forEach(row => {
      totalRoundsActiveOrders += parseInt(row.total_rounds || 0);
    });

    const metrics = {
      activeOrders,
      completedToday,
      testsPending,
      qualityCompliance: Math.round(qualityCompliance * 100) / 100,
      lineUtilization,
      totalRoundsActiveOrders
    };

    res.json(metrics);

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard metrics' 
    });
  }
});

// Get recent activity
router.get('/recent-activity', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const activityResult = await pool.query(`
      SELECT 
        'test_result' as type,
        tr.id,
        tr.order_number,
        tr.status,
        tr.timestamp,
        tr.operator_id,
        tp.name as parameter_name,
        CONCAT('Test result recorded for ', tr.order_number, ' - ', tp.name) as message
      FROM test_results tr
      JOIN test_parameters tp ON tr.parameter_id = tp.id
      
      UNION ALL
      
      SELECT 
        'order' as type,
        po.order_number as id,
        po.order_number,
        po.status,
        po.updated_at as timestamp,
        po.operator_id,
        NULL as parameter_name,
        CONCAT('Order ', po.order_number, ' ', po.status) as message
      FROM production_orders po
      
      ORDER BY timestamp DESC
      LIMIT $1
    `, [limit]);

    res.json(activityResult.rows);

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent activity' 
    });
  }
});

// Get production chart data
router.get('/production-chart', authenticateToken, async (req, res) => {
  try {
    const timeRange = req.query.range || '24h';
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // 24h
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const chartDataResult = await pool.query(`
      SELECT 
        DATE_TRUNC('hour', po.production_date_time) as time_bucket,
        COUNT(*) as production_count,
        AVG(CASE WHEN tr.status = 'pass' THEN 100 ELSE 0 END) as quality_score,
        AVG(CASE WHEN tr.status = 'pass' THEN 100 
                 WHEN tr.status = 'warning' THEN 75 
                 ELSE 50 END) as efficiency
      FROM production_orders po
      LEFT JOIN test_results tr ON po.order_number = tr.order_number
      WHERE po.production_date_time >= $1
      GROUP BY time_bucket
      ORDER BY time_bucket
    `, [startDate]);

    const chartData = chartDataResult.rows.map(row => ({
      time: new Date(row.time_bucket).toLocaleString(),
      production: parseInt(row.production_count || 0),
      quality: Math.round(parseFloat(row.quality_score || 0)),
      efficiency: Math.round(parseFloat(row.efficiency || 0))
    }));

    res.json(chartData);

  } catch (error) {
    console.error('Error fetching production chart data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch production chart data' 
    });
  }
});

// Get trend data for specific line and parameter
router.get('/trend/:lineNumber/:parameterId', authenticateToken, async (req, res) => {
  try {
    const { lineNumber, parameterId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const trendDataResult = await pool.query(`
      SELECT 
        tr.value,
        tr.status,
        tr.timestamp,
        tr.round,
        po.order_number
      FROM test_results tr
      JOIN production_orders po ON tr.order_number = po.order_number
      WHERE po.line_number = $1 
        AND tr.parameter_id = $2
      ORDER BY tr.timestamp DESC
      LIMIT $3
    `, [lineNumber, parameterId, limit]);

    // Get parameter details for min/max values
    const parameterResult = await pool.query(
      'SELECT * FROM test_parameters WHERE id = $1',
      [parameterId]
    );

    if (parameterResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Parameter not found' 
      });
    }

    const parameter = parameterResult.rows[0];

    const trendData = trendDataResult.rows.map(row => ({
      value: parseFloat(row.value),
      status: row.status,
      timestamp: row.timestamp,
      round: row.round,
      orderNumber: row.order_number
    }));

    res.json({
      parameter,
      trendData: trendData.reverse() // Reverse to show chronological order
    });

  } catch (error) {
    console.error('Error fetching trend data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trend data' 
    });
  }
});

export default router; 