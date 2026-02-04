#!/bin/bash

#######################################
# CREATE NEW BLOG
# 
# Usage: ./create-new-blog.sh my-blog-name
#
# This script will:
# 1. Create a new folder with your blog name
# 2. Copy all necessary files
# 3. Initialize git
# 4. Install dependencies
# 5. Start the dev server
# 6. Open the setup wizard in your browser
#######################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Get the directory where this script is located (the template)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║            ${BOLD}🚀 CREATE NEW BLOG 🚀${NC}${BLUE}                          ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if folder name was provided
if [ -z "$1" ]; then
    echo -e "${CYAN}What would you like to name your new blog folder?${NC}"
    echo -e "${YELLOW}(Use lowercase, no spaces - e.g., fitness-blog, tech-reviews)${NC}"
    echo ""
    read -p "Folder name: " BLOG_NAME
else
    BLOG_NAME="$1"
fi

# Validate folder name
if [ -z "$BLOG_NAME" ]; then
    echo -e "${RED}Error: Folder name cannot be empty.${NC}"
    exit 1
fi

# Convert to lowercase and replace spaces with dashes
BLOG_NAME=$(echo "$BLOG_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

# Full path for new blog
NEW_BLOG_PATH="$PARENT_DIR/$BLOG_NAME"

# Check if folder already exists
if [ -d "$NEW_BLOG_PATH" ]; then
    echo -e "${RED}Error: Folder '$BLOG_NAME' already exists at $NEW_BLOG_PATH${NC}"
    echo -e "${YELLOW}Please choose a different name or delete the existing folder.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Creating new blog: ${BOLD}$BLOG_NAME${NC}"
echo -e "${CYAN}Location: $NEW_BLOG_PATH${NC}"
echo ""

# Step 1: Create folder
echo -e "${BLUE}[1/6]${NC} Creating folder..."
mkdir -p "$NEW_BLOG_PATH"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to create folder.${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Folder created${NC}"

# Step 2: Copy files
echo -e "${BLUE}[2/6]${NC} Copying files..."
cp -r "$SCRIPT_DIR"/* "$NEW_BLOG_PATH/" 2>/dev/null
cp "$SCRIPT_DIR"/.gitignore "$NEW_BLOG_PATH/" 2>/dev/null
cp "$SCRIPT_DIR"/.eslintrc.json "$NEW_BLOG_PATH/" 2>/dev/null

# Remove template-only files from the new blog
rm -f "$NEW_BLOG_PATH/create-new-blog.sh"
rm -f "$NEW_BLOG_PATH/.template-marker"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to copy files.${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Files copied${NC}"

# Step 3: Initialize git
echo -e "${BLUE}[3/6]${NC} Initializing git repository..."
cd "$NEW_BLOG_PATH"
git init -q
git add .
git commit -m "Initial commit" -q
echo -e "${GREEN}  ✓ Git initialized${NC}"

# Step 4: Install dependencies
echo -e "${BLUE}[4/6]${NC} Installing dependencies (this may take a minute)..."
npm install --silent 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}  ⚠ npm install had warnings (this is usually fine)${NC}"
else
    echo -e "${GREEN}  ✓ Dependencies installed${NC}"
fi

# Step 5: Start dev server in background
echo -e "${BLUE}[5/6]${NC} Starting development server..."
npm run dev &>/dev/null &
DEV_PID=$!
sleep 3

# Check if server started
if ps -p $DEV_PID > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Dev server running (PID: $DEV_PID)${NC}"
else
    echo -e "${YELLOW}  ⚠ Dev server may not have started. Run 'npm run dev' manually.${NC}"
fi

# Step 6: Open setup wizard
echo -e "${BLUE}[6/6]${NC} Opening setup wizard..."
sleep 2

# Try to open browser (works on macOS)
if command -v open &> /dev/null; then
    open "http://localhost:3003/setup"
    echo -e "${GREEN}  ✓ Setup wizard opened in browser${NC}"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3003/setup"
    echo -e "${GREEN}  ✓ Setup wizard opened in browser${NC}"
else
    echo -e "${YELLOW}  → Please open http://localhost:3003/setup in your browser${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║              ${BOLD}✅ SETUP COMPLETE!${NC}${GREEN}                           ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Your new blog is ready at:${NC}"
echo -e "  ${CYAN}$NEW_BLOG_PATH${NC}"
echo ""
echo -e "${BOLD}Setup Wizard:${NC}"
echo -e "  ${CYAN}http://localhost:3003/setup${NC}"
echo ""
echo -e "${BOLD}Next steps:${NC}"
echo -e "  1. Complete the setup wizard in your browser"
echo -e "  2. Create a GitHub repo and push your code"
echo -e "  3. Set up Supabase on Elestio"
echo -e "  4. Deploy to Vercel"
echo ""
echo -e "${YELLOW}To stop the dev server, press Ctrl+C or run: kill $DEV_PID${NC}"
echo ""
