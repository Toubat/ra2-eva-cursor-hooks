/**
 * Red Alert 2 EVA Sound Mappings
 * Maps hook events to EVA voice lines for both Allied and Soviet factions
 */

import type { SoundMapping } from "./types.js";

/**
 * Sound mappings for each hook event
 * Allied files: ceva###.wav
 * Soviet files: csof###.wav (same numbers, different prefix)
 *
 * Hook event names use camelCase as per Cursor docs
 */
export const SOUND_MAPPINGS: Record<string, SoundMapping> = {
  // ============================================================
  // Session Lifecycle
  // ============================================================

  sessionStart: {
    // "Establishing battlefield control. Stand by."
    allied: ["ceva016.wav"],
    soviet: ["csof016.wav"],
  },

  sessionEnd: {
    // "Battle control terminated."
    allied: ["ceva015.wav"],
    soviet: ["csof015.wav"],
  },

  // ============================================================
  // Tool Operations
  // ============================================================

  preToolUse: {
    // "Building."
    allied: ["ceva052.wav"],
    soviet: ["csof052.wav"],
  },

  postToolUse: {
    // "Unit ready."
    allied: ["ceva062.wav"],
    soviet: ["csof062.wav"],
  },

  postToolUseFailure: {
    // "Unit lost."
    allied: ["ceva064.wav"],
    soviet: ["csof064.wav"],
  },

  // ============================================================
  // Shell Commands
  // ============================================================

  beforeShellExecution: {
    // "Building."
    allied: ["ceva052.wav"],
    soviet: ["csof052.wav"],
  },

  afterShellExecution: {
    // "Unit ready."
    allied: ["ceva062.wav"],
    soviet: ["csof062.wav"],
  },

  // ============================================================
  // File Operations
  // ============================================================

  beforeReadFile: {
    // "Training." (training the LLM!)
    allied: ["ceva066.wav"],
    soviet: ["csof066.wav"],
  },

  afterFileEdit: {
    // "Unit promoted." (file improved!)
    allied: ["ceva079.wav"],
    soviet: ["csof079.wav"],
  },

  // ============================================================
  // MCP Tools (Special Technology!)
  // ============================================================

  beforeMCPExecution: {
    // "Upgrade in progress."
    allied: ["ceva084.wav"],
    soviet: ["csof084.wav"],
  },

  afterMCPExecution: {
    // "New technology acquired."
    allied: ["ceva074.wav"],
    soviet: ["csof074.wav"],
  },

  // ============================================================
  // Prompts
  // ============================================================

  beforeSubmitPrompt: {
    // "New mission objective received." / "New construction options."
    allied: ["ceva083.wav", "ceva049.wav"],
    soviet: ["csof083.wav", "csof049.wav"],
  },

  // ============================================================
  // Subagents (Reinforcements!)
  // ============================================================

  subagentStart: {
    // Random: "Reinforcements have arrived." / "Reinforcements ready."
    allied: ["ceva038.wav", "ceva121.wav"],
    soviet: ["csof038.wav", "csof121.wav"],
  },

  subagentStop: {
    // Random: "Primary/Secondary/Tertiary objective achieved."
    allied: ["ceva017.wav", "ceva018.wav", "ceva019.wav"],
    soviet: ["csof017.wav", "csof018.wav", "csof019.wav"],
  },

  // ============================================================
  // Agent Stop (Status-based)
  // ============================================================

  "stop:completed": {
    // "Construction complete." / "Primary objective achieved."
    allied: ["ceva048.wav", "ceva017.wav"],
    soviet: ["csof048.wav", "csof017.wav"],
  },

  "stop:aborted": {
    // "Cancelled."
    allied: ["ceva051.wav"],
    soviet: ["csof051.wav"],
  },

  "stop:error": {
    // "Cannot deploy here."
    allied: ["ceva063.wav"],
    soviet: ["csof063.wav"],
  },

  // ============================================================
  // Agent Thoughts
  // ============================================================

  afterAgentThought: {
    // "Incoming transmission." (agent finished thinking)
    allied: ["ceva040.wav"],
    soviet: ["csof040.wav"],
  },

  // ============================================================
  // Context Management
  // ============================================================

  preCompact: {
    // Random: "Low power." / "Base defenses offline." / "Building offline."
    allied: ["ceva053.wav"],
    soviet: ["csof053.wav"],
  },
};

/**
 * Get the sound key for a stop event based on status
 */
export function getStopSoundKey(status: string): string {
  return `stop:${status}`;
}
