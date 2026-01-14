#!/usr/bin/env node
/**
 * Multi-Session Manager - 并行多会话管理
 *
 * 根据 Boris Cherny 的实践，并行运行 5 个 Claude 可以极大提升效率。
 * 这个 hook 帮助跟踪和管理多个并行会话。
 *
 * 功能：
 * - 跟踪活跃的会话
 * - 为每个会话分配编号
 * - 记录会话状态和任务
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const SESSIONS_DIR = path.join(PROJECT_DIR, '.claude', 'sessions');
const ACTIVE_SESSIONS_FILE = path.join(SESSIONS_DIR, 'active-sessions.json');
const SESSION_LOCK_FILE = path.join(SESSIONS_DIR, '.session-lock');

// 确保目录存在
try { fs.mkdirSync(SESSIONS_DIR, { recursive: true }); } catch (e) {}

// 获取主机名和用户信息用于标识会话来源
function getSessionIdentifier() {
  const hostname = os.hostname();
  const platform = os.platform();
  const username = process.env.USER || process.env.USERNAME || 'unknown';
  return `${username}@${hostname} (${platform})`;
}

// 获取当前会话 ID
function getCurrentSessionId() {
  // 从环境变量或进程信息生成唯一 ID
  const pid = process.pid;
  const ppid = process.ppid;
  const timestamp = Date.now();
  return `session-${pid}-${ppid}`;
}

// 获取活跃会话列表
function getActiveSessions() {
  if (!fs.existsSync(ACTIVE_SESSIONS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(ACTIVE_SESSIONS_FILE, 'utf-8');
    const sessions = JSON.parse(data);
    // 清理超过 1 小时的旧会话
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return sessions.filter(s => s.lastHeartbeat > oneHourAgo);
  } catch (e) {
    return [];
  }
}

// 保存活跃会话列表
function saveActiveSessions(sessions) {
  fs.writeFileSync(ACTIVE_SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

// 更新当前会话的心跳
function updateHeartbeat() {
  const sessions = getActiveSessions();
  const currentId = getCurrentSessionId();
  const now = Date.now();

  const existingSession = sessions.find(s => s.id === currentId);
  if (existingSession) {
    existingSession.lastHeartbeat = now;
    existingSession.heartbeatCount = (existingSession.heartbeatCount || 0) + 1;
  } else {
    sessions.push({
      id: currentId,
      identifier: getSessionIdentifier(),
      startedAt: now,
      lastHeartbeat: now,
      heartbeatCount: 1,
      status: 'active'
    });
  }

  saveActiveSessions(sessions);
  return sessions;
}

// 获取会话编号（1-5，类似 Boris 的标签页编号）
function getSessionNumber(sessions) {
  const currentId = getCurrentSessionId();
  const session = sessions.find(s => s.id === currentId);
  if (session && session.number) {
    return session.number;
  }

  // 分配一个可用的编号
  const usedNumbers = new Set(sessions.filter(s => s.number).map(s => s.number));
  for (let i = 1; i <= 10; i++) {
    if (!usedNumbers.has(i)) {
      // 更新会话的编号
      const updatedSessions = getActiveSessions();
      const targetSession = updatedSessions.find(s => s.id === currentId);
      if (targetSession) {
        targetSession.number = i;
        saveActiveSessions(updatedSessions);
        return i;
      }
      return i;
    }
  }

  return sessions.length + 1;
}

// 显示会话状态
function displaySessionStatus() {
  const sessions = getActiveSessions();
  const currentId = getCurrentSessionId();
  const currentNumber = getSessionNumber(sessions);

  console.log(`\n🔄 [多会话] 当前会话: #${currentNumber} | 活跃会话: ${sessions.length}`);
  console.log(`   主机: ${getSessionIdentifier()}`);

  if (sessions.length > 1) {
    console.log(`\n   其他活跃会话:`);
    sessions
      .filter(s => s.id !== currentId)
      .forEach(s => {
        const number = s.number || '?';
        const duration = Math.round((Date.now() - s.startedAt) / 1000 / 60);
        console.log(`   - 会话 #${number}: ${s.identifier} (${duration}分钟前启动)`);
      });
  }

  console.log('');
}

// 主函数
function main() {
  try {
    const eventType = process.env.CLAUDE_EVENT_TYPE || '';
    const toolInput = process.env.CLAUDE_TOOL_INPUT || '';

    // 在每次交互时更新心跳
    const sessions = updateHeartbeat();
    const sessionNumber = getSessionNumber(sessions);

    // 在会话开始或重要操作时显示状态
    if (eventType === 'UserPromptSubmit' && toolInput.length > 20) {
      // 只在较长的用户输入时显示，避免噪音
      if (sessions.length > 1 || process.env.SHOW_SESSION_STATUS) {
        console.log(`\n🔄 [会话 #${sessionNumber}] 活跃会话: ${sessions.length}\n`);
      }
    }

    // 在会话结束时清理
    if (eventType === 'AgentStop') {
      const currentId = getCurrentSessionId();
      const updatedSessions = getActiveSessions();
      const index = updatedSessions.findIndex(s => s.id === currentId);
      if (index !== -1) {
        updatedSessions[index].status = 'ended';
        updatedSessions[index].endedAt = Date.now();
        saveActiveSessions(updatedSessions);
      }
    }

  } catch (e) {
    // 静默处理错误
  }

  process.exit(0);
}

// 如果直接运行此脚本，显示会话状态
if (require.main === module && process.argv[2] === '--status') {
  displaySessionStatus();
} else {
  main();
}
