#!/usr/bin/env bun
/**
 * Red Alert 2 EVA Cursor Hooks
 *
 * Plays nostalgic Red Alert 2 EVA voice lines for Cursor agent events.
 * Alternates between Allied (odd hours) and Soviet (even hours) voices.
 */

import { stdin } from "bun";
import { getFaction, playHookSound, getSoundKey } from "./player";

// #region agent log - debug logging helper
const DEBUG_ENDPOINT = "http://127.0.0.1:7250/ingest/4d6b02fd-c954-479e-9cf3-5b010857b686";
const debugLog = (hypothesisId: string, message: string, data: Record<string, unknown>) => {
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location: "index.ts", message, data, timestamp: Date.now(), sessionId: "debug-session", hypothesisId })
  }).catch(() => {});
};
// #endregion
import type {
  BeforeReadFileOutput,
  BeforeShellExecutionOutput,
  BeforeSubmitPromptOutput,
  HookInput,
  PreCompactOutput,
  PreToolUseOutput,
  SessionStartOutput,
  StopOutput,
  SubagentStartOutput,
  SubagentStopOutput,
} from "./types";

/**
 * Parse hook input from stdin
 */
async function parseHookInput<T>(): Promise<T> {
  const text = await stdin.text();
  return JSON.parse(text) as T;
}

/**
 * Build the appropriate response for each hook type
 */
function buildResponse(hookName: string): Record<string, unknown> {
  switch (hookName) {
    // Hooks that need to allow the action to proceed
    case "sessionStart": {
      const response: SessionStartOutput = { continue: true };
      return response;
    }

    case "preToolUse": {
      const response: PreToolUseOutput = { decision: "allow" };
      return response;
    }

    case "beforeShellExecution":
    case "beforeMCPExecution": {
      const response: BeforeShellExecutionOutput = { permission: "allow" };
      return response;
    }

    case "beforeReadFile": {
      const response: BeforeReadFileOutput = { permission: "allow" };
      return response;
    }

    case "beforeSubmitPrompt": {
      const response: BeforeSubmitPromptOutput = { continue: true };
      return response;
    }

    case "subagentStart": {
      const response: SubagentStartOutput = { decision: "allow" };
      return response;
    }

    // Hooks that can optionally trigger follow-ups
    case "subagentStop": {
      const response: SubagentStopOutput = {};
      return response;
    }

    case "stop": {
      const response: StopOutput = {};
      return response;
    }

    case "preCompact": {
      const response: PreCompactOutput = {};
      return response;
    }

    // Observation-only hooks (no output needed)
    case "sessionEnd":
    case "postToolUse":
    case "postToolUseFailure":
    case "afterShellExecution":
    case "afterMCPExecution":
    case "afterFileEdit":
    default:
      return {};
  }
}

/**
 * Main hook handler
 */
async function main(): Promise<void> {
  const input = await parseHookInput<HookInput>();
  const hookName = input.hook_event_name;

  // Log to stderr (doesn't interfere with JSON output)
  const faction = getFaction();
  const hour = new Date().getHours();
  console.error(`[EVA] Hook: ${hookName}`);
  console.error(`[EVA] ${faction.toUpperCase()} faction (hour: ${hour})`);

  // #region agent log - Hypothesis A/B: Track which hooks fire and their sound keys
  const soundKey = getSoundKey(input);
  const toolName = (input as any).tool_name || null;
  debugLog("A", "Hook invoked", { hookName, soundKey, toolName, faction, timestamp: Date.now() });
  // #endregion

  // Play the appropriate sound (fire and forget)
  await playHookSound(input);

  // #region agent log - Hypothesis C: Confirm sound was triggered
  debugLog("C", "Sound played", { hookName, soundKey });
  // #endregion

  // Build and return the appropriate response
  const response = buildResponse(hookName);
  process.stdout.write(JSON.stringify(response) + "\n");
}

main().catch((error) => {
  console.error("[EVA] Hook failed:", error);
  // Return empty object on error to not block Cursor
  process.stdout.write("{}\n");
});
