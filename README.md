# Red Alert 2 EVA Cursor Hooks

Nostalgic Red Alert 2 EVA voice lines for Cursor IDE agent events. Transform your coding sessions with iconic audio feedback from the classic RTS game.

## Features

- **17 hook events** with custom EVA voice lines
- **Allied & Soviet factions** - alternates based on hour (odd = Allied, even = Soviet)
- **Audio queue** - prevents overlapping sounds when parallel tools execute
- **Easy install** - one command via npx

## Sound Mappings

| Event | Sound |
|-------|-------|
| Session Start | "Establishing battlefield control. Stand by." |
| Session End | "Battle control terminated." |
| Before Shell | "Building." |
| After Shell | "Unit ready." |
| Before Read File | "Training." |
| After File Edit | "Unit promoted." |
| Before MCP | "Upgrade in progress." |
| After MCP | "New technology acquired." |
| Before Prompt | "New mission objective received." / "New construction options." |
| Tool Failure | "Unit lost." |
| Delete File | "Unit lost." |
| Stop (completed) | "Construction complete." / "Primary objective achieved." |
| Stop (aborted) | "Cancelled." |
| Stop (error) | "Cannot deploy here." |
| Subagent Start | "Reinforcements have arrived." |
| Subagent Stop | "Objective achieved." |
| Agent Thought | "Incoming transmission." |
| Context Compact | "Low power." |

## Installation

### Via npx (recommended)

```bash
npx ra2-eva-cursor-hooks
```

Or use the shorter alias:

```bash
npx ra2-eva
```

### Manual Installation

```bash
git clone https://github.com/Toubat/cursor-hooks.git
cd cursor-hooks
./install.sh
```

## Prerequisites

- **Bun runtime** - required to run the TypeScript hooks
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
- **macOS** - uses `afplay` for audio playback

## Uninstall

```bash
npx ra2-eva-cursor-hooks --uninstall
```

## Faction Selection

The EVA voice alternates between factions based on the current hour:

- **Odd hours** (1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23) → **Allied EVA** (English)
- **Even hours** (0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22) → **Soviet EVA** (Russian accent)

## How It Works

This package installs Cursor hooks that:

1. Listen for agent events (tool use, file edits, shell commands, etc.)
2. Play appropriate Red Alert 2 EVA voice lines via `afplay`
3. Queue audio to prevent overlapping when multiple events fire simultaneously
4. Return proper JSON responses to allow Cursor to continue

Files are installed to `~/.cursor/hooks/ra2-eva/` and configured in `~/.cursor/hooks.json`.

## Audio Credits

Voice lines are from **Command & Conquer: Red Alert 2** by Westwood Studios / EA Games. This is a fan project for educational purposes.