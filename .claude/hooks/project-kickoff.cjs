#!/usr/bin/env node
/**
 * Project Kickoff Hook - Manus-style project initialization
 *
 * 触发条件:
 * - 检测到新项目 (缺少 PROJECT_KICKOFF.md)
 * - 用户明确请求项目启动
 *
 * 功能:
 * - 检查项目是否已启动
 * - 如果未启动，提示 AI 进行项目规划
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const TEMPLATES_DIR = path.join(PROJECT_DIR, '.claude/templates');
const KICKOFF_FILE = path.join(PROJECT_DIR, 'PROJECT_KICKOFF.md');
const PLAN_FILE = path.join(PROJECT_DIR, 'TASK_PLAN.md');
const PROPOSAL_FILE = path.join(PROJECT_DIR, 'PROJECT_PROPOSAL.md');
const HINT_FILE = path.join(PROJECT_DIR, '.claude/.kickoff-hint.txt');

// 检查项目是否已启动
function isProjectStarted() {
  return fs.existsSync(KICKOFF_FILE);
}

// 检查是否为强制启动模式
function isForceKickoff() {
  const toolInput = process.env.CLAUDE_TOOL_INPUT || '';
  return toolInput.includes('kickoff') ||
         toolInput.includes('项目启动') ||
         toolInput.includes('project plan') ||
         toolInput.includes('重新规划');
}

// 生成启动提示
function generateKickoffHint() {
  const now = new Date().toISOString().split('T')[0];

  return `
╔══════════════════════════════════════════════════════════════════════╗
║                    🚀 项目启动检测 (Project Kickoff)                 ║
╚══════════════════════════════════════════════════════════════════════╝

检测到此项目尚未完成启动流程。

根据 Manus 风格的 AI 2.0 开发范式，在开始编码前，我们需要：

═══════════════════════════════════════════════════════════════════════

📋 第一步: 项目启动清单 (PROJECT_KICKOFF.md)
   ├── 定义项目目标和成功标准
   ├── 明确技术约束和非技术约束
   └── 划定 AI/Human 责任边界

📋 第二步: 任务执行计划 (TASK_PLAN.md)
   ├── 任务分解 (WBS)
   ├── 依赖关系分析
   ├── Agent 分配策略
   └── 检查点设置

📋 第三步: 项目计划书 (PROJECT_PROPOSAL.md)
   ├── 技术架构设计
   ├── 功能需求分析
   ├── 开发迭代规划
   └── 风险评估

═══════════════════════════════════════════════════════════════════════

🎯 下一步行动:

请回答以下问题，我将为你生成完整的项目规划：

1. 项目名称是什么？
2. 用一句话描述这个项目要解决什么问题？
3. 核心目标是什么？（成功标准是什么？）
4. 有什么技术约束或偏好？（语言/框架/部署等）
5. 预期的时间框架是怎样的？

回答这些问题后，我将：
✅ 生成 PROJECT_KICKOFF.md
✅ 生成 TASK_PLAN.md
✅ 生成 PROJECT_PROPOSAL.md
✅ 等待你的确认后开始执行

═══════════════════════════════════════════════════════════════════════

💡 提示: 你也可以直接说 "跳过启动" 使用传统开发模式

生成日期: ${now}
`;
}

// 主函数
function main() {
  // 如果项目已启动且不是强制模式，静默退出
  if (isProjectStarted() && !isForceKickoff()) {
    process.exit(0);
  }

  // 生成提示文件
  const hint = generateKickoffHint();
  fs.mkdirSync(path.dirname(HINT_FILE), { recursive: true });
  fs.writeFileSync(HINT_FILE, hint);

  // 同时输出到 stdout (供 AI 直接读取)
  console.log(hint);

  process.exit(0);
}

main();
