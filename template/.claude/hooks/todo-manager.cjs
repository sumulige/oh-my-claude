#!/usr/bin/env node
/**
 * TODO Manager - AI 自动任务管理系统
 *
 * 功能：
 * - 自动追踪项目任务
 * - 生成可点击的任务索引
 * - 维护任务状态流转
 * - 静默运行，不打扰工作流
 *
 * 目录结构：
 * development/todos/
 * ├── INDEX.md       # 任务总览
 * ├── active/        # 进行中的任务
 * ├── completed/     # 已完成的任务
 * ├── backlog/       # 待办任务
 * └── archived/      # 已归档任务
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const TODOS_DIR = path.join(PROJECT_DIR, 'development', 'todos');
const INDEX_FILE = path.join(TODOS_DIR, 'INDEX.md');
const STATE_FILE = path.join(TODOS_DIR, '.state.json');

// 任务状态
const STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  BACKLOG: 'backlog',
  ARCHIVED: 'archived'
};

// 确保目录存在
function ensureDirectories() {
  [TODOS_DIR, STATUS.ACTIVE, STATUS.COMPLETED, STATUS.BACKLOG, STATUS.ARCHIVED].forEach(dir => {
    const fullPath = dir.startsWith('/') ? dir : path.join(TODOS_DIR, dir);
    try { fs.mkdirSync(fullPath, { recursive: true }); } catch (e) {}
  });
}

// 扫描任务文件
function scanTasks() {
  const tasks = {
    active: [],
    completed: [],
    backlog: [],
    archived: []
  };

  for (const [key, dirName] of Object.entries(STATUS)) {
    const dir = path.join(TODOS_DIR, dirName);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.md') && f !== '_README.md');

    tasks[dirName] = files.map(f => {
      const filePath = path.join(dir, f);
      const content = fs.readFileSync(filePath, 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const statusMatch = content.match(/\*\*状态\*\*:\s*([\u{1F300}-\u{1F9FF}\s]+)/u);
      const priorityMatch = content.match(/\*\*优先级\*\*:\s*(P[0-3])/);
      const branchMatch = content.match(/\*\*分支\*\*:\s*`([^`]+)`/);

      return {
        file: f,
        title: titleMatch ? titleMatch[1] : path.basename(f, '.md'),
        status: statusMatch ? statusMatch[1].trim() : '🚧 进行中',
        priority: priorityMatch ? priorityMatch[1] : 'P2',
        branch: branchMatch ? branchMatch[1] : null,
        path: `${dirName}/${f}`
      };
    });
  }

  return tasks;
}

// 生成任务索引
function generateIndex(tasks) {
  const now = new Date().toISOString().split('T')[0];

  let md = `# 项目任务追踪系统

> 本目录由 AI 自动维护，记录项目开发任务和进度

**最后更新**: ${now}

@version: 1.0.0

## 目录结构

\`\`\`
development/todos/
├── INDEX.md           # 本文件 - 任务总览
├── active/            # 进行中的任务 (${tasks.active.length})
├── completed/         # 已完成的任务 (${tasks.completed.length})
├── backlog/           # 待规划的任务 (${tasks.backlog.length})
└── archived/          # 已归档的任务 (${tasks.archived.length})
\`\`\`

## 快速跳转

`;

  // 进行中的任务
  md += `## 🚧 进行中的任务 (${tasks.active.length})\n\n`;
  if (tasks.active.length > 0) {
    tasks.active.forEach(t => {
      md += `- [${t.priority}] [${t.title}](./${t.path}) - ${t.status}${t.branch ? ` \`branch: ${t.branch}\`` : ''}\n`;
    });
  } else {
    md += `*暂无进行中的任务*\n`;
  }
  md += `\n`;

  // 最近完成的任务（最多5个）
  md += `## ✅ 最近完成的任务\n\n`;
  const recentCompleted = tasks.completed.slice(0, 5);
  if (recentCompleted.length > 0) {
    recentCompleted.forEach(t => {
      md += `- [${t.title}](./${t.path})\n`;
    });
    if (tasks.completed.length > 5) {
      md += `- ...还有 ${tasks.completed.length - 5} 个已完成任务\n`;
    }
  } else {
    md += `*暂无已完成的任务*\n`;
  }
  md += `\n`;

  // 待办任务
  md += `## 📋 待办任务 (${tasks.backlog.length})\n\n`;
  if (tasks.backlog.length > 0) {
    tasks.backlog.slice(0, 10).forEach(t => {
      md += `- [${t.priority}] [${t.title}](./${t.path})\n`;
    });
    if (tasks.backlog.length > 10) {
      md += `- ...还有 ${tasks.backlog.length - 10} 个待办任务\n`;
    }
  } else {
    md += `*暂无待办任务*\n`;
  }
  md += `\n`;

  // 全部目录链接
  md += `## 全部目录\n\n`;
  md += `- [🚧 所有进行中的任务](./active/) - 当前开发重点\n`;
  md += `- [✅ 所有已完成的任务](./completed/) - 完整历史\n`;
  md += `- [📋 所有待办任务](./backlog/) - 待规划\n`;
  md += `- [📦 所有已归档任务](./archived/) - 历史记录\n`;
  md += `\n`;

  // 使用说明
  md += `## 使用方式\n\n`;
  md += `### 查看任务\n`;
  md += `点击上方链接跳转到对应目录，或使用：\n`;
  md += `\`\`\`bash\n`;
  md += `# 查看进行中的任务\n`;
  md += `cat development/todos/active/*.md\n\n`;
  md += `# 查看特定任务\n`;
  md += `cat development/todos/active/feature-name.md\n`;
  md += `\`\`\`\n\n`;
  md += `### 创建新任务\n`;
  md += `在 Claude Code 中：\n`;
  md += `\`\`\`\n`;
  md += `创建一个新任务：实现用户登录功能\n`;
  md += `\`\`\`\n\n`;
  md += `AI 会自动在 \`active/\` 目录创建对应的任务文件。\n\n`;
  md += `### 更新任务状态\n`;
  md += `\`\`\`\n`;
  md += `将 [任务名] 标记为完成\n`;
  md += `\`\`\`\n\n`;
  md += `AI 会自动将任务移动到 \`completed/\` 目录。\n\n`;

  md += `---\n\n`;
  md += `> **维护说明**: 本系统由 AI 自动维护，请勿手动编辑（除非你知道自己在做什么）\n`;

  return md;
}

// 更新索引
function updateIndex() {
  try {
    ensureDirectories();
    const tasks = scanTasks();
    const index = generateIndex(tasks);

    // 检查是否需要更新 - 比较任务总数
    let needsUpdate = true;
    if (fs.existsSync(INDEX_FILE)) {
      const existing = fs.readFileSync(INDEX_FILE, 'utf-8');
      // 从现有索引中提取任务数量
      const activeMatch = existing.match(/## 🚧 进行中的任务 \((\d+)\)/);
      const completedMatch = existing.match(/## ✅ 最近完成的任务/);
      const existingActive = activeMatch ? parseInt(activeMatch[1], 10) : 0;
      const newActive = tasks.active.length;

      // 如果活跃任务数量相同且没有完成任务内容变化，则不更新
      if (existingActive === newActive && tasks.completed.length === 0) {
        // 检查现有索引是否已有完成任务
        const hasCompletedInExisting = existing.includes('[completed/') || existing.includes('./completed/');
        const hasCompletedNow = tasks.completed.length > 0;
        needsUpdate = hasCompletedInExisting !== hasCompletedNow;
      }
    }

    if (needsUpdate) {
      fs.writeFileSync(INDEX_FILE, index);
    }

    return { tasks, updated: needsUpdate };
  } catch (e) {
    return { tasks: { active: [], completed: [], backlog: [], archived: [] }, updated: false };
  }
}

// 主函数
function main() {
  const result = updateIndex();

  // 在 AgentStop 或特定事件时输出摘要
  const eventType = process.env.CLAUDE_EVENT_TYPE || '';
  if (eventType === 'AgentStop') {
    const { active, completed } = result.tasks;
    if (active.length > 0) {
      console.log(`\n📋 [任务追踪] ${active.length} 个进行中, ${completed.length} 个已完成`);
      console.log(`   查看: development/todos/INDEX.md\n`);
    }
  }

  process.exit(0);
}

// 如果直接运行，强制更新索引
if (require.main === module) {
  if (process.argv[2] === '--force') {
    updateIndex();
    console.log('✅ Task index updated');
  } else {
    main();
  }
} else {
  main();
}
