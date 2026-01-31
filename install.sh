#!/bin/bash
#
# Red Alert 2 EVA Cursor Hooks - Install Script
# 
# This script installs the RA2 EVA hooks to ~/.cursor/hooks/ra2-eva/
# and configures hooks.json. Safe to run multiple times (idempotent).
#
# Usage: ./install.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Target directories
CURSOR_DIR="$HOME/.cursor"
HOOKS_DIR="$CURSOR_DIR/hooks"
TARGET_DIR="$HOOKS_DIR/ra2-eva"
HOOKS_JSON="$CURSOR_DIR/hooks.json"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ${RED}RED ALERT 2${NC} ${BLUE}EVA Cursor Hooks Installer            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Clean up existing installation
if [ -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}[1/5]${NC} Removing existing installation..."
    rm -rf "$TARGET_DIR"
else
    echo -e "${YELLOW}[1/5]${NC} No existing installation found."
fi

# Step 2: Create fresh directory structure
echo -e "${YELLOW}[2/5]${NC} Creating directory structure..."
mkdir -p "$TARGET_DIR"

# Step 3: Copy source files
echo -e "${YELLOW}[3/5]${NC} Copying TypeScript source files..."
cp "$SCRIPT_DIR/src/"*.ts "$TARGET_DIR/"

# Step 4: Copy audio assets
echo -e "${YELLOW}[4/5]${NC} Copying audio assets..."
cp -r "$SCRIPT_DIR/assets/audio" "$TARGET_DIR/assets"

# Count audio files
ALLIED_COUNT=$(ls -1 "$TARGET_DIR/assets/eva_allied/"*.wav 2>/dev/null | wc -l | tr -d ' ')
SOVIET_COUNT=$(ls -1 "$TARGET_DIR/assets/eva_soviet/"*.wav 2>/dev/null | wc -l | tr -d ' ')
echo -e "    Allied EVA sounds: ${GREEN}$ALLIED_COUNT${NC}"
echo -e "    Soviet EVA sounds: ${GREEN}$SOVIET_COUNT${NC}"

# Step 5: Create/update hooks.json
echo -e "${YELLOW}[5/5]${NC} Configuring hooks.json..."

# The hooks.json configuration (hook names must be camelCase, values must be arrays)
HOOKS_CONFIG='{
  "version": 1,
  "hooks": {
    "sessionStart": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "sessionEnd": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "preToolUse": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "postToolUse": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "postToolUseFailure": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "beforeShellExecution": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "afterShellExecution": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "beforeReadFile": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "afterFileEdit": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "beforeMCPExecution": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "afterMCPExecution": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "beforeSubmitPrompt": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "subagentStart": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "subagentStop": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "stop": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }],
    "preCompact": [{ "command": "bun '"$TARGET_DIR"'/index.ts" }]
  }
}'

# Write hooks.json (overwrites existing)
echo "$HOOKS_CONFIG" > "$HOOKS_JSON"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Installation Complete!                              ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Installed to: ${BLUE}$TARGET_DIR${NC}"
echo -e "Hooks config: ${BLUE}$HOOKS_JSON${NC}"
echo ""
echo -e "${YELLOW}Faction selection:${NC}"
echo -e "  • Odd hours (1,3,5...):  ${BLUE}Allied EVA${NC} (English)"
echo -e "  • Even hours (0,2,4...): ${RED}Soviet EVA${NC} (Russian accent)"
echo ""
echo -e "Current hour: $(date +%H) → $( [ $(($(date +%H) % 2)) -eq 1 ] && echo -e "${BLUE}Allied${NC}" || echo -e "${RED}Soviet${NC}" ) faction active"
echo ""
echo -e "${YELLOW}To activate:${NC} Restart Cursor or reload the window"
echo -e "${YELLOW}To refresh:${NC}  Run this script again"
echo ""
echo -e "${GREEN}Establishing battlefield control. Stand by.${NC}"
