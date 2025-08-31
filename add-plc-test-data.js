// Script to add test data for PLC orders with test results
// This script will create sample PLC orders and corresponding test results

const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'inspection_db',
  password: 'password',
  port: 5432,
});

async function addPlcTestData() {
  const client = await pool.connect();
  
  try {
    console.log('Adding PLC test data...');
    
    // Add sample PLC orders
    const plcOrders = [
      {
        Batch_Log_ID: 'BL001',
        Campaign_ID: 'CAMP001',
        Lot_ID: 'LOT001',
        Batch_ID: 'BATCH001',
        Product_ID: 'PROD001',
        Product_Name: 'Product A',
        Recipe_ID: 'REC001',
        Recipe_Name: 'Recipe A',
        Train_ID: 'TRAIN1',
        Batch_Size: 1000,
        Log_Open_DT_UTC: '2025-01-02T10:00:00Z',
        Log_Close_DT_UTC: null,
        Batch_Server_Name: 'SERVER1'
      },
      {
        Batch_Log_ID: 'BL002',
        Campaign_ID: 'CAMP002',
        Lot_ID: 'LOT002',
        Batch_ID: 'BATCH002',
        Product_ID: 'PROD002',
        Product_Name: 'Product B',
        Recipe_ID: 'REC002',
        Recipe_Name: 'Recipe B',
        Train_ID: 'TRAIN2',
        Batch_Size: 1500,
        Log_Open_DT_UTC: '2025-01-02T11:00:00Z',
        Log_Close_DT_UTC: '2025-01-02T15:00:00Z',
        Batch_Server_Name: 'SERVER2'
      },
      {
        Batch_Log_ID: 'BL003',
        Campaign_ID: 'CAMP003',
        Lot_ID: 'LOT003',
        Batch_ID: 'BATCH003',
        Product_ID: 'PROD003',
        Product_Name: 'Product C',
        Recipe_ID: 'REC003',
        Recipe_Name: 'Recipe C',
        Train_ID: 'TRAIN1',
        Batch_Size: 800,
        Log_Open_DT_UTC: '2025-01-02T12:00:00Z',
        Log_Close_DT_UTC: null,
        Batch_Server_Name: 'SERVER1'
      }
    ];

    // Insert PLC orders
    for (const order of plcOrders) {
      await client.query(`
        INSERT INTO plc_orders (
          Batch_Log_ID, Campaign_ID, Lot_ID, Batch_ID, Product_ID, Product_Name,
          Recipe_ID, Recipe_Name, Train_ID, Batch_Size, Log_Open_DT_UTC,
          Log_Close_DT_UTC, Batch_Server_Name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (Batch_Log_ID) DO NOTHING
      `, [
        order.Batch_Log_ID, order.Campaign_ID, order.Lot_ID, order.Batch_ID,
        order.Product_ID, order.Product_Name, order.Recipe_ID, order.Recipe_Name,
        order.Train_ID, order.Batch_Size, order.Log_Open_DT_UTC,
        order.Log_Close_DT_UTC, order.Batch_Server_Name
      ]);
    }

    // Add test results for PLC orders
    const testResults = [
      // Test results for BATCH001
      {
        id: 'TR_PLC_001',
        order_number: 'BATCH001',
        parameter_id: 'moisture',
        round: 1,
        value: 12.5,
        unit: '%',
        status: 'pass',
        operator_id: 'OP001',
        comments: 'Within acceptable range'
      },
      {
        id: 'TR_PLC_002',
        order_number: 'BATCH001',
        parameter_id: 'ph',
        round: 1,
        value: 6.2,
        unit: 'pH',
        status: 'pass',
        operator_id: 'OP001',
        comments: 'Good pH level'
      },
      {
        id: 'TR_PLC_003',
        order_number: 'BATCH001',
        parameter_id: 'viscosity',
        round: 1,
        value: 750.0,
        unit: 'cP',
        status: 'pass',
        operator_id: 'OP001',
        comments: 'Optimal viscosity'
      },
      
      // Test results for BATCH002
      {
        id: 'TR_PLC_004',
        order_number: 'BATCH002',
        parameter_id: 'moisture',
        round: 1,
        value: 13.8,
        unit: '%',
        status: 'warning',
        operator_id: 'OP002',
        comments: 'Slightly high moisture'
      },
      {
        id: 'TR_PLC_005',
        order_number: 'BATCH002',
        parameter_id: 'ph',
        round: 1,
        value: 7.8,
        unit: 'pH',
        status: 'warning',
        operator_id: 'OP002',
        comments: 'Approaching upper limit'
      },
      {
        id: 'TR_PLC_006',
        order_number: 'BATCH002',
        parameter_id: 'viscosity',
        round: 1,
        value: 680.0,
        unit: 'cP',
        status: 'pass',
        operator_id: 'OP002',
        comments: 'Completed successfully'
      },
      {
        id: 'TR_PLC_007',
        order_number: 'BATCH002',
        parameter_id: 'density',
        round: 1,
        value: 1.25,
        unit: 'g/cm³',
        status: 'pass',
        operator_id: 'OP002',
        comments: 'Completed successfully'
      },
      
      // Test results for BATCH003
      {
        id: 'TR_PLC_008',
        order_number: 'BATCH003',
        parameter_id: 'moisture',
        round: 1,
        value: 14.2,
        unit: '%',
        status: 'fail',
        operator_id: 'OP003',
        comments: 'Moisture too high'
      },
      {
        id: 'TR_PLC_009',
        order_number: 'BATCH003',
        parameter_id: 'ph',
        round: 1,
        value: 6.8,
        unit: 'pH',
        status: 'pass',
        operator_id: 'OP003',
        comments: 'Good pH level'
      }
    ];

    // Insert test results
    for (const result of testResults) {
      await client.query(`
        INSERT INTO test_results (
          id, order_number, parameter_id, round, value, unit,
          status, operator_id, comments
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [
        result.id, result.order_number, result.parameter_id, result.round,
        result.value, result.unit, result.status, result.operator_id, result.comments
      ]);
    }

    console.log('✅ PLC test data added successfully!');
    console.log(`- Added ${plcOrders.length} PLC orders`);
    console.log(`- Added ${testResults.length} test results`);
    
    // Verify the data
    const plcCount = await client.query('SELECT COUNT(*) FROM plc_orders');
    const testCount = await client.query('SELECT COUNT(*) FROM test_results');
    
    console.log(`- Total PLC orders in database: ${plcCount.rows[0].count}`);
    console.log(`- Total test results in database: ${testCount.rows[0].count}`);
    
    // Show sample data
    const samplePlc = await client.query('SELECT * FROM plc_orders LIMIT 1');
    const sampleTests = await client.query('SELECT * FROM test_results WHERE order_number LIKE \'BATCH%\' LIMIT 3');
    
    console.log('\nSample PLC order:', samplePlc.rows[0]);
    console.log('\nSample test results:', sampleTests.rows);

  } catch (error) {
    console.error('❌ Error adding PLC test data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
addPlcTestData(); 