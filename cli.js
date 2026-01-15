#!/usr/bin/env node
/**
 * Sumulige Claude - CLI Entry Point
 * Agent harness for Claude Code
 *
 * Features:
 * - Multi-agent orchestration
 * - Skills management via OpenSkills
 * - Built-in Claude Code project template
 * - ThinkingLens conversation tracking
 *
 * @version 1.0.7
 */

const { runCommand } = require('./lib/commands');
const { marketplaceCommands } = require('./lib/marketplace');

// ============================================================================
// Command Registry (data-driven, no if-else chains)
// ============================================================================

const COMMANDS = {
  version: {
    help: 'Show version and check for updates',
    args: ''
  },
  init: {
    help: 'Initialize configuration',
    args: '[--interactive]'
  },
  sync: {
    help: 'Sync to current project (auto-migrates old format)',
    args: ''
  },
  migrate: {
    help: 'Migrate old hooks format to new',
    args: ''
  },
  template: {
    help: 'Deploy Claude Code project template',
    args: '[path] [--safe] [--force] [--help]'
  },
  kickoff: {
    help: 'Start project planning workflow (Manus-style)',
    args: ''
  },
  agent: {
    help: 'Run agent orchestration',
    args: '<task>'
  },
  status: {
    help: 'Show configuration status',
    args: ''
  },
  'skill:list': {
    help: 'List installed skills',
    args: ''
  },
  'skill:create': {
    help: 'Create a new skill',
    args: '<name>'
  },
  'skill:check': {
    help: 'Check skill dependencies',
    args: '[name]'
  },
  'skill:install': {
    help: 'Install a skill',
    args: '<source>'
  },
  'marketplace:list': {
    help: 'List all available skills',
    args: ''
  },
  'marketplace:install': {
    help: 'Install a skill from marketplace',
    args: '<name>'
  },
  'marketplace:sync': {
    help: 'Sync external skills',
    args: ''
  },
  'marketplace:add': {
    help: 'Add external skill source',
    args: '<owner/repo>'
  },
  'marketplace:remove': {
    help: 'Remove skill from sources',
    args: '<name>'
  },
  'marketplace:status': {
    help: 'Show marketplace status',
    args: ''
  },
  ultrathink: {
    help: 'Enable deep thinking mode for AI',
    args: ''
  },
  'skills:official': {
    help: 'List official Claude skills',
    args: ''
  },
  'skills:install-official': {
    help: 'Install an official skill',
    args: '<name>'
  },
  'skills:install-all': {
    help: 'Install all recommended skills',
    args: ''
  },
  doctor: {
    help: 'Check system health',
    args: ''
  },
  'skills:search': {
    help: 'Search skills by keyword',
    args: '<keyword>'
  },
  'skills:validate': {
    help: 'Validate skill format',
    args: '[path]'
  },
  'skills:update': {
    help: 'Update official skills list',
    args: ''
  },
  'skills:publish': {
    help: 'Publish skill to GitHub',
    args: '[path]'
  },
  config: {
    help: 'Manage configuration',
    args: '[get|set] [key] [value]'
  }
};

// ============================================================================
// Help Display
// ============================================================================

function showHelp() {
  console.log('Sumulige Claude (smc) - Agent Harness for Claude Code');
  console.log('');
  console.log('Usage: smc <command> [args]');
  console.log('   (or: sumulige-claude <command> [args])');
  console.log('');
  console.log('Commands:');

  const maxCmdLen = Math.max(...Object.keys(COMMANDS).map(k => k.length));

  Object.entries(COMMANDS).forEach(([cmd, info]) => {
    const cmdPad = cmd.padEnd(maxCmdLen);
    const args = info.args ? ' ' + info.args : '';
    const argsPad = args.padEnd(10);
    console.log(`  ${cmdPad}${argsPad}  ${info.help}`);
  });

  console.log('');
  console.log('Examples:');
  console.log('  smc init');
  console.log('  smc sync            # Auto-migrates old format');
  console.log('  smc migrate         # Manual migration');
  console.log('  smc template          # Deploy to current dir (with backup)');
  console.log('  smc template /path/to/project');
  console.log('  smc template --safe   # Skip existing files');
  console.log('  smc template --force  # Overwrite without backup');
  console.log('  smc kickoff        # Start project planning');
  console.log('  smc agent "Build a REST API"');
  console.log('  smc skill:create api-tester');
  console.log('  smc skill:check manus-kickoff');
  console.log('  smc skill:install anthropics/skills');
  console.log('  smc marketplace:list');
  console.log('  smc marketplace:install dev-browser');
  console.log('  smc marketplace:sync');
  console.log('  smc ultrathink      # Enable deep thinking mode');
  console.log('  smc skills:official # List official skills');
  console.log('  smc doctor           # Check system health');
  console.log('  smc skills:search    # Search skills by keyword');
  console.log('  smc init -i         # Interactive setup');
}

// ============================================================================
// Main Entry
// ============================================================================

function main() {
  const [cmd, ...args] = process.argv.slice(2);

  // Handle --version flag
  if (cmd === '--version' || cmd === '-v') {
    runCommand('version', []);
    return;
  }

  if (!cmd) {
    showHelp();
    return;
  }

  const handler = COMMANDS[cmd];

  if (handler) {
    // Check if it's a marketplace command
    if (cmd.startsWith('marketplace:')) {
      marketplaceCommands[cmd](...args);
    } else {
      runCommand(cmd, args);
    }
  } else {
    console.log(`Unknown command: ${cmd}`);
    console.log('');
    showHelp();
    process.exit(1);
  }
}

// Run
main();
