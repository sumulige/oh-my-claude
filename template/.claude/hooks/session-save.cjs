#!/usr/bin/env node
/**
 * Session Save Hook - Save conversation context to file
 *
 * Triggered after each conversation turn
 * Saves conversation history, context, and state
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const SESSIONS_DIR = path.join(PROJECT_DIR, '.claude', 'sessions');
const MEMORY_FILE = path.join(PROJECT_DIR, '.claude', 'MEMORY.md');

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

/**
 * Generate session filename
 */
function getSessionFilename() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `session_${date}_${time}.md`;
}

/**
 * Save session context
 */
function saveSession(context) {
  const filename = getSessionFilename();
  const filepath = path.join(SESSIONS_DIR, filename);
  
  const content = `# Session - ${new Date().toISOString()}

> Type: ${context.type || 'chat'}
> Model: ${context.model || 'unknown'}
> Duration: ${context.duration || 'unknown'}

---

## Summary

${context.summary || 'No summary provided'}

---

## Context

\`\`\`json
${JSON.stringify(context.metadata || {}, null, 2)}
\`\`\`

---

## Key Points

${(context.keyPoints || []).map((p, i) => `${i + 1}. ${p}`).join('\n')}

---

## Artifacts

${(context.artifacts || []).map(a => `- ${a}`).join('\n') || 'None'}

---

## Next Steps

${context.nextSteps || 'None'}

---

*Session saved at: ${new Date().toISOString()}*
`;

  fs.writeFileSync(filepath, content, 'utf-8');
  
  // Update sessions index
  updateSessionsIndex();
  
  return filename;
}

/**
 * Update sessions index
 */
function updateSessionsIndex() {
  const files = fs.readdirSync(SESSIONS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse();
  
  const indexPath = path.join(SESSIONS_DIR, 'INDEX.md');
  
  let content = `# Sessions Index

> Total sessions: ${files.length}
> Last updated: ${new Date().toISOString()}

---

## Recent Sessions

${files.slice(0, 20).map(f => {
  const filepath = path.join(SESSIONS_DIR, f);
  const stat = fs.statSync(filepath);
  return `- [${f}](${f}) - ${stat.mtime.toISOString()}`;
}).join('\n')}

---
`;
  
  fs.writeFileSync(indexPath, content, 'utf-8');
}

/**
 * Update MEMORY.md with latest context
 */
function updateMemory(context) {
  const timestamp = new Date().toISOString();
  
  let content = '';
  
  if (fs.existsSync(MEMORY_FILE)) {
    content = fs.readFileSync(MEMORY_FILE, 'utf-8');
  }
  
  // Check if we need to add a new entry
  const newEntry = `\n## ${timestamp.split('T')[0]}\n\n${
    context.summary || context.keyPoints?.join('\n') || 'No details'
  }\n`;
  
  // Keep only last 7 days
  const entries = content.split('## ').slice(1, 8);
  content = '# Memory\n\n<!-- Project memory updated by AI -->\n' + 
    '## ' + entries.join('## ') + newEntry;
  
  fs.writeFileSync(MEMORY_FILE, content, 'utf-8');
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === '--save' && args[1]) {
    const contextData = JSON.parse(fs.readFileSync(args[1], 'utf-8'));
    const filename = saveSession(contextData);
    console.log(`✅ Session saved: ${filename}`);
    
    if (contextData.addToMemory !== false) {
      updateMemory(contextData);
      console.log(`✅ Memory updated`);
    }
  }
}

exports.saveSession = saveSession;
exports.updateMemory = updateMemory;
exports.updateSessionsIndex = updateSessionsIndex;
