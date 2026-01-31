/// <reference types="bun-types" />
/**
 * Red Alert 2 EVA Audio Player
 * Plays WAV files using macOS afplay command
 * Includes audio queue to prevent overlapping sounds
 */

import { spawnSync } from "bun";
import { existsSync, unlinkSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { SOUND_MAPPINGS, getStopSoundKey } from "./sounds";
import type { Faction, HookInput, PostToolUseInput, StopInput } from "./types";

// Resolve assets directory relative to this file
const SCRIPT_DIR = dirname(Bun.main);
const ASSETS_DIR = resolve(SCRIPT_DIR, "assets", "audio");

// Lock file for audio queue
const LOCK_FILE = "/tmp/ra2-eva-audio.lock";
const MAX_WAIT_MS = 10000; // Max 10 seconds to wait for lock
const POLL_INTERVAL_MS = 50; // Check every 50ms

/**
 * Acquire the audio lock (blocks until available or timeout)
 */
async function acquireLock(): Promise<boolean> {
  const startTime = Date.now();

  while (existsSync(LOCK_FILE)) {
    // Check if lock is stale (older than 5 seconds = stuck process)
    try {
      const stat = Bun.file(LOCK_FILE);
      const lockTime = parseInt(await stat.text(), 10);
      if (Date.now() - lockTime > 5000) {
        // Stale lock, remove it
        try {
          unlinkSync(LOCK_FILE);
        } catch {}
        break;
      }
    } catch {}

    // Timeout check
    if (Date.now() - startTime > MAX_WAIT_MS) {
      console.error("[EVA] Timeout waiting for audio lock");
      return false;
    }

    await Bun.sleep(POLL_INTERVAL_MS);
  }

  // Create lock with current timestamp
  try {
    writeFileSync(LOCK_FILE, Date.now().toString());
    return true;
  } catch {
    return false;
  }
}

/**
 * Release the audio lock
 */
function releaseLock(): void {
  try {
    unlinkSync(LOCK_FILE);
  } catch {}
}

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
    if (toolInput.tool_name === "Grep") {
      return "beforeReadFile"; // Grep is like Read - play "Training"
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
    // Skip Grep - no sound needed after grep (like Read)
    if (toolInput.tool_name === "Grep") {
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
 * Play a WAV file with queue support
 * Waits for previous audio to finish before playing
 */
export async function playSound(filePath: string): Promise<void> {
  try {
    // Check if file exists
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      console.error(`[EVA] Sound file not found: ${filePath}`);
      return;
    }

    // Acquire lock (wait for previous audio to finish)
    const gotLock = await acquireLock();
    if (!gotLock) {
      console.error(
        `[EVA] Could not acquire audio lock, skipping: ${filePath}`
      );
      return;
    }

    console.error(`[EVA] Playing: ${filePath}`);

    try {
      // Play audio SYNCHRONOUSLY (wait for it to finish)
      spawnSync({
        cmd: ["afplay", filePath],
        stdout: "ignore",
        stderr: "ignore",
      });
    } finally {
      // Always release lock
      releaseLock();
    }
  } catch (error) {
    console.error(`[EVA] Error playing sound: ${error}`);
    releaseLock(); // Ensure lock is released on error
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
