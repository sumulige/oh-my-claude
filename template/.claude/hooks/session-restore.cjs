#!/usr/bin/env node
/**
 * Session Restore Hook - Restore conversation context from file
 *
 * Provides context continuity across sessions
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const SESSIONS_DIR = path.join(PROJECT_DIR, '.claude', 'sessions');
const MEMORY_FILE = path.join(PROJECT_DIR, '.claude', 'MEMORY.md');

/**
 * Get latest session
 */
function getLatestSession() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    return null;
  }
  
  const files = fs.readdirSync(SESSIONS_DIR)
    .filter(f => f.startsWith('session_') && f.endsWith('.md'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    return null;
  }
  
  const latestFile = files[0];
  const filepath = path.join(SESSIONS_DIR, latestFile);
  const content = fs.readFileSync(filepath, 'utf-8');
  
  return {
    file: latestFile,
    path: filepath,
    content: content
  };
}

/**
 * Get recent memory entries
 */
function getRecentMemory(days = 7) {
  if (!fs.existsSync(MEMORY_FILE)) {
    return '';
  }
  
  const content = fs.readFileSync(MEMORY_FILE, 'utf-8');
  const entries = content.split('## ').slice(1, days + 1);
  
  return entries.join('## ');
}

/**
 * Format context summary for display
 */
function formatContextSummary(latestSession, recentMemory) {
  let summary = '';
  
  if (latestSession) {
    summary += `\n📁 Last Session: ${latestSession.file}\n`;
    summary += `   Date: ${fs.statSync(latestSession.path).mtime.toLocaleString()}\n`;
  }
  
  const memoryEntries = recentMemory.split('\n').filter(l => l.trim()).length;
  if (memoryEntries > 0) {
    summary += `\n💾 Memory Entries: ${memoryEntries}\n`;
  }
  
  return summary;
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === '--latest') {
    const session = getLatestSession();
    if (session) {
      console.log(session.content);
    } else {
      console.log('No sessions found.');
    }
  } else if (args[0] === '--memory') {
    const memory = getRecentMemory(parseInt(args[1]) || 7);
    console.log('# Recent Memory\n');
    console.log(memory);
  } else if (args[0] === '--summary') {
    const session = getLatestSession();
    const memory = getRecentMemory();
    console.log(formatContextSummary(session, memory));
  } else {
    console.log('Usage: node session-restore.cjs [--latest|--memory|--summary]');
  }
}

exports.getLatestSession = getLatestSession;
exports.getRecentMemory = getRecentMemory;
exports.formatContextSummary = formatContextSummary;
