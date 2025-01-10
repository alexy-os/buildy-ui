

# Block Update Script Usage Guide

## Overview
This script allows you to fetch and update UI blocks from a remote repository while automatically adjusting import paths to match your project's structure.

## Setup Instructions

1. **Copy the Script**
   - Create a `bin` directory in your project root
   - Save the script as `bin/getblocks.sh`
   - Make it executable:
   ```bash
   chmod +x bin/getblocks.sh
   ```

2. **Configure Variables**
   Edit the following variables at the top of the script to match your setup:
   ```bash
   REPO="alexy-os/buildy-ui"              # Source repository
   TARGET_DIR="src/blocks"                # Directory in source repo
   BLOCKS_DEST="src/components/blocks"    # Where to copy blocks in your project
   OLD_UI_PATH="@/components/ui"          # Original import path
   NEW_UI_PATH="@/components/ui"          # For default shadcn project
   NEW_UI_PATH="@workspace/ui/components" # For monorepo shadcn project
   ```

3. **Requirements**
   - Git installed
   - SSH access to the repository
   - Bash shell environment

## Usage

1. **Run the Script**
   ```bash
   ./bin/getblocks.sh
   ```

2. **What the Script Does**
   - Clones specified blocks from remote repository
   - Copies them to your designated directory
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

## Example Configuration
```bash
# For default shadcn project
BLOCKS_DEST="src/components/blocks"
OLD_UI_PATH="@/components/ui"
NEW_UI_PATH="@/components/ui"

# For monorepo shadcn project
BLOCKS_DEST="web/components/blocks"
OLD_UI_PATH="@/components/ui"
NEW_UI_PATH="@workspace/ui/components"
```
