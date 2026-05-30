#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=================================================="
echo "Starting Lotsitems Marketplace Deployment..."
echo "=================================================="

# Navigate to the project root directory
cd /var/www/recommerce-marketplace

# 1. Pull latest changes
echo ">>> Pulling latest changes from Git..."
git pull origin main || git pull origin master

# 2. Install dependencies
echo ">>> Installing dependencies..."
npm install

# 3. Generate Prisma Client
echo ">>> Generating Prisma Client..."
npm run generate --workspace=database

# 4. Apply database migrations
echo ">>> Running database migrations..."
# We use db push for development/fast prototyping, but in production we can use db push or prisma migrate deploy
# If db push is preferred:
npx prisma db push --schema=packages/database/prisma/schema.prisma --accept-data-loss

# 5. Build application workspaces
echo ">>> Building applications..."
npm run build

# 6. Restart applications using PM2
echo ">>> Reloading PM2 applications..."
if pm2 describe lotsitems-api > /dev/null 2>&1; then
    echo "PM2 processes exist. Reloading..."
    pm2 reload scripts/pm2.config.js --env production
else
    echo "PM2 processes do not exist. Starting..."
    pm2 start scripts/pm2.config.js --env production
fi

# 7. Save PM2 process list
echo ">>> Saving PM2 process list..."
pm2 save

echo "=================================================="
echo "Deployment Completed Successfully!"
echo "=================================================="
