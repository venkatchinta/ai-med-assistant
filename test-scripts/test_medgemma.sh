#!/bin/bash

# Test script for validating GCP MedGemma model access
# Prerequisites: 
#   1. Google Cloud SDK installed
#   2. Run: gcloud auth application-default login

set -e

echo "=== MedGemma Endpoint Test Script ==="
echo ""

# Configuration
ENDPOINT_ID="mg-endpoint-1f3addd2-8e87-4fcd-a6e2-019ff94fce3e"
PROJECT_ID="977337325460"
LOCATION="us-central1"
DEDICATED_HOST="${ENDPOINT_ID}.${LOCATION}-${PROJECT_ID}.prediction.vertexai.goog"

echo "Endpoint ID: $ENDPOINT_ID"
echo "Project ID: $PROJECT_ID"
echo "Dedicated Host: $DEDICATED_HOST"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "ERROR: gcloud CLI is not installed. Please install Google Cloud SDK."
    exit 1
fi

# Check authentication
echo "Checking authentication..."
if ! gcloud auth print-access-token &> /dev/null; then
    echo "ERROR: Not authenticated. Please run: gcloud auth application-default login"
    exit 1
fi
echo "✓ Authentication OK"
echo ""

# Test DNS resolution for dedicated endpoint
echo "Testing DNS resolution for dedicated endpoint..."
if nslookup "$DEDICATED_HOST" &> /dev/null; then
    echo "✓ DNS resolution OK"
else
    echo "⚠ WARNING: DNS resolution failed for $DEDICATED_HOST"
    echo "  This endpoint may require VPC/Private Service Connect access."
    echo ""
fi

# Create test input JSON
INPUT_JSON=$(cat <<'EOF'
{
    "instances": [
        {
            "@requestFormat": "chatCompletions",
            "messages": [
                {
                    "role": "system",
                    "content": [{"type": "text", "text": "You are an expert medical AI assistant."}]
                },
                {
                    "role": "user",
                    "content": [{"type": "text", "text": "What are the common symptoms of vitamin D deficiency?"}]
                }
            ],
            "max_tokens": 200
        }
    ]
}
EOF
)

echo "=== Test 1: Simple Text Query ==="
echo "Sending request to MedGemma endpoint..."
echo ""

# Execute the request
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "Content-Type: application/json" \
    "https://${DEDICATED_HOST}/v1/projects/${PROJECT_ID}/locations/${LOCATION}/endpoints/${ENDPOINT_ID}:predict" \
    -d "$INPUT_JSON" 2>&1)

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Extract response body (all but last line)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ SUCCESS! MedGemma endpoint is accessible."
    echo ""
    echo "Response:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "✗ FAILED: Could not connect to endpoint."
    echo "  This is likely a DNS/network issue."
    echo "  The dedicated endpoint may require VPC access."
    echo ""
    echo "Response: $BODY"
else
    echo "✗ FAILED with HTTP $HTTP_CODE"
    echo ""
    echo "Response:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi

echo ""
echo "=== Test Complete ==="
