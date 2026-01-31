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

// ANSI codes
const colors = {
  red: "\x1b[0;31m",
  green: "\x1b[0;32m",
  yellow: "\x1b[1;33m",
  blue: "\x1b[0;34m",
  cyan: "\x1b[0;36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

const cursor = {
  hide: "\x1b[?25l",
  show: "\x1b[?25h",
  up: "\x1b[1A",
  clearLine: "\x1b[2K",
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Interactive yes/no prompt with arrow key navigation
 */
function confirm(question) {
  return new Promise((resolve) => {
    let selected = 0; // 0 = Yes, 1 = No

    const render = () => {
      const yes = selected === 0 
        ? `${colors.green}${colors.bold}▸ Yes${colors.reset}` 
        : `${colors.dim}  Yes${colors.reset}`;
      const no = selected === 1 
        ? `${colors.red}${colors.bold}▸ No${colors.reset}` 
        : `${colors.dim}  No${colors.reset}`;
      
      process.stdout.write(`${cursor.clearLine}\r  ${yes}    ${no}  ${colors.dim}(←/→ to select, enter to confirm)${colors.reset}`);
    };

    console.log();
    console.log(`${colors.yellow}⚠${colors.reset}  ${question}`);
    process.stdout.write(cursor.hide);
    render();

    // Enable raw mode for keypress detection
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const onKeypress = (key) => {
      // Ctrl+C
      if (key === "\u0003") {
        process.stdout.write(cursor.show);
        console.log("\n");
        log(colors.yellow, "Installation cancelled.");
        process.exit(0);
      }

      // Arrow keys (left/right) or h/l or y/n
      if (key === "\u001b[D" || key === "h" || key === "y" || key === "Y") {
        // Left arrow or h or y = Yes
        selected = 0;
        render();
      } else if (key === "\u001b[C" || key === "l" || key === "n" || key === "N") {
        // Right arrow or l or n = No
        selected = 1;
        render();
      } else if (key === "\r" || key === "\n") {
        // Enter
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onKeypress);
        process.stdout.write(cursor.show);
        console.log("\n");
        resolve(selected === 0);
      }
    };

    process.stdin.on("data", onKeypress);
  });
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

// Check if -y or --yes flag is passed
const skipConfirmation = process.argv.includes("-y") || process.argv.includes("--yes");

async function main() {
  // Banner
  console.log();
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

  // Check if hooks.json exists and warn user
  const hooksJsonExists = fs.existsSync(hooksJsonPath);
  
  if (hooksJsonExists && !skipConfirmation) {
    console.log(`${colors.cyan}Found existing:${colors.reset} ${hooksJsonPath}`);
    console.log();
    console.log(`${colors.dim}This will override your existing hooks.json configuration.${colors.reset}`);
    console.log(`${colors.dim}Your current hooks will be replaced with RA2 EVA hooks.${colors.reset}`);
    
    const proceed = await confirm("Do you want to continue?");
    
    if (!proceed) {
      log(colors.yellow, "Installation cancelled. Your hooks.json was not modified.");
      process.exit(0);
    }
  } else if (!hooksJsonExists) {
    console.log(`${colors.dim}No existing hooks.json found. A new one will be created.${colors.reset}`);
    console.log();
  }

  // Source paths (relative to this script's package)
  const packageRoot = path.join(__dirname, "..");
  const distDir = path.join(packageRoot, "dist");
  const assetsDir = path.join(packageRoot, "assets");

  // Verify dist/index.js exists
  const indexJsPath = path.join(distDir, "index.js");
  if (!fs.existsSync(indexJsPath)) {
    log(colors.red, "Error: dist/index.js not found. Package may be corrupted.");
    process.exit(1);
  }

  // Step 1: Remove existing installation
  log(colors.yellow, "[1/4] Removing existing installation...");
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // Step 2: Create directory structure
  log(colors.yellow, "[2/4] Creating directory structure...");
  fs.mkdirSync(targetDir, { recursive: true });

  // Step 3: Copy bundled JavaScript file
  log(colors.yellow, "[3/4] Copying bundled hook & assets...");
  
  // Copy the bundled index.js
  fs.copyFileSync(indexJsPath, path.join(targetDir, "index.js"));

  // Copy audio assets
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
    `    ${colors.dim}Allied EVA sounds:${colors.reset} ${colors.green}${alliedCount}${colors.reset}`
  );
  console.log(
    `    ${colors.dim}Soviet EVA sounds:${colors.reset} ${colors.green}${sovietCount}${colors.reset}`
  );

  // Step 4: Configure hooks.json
  log(colors.yellow, "[4/4] Configuring hooks.json...");

  // Use node to run the bundled JavaScript
  const hookCommand = `node ${targetDir}/index.js`;
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

  const hooksConfig = { version: 1, hooks: {} };

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
  console.log(`${colors.dim}Installed to:${colors.reset}  ${colors.blue}${targetDir}${colors.reset}`);
  console.log(`${colors.dim}Hooks config:${colors.reset}  ${colors.blue}${hooksJsonPath}${colors.reset}`);
  console.log();
  
  log(colors.yellow, "Faction selection:");
  console.log(
    `  ${colors.dim}•${colors.reset} Odd hours (1,3,5...):  ${colors.blue}Allied EVA${colors.reset} ${colors.dim}(English)${colors.reset}`
  );
  console.log(
    `  ${colors.dim}•${colors.reset} Even hours (0,2,4...): ${colors.red}Soviet EVA${colors.reset} ${colors.dim}(Russian accent)${colors.reset}`
  );
  console.log();

  const currentHour = new Date().getHours();
  const faction = currentHour % 2 === 1 ? "Allied" : "Soviet";
  const factionColor = currentHour % 2 === 1 ? colors.blue : colors.red;
  console.log(
    `${colors.dim}Current hour:${colors.reset} ${currentHour} → ${factionColor}${faction}${colors.reset} ${colors.dim}faction active${colors.reset}`
  );
  console.log();
  
  log(colors.yellow, "Next steps:");
  console.log(`  ${colors.dim}•${colors.reset} Restart Cursor or reload the window`);
  console.log();
  
  log(colors.yellow, "To uninstall:");
  console.log(`  ${colors.cyan}npx ra2-eva-cursor-hooks --uninstall${colors.reset}`);
  console.log();
  
  log(colors.green, "Establishing battlefield control. Stand by.");
  console.log();
}

// Handle --uninstall flag
if (process.argv.includes("--uninstall")) {
  const homeDir = os.homedir();
  const targetDir = path.join(homeDir, ".cursor", "hooks", "ra2-eva");
  const hooksJsonPath = path.join(homeDir, ".cursor", "hooks.json");

  console.log();
  log(colors.yellow, "Uninstalling RA2 EVA Cursor Hooks...");
  console.log();

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
    log(colors.green, `✓ Removed: ${targetDir}`);
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
        log(colors.green, "✓ Cleaned up hooks.json");
      }
    } catch (e) {
      // Ignore errors
    }
  }

  console.log();
  log(colors.green, "Uninstallation complete. Battle control terminated.");
  console.log();
  process.exit(0);
}

// Run the installer
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
