#!/usr/bin/env node

/**
 * Red Alert 2 EVA Cursor Hooks Installer
 * Installs EVA voice lines as Cursor IDE hooks
 *
 * Usage: npx ra2-eva-cursor-hooks
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// ANSI colors
const colors = {
  red: "\x1b[0;31m",
  green: "\x1b[0;32m",
  yellow: "\x1b[1;33m",
  blue: "\x1b[0;34m",
  reset: "\x1b[0m",
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function countFiles(dir, extension) {
  let count = 0;
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    if (entry.endsWith(extension)) {
      count++;
    }
  }
  return count;
}

function main() {
  // Banner
  log(colors.blue, "╔═══════════════════════════════════════════════════════╗");
  log(
    colors.blue,
    `║   ${colors.red}RED ALERT 2${colors.blue} EVA Cursor Hooks Installer            ║`
  );
  log(colors.blue, "╚═══════════════════════════════════════════════════════╝");
  console.log();

  // Paths
  const homeDir = os.homedir();
  const cursorDir = path.join(homeDir, ".cursor");
  const targetDir = path.join(cursorDir, "hooks", "ra2-eva");
  const hooksJsonPath = path.join(cursorDir, "hooks.json");

  // Source paths (relative to this script's package)
  const packageRoot = path.join(__dirname, "..");
  const srcDir = path.join(packageRoot, "src");
  const assetsDir = path.join(packageRoot, "assets");

  // Step 1: Remove existing installation
  log(colors.yellow, "[1/5] Removing existing installation...");
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // Step 2: Create directory structure
  log(colors.yellow, "[2/5] Creating directory structure...");
  fs.mkdirSync(targetDir, { recursive: true });

  // Step 3: Copy TypeScript source files
  log(colors.yellow, "[3/5] Copying TypeScript source files...");
  const srcFiles = ["index.ts", "player.ts", "sounds.ts", "types.ts"];
  for (const file of srcFiles) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(targetDir, file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  // Step 4: Copy audio assets
  log(colors.yellow, "[4/5] Copying audio assets...");
  const assetsTargetDir = path.join(targetDir, "assets");
  copyRecursive(assetsDir, assetsTargetDir);

  const alliedDir = path.join(assetsTargetDir, "audio", "eva_allied");
  const sovietDir = path.join(assetsTargetDir, "audio", "eva_soviet");
  const alliedCount = fs.existsSync(alliedDir)
    ? countFiles(alliedDir, ".wav")
    : 0;
  const sovietCount = fs.existsSync(sovietDir)
    ? countFiles(sovietDir, ".wav")
    : 0;

  console.log(
    `    Allied EVA sounds: ${colors.green}${alliedCount}${colors.reset}`
  );
  console.log(
    `    Soviet EVA sounds: ${colors.green}${sovietCount}${colors.reset}`
  );

  // Step 5: Configure hooks.json
  log(colors.yellow, "[5/5] Configuring hooks.json...");

  const hookCommand = `bun run ${targetDir}/index.ts`;
  const hookEvents = [
    "sessionStart",
    "sessionEnd",
    "preToolUse",
    "postToolUse",
    "postToolUseFailure",
    "beforeShellExecution",
    "afterShellExecution",
    "beforeReadFile",
    "afterFileEdit",
    "beforeMCPExecution",
    "afterMCPExecution",
    "beforeSubmitPrompt",
    "subagentStart",
    "subagentStop",
    "stop",
    "preCompact",
    "afterAgentThought",
  ];

  // Load existing hooks.json or create new
  let hooksConfig = { version: 1, hooks: {} };
  if (fs.existsSync(hooksJsonPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(hooksJsonPath, "utf8"));
      hooksConfig = existing;
      if (!hooksConfig.hooks) {
        hooksConfig.hooks = {};
      }
    } catch (e) {
      // If parsing fails, start fresh
      hooksConfig = { version: 1, hooks: {} };
    }
  }

  // Add RA2 EVA hooks
  for (const event of hookEvents) {
    hooksConfig.hooks[event] = [{ command: hookCommand }];
  }

  fs.writeFileSync(hooksJsonPath, JSON.stringify(hooksConfig, null, 2));

  // Success message
  console.log();
  log(
    colors.green,
    "╔═══════════════════════════════════════════════════════╗"
  );
  log(
    colors.green,
    "║   Installation Complete!                              ║"
  );
  log(
    colors.green,
    "╚═══════════════════════════════════════════════════════╝"
  );
  console.log();
  console.log(`Installed to: ${colors.blue}${targetDir}${colors.reset}`);
  console.log(`Hooks config: ${colors.blue}${hooksJsonPath}${colors.reset}`);
  console.log();
  log(colors.yellow, "Faction selection:");
  console.log(
    `  • Odd hours (1,3,5...):  ${colors.blue}Allied EVA${colors.reset} (English)`
  );
  console.log(
    `  • Even hours (0,2,4...): ${colors.red}Soviet EVA${colors.reset} (Russian accent)`
  );
  console.log();

  const currentHour = new Date().getHours();
  const faction = currentHour % 2 === 1 ? "Allied" : "Soviet";
  const factionColor = currentHour % 2 === 1 ? colors.blue : colors.red;
  console.log(
    `Current hour: ${currentHour} → ${factionColor}${faction}${colors.reset} faction active`
  );
  console.log();
  log(colors.yellow, "Prerequisites:");
  console.log("  • Bun runtime must be installed (https://bun.sh)");
  console.log("  • Run: curl -fsSL https://bun.sh/install | bash");
  console.log();
  log(colors.yellow, "To activate:");
  console.log("  Restart Cursor or reload the window");
  console.log();
  log(colors.yellow, "To uninstall:");
  console.log("  npx ra2-eva-cursor-hooks --uninstall");
  console.log();
  log(colors.green, "Establishing battlefield control. Stand by.");
}

// Handle --uninstall flag
if (process.argv.includes("--uninstall")) {
  const homeDir = os.homedir();
  const targetDir = path.join(homeDir, ".cursor", "hooks", "ra2-eva");
  const hooksJsonPath = path.join(homeDir, ".cursor", "hooks.json");

  log(colors.yellow, "Uninstalling RA2 EVA Cursor Hooks...");

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
    log(colors.green, `Removed: ${targetDir}`);
  }

  if (fs.existsSync(hooksJsonPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(hooksJsonPath, "utf8"));
      if (config.hooks) {
        // Remove RA2 hooks
        for (const key of Object.keys(config.hooks)) {
          const hooks = config.hooks[key];
          if (Array.isArray(hooks)) {
            config.hooks[key] = hooks.filter(
              (h) => !h.command?.includes("ra2-eva")
            );
            if (config.hooks[key].length === 0) {
              delete config.hooks[key];
            }
          }
        }
        fs.writeFileSync(hooksJsonPath, JSON.stringify(config, null, 2));
        log(colors.green, "Cleaned up hooks.json");
      }
    } catch (e) {
      // Ignore errors
    }
  }

  log(colors.green, "Uninstallation complete. Battle control terminated.");
  process.exit(0);
}

main();
