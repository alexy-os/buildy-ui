#!/bin/bash

# // Repository details
REPO="alexy-os/buildy-ui"
TARGET_DIR="src/blocks"
BLOCKS_DEST="web/components/blocks"

# // Import paths configuration
OLD_UI_PATH="@/components/ui"
NEW_UI_PATH="@/components/ui"
# NEW_UI_PATH="@workspace/ui/components" # For monorepo shadcn project

# // Directory settings
CURRENT_DIR=$(pwd)
DESTINATION_DIR="$CURRENT_DIR/$BLOCKS_DEST"

# // Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Starting blocks update process..."
echo "📂 Source UI path: $OLD_UI_PATH"
echo "📂 Target UI path: $NEW_UI_PATH"

# // Create and enter temporary directory
TEMP_DIR="temp-repo-$(date +%s)"
mkdir $TEMP_DIR
cd $TEMP_DIR

# // Initialize git and set up sparse checkout
git init
git remote add origin git@github.com:$REPO.git
git sparse-checkout init --cone
git sparse-checkout set $TARGET_DIR

# // Pull the specific directory
git pull origin main

# // Create destination directory if it doesn't exist
mkdir -p $DESTINATION_DIR

# // Copy files
cp -r $TARGET_DIR/* $DESTINATION_DIR/

# // Replace import paths in all TypeScript/TSX files
echo "📝 Updating import paths..."
find $DESTINATION_DIR -type f -name "*.tsx" -o -name "*.ts" | while read file; do
    # Replace UI component paths
    sed -i "s|$OLD_UI_PATH|$NEW_UI_PATH|g" "$file"
    echo "Updated: $file"
done

# // Clean up
cd ..
rm -rf $TEMP_DIR

echo -e "${GREEN}✅ Successfully completed:${NC}"
echo "- Cloned blocks from $REPO"
echo "- Copied to $DESTINATION_DIR"
echo "- Updated import paths from $OLD_UI_PATH to $NEW_UI_PATH"

# // Validation check
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All operations completed successfully!${NC}"
else
    echo -e "${RED}❌ Some operations failed. Please check the output above.${NC}"
    exit 1
fi 