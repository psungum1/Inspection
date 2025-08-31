import pool from './config.js';

const fixSchema = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔍 Checking existing tables...');
    
    // Check if test_stages table exists
    const stagesTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'test_stages'
      );
    `);
    
    if (!stagesTableExists.rows[0].exists) {
      console.log('📊 Creating test_stages table...');
      await client.query(`
        CREATE TABLE test_stages (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          "order" INTEGER NOT NULL DEFAULT 1,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default test stages
      await client.query(`
        INSERT INTO test_stages (name, description, "order", is_active) VALUES 
          ('Slurry', 'Initial slurry preparation stage', 1, true),
          ('Reaction', 'Main reaction process stage', 2, true),
          ('End Reaction', 'Final reaction completion stage', 3, true)
        ON CONFLICT (name) DO NOTHING
      `);
      
      console.log('✅ test_stages table created with default data');
    } else {
      console.log('✅ test_stages table already exists');
    }
    
    // Check if stage column exists in test_results
    const stageColumnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'test_results' AND column_name = 'stage'
      );
    `);
    
    if (!stageColumnExists.rows[0].exists) {
      console.log('📊 Adding stage column to test_results...');
      await client.query(`
        ALTER TABLE test_results ADD COLUMN stage VARCHAR(100)
      `);
      console.log('✅ stage column added to test_results');
    } else {
      console.log('✅ stage column already exists in test_results');
    }
    
    // Check if updated_at trigger function exists
    const triggerFunctionExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc WHERE proname = 'update_updated_at_column'
      );
    `);
    
    if (!triggerFunctionExists.rows[0].exists) {
      console.log('📊 Creating updated_at trigger function...');
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);
      console.log('✅ updated_at trigger function created');
    } else {
      console.log('✅ updated_at trigger function already exists');
    }
    
    // Check if test_stages trigger exists
    const testStagesTriggerExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_trigger WHERE tgname = 'update_test_stages_updated_at'
      );
    `);
    
    if (!testStagesTriggerExists.rows[0].exists) {
      console.log('📊 Creating trigger for test_stages...');
      await client.query(`
        DROP TRIGGER IF EXISTS update_test_stages_updated_at ON test_stages;
        CREATE TRIGGER update_test_stages_updated_at
          BEFORE UPDATE ON test_stages
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `);
      console.log('✅ test_stages trigger created');
    } else {
      console.log('✅ test_stages trigger already exists');
    }
    
    await client.query('COMMIT');
    console.log('🎉 Schema fix completed successfully!');
    
    // Show current state
    console.log('\n📋 Current database state:');
    
    const stages = await client.query('SELECT * FROM test_stages ORDER BY "order"');
    console.log(`\nTest Stages (${stages.rows.length}):`);
    stages.rows.forEach(stage => {
      console.log(`  - ${stage.name}: ${stage.description}`);
    });
    
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'test_results' 
      ORDER BY ordinal_position
    `);
    console.log(`\nTest Results columns (${columns.rows.length}):`);
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing schema:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run schema fix
fixSchema()
  .then(() => {
    console.log('🎉 Schema fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Schema fix failed:', error);
    process.exit(1);
  });
