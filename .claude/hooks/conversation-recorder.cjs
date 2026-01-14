#!/usr/bin/env node
/**
 * Conversation Recorder - 完整对话记录器
 *
 * 功能：
 * - 捕获完整对话（用户输入 + AI 输出）
 * - 按日期组织存储
 * - 自动过滤敏感信息
 * - 记录使用的工具
 * - 支持 Session 管理
 */

const fs = require('fs');
const path = require('path');
const { filterSensitive } = require('./privacy-filter.js');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const TRANSCRIPTS_DIR = path.join(PROJECT_DIR, '.claude', 'transcripts');
const CURRENT_SESSION_FILE = path.join(PROJECT_DIR, '.claude', 'thinking-routes', '.current-session');

// 确保目录存在
try { fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true }); } catch (e) {}

/**
 * 获取当前会话 ID
 */
function getSessionId() {
  try {
    const data = fs.readFileSync(CURRENT_SESSION_FILE, 'utf-8').trim();
    if (data) return data;
  } catch (e) {}
  return 'session-' + Date.now();
}

/**
 * 获取今日 transcript 文件路径
 */
function getTodayTranscriptPath() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const dir = path.join(TRANSCRIPTS_DIR, String(year), month);
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}

  return path.join(dir, `${day}.md`);
}

/**
 * 获取当前 Session 编号
 */
function getSessionNumber() {
  const transcriptPath = getTodayTranscriptPath();
  try {
    const content = fs.readFileSync(transcriptPath, 'utf-8');
    const matches = content.match(/^## Session \d+/gm);
    if (matches) {
      const lastNum = parseInt(matches[matches.length - 1].match(/\d+/)[0]);
      return String(lastNum + 1).padStart(3, '0');
    }
  } catch (e) {}
  return '001';
}

/**
 * 获取当前时间戳
 */
function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * 格式化消息内容
 */
function formatMessage(role, content, metadata = {}) {
  const timestamp = getTimestamp();
  const roleEmoji = role === 'user' ? '👤' : role === 'assistant' ? '🤖' : '🔧';

  let section = `\n### ${roleEmoji} ${role.charAt(0).toUpperCase() + role.slice(1)} - ${timestamp}\n\n`;

  // 过滤敏感信息
  const filtered = filterSensitive(content || '');
  section += filtered.filteredText;

  // 添加元数据
  if (Object.keys(metadata).length > 0) {
    section += '\n\n**Metadata**:\n';
    for (const [key, value] of Object.entries(metadata)) {
      section += `- ${key}: ${value}\n`;
    }
  }

  return section + '\n';
}

/**
 * 追加到 transcript
 */
function appendToTranscript(content) {
  const transcriptPath = getTodayTranscriptPath();

  // 如果文件不存在，创建头部
  if (!fs.existsSync(transcriptPath)) {
    const now = new Date();
    const header = `# ${now.toISOString().split('T')[0]} - Conversation Transcript\n\n`;
    fs.writeFileSync(transcriptPath, header, 'utf-8');
  }

  fs.appendFileSync(transcriptPath, content, 'utf-8');
}

/**
 * 记录用户消息
 */
function recordUserMessage(content) {
  const sessionId = getSessionId();
  const sessionNum = getSessionNumber();

  const section = `\n${'='.repeat(60)}\n`;
  const header = `## Session ${sessionNum} - ${getTimestamp()} | ID: ${sessionId}\n`;

  appendToTranscript(section + header + formatMessage('user', content));

  return { sessionId, sessionNum };
}

/**
 * 记录 AI 回复
 */
function recordAssistantMessage(content, toolsUsed = []) {
  let section = formatMessage('assistant', content);

  if (toolsUsed.length > 0) {
    section += `\n**Tools Used**:\n`;
    toolsUsed.forEach(tool => {
      section += `- \`${tool.name}\`${tool.args ? `: ${tool.args}` : ''}\n`;
    });
    section += '\n';
  }

  appendToTranscript(section);
}

/**
 * 记录工具使用
 */
function recordToolUse(toolName, args, result) {
  const timestamp = getTimestamp();
  let section = `\n### 🔧 Tool: ${toolName} - ${timestamp}\n\n`;

  if (args) {
    section += `**Args**:\n\`\`\`\n${JSON.stringify(args, null, 2)}\n\`\`\`\n\n`;
  }

  if (result) {
    const filtered = filterSensitive(String(result));
    section += `**Result**:\n\`\`\`\n${filtered.filteredText.substring(0, 500)}${filtered.filteredText.length > 500 ? '...' : ''}\n\`\`\`\n\n`;
  }

  appendToTranscript(section);
}

/**
 * 记录决策
 */
function recordDecision(title, details, links = {}) {
  const timestamp = getTimestamp();
  const decisionsPath = path.join(PROJECT_DIR, '.claude', 'decisions', 'DECISIONS.md');

  // 确保文件存在
  if (!fs.existsSync(decisionsPath)) {
    fs.writeFileSync(decisionsPath, `# Decisions Log\n\n> 所有项目决策的完整记录\n\n`, 'utf-8');
  }

  // 生成决策 ID
  const content = fs.readFileSync(decisionsPath, 'utf-8');
  const match = content.match(/\[D(\d+)\]/g);
  const nextId = match ? Math.max(...match.map(m => parseInt(m.slice(2, -1)))) + 1 : 1;
  const decisionId = `D${String(nextId).padStart(3, '0')}`;

  let section = `\n## [${decisionId}] ${timestamp} - ${title}\n\n`;

  if (details.reason) {
    section += `### 💡 理由\n${details.reason}\n\n`;
  }

  if (details.content) {
    section += `### 📌 决策内容\n${details.content}\n\n`;
  }

  if (Object.keys(links).length > 0) {
    section += `### 🔗 关联\n`;
    if (links.conversation) section += `- 对话: \`${links.conversation}\`\n`;
    if (links.files && links.files.length > 0) {
      section += `- 代码: ${links.files.map(f => `\`${f}\``).join(', ')}\n`;
    }
    if (links.commit) section += `- Commit: \`${links.commit}\`\n`;
    section += '\n';
  }

  if (details.tags && details.tags.length > 0) {
    section += `### 🏷️ 主题\n${details.tags.map(t => `- ${t}`).join('\n')}\n\n`;
  }

  // 追加到文件
  fs.appendFileSync(decisionsPath, section, 'utf-8');

  // 如果有主题，也添加到主题文件
  if (details.tags && details.tags.length > 0) {
    const topicDir = path.join(PROJECT_DIR, '.claude', 'decisions', 'by-topic');
    try { fs.mkdirSync(topicDir, { recursive: true }); } catch (e) {}

    details.tags.forEach(tag => {
      const topicPath = path.join(topicDir, `${tag}.md`);
      const topicEntry = `\n- [${decisionId}](${getRelativePath(decisionsPath, topicPath)}#${timestamp}) - ${title}\n`;
      fs.appendFileSync(topicPath, topicEntry, 'utf-8');
    });
  }

  return decisionId;
}

/**
 * 获取相对路径
 */
function getRelativePath(from, to) {
  return path.relative(path.dirname(from), to);
}

/**
 * 从环境变量读取并记录
 */
function recordFromEnv() {
  const eventType = process.env.CLAUDE_EVENT_TYPE || '';
  const toolInput = process.env.CLAUDE_TOOL_INPUT || '';

  if (eventType === 'UserPromptSubmit' && toolInput) {
    recordUserMessage(toolInput);
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'user':
      // 记录用户消息
      const userContent = args.slice(1).join(' ') || '';
      if (userContent) {
        const { sessionId, sessionNum } = recordUserMessage(userContent);
        console.log(`✅ 记录用户消息 - Session ${sessionNum} (${sessionId})`);
      }
      break;

    case 'assistant':
      // 记录 AI 回复
      const assistantContent = args.slice(1).join(' ') || '';
      if (assistantContent) {
        recordAssistantMessage(assistantContent);
        console.log('✅ 记录 AI 回复');
      }
      break;

    case 'decision':
      // 记录决策
      // 用法: node conversation-recorder.cjs decision "标题" "理由" "内容"
      const title = args[1] || '';
      const reason = args[2] || '';
      const content = args[3] || '';
      if (title) {
        const id = recordDecision(title, { reason, content });
        console.log(`✅ 记录决策 - ${id}: ${title}`);
      }
      break;

    case 'today':
      // 查看今日对话
      const todayPath = getTodayTranscriptPath();
      if (fs.existsSync(todayPath)) {
        console.log(fs.readFileSync(todayPath, 'utf-8'));
      } else {
        console.log('📭 今日暂无对话记录');
      }
      break;

    case 'list':
      // 列出所有 transcript
      listTranscripts();
      break;

    default:
      // 从环境变量读取并记录
      recordFromEnv();
  }
}

/**
 * 列出所有 transcript
 */
function listTranscripts() {
  function listDir(dir, prefix = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        console.log(`${prefix}📁 ${entry.name}/`);
        listDir(fullPath, prefix + '  ');
      } else if (entry.name.endsWith('.md')) {
        const stat = fs.statSync(fullPath);
        const size = (stat.size / 1024).toFixed(1);
        console.log(`${prefix}📄 ${entry.name} (${size}KB)`);
      }
    });
  }

  if (fs.existsSync(TRANSCRIPTS_DIR)) {
    console.log('\n📂 Conversation Transcripts:\n');
    listDir(TRANSCRIPTS_DIR);
  } else {
    console.log('📭 暂无对话记录');
  }
}

// 导出
module.exports = {
  recordUserMessage,
  recordAssistantMessage,
  recordToolUse,
  recordDecision,
  getTodayTranscriptPath,
  getSessionId
};

// 直接运行
if (require.main === module) {
  main();
}
