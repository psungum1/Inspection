// Script to add product parameters for testing
// This script creates product-specific parameters for different products

const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'inspection_db',
  password: 'password',
  port: 5432,
});

async function addProductParameters() {
  const client = await pool.connect();
  
  try {
    console.log('Adding product parameters for testing...');
    
    // Define product parameters for different products
    const productParameters = [
      // Product A - 4 parameters
      {
        product_name: 'Product A',
        parameter_name: 'moisture',
        parameter_order: 1,
        unit: '%',
        acceptable_min: 10.0,
        acceptable_max: 15.0,
        warning_min: 11.0,
        warning_max: 14.0,
        critical_min: 9.0,
        critical_max: 16.0
      },
      {
        product_name: 'Product A',
        parameter_name: 'ph',
        parameter_order: 2,
        unit: 'pH',
        acceptable_min: 5.0,
        acceptable_max: 8.0,
        warning_min: 5.5,
        warning_max: 7.5,
        critical_min: 4.0,
        critical_max: 9.0
      },
      {
        product_name: 'Product A',
        parameter_name: 'viscosity',
        parameter_order: 3,
        unit: 'cP',
        acceptable_min: 500.0,
        acceptable_max: 1000.0,
        warning_min: 600.0,
        warning_max: 900.0,
        critical_min: 400.0,
        critical_max: 1100.0
      },
      {
        product_name: 'Product A',
        parameter_name: 'density',
        parameter_order: 4,
        unit: 'g/cm³',
        acceptable_min: 1.0,
        acceptable_max: 1.5,
        warning_min: 1.1,
        warning_max: 1.4,
        critical_min: 0.9,
        critical_max: 1.6
      },
      
      // Product B - 6 parameters
      {
        product_name: 'Product B',
        parameter_name: 'moisture',
        parameter_order: 1,
        unit: '%',
        acceptable_min: 12.0,
        acceptable_max: 18.0,
        warning_min: 13.0,
        warning_max: 17.0,
        critical_min: 11.0,
        critical_max: 19.0
      },
      {
        product_name: 'Product B',
        parameter_name: 'ph',
        parameter_order: 2,
        unit: 'pH',
        acceptable_min: 6.0,
        acceptable_max: 9.0,
        warning_min: 6.5,
        warning_max: 8.5,
        critical_min: 5.5,
        critical_max: 9.5
      },
      {
        product_name: 'Product B',
        parameter_name: 'viscosity',
        parameter_order: 3,
        unit: 'cP',
        acceptable_min: 600.0,
        acceptable_max: 1200.0,
        warning_min: 700.0,
        warning_max: 1100.0,
        critical_min: 500.0,
        critical_max: 1300.0
      },
      {
        product_name: 'Product B',
        parameter_name: 'density',
        parameter_order: 4,
        unit: 'g/cm³',
        acceptable_min: 1.2,
        acceptable_max: 1.8,
        warning_min: 1.3,
        warning_max: 1.7,
        critical_min: 1.1,
        critical_max: 1.9
      },
      {
        product_name: 'Product B',
        parameter_name: 'temperature',
        parameter_order: 5,
        unit: '°C',
        acceptable_min: 20.0,
        acceptable_max: 30.0,
        warning_min: 22.0,
        warning_max: 28.0,
        critical_min: 18.0,
        critical_max: 32.0
      },
      {
        product_name: 'Product B',
        parameter_name: 'pressure',
        parameter_order: 6,
        unit: 'bar',
        acceptable_min: 1.0,
        acceptable_max: 2.0,
        warning_min: 1.2,
        warning_max: 1.8,
        critical_min: 0.8,
        critical_max: 2.2
      },
      
      // Product C - 3 parameters
      {
        product_name: 'Product C',
        parameter_name: 'moisture',
        parameter_order: 1,
        unit: '%',
        acceptable_min: 8.0,
        acceptable_max: 12.0,
        warning_min: 9.0,
        warning_max: 11.0,
        critical_min: 7.0,
        critical_max: 13.0
      },
      {
        product_name: 'Product C',
        parameter_name: 'ph',
        parameter_order: 2,
        unit: 'pH',
        acceptable_min: 4.5,
        acceptable_max: 7.0,
        warning_min: 5.0,
        warning_max: 6.5,
        critical_min: 4.0,
        critical_max: 7.5
      },
      {
        product_name: 'Product C',
        parameter_name: 'conductivity',
        parameter_order: 3,
        unit: 'mS/cm',
        acceptable_min: 0.5,
        acceptable_max: 2.0,
        warning_min: 0.7,
        warning_max: 1.8,
        critical_min: 0.3,
        critical_max: 2.2
      }
    ];

    // Insert product parameters
    for (const param of productParameters) {
      await client.query(`
        INSERT INTO product_parameters (
          product_name, parameter_name, parameter_order, unit,
          acceptable_min, acceptable_max, warning_min, warning_max,
          critical_min, critical_max
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (product_name, parameter_name) DO UPDATE SET
          parameter_order = EXCLUDED.parameter_order,
          unit = EXCLUDED.unit,
          acceptable_min = EXCLUDED.acceptable_min,
          acceptable_max = EXCLUDED.acceptable_max,
          warning_min = EXCLUDED.warning_min,
          warning_max = EXCLUDED.warning_max,
          critical_min = EXCLUDED.critical_min,
          critical_max = EXCLUDED.critical_max
      `, [
        param.product_name, param.parameter_name, param.parameter_order, param.unit,
        param.acceptable_min, param.acceptable_max, param.warning_min, param.warning_max,
        param.critical_min, param.critical_max
      ]);
    }

    console.log('✅ Product parameters added successfully!');
    console.log(`- Added ${productParameters.length} product parameters`);
    
    // Verify the data
    const productCount = await client.query(`
      SELECT product_name, COUNT(*) as param_count
      FROM product_parameters 
      GROUP BY product_name 
      ORDER BY product_name
    `);
    
    console.log('\nProduct parameters summary:');
    productCount.rows.forEach(row => {
      console.log(`  - ${row.product_name}: ${row.param_count} parameters`);
    });
    
    // Show sample data
    const sampleParams = await client.query(`
      SELECT * FROM product_parameters 
      WHERE product_name = 'Product A' 
      ORDER BY parameter_order
    `);
    
    console.log('\nSample Product A parameters:');
    sampleParams.rows.forEach(param => {
      console.log(`  - ${param.parameter_name}: ${param.acceptable_min}-${param.acceptable_max} ${param.unit}`);
    });

  } catch (error) {
    console.error('❌ Error adding product parameters:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
addProductParameters(); 