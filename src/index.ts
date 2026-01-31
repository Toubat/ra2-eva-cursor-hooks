#!/usr/bin/env bun
/**
 * Red Alert 2 EVA Cursor Hooks
 *
 * Plays nostalgic Red Alert 2 EVA voice lines for Cursor agent events.
 * Alternates between Allied (odd hours) and Soviet (even hours) voices.
 */

import { stdin } from "bun";
import { getFaction, playHookSound } from "./player";
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

  // Play the appropriate sound (fire and forget)
  await playHookSound(input);

  // Build and return the appropriate response
  const response = buildResponse(hookName);
  process.stdout.write(JSON.stringify(response) + "\n");
}

main().catch((error) => {
  console.error("[EVA] Hook failed:", error);
  // Return empty object on error to not block Cursor
  process.stdout.write("{}\n");
});
