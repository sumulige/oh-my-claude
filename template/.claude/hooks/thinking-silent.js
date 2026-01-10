#!/usr/bin/env node
/**
 * ThinkingLens 无感知追踪
 *
 * 特点：
 * - 完全静默，0 输出
 * - 自动追踪对话流
 * - 智能判断重要时刻
 * - 后台运行，不打扰
 * - 定期同步到 PROJECT_LOG.md（每 20 轮）
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const THINKING_DIR = path.join(process.env.CLAUDE_PROJECT_DIR, '.claude/thinking-routes');
const ACTIVITY_FILE = path.join(THINKING_DIR, '.conversation-flow.json');
const SESSION_FILE = path.join(THINKING_DIR, '.current-session');
const SYNC_MARKER_FILE = path.join(THINKING_DIR, '.last-sync');
const SYNC_INTERVAL = 20; // 每 20 轮同步一次

// 确保目录存在
try { fs.mkdirSync(THINKING_DIR, { recursive: true }); } catch (e) {}

// 获取当前会话
function getSession() {
  let sessionId = fs.existsSync(SESSION_FILE)
    ? fs.readFileSync(SESSION_FILE, 'utf-8').trim()
    : null;

  if (!sessionId) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const project = path.basename(process.env.CLAUDE_PROJECT_DIR).slice(0, 10);
    sessionId = `s-${date}-${project}`;
    fs.writeFileSync(SESSION_FILE, sessionId);
  }

  return sessionId;
}

// 获取对话流数据
function getConversationFlow() {
  if (!fs.existsSync(ACTIVITY_FILE)) {
    return { sessionId: getSession(), turns: [], startTime: new Date().toISOString() };
  }
  try {
    return JSON.parse(fs.readFileSync(ACTIVITY_FILE, 'utf-8'));
  } catch (e) {
    return { sessionId: getSession(), turns: [], startTime: new Date().toISOString() };
  }
}

// 保存对话流
function saveConversationFlow(data) {
  // 只保留最近 100 条
  if (data.turns.length > 100) {
    data.turns = data.turns.slice(-100);
  }
  fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(data, null, 2));
}

// 检查是否需要同步到日志
function shouldSync(turnCount) {
  const lastSync = fs.existsSync(SYNC_MARKER_FILE)
    ? parseInt(fs.readFileSync(SYNC_MARKER_FILE, 'utf-8'), 10)
    : 0;
  return turnCount - lastSync >= SYNC_INTERVAL;
}

// 标记已同步
function markSynced(turnCount) {
  fs.writeFileSync(SYNC_MARKER_FILE, turnCount.toString());
}

// 静默同步到 PROJECT_LOG.md
function syncToLog() {
  const syncScript = path.join(process.env.CLAUDE_PROJECT_DIR, '.claude/hooks/sync-to-log.sh');
  if (fs.existsSync(syncScript)) {
    try {
      // 使用 spawn 静默执行，不输出任何内容
      spawn('bash', [syncScript], {
        stdio: 'ignore',
        detached: true
      }).unref();
    } catch (e) {
      // 静默忽略错误
    }
  }
}

// 检测是否是关键操作
function detectKeyOperation(toolInput, toolName) {
  const keywords = [
    '完成', '实现', '创建', '添加', '修复', '更新',
    '完成', '测试', '部署', '推送', '设计', '决定'
  ];

  // 如果包含关键词，可能是关键操作
  if (keywords.some(k => toolInput.includes(k))) {
    return 'potential-action';
  }

  // 如果是代码编辑
  if (toolName === 'Edit' || toolName === 'Write') {
    return 'code-edit';
  }

  return 'normal';
}

// 主函数 - 完全静默
function main() {
  try {
    const sessionId = getSession();
    const flow = getConversationFlow();
    const toolInput = process.env.CLAUDE_TOOL_INPUT || '';
    const toolName = process.env.CLAUDE_TOOL_NAME || '';

    // 添加新的对话轮次
    flow.turns.push({
      time: new Date().toISOString(),
      toolName,
      inputLength: toolInput.length,
      type: detectKeyOperation(toolInput, toolName),
    });

    saveConversationFlow(flow);

    // 检查是否需要同步到日志
    const turnCount = flow.turns.length;
    if (shouldSync(turnCount)) {
      syncToLog();
      markSynced(turnCount);
    }

  } catch (e) {
    // 完全静默，忽略任何错误
  }

  // 永远不输出任何内容
  process.exit(0);
}

main();
