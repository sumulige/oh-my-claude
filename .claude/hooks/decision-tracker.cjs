#!/usr/bin/env node
/**
 * Decision Tracker - 决策识别与追踪
 *
 * 功能：
 * - AI 自动识别对话中的决策
 * - 记录到 DECISIONS.md
 * - 按主题分类
 * - 双向链接决策 ↔ 对话 ↔ 代码
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const DECISIONS_DIR = path.join(PROJECT_DIR, '.claude', 'decisions');
const DECISIONS_FILE = path.join(DECISIONS_DIR, 'DECISIONS.md');
const TOPICS_DIR = path.join(DECISIONS_DIR, 'by-topic');
const TRANSCRIPTS_DIR = path.join(PROJECT_DIR, '.claude', 'transcripts');

// 决策关键词模式
const DECISION_KEYWORDS = [
  // 中文关键词
  '决定', '选择', '采用', '确定', '最终', '使用', '实现',
  '设计', '架构', '方案', '策略', '计划', '优先级',
  '不使用', '放弃', '排除', '拒绝',
  // 英文关键词
  'decided', 'chose', 'selected', 'using', 'implementing',
  'design', 'architecture', 'approach', 'strategy',
  'not using', 'rejected', 'excluded'
];

// 决策起始短语
const DECISION_PHRASES = [
  /我决定/i, /我们决定/i, /最终决定/i, /经过考虑/i,
  /let'?s use/i, /we will/i, /going to/i, /decided to/i,
  /选择(?:了)?(?:使用|采用)?/i, /采用(?:了)?/i,
  /将使用/i, /会使用/i, /计划使用/i
];

/**
 * 分析文本，提取可能的决策
 */
function extractDecisions(text) {
  const decisions = [];
  const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 10);

  sentences.forEach(sentence => {
    // 检查是否包含决策短语
    let isDecision = false;
    for (const phrase of DECISION_PHRASES) {
      if (phrase.test(sentence)) {
        isDecision = true;
        break;
      }
    }

    // 检查是否包含决策关键词
    if (!isDecision) {
      const keywordCount = DECISION_KEYWORDS.filter(kw => sentence.includes(kw)).length;
      if (keywordCount >= 2) {
        isDecision = true;
      }
    }

    if (isDecision) {
      decisions.push({
        text: sentence.trim(),
        confidence: 'medium'
      });
    }
  });

  return decisions;
}

/**
 * 提取主题标签
 */
function extractTopics(text) {
  const topics = new Set();

  // 技术主题
  const techTopics = [
    'api', 'database', 'auth', 'frontend', 'backend',
    'architecture', 'design', 'security', 'performance',
    'testing', 'deployment', 'storage', 'cache',
    'api', 'database', 'auth', 'frontend', 'backend',
    '架构', '数据库', '认证', '前端', '后端',
    '设计', '安全', '性能', '测试', '部署',
    '存储', '缓存', '网络', '日志'
  ];

  techTopics.forEach(topic => {
    if (text.toLowerCase().includes(topic)) {
      topics.add(topic);
    }
  });

  return Array.from(topics);
}

/**
 * 获取下一个决策 ID
 */
function getNextDecisionId() {
  try {
    const content = fs.readFileSync(DECISIONS_FILE, 'utf-8');
    const matches = content.match(/\[D(\d+)\]/g);
    if (matches) {
      const maxId = Math.max(...matches.map(m => parseInt(m.slice(2, -1))));
      return `D${String(maxId + 1).padStart(3, '0')}`;
    }
  } catch (e) {}
  return 'D001';
}

/**
 * 获取时间戳
 */
function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 16);
}

/**
 * 获取今日 transcript 路径
 */
function getTodayTranscriptPath() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return path.join(TRANSCRIPTS_DIR, String(year), month, `${day}.md`);
}

/**
 * 记录决策
 */
function recordDecision(title, details) {
  // 确保目录存在
  try { fs.mkdirSync(DECISIONS_DIR, { recursive: true }); } catch (e) {}
  try { fs.mkdirSync(TOPICS_DIR, { recursive: true }); } catch (e) {}

  const decisionId = getNextDecisionId();
  const timestamp = getTimestamp();
  const todayPath = getTodayTranscriptPath();

  let section = `\n## [${decisionId}] ${timestamp} - ${title}\n\n`;

  if (details.reason) {
    section += `### 💡 理由\n${details.reason}\n\n`;
  }

  if (details.content) {
    section += `### 📌 决策内容\n${details.content}\n\n`;
  }

  if (details.links && Object.keys(details.links).length > 0) {
    section += `### 🔗 关联\n`;
    if (details.links.conversation) {
      section += `- 对话: \`${details.links.conversation}\`\n`;
    }
    if (details.links.files && details.links.files.length > 0) {
      section += `- 代码: ${details.links.files.map(f => `\`${f}\``).join(', ')}\n`;
    }
    if (details.links.commit) {
      section += `- Commit: \`${details.links.commit}\`\n`;
    }
    section += '\n';
  }

  if (details.tags && details.tags.length > 0) {
    section += `### 🏷️ 主题\n`;
    details.tags.forEach(tag => {
      section += `- \`${tag}\`\n`;
    });
    section += '\n';
  }

  // 追加到 DECISIONS.md
  if (!fs.existsSync(DECISIONS_FILE)) {
    fs.writeFileSync(DECISIONS_FILE, `# Decisions Log\n\n> 所有项目决策的完整记录\n\n`, 'utf-8');
  }
  fs.appendFileSync(DECISIONS_FILE, section, 'utf-8');

  // 添加到主题文件
  if (details.tags && details.tags.length > 0) {
    details.tags.forEach(tag => {
      const topicPath = path.join(TOPICS_DIR, `${tag}.md`);
      const relativePath = path.relative(path.dirname(topicPath), DECISIONS_FILE);

      if (!fs.existsSync(topicPath)) {
        fs.writeFileSync(topicPath, `# ${tag}\n\n相关的决策记录\n\n`, 'utf-8');
      }

      const entry = `- [${timestamp}] [${decisionId}](${relativePath}#${decisionId}) - ${title}\n`;
      fs.appendFileSync(topicPath, entry, 'utf-8');
    });
  }

  return decisionId;
}

/**
 * 从对话中自动提取并记录决策
 */
function extractAndRecordDecisions(conversationText) {
  const decisions = extractDecisions(conversationText);

  if (decisions.length === 0) {
    return [];
  }

  const recorded = [];
  const topics = extractTopics(conversationText);

  decisions.forEach((decision, index) => {
    const title = decision.text.substring(0, 50) + (decision.text.length > 50 ? '...' : '');
    const id = recordDecision(title, {
      content: decision.text,
      reason: '自动识别',
      tags: topics,
      links: {
        conversation: getTodayTranscriptPath()
      }
    });
    recorded.push({ id, title, confidence: decision.confidence });
  });

  return recorded;
}

/**
 * 查看所有决策
 */
function listDecisions(filter = null) {
  if (!fs.existsSync(DECISIONS_FILE)) {
    console.log('📭 暂无决策记录');
    return [];
  }

  const content = fs.readFileSync(DECISIONS_FILE, 'utf-8');
  const decisionBlocks = content.split(/^## /m).filter(s => s.trim());

  if (filter) {
    // 过滤决策
    const filtered = decisionBlocks.filter(block =>
      block.toLowerCase().includes(filter.toLowerCase())
    );
    console.log(`\n📋 找到 ${filtered.length} 个匹配 "${filter}" 的决策:\n`);
    filtered.forEach(block => {
      const lines = block.split('\n');
      console.log(`\n${lines[0]}`);
    });
    return filtered;
  } else {
    console.log(`\n📋 所有决策 (${decisionBlocks.length} 个):\n`);
    decisionBlocks.forEach(block => {
      const lines = block.split('\n');
      console.log(`${lines[0]}`);
    });
    return decisionBlocks;
  }
}

/**
 * 搜索决策
 */
function searchDecisions(keyword) {
  if (!fs.existsSync(DECISIONS_FILE)) {
    console.log('📭 暂无决策记录');
    return;
  }

  const content = fs.readFileSync(DECISIONS_FILE, 'utf-8');
  const lines = content.split('\n');

  console.log(`\n🔍 搜索 "${keyword}":\n`);

  let found = false;
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(keyword.toLowerCase())) {
      // 获取上下文
      const start = Math.max(0, index - 2);
      const end = Math.min(lines.length, index + 3);
      const context = lines.slice(start, end).join('\n');
      console.log(context);
      console.log('---');
      found = true;
    }
  });

  if (!found) {
    console.log('未找到匹配结果');
  }
}

// CLI
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'add': {
      // 手动添加决策
      // node decision-tracker.cjs add "标题" "内容" "tag1,tag2"
      const title = args[1] || '';
      const content = args[2] || '';
      const tags = args[3] ? args[3].split(',') : [];

      if (!title) {
        console.error('用法: node decision-tracker.cjs add "标题" "内容" "tag1,tag2"');
        process.exit(1);
      }

      const id = recordDecision(title, { content, tags });
      console.log(`✅ 已记录决策 ${id}: ${title}`);
      break;
    }

    case 'list': {
      const filter = args[1];
      listDecisions(filter);
      break;
    }

    case 'search': {
      const keyword = args[1];
      if (!keyword) {
        console.error('用法: node decision-tracker.cjs search "关键词"');
        process.exit(1);
      }
      searchDecisions(keyword);
      break;
    }

    case 'topics': {
      // 列出所有主题
      if (fs.existsSync(TOPICS_DIR)) {
        const topics = fs.readdirSync(TOPICS_DIR).filter(f => f.endsWith('.md'));
        console.log('\n🏷️ 主题分类:\n');
        topics.forEach(t => {
          const content = fs.readFileSync(path.join(TOPICS_DIR, t), 'utf-8');
          const count = (content.match(/^- /gm) || []).length;
          console.log(`  - ${t.replace('.md', '')} (${count} 个决策)`);
        });
      } else {
        console.log('📭 暂无主题分类');
      }
      break;
    }

    case 'extract': {
      // 从文本中提取决策
      const text = args.slice(1).join(' ') || '';
      if (!text) {
        console.error('用法: node decision-tracker.cjs extract "文本内容"');
        process.exit(1);
      }

      const decisions = extractAndRecordDecisions(text);
      console.log(`✅ 从文本中提取并记录了 ${decisions.length} 个决策`);
      decisions.forEach(d => {
        console.log(`  - ${d.id}: ${d.title}`);
      });
      break;
    }

    default:
      console.log(`
Decision Tracker - 决策追踪工具

用法:
  node decision-tracker.cjs add "标题" "内容" "tag1,tag2"  手动添加决策
  node decision-tracker.cjs list [filter]                  列出所有决策
  node decision-tracker.cjs search "关键词"                搜索决策
  node decision-tracker.cjs topics                         列出所有主题
  node decision-tracker.cjs extract "文本"                 从文本中提取决策

快捷命令:
  alias dadd='node .claude/hooks/decision-tracker.cjs add'
  alias dlist='node .claude/hooks/decision-tracker.cjs list'
  alias dsearch='node .claude/hooks/decision-tracker.cjs search'
      `);
  }
}

module.exports = {
  extractDecisions,
  recordDecision,
  extractAndRecordDecisions,
  listDecisions,
  searchDecisions
};

if (require.main === module) {
  main();
}
