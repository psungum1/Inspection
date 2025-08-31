import pool from './config.js';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Hash passwords
    const passwordHash = await bcrypt.hash('password123', 10);
    const adminPasswordHash = await bcrypt.hash('admin123', 10);

    // Insert users
    await client.query(`
      INSERT INTO users (name, email, password_hash, role, permissions) VALUES
      ('Sarah Johnson', 'sarah.johnson@company.com', $1, 'quality_manager', ARRAY['read', 'write', 'admin']),
      ('John Smith', 'john.smith@company.com', $1, 'operator', ARRAY['read', 'write']),
      ('Admin User', 'admin@company.com', $2, 'admin', ARRAY['read', 'write', 'admin'])
      ON CONFLICT (email) DO NOTHING
    `, [passwordHash, adminPasswordHash]);

    // Insert test parameters
    await client.query(`
      INSERT INTO test_parameters (id, name, unit, min_value, max_value, warning_min, warning_max, category, description) VALUES
      ('moisture', 'Moisture Content', '%', 10.0, 15.0, 11.0, 14.0, 'Physical Properties', 'Moisture content measurement'),
      ('ph', 'pH Level', 'pH', 5.0, 8.0, 5.5, 7.5, 'Chemical Properties', 'pH level measurement'),
      ('viscosity', 'Viscosity', 'cP', 500.0, 1000.0, 600.0, 900.0, 'Physical Properties', 'Viscosity measurement'),
      ('density', 'Density', 'g/cm³', 1.0, 1.5, 1.1, 1.4, 'Physical Properties', 'Density measurement')
      ON CONFLICT (id) DO NOTHING
    `);

    // Insert sample production orders
    await client.query(`
      INSERT INTO production_orders (order_number, line_number, production_date_time, operator_id, status) VALUES
      ('ORD001', 1, '2024-01-15 08:00:00', 'OP001', 'active'),
      ('ORD002', 2, '2024-01-15 09:00:00', 'OP002', 'active'),
      ('ORD003', 1, '2024-01-14 10:00:00', 'OP001', 'completed'),
      ('ORD004', 3, '2024-01-15 11:00:00', 'OP003', 'active'),
      ('ORD005', 2, '2024-01-14 14:00:00', 'OP002', 'completed')
      ON CONFLICT (order_number) DO NOTHING
    `);

    // Insert sample test results
    await client.query(`
      INSERT INTO test_results (id, order_number, parameter_id, round, value, unit, status, operator_id, comments) VALUES
      ('TR001', 'ORD001', 'moisture', 1, 12.5, '%', 'pass', 'OP001', 'Within acceptable range'),
      ('TR002', 'ORD001', 'ph', 1, 6.2, 'pH', 'pass', 'OP001', 'Good pH level'),
      ('TR003', 'ORD001', 'viscosity', 1, 750.0, 'cP', 'pass', 'OP001', 'Optimal viscosity'),
      ('TR004', 'ORD002', 'moisture', 1, 13.8, '%', 'warning', 'OP002', 'Slightly high moisture'),
      ('TR005', 'ORD002', 'ph', 1, 7.8, 'pH', 'warning', 'OP002', 'Approaching upper limit'),
      ('TR006', 'ORD003', 'moisture', 1, 11.2, '%', 'pass', 'OP001', 'Completed successfully'),
      ('TR007', 'ORD003', 'ph', 1, 6.5, 'pH', 'pass', 'OP001', 'Completed successfully'),
      ('TR008', 'ORD003', 'viscosity', 1, 680.0, 'cP', 'pass', 'OP001', 'Completed successfully'),
      ('TR009', 'ORD003', 'density', 1, 1.25, 'g/cm³', 'pass', 'OP001', 'Completed successfully'),
      ('TR010', 'ORD004', 'moisture', 1, 14.2, '%', 'fail', 'OP003', 'Moisture too high'),
      ('TR011', 'ORD005', 'moisture', 1, 11.8, '%', 'pass', 'OP002', 'Completed successfully'),
      ('TR012', 'ORD005', 'ph', 1, 6.8, 'pH', 'pass', 'OP002', 'Completed successfully'),
      ('TR013', 'ORD005', 'viscosity', 1, 720.0, 'cP', 'pass', 'OP002', 'Completed successfully'),
      ('TR014', 'ORD005', 'density', 1, 1.32, 'g/cm³', 'pass', 'OP002', 'Completed successfully')
      ON CONFLICT (id) DO NOTHING
    `);

    // Insert initial dashboard metrics
    await client.query(`
      INSERT INTO dashboard_metrics (active_orders, completed_today, tests_pending, quality_compliance, line_utilization) VALUES
      (3, 2, 8, 92.5, '{"1": 85.5, "2": 78.2, "3": 92.1, "4": 65.8}')
      ON CONFLICT DO NOTHING
    `);

    // Seed test stages
    await client.query(`
      INSERT INTO test_stages (name, description, "order", is_active) VALUES 
        ('Slurry', 'Initial slurry preparation stage', 1, true),
        ('Reaction', 'Main reaction process stage', 2, true),
        ('End Reaction', 'Final reaction completion stage', 3, true)
      ON CONFLICT (name) DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seeding
seedDatabase()
  .then(() => {
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }); 