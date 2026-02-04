#!/bin/bash

#######################################
# RUN ALL DATABASE MIGRATIONS
# 
# This script combines all SQL migration files into one
# and can either:
# 1. Output a combined file to copy/paste into Supabase Studio
# 2. Run directly against your database (if you provide the connection string)
#
# Usage:
#   ./scripts/run-all-migrations.sh              # Creates combined SQL file
#   ./scripts/run-all-migrations.sh --run "postgres://..."  # Runs directly
#######################################

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_DIR/supabase/migrations"
OUTPUT_FILE="$PROJECT_DIR/all-migrations-combined.sql"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          DATABASE MIGRATION SCRIPT                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${YELLOW}Error: Migrations directory not found at $MIGRATIONS_DIR${NC}"
    exit 1
fi

# Count migration files
MIGRATION_COUNT=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l | tr -d ' ')
echo -e "${CYAN}Found $MIGRATION_COUNT migration files${NC}"
echo ""

# Create combined SQL file
echo "-- ============================================" > "$OUTPUT_FILE"
echo "-- COMBINED DATABASE MIGRATIONS" >> "$OUTPUT_FILE"
echo "-- Generated: $(date)" >> "$OUTPUT_FILE"
echo "-- Total files: $MIGRATION_COUNT" >> "$OUTPUT_FILE"
echo "-- ============================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Process each migration file in order
for file in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
    filename=$(basename "$file")
    echo -e "  Adding: ${GREEN}$filename${NC}"
    
    echo "" >> "$OUTPUT_FILE"
    echo "-- ============================================" >> "$OUTPUT_FILE"
    echo "-- FILE: $filename" >> "$OUTPUT_FILE"
    echo "-- ============================================" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
done

echo ""
echo -e "${GREEN}✓ Combined SQL file created:${NC}"
echo -e "  ${CYAN}$OUTPUT_FILE${NC}"
echo ""

# Check if --run flag was provided with connection string
if [ "$1" == "--run" ] && [ -n "$2" ]; then
    echo -e "${YELLOW}Running migrations against database...${NC}"
    echo ""
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        echo -e "${YELLOW}Error: psql command not found.${NC}"
        echo "Install PostgreSQL client or use the combined SQL file manually."
        exit 1
    fi
    
    # Run the migrations
    psql "$2" -f "$OUTPUT_FILE"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ All migrations completed successfully!${NC}"
    else
        echo ""
        echo -e "${YELLOW}⚠ Some migrations may have failed. Check the output above.${NC}"
    fi
else
    echo -e "${YELLOW}Next steps:${NC}"
    echo ""
    echo "  Option 1: Copy/paste into Supabase Studio"
    echo "    1. Open the file: $OUTPUT_FILE"
    echo "    2. Copy all contents (Cmd+A, Cmd+C)"
    echo "    3. Paste into Supabase SQL Editor"
    echo "    4. Click Run"
    echo ""
    echo "  Option 2: Run directly (if you have psql installed)"
    echo "    ./scripts/run-all-migrations.sh --run \"postgres://user:pass@host:5432/postgres\""
    echo ""
    echo "  You can find your database connection string in Elestio:"
    echo "    → Your Supabase service → Update config → Look for DATABASE_URL"
    echo ""
fi
