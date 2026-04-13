#!/bin/bash

# 🚀 TAI Edge Function Quick Deploy Script
# This script deploys the rapid-responder Edge Function to Supabase

set -e  # Exit on error

PROJECT_REF="xspogpfohjmkykfjadhk"
FUNCTION_NAME="rapid-responder"
BASE_URL="https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}"
ROOT_URL="${BASE_URL}/"
HEALTH_URL="${BASE_URL}/make-server-28f2f653/health"

echo "🎯 TAI Edge Function Deployment"
echo "================================"
echo ""
echo "Project: ${PROJECT_REF}"
echo "Function: ${FUNCTION_NAME}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo "  OR"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
echo "🔐 Checking Supabase login..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo ""
    echo "Run: supabase login"
    echo ""
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Deploy function
echo "🚀 Deploying ${FUNCTION_NAME} function..."
echo ""

supabase functions deploy ${FUNCTION_NAME} --project-ref ${PROJECT_REF}

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    exit 1
fi

# Wait for deployment to propagate
echo "⏳ Waiting for deployment to propagate..."
sleep 5
echo ""

# Test root endpoint first
echo "🧪 Test 1: Testing root endpoint..."
echo "URL: ${ROOT_URL}"
echo ""

ROOT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "${ROOT_URL}")
ROOT_HTTP_CODE=$(echo "$ROOT_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
ROOT_BODY=$(echo "$ROOT_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response:"
echo "$ROOT_BODY" | jq . 2>/dev/null || echo "$ROOT_BODY"
echo ""

if [ "$ROOT_HTTP_CODE" = "200" ]; then
    echo "✅ Root endpoint working! (HTTP 200)"
    echo ""
else
    echo "⚠️  Root endpoint returned HTTP ${ROOT_HTTP_CODE}"
    echo ""
    echo "This might indicate a deployment issue."
    echo ""
fi

# Test health endpoint
echo "🧪 Test 2: Testing health endpoint..."
echo "URL: ${HEALTH_URL}"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "${HEALTH_URL}")
HEALTH_HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response:"
echo "$HEALTH_BODY" | jq . 2>/dev/null || echo "$HEALTH_BODY"
echo ""

if [ "$HEALTH_HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed! (HTTP 200)"
    echo ""
else
    echo "⚠️  Health check returned HTTP ${HEALTH_HTTP_CODE}"
    echo ""
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$ROOT_HTTP_CODE" = "200" ] && [ "$HEALTH_HTTP_CODE" = "200" ]; then
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "✅ Function is deployed and responding"
    echo "✅ Root endpoint: Working"
    echo "✅ Health endpoint: Working"
    echo ""
    echo "📊 Next steps:"
    echo "  1. Open TAI app"
    echo "  2. Login as Director (Ashish)"
    echo "  3. Try creating a program"
    echo "  4. Monitor logs if needed:"
    echo "     supabase functions logs ${FUNCTION_NAME} --project-ref ${PROJECT_REF}"
    echo ""
    echo "🔗 Useful URLs:"
    echo "  • Root: ${ROOT_URL}"
    echo "  • Health: ${HEALTH_URL}"
    echo "  • Logs: https://supabase.com/dashboard/project/${PROJECT_REF}/logs/edge-functions"
    echo ""
elif [ "$ROOT_HTTP_CODE" = "200" ]; then
    echo "⚠️  PARTIAL SUCCESS"
    echo ""
    echo "✅ Function is deployed"
    echo "✅ Root endpoint works"
    echo "❌ Health endpoint failing"
    echo ""
    echo "This is unusual. Check function logs:"
    echo "  supabase functions logs ${FUNCTION_NAME} --project-ref ${PROJECT_REF}"
    echo ""
else
    echo "❌ DEPLOYMENT ISSUES DETECTED"
    echo ""
    echo "Both endpoints are failing. This usually means:"
    echo "  • Function didn't deploy correctly"
    echo "  • Function has syntax errors"
    echo "  • Function isn't starting"
    echo ""
    echo "🔍 Troubleshooting steps:"
    echo "  1. Check function logs:"
    echo "     supabase functions logs ${FUNCTION_NAME} --project-ref ${PROJECT_REF}"
    echo ""
    echo "  2. View in dashboard:"
    echo "     https://supabase.com/dashboard/project/${PROJECT_REF}/functions"
    echo ""
    echo "  3. Try manual deployment:"
    echo "     Read /DEBUG_401_ERROR.md for step-by-step guide"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Done!"