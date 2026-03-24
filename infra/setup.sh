#!/bin/bash
# Run this ONCE on a fresh Ubuntu 22.04 ECS instance
# Usage: bash setup.sh

set -e

echo "=== [1/5] System update ==="
apt-get update -y && apt-get upgrade -y

echo "=== [2/5] Install Docker ==="
apt-get install -y ca-certificates curl gnupg lsb-release git
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable docker
systemctl start docker

echo "=== [3/5] Install Node 20 (for frontend build) ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "=== [4/5] Clone repo ==="
cd /opt
git clone https://github.com/yuriao/papercraft.git
cd papercraft

echo "=== [5/5] Build frontend ==="
cd frontend
npm install
VITE_API_URL=/api npm run build
cd ..

echo ""
echo "✅ Setup complete. Now run:"
echo "   cd /opt/papercraft && docker compose -f docker-compose.prod.yml up -d"
