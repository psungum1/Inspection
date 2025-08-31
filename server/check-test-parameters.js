import pool from './src/database/config.js';

async function checkAndCreateTestParameters() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking test_parameters table...\n');
    
    // Get all test parameters
    const testParamsResult = await client.query('SELECT id, name FROM test_parameters ORDER BY name');
    console.log('Existing test parameters:');
    testParamsResult.rows.forEach(param => {
      console.log(`  - ${param.id}: ${param.name}`);
    });
    
    console.log('\n🔍 Checking product_parameters table...\n');
    
    // Get all product parameters
    const productParamsResult = await client.query('SELECT DISTINCT parameter_name FROM product_parameters ORDER BY parameter_name');
    console.log('Product parameter names:');
    productParamsResult.rows.forEach(param => {
      console.log(`  - ${param.parameter_name}`);
    });
    
    // Find missing test parameters
    const existingTestParamNames = testParamsResult.rows.map(p => p.name);
    const productParamNames = productParamsResult.rows.map(p => p.parameter_name);
    
    const missingParams = productParamNames.filter(name => !existingTestParamNames.includes(name));
    
    if (missingParams.length > 0) {
      console.log('\n⚠️  Missing test parameters that need to be created:');
      missingParams.forEach(name => {
        console.log(`  - ${name}`);
      });
      
      console.log('\n📝 Creating missing test parameters...');
      
      for (const paramName of missingParams) {
        // Generate a better ID based on the parameter name
        let paramId = paramName.toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        
        // If the ID is empty or too short, use a fallback
        if (!paramId || paramId.length < 2) {
          paramId = `param_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        }
        
        try {
          await client.query(
            `INSERT INTO test_parameters (id, name, unit, min_value, max_value, warning_min, warning_max, category, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [paramId, paramName, 'N/A', 0, 100, 0, 100, 'Product Parameters', `Auto-created for ${paramName}`]
          );
          console.log(`✅ Created: ${paramId} - ${paramName}`);
        } catch (error) {
          if (error.code === '23505') { // Unique violation
            console.log(`⚠️  Skipped (already exists): ${paramId} - ${paramName}`);
          } else {
            console.error(`❌ Error creating ${paramName}:`, error.message);
          }
        }
      }
    } else {
      console.log('\n✅ All product parameters have corresponding test parameters!');
    }
    
    console.log('\n🎉 Check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkAndCreateTestParameters(); 