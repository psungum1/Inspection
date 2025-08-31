import pool from './config.js';

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'quality_manager', 'operator', 'viewer')),
        permissions TEXT[] DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_preferences table for storing per-user settings (e.g., dashboard layout)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pref_key VARCHAR(100) NOT NULL,
        pref_value JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, pref_key)
      )
    `);

    // Create test_parameters table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_parameters (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        min_value DECIMAL(10,3) NOT NULL,
        max_value DECIMAL(10,3) NOT NULL,
        warning_min DECIMAL(10,3) NOT NULL,
        warning_max DECIMAL(10,3) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create production_orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS production_orders (
        order_number VARCHAR(50) PRIMARY KEY,
        line_number INTEGER NOT NULL,
        production_date_time TIMESTAMP NOT NULL,
        operator_id VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create test_results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_results (
        id VARCHAR(50) PRIMARY KEY,
        order_number VARCHAR(50) NOT NULL REFERENCES production_orders(order_number) ON DELETE CASCADE,
        parameter_id VARCHAR(50) NOT NULL REFERENCES test_parameters(id) ON DELETE CASCADE,
        round INTEGER NOT NULL,
        stage VARCHAR(100),
        value DECIMAL(10,3) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pass', 'warning', 'fail')),
        operator_id VARCHAR(50) NOT NULL,
        comments TEXT,
        attachments TEXT[],
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create dashboard_metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dashboard_metrics (
        id SERIAL PRIMARY KEY,
        active_orders INTEGER DEFAULT 0,
        completed_today INTEGER DEFAULT 0,
        tests_pending INTEGER DEFAULT 0,
        quality_compliance DECIMAL(5,2) DEFAULT 0,
        line_utilization JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create plc_orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS plc_orders (
        Batch_Log_ID VARCHAR(100) PRIMARY KEY,
        Campaign_ID VARCHAR(100),
        Lot_ID VARCHAR(100),
        Batch_ID VARCHAR(100),
        Product_ID VARCHAR(100),
        Product_Name VARCHAR(255),
        Recipe_ID VARCHAR(100),
        Recipe_Name VARCHAR(255),
        Recipe_Version VARCHAR(50),
        Recipe_State VARCHAR(50),
        Recipe_Type VARCHAR(50),
        Recipe_Approval_CD VARCHAR(50),
        Train_ID VARCHAR(100),
        Batch_Size NUMERIC,
        Archive_CD VARCHAR(50),
        Log_Open_DT TIMESTAMP,
        Log_Close_DT TIMESTAMP,
        Batch_Server_Name VARCHAR(255),
        Formula_Name VARCHAR(255),
        Batch_Auto_Start BOOLEAN,
        Log_Open_DT_UTC TIMESTAMP,
        Log_Close_DT_UTC TIMESTAMP
      )
    `);

    // Create product_parameters table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_parameters (
        id SERIAL PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        parameter_name VARCHAR(255) NOT NULL,
        parameter_order INTEGER NOT NULL
      )
    `);

    // Add range columns to product_parameters table
    await client.query(`
      ALTER TABLE product_parameters
      ADD COLUMN IF NOT EXISTS unit VARCHAR(50),
      ADD COLUMN IF NOT EXISTS acceptable_min DECIMAL(10,3),
      ADD COLUMN IF NOT EXISTS acceptable_max DECIMAL(10,3),
      ADD COLUMN IF NOT EXISTS warning_min DECIMAL(10,3),
      ADD COLUMN IF NOT EXISTS warning_max DECIMAL(10,3),
      ADD COLUMN IF NOT EXISTS critical_min DECIMAL(10,3),
      ADD COLUMN IF NOT EXISTS critical_max DECIMAL(10,3)
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_test_results_order_number ON test_results(order_number);
      CREATE INDEX IF NOT EXISTS idx_test_results_parameter_id ON test_results(parameter_id);
      CREATE INDEX IF NOT EXISTS idx_test_results_timestamp ON test_results(timestamp);
      CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
      CREATE INDEX IF NOT EXISTS idx_production_orders_line_number ON production_orders(line_number);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

    // Create updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
      CREATE TRIGGER update_user_preferences_updated_at
        BEFORE UPDATE ON user_preferences
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_test_parameters_updated_at ON test_parameters;
      CREATE TRIGGER update_test_parameters_updated_at
        BEFORE UPDATE ON test_parameters
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_production_orders_updated_at ON production_orders;
      CREATE TRIGGER update_production_orders_updated_at
        BEFORE UPDATE ON production_orders
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_dashboard_metrics_updated_at ON dashboard_metrics;
      CREATE TRIGGER update_dashboard_metrics_updated_at
        BEFORE UPDATE ON dashboard_metrics
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create test_stages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_stages (
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

    // Create trigger for test_stages updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_test_stages_updated_at ON test_stages;
      CREATE TRIGGER update_test_stages_updated_at
        BEFORE UPDATE ON test_stages
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migrations
createTables()
  .then(() => {
    console.log('🎉 Database migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }); 