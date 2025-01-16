# Block Update Script Usage Guide

## Overview
This script allows you to fetch and update UI blocks from a remote repository while automatically adjusting import paths to match your project's structure.

## Setup Instructions

1. **Copy the Script**
   - Create a `howUse` directory in your project root
   - Save the script as `howUse/getblocks.sh`
   - Make it executable:
   ```bash
   chmod +x howUse/getblocks.sh
   ```

2. **Configure Variables**
   Edit the following variables at the top of the script to match your setup:
   ```bash
   # Repository details
   REPO="alexy-os/buildy-ui"                 # Source repository
   SOURCE_DIR="src/blocks"                   # Source directory in repo

   # TARGET_DIR="web/components/blocks" # For monorepo shadcn project
   TARGET_DIR="src/components/blocks"   # For default shadcn project

   # Import paths configuration
   OLD_UI_PATH="@/components/ui"             # Original import path

   # NEW_UI_PATH="@workspace/ui/components" # For monorepo shadcn project
   NEW_UI_PATH="@/components/ui" # For default shadcn project
   ```

3. **Requirements**
   - Git installed
   - SSH access to the repository
   - Bash shell environment

## Usage

1. **Run the Script**
   ```bash
   ./howUse/getblocks.sh
   ```

2. **What the Script Does**
   - Creates temporary directory for git operations
   - Clones specified blocks from remote repository
   - Copies them to your designated target directory
   - Updates import paths in all .ts/.tsx files
   - Cleans up temporary files

## Success Indicators
- Green checkmark (✅) indicates successful completion
- Red cross (❌) indicates failures
- Detailed logs show which files were updated

## Troubleshooting
- Check if you have correct repository access
- Verify paths in configuration variables
- Ensure target directories are writable
- Check git SSH configuration if clone fails

## Example Configurations

```bash
# For default project
SOURCE_DIR="src/blocks"
TARGET_DIR="src/components/blocks"
OLD_UI_PATH="@/components/ui"
NEW_UI_PATH="@/components/ui"

# For monorepo project
SOURCE_DIR="src/blocks"
TARGET_DIR="web/components/blocks"
OLD_UI_PATH="@/components/ui"
NEW_UI_PATH="@workspace/ui/components"
```
