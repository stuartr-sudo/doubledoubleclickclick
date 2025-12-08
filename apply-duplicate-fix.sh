#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  BULLETPROOF DUPLICATE FIX - DEPLOYMENT${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Step 1: Check if migration file exists
echo -e "${YELLOW}Step 1: Checking migration file...${NC}"
MIGRATION_FILE="supabase/migrations/20251208_bulletproof_duplicate_prevention.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Migration file found${NC}"
echo ""

# Step 2: Show migration preview
echo -e "${YELLOW}Step 2: Migration Preview${NC}"
echo -e "${BLUE}This migration will:${NC}"
echo "  • Remove existing duplicate posts (keeps newest)"
echo "  • Add UNIQUE constraint on slug column"
echo "  • Create database trigger to prevent duplicates by title"
echo "  • Create advisory lock functions for serverless safety"
echo "  • Create cleanup function for manual use"
echo ""

# Step 3: Instructions for Supabase
echo -e "${YELLOW}Step 3: Apply Database Migration${NC}"
echo -e "${BLUE}You need to run this in your Supabase Dashboard:${NC}"
echo ""
echo "  1. Go to: https://supabase.com/dashboard"
echo "  2. Select your project"
echo "  3. Click 'SQL Editor' in the sidebar"
echo "  4. Click 'New Query'"
echo "  5. Copy the contents of this file:"
echo "     ${GREEN}$MIGRATION_FILE${NC}"
echo "  6. Paste into the SQL Editor"
echo "  7. Click 'Run'"
echo ""
echo -e "${YELLOW}Press ENTER when you've completed the database migration...${NC}"
read

# Step 4: Verify files changed
echo ""
echo -e "${YELLOW}Step 4: Verifying code changes...${NC}"

if ! git diff --quiet HEAD -- app/api/blog/route.ts; then
    echo -e "${GREEN}✅ API route has been updated${NC}"
else
    echo -e "${YELLOW}⚠️  No changes detected in API route${NC}"
fi

# Step 5: Commit and push
echo ""
echo -e "${YELLOW}Step 5: Commit and Deploy${NC}"
echo -e "${BLUE}This will commit the changes and trigger Vercel deployment.${NC}"
echo ""
echo -e "${YELLOW}Ready to commit and push? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}Committing changes...${NC}"
    
    git add app/api/blog/route.ts
    git add supabase/migrations/20251208_bulletproof_duplicate_prevention.sql
    git add STOP_DUPLICATES_NOW.md
    git add apply-duplicate-fix.sh
    
    git commit -m "FIX: Bulletproof duplicate post prevention with 5-layer protection

- Remove in-memory locks (don't work in serverless)
- Add PostgreSQL advisory locks (cross-instance safe)
- Add database UNIQUE constraint on slug
- Add trigger to prevent duplicate titles within 60s
- Add cleanup function for manual duplicate removal
- Improve slug generation with normalization
- Add comprehensive error handling
- Enhanced logging for debugging

This implements multiple redundant layers:
1. Advisory locks prevent concurrent processing
2. Database trigger blocks similar posts
3. UNIQUE constraint physically prevents duplicates
4. Application checks catch obvious duplicates
5. Upsert logic gracefully handles conflicts

Fixes: Duplicate posts being created from Base44"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Changes committed${NC}"
        echo ""
        echo -e "${BLUE}Pushing to GitHub...${NC}"
        git push
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Pushed to GitHub${NC}"
            echo -e "${GREEN}✅ Vercel will automatically deploy${NC}"
        else
            echo -e "${RED}❌ Failed to push to GitHub${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Failed to commit changes${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Skipping commit and push${NC}"
fi

# Step 6: Testing instructions
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETE!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}Step 6: Test the Fix${NC}"
echo ""
echo -e "${BLUE}Option A: Test from Base44${NC}"
echo "  1. Publish a blog post from Base44"
echo "  2. Immediately publish the same post again"
echo "  3. Check: curl https://sewo.io/api/blog | grep 'your-slug'"
echo "  4. Should only see 1 post"
echo ""
echo -e "${BLUE}Option B: Watch Logs${NC}"
echo "  1. Run: vercel logs --follow"
echo "  2. Publish from Base44"
echo "  3. Look for:"
echo "     ✅ '[BLOG API] UPDATING existing post' (good)"
echo "     ✅ '[BLOG API] 🛡️  DUPLICATE PREVENTED' (good)"
echo "     ❌ Two '[BLOG API] INSERTING' messages (bad - send screenshot)"
echo ""
echo -e "${BLUE}Option C: Check Database${NC}"
echo "  Run this in Supabase SQL Editor:"
echo "  ${GREEN}SELECT slug, COUNT(*) FROM blog_posts GROUP BY slug HAVING COUNT(*) > 1;${NC}"
echo "  Should return 0 rows (no duplicates)"
echo ""
echo -e "${YELLOW}If you still see duplicates after this:${NC}"
echo "  1. Take screenshot of Vercel logs"
echo "  2. Take screenshot of duplicate posts in database"
echo "  3. Check Base44 webhook configuration"
echo ""
echo -e "${GREEN}Good luck! This should completely eliminate duplicates.${NC}"
echo ""

