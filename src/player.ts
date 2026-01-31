/// <reference types="bun-types" />
/**
 * Red Alert 2 EVA Audio Player
 * Plays WAV files using macOS afplay command
 */

import { spawn } from "bun";
import { dirname, resolve } from "path";
import { SOUND_MAPPINGS, getStopSoundKey } from "./sounds";
import type { Faction, HookInput, PostToolUseInput, StopInput } from "./types";

// Resolve assets directory relative to this file
const SCRIPT_DIR = dirname(Bun.main);
const ASSETS_DIR = resolve(SCRIPT_DIR, "assets");

/**
 * Get the current faction based on hour
 * Odd hours = Allied, Even hours = Soviet
 */
export function getFaction(): Faction {
  const hour = new Date().getHours();
  return hour % 2 === 1 ? "allied" : "soviet";
}

/**
 * Get a random element from an array
 */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get the sound file path for a hook event
 */
export function getSoundPath(
  hookType: string,
  faction: Faction
): string | null {
  const mapping = SOUND_MAPPINGS[hookType];
  if (!mapping) {
    console.error(`[EVA] No sound mapping for hook: ${hookType}`);
    return null;
  }

  const sounds = mapping[faction];
  if (!sounds || sounds.length === 0) {
    return null;
  }

  const soundFile = randomChoice(sounds);
  const factionDir = faction === "allied" ? "eva_allied" : "eva_soviet";

  return resolve(ASSETS_DIR, factionDir, soundFile);
}

/**
 * Determine the sound key for lookup
 * Handles special cases like stop with different statuses
 * Returns null to skip playing sound for this hook
 */
export function getSoundKey(input: HookInput): string | null {
  const hookName = input.hook_event_name;

  // Handle stop hook with status-based sounds
  if (hookName === "stop") {
    const stopInput = input as StopInput;
    return getStopSoundKey(stopInput.status);
  }

  // Handle preToolUse - skip for tools with dedicated hooks
  if (hookName === "preToolUse") {
    const toolInput = input as PostToolUseInput;
    if (toolInput.tool_name === "Shell") {
      return null; // Skip - beforeShellExecution handles shell
    }
    if (toolInput.tool_name === "Read") {
      return null; // Skip - beforeReadFile handles read
    }
    if (
      toolInput.tool_name === "Write" ||
      toolInput.tool_name === "StrReplace"
    ) {
      return null; // Skip - afterFileEdit handles write/edit
    }
  }

  // Handle postToolUse - skip for tools with dedicated hooks
  if (hookName === "postToolUse") {
    const toolInput = input as PostToolUseInput;
    // Skip Shell - afterShellExecution handles it
    if (toolInput.tool_name === "Shell") {
      return null;
    }
    // Skip Read - no sound needed after reading
    if (toolInput.tool_name === "Read") {
      return null;
    }
    // Skip Write/StrReplace - afterFileEdit handles it
    if (
      toolInput.tool_name === "Write" ||
      toolInput.tool_name === "StrReplace"
    ) {
      return null;
    }
    // Delete tool plays "Unit lost" - something was destroyed!
    if (toolInput.tool_name === "Delete") {
      return "postToolUseFailure"; // Maps to "Unit lost"
    }
  }

  // Handle postToolUseFailure - skip Read failures (often just "file doesn't exist" checks)
  if (hookName === "postToolUseFailure") {
    const toolInput = input as PostToolUseInput;
    if (toolInput.tool_name === "Read") {
      return null; // Skip - file not existing is expected when checking before create
    }
  }

  return hookName;
}

/**
 * Play a WAV file asynchronously using afplay
 * Does not block - fire and forget
 */
export async function playSound(filePath: string): Promise<void> {
  try {
    // Check if file exists
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      console.error(`[EVA] Sound file not found: ${filePath}`);
      return;
    }

    console.error(`[EVA] Playing: ${filePath}`);

    // Spawn afplay in background (fire and forget)
    spawn({
      cmd: ["afplay", filePath],
      stdout: "ignore",
      stderr: "ignore",
    });
  } catch (error) {
    console.error(`[EVA] Error playing sound: ${error}`);
  }
}

/**
 * Play the appropriate EVA sound for a hook event
 */
export async function playHookSound(input: HookInput): Promise<void> {
  const faction = getFaction();
  const soundKey = getSoundKey(input);
  const soundPath = getSoundPath(soundKey, faction);

  console.error(`[EVA] Faction: ${faction}, Sound key: ${soundKey}`);

  if (soundPath) {
    await playSound(soundPath);
  }
}
