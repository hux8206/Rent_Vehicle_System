#!/bin/sh
set -e

echo "========================================="
echo "🚗 VehicleRent API Service initializing..."
echo "========================================="

echo "⏳ Waiting for MySQL database connection..."
MAX_RETRIES=30
RETRY_COUNT=0

until npx prisma db push --skip-generate --accept-data-loss; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "❌ Database connection failed after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "⏳ MySQL is starting up... (attempt $RETRY_COUNT/$MAX_RETRIES). Retrying in 3s..."
  sleep 3
done

echo "✅ Database schema synchronized successfully!"

echo "🌱 Seeding initial demo data (Admin, Partners, Stores, Vehicles)..."
npm run prisma:seed || echo "ℹ️ Database already seeded or completed with notes."

echo "🚀 Starting NestJS API application..."
exec "$@"

