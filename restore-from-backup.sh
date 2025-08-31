#!/bin/bash

echo "=== PQMS Database Restore from Backup Script ==="
echo ""

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "❌ Please provide the backup file path"
    echo "Usage: $0 <backup_file.sql>"
    echo ""
    echo "Example:"
    echo "$0 /var/backups/pqms/db_backup_20241201_143022.sql"
    exit 1
fi

BACKUP_FILE=$1
DB_NAME="pqms_db"
DB_USER="pqms_a"
DB_HOST="localhost"
DB_PORT="5432"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Backup file: $BACKUP_FILE"
echo ""

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

# Restore from backup
echo ""
echo "4. Restoring from backup file..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully from backup"
else
    echo "❌ Database restore failed"
    exit 1
fi

echo ""
echo "=== Database Restore Complete ==="
echo ""
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Backup file: $BACKUP_FILE"
echo ""
echo "You can now start the application!" 