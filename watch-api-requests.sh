#!/bin/bash

# This script will show you EXACTLY what Base44 is sending to your API
# Run this BEFORE publishing from Base44

echo "🔍 Watching API requests in real-time..."
echo "📝 Open Base44 and publish a post NOW"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Follow Vercel logs in real-time
vercel logs --follow --filter="[BLOG API]"

