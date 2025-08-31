import express from 'express';
import pool from '../database/config.js';
import { getSqlServerConnection } from '../database/sqlServer.js';

const router = express.Router();

// Get Flow Rate for an order (by Batch_ID) calculated from ProcessVar and MaterialInput
// Formula: mi.Actual_Qty / (CAST(pv.Actual_Value as float) / 60)
// Filters: pv.Operation_ID='VAM' AND pv.Phase_ID='Rx_time1' AND pv.Parameter_ID='Time' AND mi.Phase_ID='VAM_Add'
router.get('/sqlserver/flow-rate/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const sqlPool = await getSqlServerConnection();

    // Use BatchIdLog to translate Batch_ID -> Batch_Log_ID then compute flow rate
    const query = `
      USE BatchHistory;
      SET NOCOUNT ON;
      SELECT TOP 1
        pv.Batch_Log_ID,
        mi.Actual_Qty,
        pv.Actual_Value,
        TRY_CAST(mi.Actual_Qty as float) / NULLIF(TRY_CAST(pv.Actual_Value as float) / 60.0, 0) as flowRate
      FROM [BatchHistory].[dbo].[ProcessVar] pv
      LEFT JOIN [BatchHistory].[dbo].[MaterialInput] mi ON pv.Batch_Log_ID = mi.Batch_Log_ID
      LEFT JOIN [BatchHistory].[dbo].[BatchIdLog] bi ON pv.Batch_Log_ID = bi.Batch_Log_ID
      WHERE pv.Operation_ID = 'VAM'
        AND pv.Phase_ID = 'Rx_time1'
        AND pv.Parameter_ID = 'Time'
        AND mi.Phase_ID = 'VAM_Add'
        AND bi.Batch_ID = @batchId
      ORDER BY pv.DateTimeUTC DESC`;

    const request = sqlPool.request();
    request.input('batchId', batchId);
    const result = await request.query(query);

    if (!result.recordset || result.recordset.length === 0) {
      return res.json({ success: true, data: null });
    }

    const row = result.recordset[0];
    res.json({
      success: true,
      data: {
        batchLogId: row.Batch_Log_ID,
        actualQty: row.Actual_Qty,
        actualValue: row.Actual_Value,
        flowRate: row.flowRate,
      },
    });
  } catch (err) {
    console.error('SQL Server flow rate error:', err);
    res.status(500).json({ error: 'Failed to fetch flow rate', details: err.message });
  }
});

// Get MaterialInput data by batch ID from SQL Server
router.get('/sqlserver/material-inputs/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const sqlPool = await getSqlServerConnection();
    
    // Query MaterialInput table for specific batch
    const query = `
      SELECT 
        mi.Batch_Log_ID,
        bi.Product_Name,
        bi.Batch_ID,
        bi.Lot_ID,
        mi.UnitOrConnection,
        mi.Material_ID,
        mi.Material_Name,
        mi.Actual_Qty,
        mi.UnitOfMeasure,
        mi.DateTimeUTC
      FROM [BatchHistory].[dbo].[MaterialInput] mi
      LEFT JOIN [BatchHistory].[dbo].[BatchIdLog] bi ON mi.Batch_Log_ID = bi.Batch_Log_ID
      WHERE bi.Batch_ID = @batchId
    `;
    
    const request = sqlPool.request();
    request.input('batchId', batchId);
    
    const result = await request.query(query);
    console.log('MaterialInput query result for batchId:', batchId, {
      recordCount: result.recordset.length,
      sampleRecord: result.recordset[0]
    });
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Server error:', err);
    res.status(500).json({ error: 'Failed to fetch MaterialInput data 1', details: err.message });
  }
});

// Get MaterialInput data with date range filter

router.get('/sqlserver/material-inputs', async (req, res) => {
  try {
    const { startDate, endDate, batchId } = req.query;
    const sqlPool = await getSqlServerConnection();
    
    let query = `
      SELECT 
        mi.Batch_Log_ID,
        bi.Batch_ID,
        mi.UnitOrConnection,
        mi.Material_ID,
        mi.Material_Name,
        mi.Actual_Qty,
        mi.UnitOfMeasure,
        mi.DateTimeUTC
      FROM [BatchHistory].[dbo].[MaterialInput] mi
      LEFT JOIN [BatchHistory].[dbo].[BatchIdLog] bi ON mi.Batch_Log_ID = bi.Batch_Log_ID
      WHERE 1=1
    `;
    const params = [];
    
    // Add batch ID filter if provided
    if (batchId) {
      query += ' AND bi.Batch_ID = @batchId';
      params.push({ name: 'batchId', value: batchId });
    }
    
    // Add date filtering if provided
    if (startDate) {
      query += ' AND mi.DateTimeUTC >= @startDate';
      params.push({ name: 'startDate', value: startDate });
    }
    if (endDate) {
      query += ' AND mi.DateTimeUTC <= @endDate';
      params.push({ name: 'endDate', value: endDate });
    }
    
    query += ' ORDER BY mi.DateTimeUTC DESC';
    
    const request = sqlPool.request();
    params.forEach(param => {
      request.input(param.name, param.value);
    });
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Server error:', err);
    res.status(500).json({ error: 'Failed to fetch from SQL Server', details: err.message });
  }
});


// 2. Import data into PostgreSQL
router.post('/import/material-inputs', async (req, res) => {
  try {
    const { data } = req.body; // expects array of rows
    if (!Array.isArray(data)) return res.status(400).json({ error: 'Data must be an array' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const row of data) {
        await client.query(
          `INSERT INTO material_inputs (material_code, material_name, batch_number, quantity, unit, input_date)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (batch_number) DO NOTHING`,
          [
            row.MaterialCode,
            row.MaterialName,
            row.BatchNumber,
            row.Quantity,
            row.Unit,
            row.InputDate
          ]
        );
      }
      await client.query('COMMIT');
      res.json({ message: `Imported ${data.length} records.` });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to import', details: err.message });
  }
});

// Import data into orders table
router.post('/import/plc-orders', async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) return res.status(400).json({ error: 'Data must be an array' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const row of data) {
        await client.query(
          `INSERT INTO plc_orders (
            Batch_Log_ID, Campaign_ID, Lot_ID, Batch_ID, Product_ID, Product_Name, Recipe_ID, Recipe_Name,
            Recipe_Version, Recipe_State, Recipe_Type, Recipe_Approval_CD, Train_ID, Batch_Size, Archive_CD,
            Log_Open_DT, Log_Close_DT, Batch_Server_Name, Formula_Name, Batch_Auto_Start, Log_Open_DT_UTC, Log_Close_DT_UTC
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
          ) ON CONFLICT (Batch_Log_ID) DO NOTHING`,
          [
            row.Batch_Log_ID, row.Campaign_ID, row.Lot_ID, row.Batch_ID, row.Product_ID, row.Product_Name, row.Recipe_ID, row.Recipe_Name,
            row.Recipe_Version, row.Recipe_State, row.Recipe_Type, row.Recipe_Approval_CD, row.Train_ID, row.Batch_Size, row.Archive_CD,
            row.Log_Open_DT, row.Log_Close_DT, row.Batch_Server_Name, row.Formula_Name, row.Batch_Auto_Start, row.Log_Open_DT_UTC, row.Log_Close_DT_UTC
          ]
        );
      }
      await client.query('COMMIT');
      res.json({ message: `Imported ${data.length} records.` });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to import', details: err.message });
  }
});

// Debug endpoint to check material input data structure
router.get('/debug/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    console.log(`Debug: Checking material inputs for batch ${batchId}`);
    
    const sqlPool = await getSqlServerConnection();
    const results = {};
    
    // 1. Check MaterialInput table directly
    const directQuery = `
      SELECT TOP 10
        mi.*,
        CONVERT(varchar, mi.DateTimeUTC, 120) as formatted_datetime
      FROM [BatchHistory].[dbo].[MaterialInput] mi
      WHERE mi.Batch_Log_ID IN (
        SELECT Batch_Log_ID FROM [BatchHistory].[dbo].[BatchIdLog] WHERE Batch_ID = @batchId
      )
      ORDER BY mi.DateTimeUTC DESC
    `;
    const request1 = sqlPool.request();
    request1.input('batchId', batchId);
    const directResults = await request1.query(directQuery);
    
    results.direct_material_inputs = {
      count: directResults.recordset.length,
      data: directResults.recordset
    };
    
    // 2. Check BatchIdLog table for this batch
    const batchLogQuery = `
      SELECT * FROM [BatchHistory].[dbo].[BatchIdLog]
      WHERE Batch_ID = @batchId
    `;
    const request2 = sqlPool.request();
    request2.input('batchId', batchId);
    const batchLogResults = await request2.query(batchLogQuery);
    
    results.batch_log_entries = {
      count: batchLogResults.recordset.length,
      data: batchLogResults.recordset
    };
    
    // 3. Check with JOIN (same as current API)
    const joinQuery = `
      SELECT TOP 10
        mi.Batch_Log_ID,
        bi.Product_Name,
        bi.Batch_ID,
        bi.Lot_ID,
        mi.UnitOrConnection,
        mi.Material_ID,
        mi.Material_Name,
        mi.Actual_Qty,
        mi.UnitOfMeasure,
        mi.DateTimeUTC,
        CONVERT(varchar, mi.DateTimeUTC, 120) as formatted_datetime
      FROM [BatchHistory].[dbo].[MaterialInput] mi
      LEFT JOIN [BatchHistory].[dbo].[BatchIdLog] bi ON mi.Batch_Log_ID = bi.Batch_Log_ID
      WHERE bi.Batch_ID = @batchId
      ORDER BY mi.DateTimeUTC DESC
    `;
    const request3 = sqlPool.request();
    request3.input('batchId', batchId);
    const joinResults = await request3.query(joinQuery);
    
    results.join_material_inputs = {
      count: joinResults.recordset.length,
      data: joinResults.recordset
    };
    
    // 4. Check for similar batch IDs
    const similarQuery = `
      SELECT DISTINCT Batch_ID FROM [BatchHistory].[dbo].[BatchIdLog]
      WHERE Batch_ID LIKE '%' + @partialBatch + '%'
      ORDER BY Batch_ID
    `;
    const request4 = sqlPool.request();
    request4.input('partialBatch', batchId.slice(-6)); // Last 6 characters
    const similarResults = await request4.query(similarQuery);
    
    results.similar_batch_ids = {
      count: similarResults.recordset.length,
      data: similarResults.recordset
    };
    
    // 5. Recent MaterialInput entries
    const recentQuery = `
      SELECT TOP 10
        mi.Material_Name,
        bi.Batch_ID,
        mi.DateTimeUTC,
        CONVERT(varchar, mi.DateTimeUTC, 120) as formatted_datetime
      FROM [BatchHistory].[dbo].[MaterialInput] mi
      LEFT JOIN [BatchHistory].[dbo].[BatchIdLog] bi ON mi.Batch_Log_ID = bi.Batch_Log_ID
      ORDER BY mi.DateTimeUTC DESC
    `;
    const recentResults = await sqlPool.query(recentQuery);
    
    results.recent_material_inputs = {
      count: recentResults.recordset.length,
      data: recentResults.recordset
    };
    
    res.json({
      success: true,
      batch_id: batchId,
      debug_info: results
    });
    
  } catch (error) {
    console.error('Debug material inputs error:', error);
    res.status(500).json({ 
      error: 'Failed to debug material inputs', 
      details: error.message 
    });
  }
});

export default router; 