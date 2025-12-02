#!/bin/bash

# Test script to verify duplicate prevention is working
# Run this AFTER starting your dev server with: npm run dev

echo "🧪 Testing duplicate blog post prevention..."
echo ""

# Test payload (same slug sent twice)
PAYLOAD='{
  "title": "Test Duplicate Prevention",
  "slug": "test-duplicate-prevention",
  "content": "<h1>Test Post</h1><p>This is a test.</p>",
  "status": "published",
  "category": "Test",
  "tags": ["test"],
  "user_name": "test"
}'

echo "📤 Sending FIRST request..."
RESPONSE1=$(curl -s -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "Response 1: $RESPONSE1"
echo ""

sleep 1

echo "📤 Sending SECOND request (same slug)..."
RESPONSE2=$(curl -s -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "Response 2: $RESPONSE2"
echo ""

echo "🔍 Checking for duplicates in API..."
API_RESPONSE=$(curl -s "http://localhost:3000/api/blog?search=test-duplicate-prevention")

# Count how many times the slug appears
COUNT=$(echo "$API_RESPONSE" | grep -o "test-duplicate-prevention" | wc -l | xargs)

echo ""
if [ "$COUNT" -eq "1" ]; then
  echo "✅ SUCCESS: Only 1 version found (no duplicates)"
  echo "✅ Fix is working correctly!"
else
  echo "❌ FAILURE: Found $COUNT occurrences (should be 1)"
  echo "❌ Duplicates are still being created"
fi

echo ""
echo "Full API response:"
echo "$API_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$API_RESPONSE"

