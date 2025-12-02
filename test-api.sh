#!/bin/bash

# Test script to verify the API accepts the exact structure
# Usage: ./test-api.sh

echo "🧪 Testing Blog API with EXACT structure..."
echo ""

# Read the test JSON file
PAYLOAD=$(cat test-api-exact.json)

echo "📤 Sending POST request to /api/blog"
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "📥 Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ SUCCESS: Post created/updated successfully"
  
  # Extract post ID
  POST_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
  
  if [ ! -z "$POST_ID" ]; then
    echo "📝 Post ID: $POST_ID"
    echo ""
    echo "🔍 Verifying post exists..."
    
    # Check if post exists
    CHECK=$(curl -s "http://localhost:3000/api/blog" | python3 -c "
import sys, json
data = json.load(sys.stdin)
posts = data.get('data', [])
found = [p for p in posts if p.get('id') == '$POST_ID']
print('FOUND' if found else 'NOT FOUND')
" 2>/dev/null)
    
    if [ "$CHECK" = "FOUND" ]; then
      echo "✅ Post verified in database"
    else
      echo "❌ Post NOT found in database"
    fi
  fi
else
  echo "❌ FAILURE: Request failed"
  echo ""
  echo "Error details:"
  echo "$RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('error', 'Unknown error'))" 2>/dev/null || echo "Unknown error"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

