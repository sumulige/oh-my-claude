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

// ============================================================================
// Command Registry (data-driven, no if-else chains)
// ============================================================================

const COMMANDS = {
  init: {
    help: 'Initialize configuration',
    args: ''
  },
  sync: {
    help: 'Sync to current project',
    args: ''
  },
  template: {
    help: 'Deploy Claude Code project template',
    args: '[path]'
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
  console.log('  smc sync');
  console.log('  smc template');
  console.log('  smc template /path/to/project');
  console.log('  smc kickoff        # Start project planning');
  console.log('  smc agent "Build a REST API"');
  console.log('  smc skill:create api-tester');
  console.log('  smc skill:check manus-kickoff');
  console.log('  smc skill:install anthropics/skills');
}

// ============================================================================
// Main Entry
// ============================================================================

function main() {
  const [cmd, ...args] = process.argv.slice(2);

  if (!cmd) {
    showHelp();
    return;
  }

  const handler = COMMANDS[cmd];

  if (handler) {
    runCommand(cmd, args);
  } else {
    console.log(`Unknown command: ${cmd}`);
    console.log('');
    showHelp();
    process.exit(1);
  }
}

// Run
main();
