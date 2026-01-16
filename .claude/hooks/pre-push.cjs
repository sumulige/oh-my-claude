#!/usr/bin/env node
/**
 * Pre-push Quality Gate
 *
 * Runs full quality checks before pushing.
 * More comprehensive than pre-commit.
 *
 * Install: ln -s ../../.claude/hooks/pre-push.cjs .git/hooks/pre-push
 * Or use: smc hooks install
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

async function main() {
  // Check if quality gate is enabled
  const configPath = path.join(projectDir, '.claude', 'quality-gate.json');
  let config = { enabled: true, gates: { prePush: true } };

  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {}
  }

  if (!config.enabled || !config.gates?.prePush) {
    process.exit(0);
  }

  console.log('Running pre-push quality checks...\n');

  // Get all files that will be pushed
  let filesToCheck = [];
  try {
    // Get files changed since last push
    const upstream = execSync('git rev-parse --abbrev-ref --symbolic-full-name @{u}', {
      encoding: 'utf-8',
      stdio: 'pipe'
    }).trim() || 'origin/main';

    const output = execSync(`git diff --name-only ${upstream}...HEAD`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    filesToCheck = output.trim().split('\n').filter(Boolean);
  } catch {
    // No upstream or other git error - check staged files only
    try {
      const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      filesToCheck = output.trim().split('\n').filter(Boolean);
    } catch {
      // Not in git repo
      process.exit(0);
    }
  }

  if (filesToCheck.length === 0) {
    process.exit(0);
  }

  // Filter to checkable files
  const checkable = filesToCheck.filter(f => {
    const ext = path.extname(f);
    return ['.js', '.ts', '.jsx', '.tsx', '.cjs', '.mjs', '.json', '.md'].includes(ext);
  });

  if (checkable.length === 0) {
    process.exit(0);
  }

  console.log(`Checking ${checkable.length} changed file(s)...\n`);

  // Run quality gate
  const { QualityGate } = require(path.join(__dirname, '..', '..', 'lib', 'quality-gate.js'));
  const gate = new QualityGate({
    projectDir,
    config
  });

  const result = await gate.check({
    files: checkable.map(f => path.join(projectDir, f)),
    severity: 'warn' // Block on warnings too for push
  });

  if (!result.passed) {
    console.error('\nPush blocked by quality gate.');
    console.error('Fix issues or use --no-verify to bypass (not recommended).\n');
    process.exit(1);
  }

  console.log('All quality checks passed. Proceeding with push.\n');
}

main().catch(err => {
  console.error('Pre-push hook error:', err.message);
  process.exit(1);
});
