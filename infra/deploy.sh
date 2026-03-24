#!/bin/bash
# Run this on the server to pull latest code and restart services
# Usage: bash deploy.sh

set -e
cd /opt/papercraft

echo "=== Pull latest ==="
git pull origin main

echo "=== Rebuild frontend ==="
cd frontend
npm install --silent
VITE_API_URL=/api npm run build
cd ..

echo "=== Rebuild & restart backend ==="
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d

echo "✅ Deploy complete — http://8.218.95.2"
