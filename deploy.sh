#!/bin/bash

echo "Starting deployment..."

# Pull latest changes (if using git)
# git pull origin main

# Install frontend dependencies
npm install

# Build frontend
npm run build

# Install backend dependencies
cd server
npm install
cd ..

# Restart PM2
pm2 restart pqms-backend

# Reload Nginx (if running as root)
# sudo systemctl reload nginx

echo "Deployment completed!" 