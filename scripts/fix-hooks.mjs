#!/usr/bin/env node
/**
 * Fix hooks format from old to new
 * 旧格式：{"matcher": "...", "hooks": [...]}
 * 新格式：{"UserPromptSubmit": [{"matcher": {}, "hooks": [...]}], ...}
 */

import fs from 'fs';
import path from 'path';

const NEW_FORMAT = {
  "UserPromptSubmit": [
    {
      "matcher": {},
      "hooks": [
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/project-kickoff.cjs", "timeout": 1000 },
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/rag-skill-loader.cjs", "timeout": 1000 },
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/thinking-silent.cjs", "timeout": 1000 },
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/multi-session.cjs", "timeout": 1000 },
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/todo-manager.cjs", "timeout": 1000 }
      ]
    }
  ],
  "PreToolUse": [
    {
      "matcher": {},
      "hooks": [
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/thinking-silent.cjs", "timeout": 1000 },
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/multi-session.cjs", "timeout": 1000 },
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/todo-manager.cjs", "timeout": 1000 }
      ]
    }
  ],
  "PostToolUse": [
    {
      "matcher": {},
      "hooks": [
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/code-formatter.cjs", "timeout": 5000 },
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/verify-work.cjs", "timeout": 1000 },
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/thinking-silent.cjs", "timeout": 1000 },
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/multi-session.cjs", "timeout": 1000 },
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/todo-manager.cjs", "timeout": 1000 }
      ]
    }
  ],
  "AgentStop": [
    {
      "matcher": {},
      "hooks": [
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/verify-work.cjs", "timeout": 1000 },
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/thinking-silent.cjs", "timeout": 1000 },
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/multi-session.cjs", "timeout": 1000 },
        { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/todo-manager.cjs", "timeout": 1000 }
      ]
    }
  ]
};

function fixProject(projectPath) {
  const settingsFile = path.join(projectPath, '.claude', 'settings.json');

  if (!fs.existsSync(settingsFile)) {
    console.log(`⚠️  ${projectPath} - no settings.json`);
    return false;
  }

  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
  } catch (e) {
    console.log(`❌ ${projectPath} - invalid JSON`);
    return false;
  }

  // 检测旧格式
  const isOldFormat = settings.matcher || (settings.hooks && typeof settings.hooks === 'object');

  if (!isOldFormat) {
    console.log(`✅ ${projectPath} - already new format`);
    return false;
  }

  // 写入新格式
  fs.writeFileSync(settingsFile, JSON.stringify(NEW_FORMAT, null, 2) + '\n');
  console.log(`🔧 ${projectPath} - fixed!`);
  return true;
}

// CLI
const args = process.argv.slice(2);

if (args.length === 0) {
  // 当前目录
  fixProject(process.cwd());
} else {
  args.forEach(fixProject);
}
