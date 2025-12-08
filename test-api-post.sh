#!/bin/bash

echo "============================================"
echo "  TESTING /api/blog POST ENDPOINT"
echo "============================================"
echo ""

# Test 1: Verbose with full headers
echo "Test 1: POST with verbose output..."
echo "--------------------------------------------"
curl -v -X POST https://sewo.io/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Article",
    "content": "<p>This is test content with enough characters to pass the validation requirement.</p>",
    "status": "published"
  }' 2>&1 | grep -E "< HTTP|< Location|< Content-Type|success|error"

echo ""
echo ""

# Test 2: Follow redirects
echo "Test 2: POST with redirect following..."
echo "--------------------------------------------"
curl -L -X POST https://sewo.io/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Article 2",
    "content": "<p>This is another test with sufficient content to meet validation requirements.</p>",
    "status": "published"
  }' 2>&1

echo ""
echo ""

# Test 3: With trailing slash
echo "Test 3: POST with trailing slash..."
echo "--------------------------------------------"
curl -X POST https://sewo.io/api/blog/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Article 3",
    "content": "<p>Testing with trailing slash and enough content for validation.</p>",
    "status": "published"
  }' 2>&1

echo ""
echo ""

# Test 4: Check GET (should be 405)
echo "Test 4: GET request (should return 405)..."
echo "--------------------------------------------"
curl -v https://sewo.io/api/blog 2>&1 | grep -E "< HTTP|< Allow"

echo ""
echo ""
echo "============================================"
echo "  TESTS COMPLETE"
echo "============================================"

