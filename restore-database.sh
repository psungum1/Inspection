#!/bin/bash

echo "=== PQMS Database Restore Script ==="
echo ""

# Database configuration
DB_NAME="pqms_db"
DB_USER="pqms_a"
DB_HOST="localhost"
DB_PORT="5432"

# Check if PostgreSQL is running
echo "1. Checking PostgreSQL status..."
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; then
    echo "❌ PostgreSQL is not running or not accessible"
    echo "Please start PostgreSQL first:"
    echo "sudo systemctl start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Drop existing database if exists
echo ""
echo "2. Dropping existing database (if exists)..."
dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || echo "Database does not exist or already dropped"

# Create new database
echo ""
echo "3. Creating new database..."
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME

if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
else
    echo "❌ Failed to create database"
    exit 1
fi

# Run migrations
echo ""
echo "4. Running database migrations..."
cd server
npm run db:migrate

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migrations failed"
    exit 1
fi

# Run seed data
echo ""
echo "5. Seeding database with initial data..."
npm run db:seed

if [ $? -eq 0 ]; then
    echo "✅ Database seeded successfully"
else
    echo "❌ Seeding failed"
    exit 1
fi

cd ..

echo ""
echo "=== Database Restore Complete ==="
echo ""
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo ""
echo "Default users created:"
echo "- Email: sarah.johnson@company.com, Password: password123 (Quality Manager)"
echo "- Email: john.smith@company.com, Password: password123 (Operator)"
echo "- Email: admin@company.com, Password: admin123 (Admin)"
echo ""
echo "You can now start the application!" 