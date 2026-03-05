#!/bin/bash
# Quick AI integration test script for HomePilot
# Tests the /api/ai/explain endpoint with sample data

set -e

echo "🤖 HomePilot AI Integration Test"
echo "================================"
echo ""

# Check if backend is running
if ! curl -s http://localhost:9001/health > /dev/null 2>&1 && ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "❌ Backend is not running!"
    echo ""
    echo "Start it with:"
    echo "  cd backend"
    echo "  DATABASE_URL=sqlite:///:memory: uvicorn app.main:app --reload"
    echo ""
    echo "Or with Docker:"
    echo "  docker compose -f infrastructure/docker-compose.yml up"
    exit 1
fi

# Determine backend URL
if curl -s http://localhost:9001/health > /dev/null 2>&1; then
    BACKEND_URL="http://localhost:9001"
else
    BACKEND_URL="http://localhost:8000"
fi

echo "✅ Backend found at $BACKEND_URL"
echo ""

# Test 1: Affordable scenario
echo "📊 Test 1: Affordable Scenario"
echo "------------------------------"
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/ai/explain" \
  -H "Content-Type: application/json" \
  -d '{
    "monthly_income": 6000,
    "monthly_housing": 2000,
    "other_needs": 500,
    "is_affordable": true,
    "housing_pct_of_income": 33.33,
    "needs_budget_50": 3000,
    "remaining_needs_after_housing": 500,
    "pmi_monthly": 0,
    "term_years": 30
  }')

echo "$RESPONSE" | python3 -m json.tool
echo ""

# Extract provider
PROVIDER=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('provider', 'unknown'))")
echo "🔍 Provider used: $PROVIDER"
echo ""

# Test 2: Unaffordable scenario
echo "📊 Test 2: Unaffordable Scenario"
echo "--------------------------------"
RESPONSE2=$(curl -s -X POST "$BACKEND_URL/api/v1/ai/explain" \
  -H "Content-Type: application/json" \
  -d '{
    "monthly_income": 5000,
    "monthly_housing": 3500,
    "other_needs": 800,
    "is_affordable": false,
    "housing_pct_of_income": 70.0,
    "needs_budget_50": 2500,
    "remaining_needs_after_housing": -1000,
    "pmi_monthly": 150,
    "term_years": 30
  }')

echo "$RESPONSE2" | python3 -m json.tool
echo ""

PROVIDER2=$(echo "$RESPONSE2" | python3 -c "import sys, json; print(json.load(sys.stdin).get('provider', 'unknown'))")
echo "🔍 Provider used: $PROVIDER2"
echo ""

# Summary
echo "✅ Tests completed!"
echo ""

if [ "$PROVIDER" = "mock" ]; then
    echo "ℹ️  Currently using MOCK provider (rule-based responses)"
    echo ""
    echo "To enable real AI:"
    echo "1. Get FREE Groq API key: https://console.groq.com/keys"
    echo "2. Add to .env: GROQ_API_KEY=gsk_your_key_here"
    echo "3. Restart backend"
    echo ""
    echo "See docs/AI_INTEGRATION.md for details"
else
    echo "🎉 Real AI is working! Provider: $PROVIDER"
fi
