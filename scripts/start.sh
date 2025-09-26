#!/bin/bash

# Wait for database to be ready
echo "🔄 Waiting for database connection..."
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Run migrations
echo "🔄 Running database migrations..."
npm run db:migrate

# Run seed data
echo "🌱 Seeding database..."
npm run db:seed

# Start the application
echo "🚀 Starting application..."
npm start
