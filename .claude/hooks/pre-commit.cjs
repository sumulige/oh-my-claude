#!/usr/bin/env node
/**
 * Pre-commit Quality Gate
 *
 * Runs quality checks before committing.
 * Fails the commit if critical or error issues are found.
 *
 * Install: ln -s ../../.claude/hooks/pre-commit.cjs .git/hooks/pre-commit
 * Or use: smc hooks install
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

async function main() {
  // Check if quality gate is enabled
  const configPath = path.join(projectDir, '.claude', 'quality-gate.json');
  let config = { enabled: true, gates: { preCommit: true } };

  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {}
  }

  if (!config.enabled || !config.gates?.preCommit) {
    process.exit(0);
  }

  // Get staged files
  let stagedFiles = [];
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    stagedFiles = output.trim().split('\n').filter(Boolean);
  } catch {
    // Not in git repo or no staged files
    process.exit(0);
  }

  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  // Filter to checkable files
  const checkable = stagedFiles.filter(f => {
    const ext = path.extname(f);
    return ['.js', '.ts', '.jsx', '.tsx', '.cjs', '.mjs', '.json', '.md'].includes(ext);
  });

  if (checkable.length === 0) {
    process.exit(0);
  }

  console.log(`Running pre-commit quality checks on ${checkable.length} file(s)...`);

  // Run quality gate
  const { QualityGate } = require(path.join(__dirname, '..', '..', 'lib', 'quality-gate.js'));
  const gate = new QualityGate({
    projectDir,
    config
  });

  const result = await gate.check({
    files: checkable.map(f => path.join(projectDir, f)),
    severity: 'error' // Block on errors and critical only
  });

  if (!result.passed) {
    console.error('\nPre-commit quality gate failed.');
    console.error('Fix issues or use --no-verify to bypass (not recommended).\n');
    process.exit(1);
  }

  console.log('Pre-commit quality checks passed.\n');
}

main().catch(err => {
  console.error('Pre-commit hook error:', err.message);
  process.exit(1);
});
