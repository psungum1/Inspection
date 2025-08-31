#!/bin/bash

echo "=== PQMS Database Status Check ==="
echo ""

# Database configuration
DB_NAME="pqms_db"
DB_USER="pqms_a"
DB_HOST="localhost"
DB_PORT="5432"

# Check if PostgreSQL is running
echo "1. PostgreSQL Service Status:"
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is not running"
    echo "Start with: sudo systemctl start postgresql"
fi

echo ""

# Check database connection
echo "2. Database Connection Test:"
if pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
fi

echo ""

# Check if database exists
echo "3. Database Existence Check:"
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "✅ Database '$DB_NAME' exists"
else
    echo "❌ Database '$DB_NAME' does not exist"
fi

echo ""

# Check tables if database exists
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "4. Database Tables:"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt" 2>/dev/null | grep -v "List of relations" | grep -v "Schema" | grep -v "Name" | grep -v "Type" | grep -v "Owner" | grep -v "^\s*$" || echo "No tables found"
    
    echo ""
    echo "5. Table Row Counts:"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
    FROM pg_stat_user_tables 
    ORDER BY tablename;
    " 2>/dev/null || echo "Could not retrieve table statistics"
fi

echo ""
echo "=== Database Check Complete ===" 