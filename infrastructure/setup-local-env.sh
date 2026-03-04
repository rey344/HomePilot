#!/bin/bash
# Helper script to generate a secure .env file for local development
# Usage: ./infrastructure/setup-local-env.sh

set -e

ENV_FILE="infrastructure/.env"
EXAMPLE_FILE="infrastructure/.env.example"

echo "🔐 HomePilot Local Development Setup"
echo "===================================="
echo ""

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    read -p "⚠️  $ENV_FILE already exists. Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Using existing $ENV_FILE"
        exit 0
    fi
fi

# Check if .env.example exists
if [ ! -f "$EXAMPLE_FILE" ]; then
    echo "❌ Error: $EXAMPLE_FILE not found"
    exit 1
fi

echo "📝 Generating secure local development .env file..."
echo ""

# Generate a secure random password
PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Copy example and replace placeholders
cp "$EXAMPLE_FILE" "$ENV_FILE"

# Replace password in both POSTGRES_PASSWORD and DATABASE_URL
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|POSTGRES_PASSWORD=CHANGE_ME_REQUIRED|POSTGRES_PASSWORD=$PASSWORD|g" "$ENV_FILE"
    sed -i '' "s|postgresql://homepilot:CHANGE_ME_REQUIRED@|postgresql://homepilot:$PASSWORD@|g" "$ENV_FILE"
else
    # Linux
    sed -i "s|POSTGRES_PASSWORD=CHANGE_ME_REQUIRED|POSTGRES_PASSWORD=$PASSWORD|g" "$ENV_FILE"
    sed -i "s|postgresql://homepilot:CHANGE_ME_REQUIRED@|postgresql://homepilot:$PASSWORD@|g" "$ENV_FILE"
fi

echo "✅ Created $ENV_FILE with secure random password"
echo ""
echo "📋 Quick Start:"
echo "   docker compose -f infrastructure/docker-compose.yml up --build -d"
echo ""
echo "🔍 View services:"
echo "   Frontend: http://localhost:9002"
echo "   Backend:  http://localhost:9001/docs"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - The .env file is gitignored and will NOT be committed"
echo "   - Do NOT share this file or commit it to version control"
echo "   - For production, use your platform's secret manager"
echo ""
