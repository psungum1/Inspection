#!/bin/bash

echo "🚀 Starting database migration..."

# Run migration
echo "📊 Creating database tables..."
node src/database/migrate.js

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    
    echo "🌱 Seeding database with initial data..."
    node src/database/seed.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Database seeding completed successfully!"
        echo "🎉 Database setup is complete!"
    else
        echo "❌ Database seeding failed!"
        exit 1
    fi
else
    echo "❌ Migration failed!"
    exit 1
fi
