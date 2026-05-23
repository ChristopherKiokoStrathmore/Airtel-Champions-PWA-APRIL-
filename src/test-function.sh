#!/bin/bash

# 🧪 Quick Test Script for TAI Edge Function
# Tests if the rapid-responder function is responding

PROJECT_REF="xspogpfohjmkykfjadhk"
FUNCTION_NAME="rapid-responder"
BASE_URL="https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}"

echo "🧪 TAI Edge Function Test"
echo "========================="
echo ""

# Test 1: Root endpoint
echo "Test 1: Root Endpoint"
echo "---------------------"
echo "URL: ${BASE_URL}/"
echo ""
curl -s "${BASE_URL}/" | jq . 2>/dev/null || curl -s "${BASE_URL}/"
echo ""
echo ""

# Test 2: Health endpoint
echo "Test 2: Health Endpoint"
echo "-----------------------"
echo "URL: ${BASE_URL}/make-server-28f2f653/health"
echo ""
curl -s "${BASE_URL}/make-server-28f2f653/health" | jq . 2>/dev/null || curl -s "${BASE_URL}/make-server-28f2f653/health"
echo ""
echo ""

# Test 3: Programs endpoint
echo "Test 3: Programs Endpoint"
echo "-------------------------"
echo "URL: ${BASE_URL}/make-server-28f2f653/programs?role=director&user_id=test"
echo ""
curl -s "${BASE_URL}/make-server-28f2f653/programs?role=director&user_id=test" | jq . 2>/dev/null || curl -s "${BASE_URL}/make-server-28f2f653/programs?role=director&user_id=test"
echo ""
echo ""

echo "✅ Test complete!"
echo ""
echo "If you see JSON responses above, the function is working!"
echo "If you see errors, the function needs to be deployed."
echo ""
echo "To deploy, run: ./deploy-tai-function.sh"
