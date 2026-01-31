/**
 * Red Alert 2 EVA Cursor Hooks - TypeScript Types
 * Based on Cursor's hook specification
 */

// ============================================================
// Common Input Fields (all hooks receive these)
// ============================================================

export interface CommonHookInput {
  conversation_id: string;
  generation_id: string;
  model: string;
  hook_event_name: string;
  cursor_version: string;
  workspace_roots: string[];
  user_email: string | null;
  transcript_path: string | null;
}

// ============================================================
// Hook-Specific Input Types
// ============================================================

export interface SessionStartInput extends CommonHookInput {
  hook_event_name: "sessionStart";
  session_id: string;
  is_background_agent: boolean;
  composer_mode?: "agent" | "ask" | "edit";
}

export interface SessionEndInput extends CommonHookInput {
  hook_event_name: "sessionEnd";
  session_id: string;
  reason: "completed" | "aborted" | "error" | "window_close" | "user_close";
  duration_ms: number;
  is_background_agent: boolean;
  final_status: string;
  error_message?: string;
}

export interface PreToolUseInput extends CommonHookInput {
  hook_event_name: "preToolUse";
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_use_id: string;
  cwd: string;
  agent_message?: string;
}

export interface PostToolUseInput extends CommonHookInput {
  hook_event_name: "postToolUse";
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output: string;
  tool_use_id: string;
  cwd: string;
  duration: number;
}

export interface PostToolUseFailureInput extends CommonHookInput {
  hook_event_name: "postToolUseFailure";
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_use_id: string;
  cwd: string;
  error_message: string;
  failure_type: "timeout" | "error" | "permission_denied";
  duration: number;
  is_interrupt: boolean;
}

export interface BeforeShellExecutionInput extends CommonHookInput {
  hook_event_name: "beforeShellExecution";
  command: string;
  cwd: string;
  timeout: number;
}

export interface AfterShellExecutionInput extends CommonHookInput {
  hook_event_name: "afterShellExecution";
  command: string;
  output: string;
  duration: number;
}

export interface BeforeReadFileInput extends CommonHookInput {
  hook_event_name: "beforeReadFile";
  file_path: string;
  content: string;
  attachments?: Array<{ type: "file" | "rule"; filePath: string }>;
}

export interface AfterFileEditInput extends CommonHookInput {
  hook_event_name: "afterFileEdit";
  file_path: string;
  edits: Array<{ old_string: string; new_string: string }>;
}

export interface BeforeMCPExecutionInput extends CommonHookInput {
  hook_event_name: "beforeMCPExecution";
  tool_name: string;
  tool_input: string;
  url?: string;
  command?: string;
}

export interface AfterMCPExecutionInput extends CommonHookInput {
  hook_event_name: "afterMCPExecution";
  tool_name: string;
  tool_input: string;
  result_json: string;
  duration: number;
}

export interface BeforeSubmitPromptInput extends CommonHookInput {
  hook_event_name: "beforeSubmitPrompt";
  prompt: string;
  attachments?: Array<{ type: "file" | "rule"; filePath: string }>;
}

export interface SubagentStartInput extends CommonHookInput {
  hook_event_name: "subagentStart";
  subagent_type: string;
  prompt: string;
}

export interface SubagentStopInput extends CommonHookInput {
  hook_event_name: "subagentStop";
  subagent_type: string;
  status: "completed" | "error";
  result: string;
  duration: number;
  agent_transcript_path?: string | null;
}

export interface StopInput extends CommonHookInput {
  hook_event_name: "stop";
  status: "completed" | "aborted" | "error";
  loop_count: number;
}

export interface PreCompactInput extends CommonHookInput {
  hook_event_name: "preCompact";
  trigger: "auto" | "manual";
  context_usage_percent: number;
  context_tokens: number;
  context_window_size: number;
  message_count: number;
  messages_to_compact: number;
  is_first_compaction: boolean;
}

// Union of all hook inputs
export type HookInput =
  | SessionStartInput
  | SessionEndInput
  | PreToolUseInput
  | PostToolUseInput
  | PostToolUseFailureInput
  | BeforeShellExecutionInput
  | AfterShellExecutionInput
  | BeforeReadFileInput
  | AfterFileEditInput
  | BeforeMCPExecutionInput
  | AfterMCPExecutionInput
  | BeforeSubmitPromptInput
  | SubagentStartInput
  | SubagentStopInput
  | StopInput
  | PreCompactInput;

// ============================================================
// Hook Output Types
// ============================================================

export interface SessionStartOutput {
  env?: Record<string, string>;
  additional_context?: string;
  continue?: boolean;
  user_message?: string;
}

export interface PreToolUseOutput {
  decision?: "allow" | "deny";
  reason?: string;
  updated_input?: Record<string, unknown>;
}

export interface PostToolUseOutput {
  updated_mcp_tool_output?: Record<string, unknown>;
}

export interface BeforeShellExecutionOutput {
  permission?: "allow" | "deny" | "ask";
  user_message?: string;
  agent_message?: string;
}

export interface BeforeReadFileOutput {
  permission?: "allow" | "deny";
  user_message?: string;
}

export interface BeforeSubmitPromptOutput {
  continue?: boolean;
  user_message?: string;
}

export interface SubagentStartOutput {
  decision?: "allow" | "deny";
  reason?: string;
}

export interface SubagentStopOutput {
  followup_message?: string;
}

export interface StopOutput {
  followup_message?: string;
}

export interface PreCompactOutput {
  user_message?: string;
}

// Empty output for observation-only hooks
export interface EmptyOutput {}

// ============================================================
// Sound Types
// ============================================================

export type Faction = "allied" | "soviet";

export type HookEventName = HookInput["hook_event_name"];

export interface SoundMapping {
  allied: string[];
  soviet: string[];
}
