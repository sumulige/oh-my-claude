#!/usr/bin/env node
/**
 * Code Tracer - 代码变更追踪
 *
 * 功能：
 * - 监听文件修改事件
 * - 自动关联到最近的决策
 * - 维护双向映射表 (文件 ↔ 决策)
 * - 支持查询文件的历史决策
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CODE_TRACE_DIR = path.join(PROJECT_DIR, '.claude', 'code-trace');
const FILES_MAP = path.join(CODE_TRACE_DIR, 'files-map.json');
const DECISIONS_MAP = path.join(CODE_TRACE_DIR, 'decisions-map.json');
const DECISIONS_FILE = path.join(PROJECT_DIR, '.claude', 'decisions', 'DECISIONS.md');

// 确保目录存在
try { fs.mkdirSync(CODE_TRACE_DIR, { recursive: true }); } catch (e) {}

/**
 * 初始化映射文件
 */
function initMaps() {
  if (!fs.existsSync(FILES_MAP)) {
    fs.writeFileSync(FILES_MAP, JSON.stringify({ files: {}, lastUpdated: null }, null, 2), 'utf-8');
  }
  if (!fs.existsSync(DECISIONS_MAP)) {
    fs.writeFileSync(DECISIONS_MAP, JSON.stringify({ decisions: {}, lastUpdated: null }, null, 2), 'utf-8');
  }
}

/**
 * 读取映射文件
 */
function readMaps() {
  initMaps();
  return {
    filesMap: JSON.parse(fs.readFileSync(FILES_MAP, 'utf-8')),
    decisionsMap: JSON.parse(fs.readFileSync(DECISIONS_MAP, 'utf-8'))
  };
}

/**
 * 写入映射文件
 */
function writeMaps(filesMap, decisionsMap) {
  const now = new Date().toISOString();
  filesMap.lastUpdated = now;
  decisionsMap.lastUpdated = now;
  fs.writeFileSync(FILES_MAP, JSON.stringify(filesMap, null, 2), 'utf-8');
  fs.writeFileSync(DECISIONS_MAP, JSON.stringify(decisionsMap, null, 2), 'utf-8');
}

/**
 * 关联文件到决策
 */
function linkFileToDecision(filePath, decisionId, metadata = {}) {
  const { filesMap, decisionsMap } = readMaps();

  // 规范化路径
  const normalizedPath = path.relative(PROJECT_DIR, filePath);

  // 更新文件映射
  if (!filesMap.files[normalizedPath]) {
    filesMap.files[normalizedPath] = {
      decisions: [],
      firstSeen: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
  }

  if (!filesMap.files[normalizedPath].decisions.includes(decisionId)) {
    filesMap.files[normalizedPath].decisions.push(decisionId);
  }
  filesMap.files[normalizedPath].lastModified = new Date().toISOString();

  // 更新决策映射
  if (!decisionsMap.decisions[decisionId]) {
    decisionsMap.decisions[decisionId] = {
      description: '',
      files: [],
      firstLinked: new Date().toISOString()
    };
  }

  if (!decisionsMap.decisions[decisionId].files.includes(normalizedPath)) {
    decisionsMap.decisions[decisionId].files.push(normalizedPath);
  }

  // 添加元数据
  if (metadata.description) {
    decisionsMap.decisions[decisionId].description = metadata.description;
  }

  writeMaps(filesMap, decisionsMap);

  return { normalizedPath, decisionId };
}

/**
 * 批量关联文件到决策
 */
function linkFilesToDecision(filePaths, decisionId, metadata = {}) {
  const results = [];
  filePaths.forEach(filePath => {
    results.push(linkFileToDecision(filePath, decisionId, metadata));
  });
  return results;
}

/**
 * 查询文件的决策历史
 */
function traceFile(filePath) {
  const { filesMap } = readMaps();
  const normalizedPath = path.relative(PROJECT_DIR, filePath);

  if (!filesMap.files[normalizedPath]) {
    return null;
  }

  return filesMap.files[normalizedPath];
}

/**
 * 查询决策关联的文件
 */
function traceDecision(decisionId) {
  const { decisionsMap } = readMaps();

  if (!decisionsMap.decisions[decisionId]) {
    return null;
  }

  return decisionsMap.decisions[decisionId];
}

/**
 * 获取所有文件-决策关系
 */
function getAllLinks() {
  const { filesMap, decisionsMap } = readMaps();
  return { filesMap, decisionsMap };
}

/**
 * 格式化显示文件追踪信息
 */
function displayFileTrace(filePath) {
  const trace = traceFile(filePath);

  if (!trace) {
    console.log(`\n📭 文件 "${filePath}" 暂无决策记录\n`);
    return;
  }

  console.log(`\n📄 文件追踪: ${filePath}\n`);
  console.log(`⏰ 首次记录: ${trace.firstSeen}`);
  console.log(`🔄 最后修改: ${trace.lastModified}`);
  console.log(`\n🔗 关联的决策 (${trace.decisions.length}):\n`);

  if (trace.decisions.length > 0) {
    const { decisionsMap } = readMaps();
    trace.decisions.forEach(decisionId => {
      const decision = decisionsMap.decisions[decisionId];
      if (decision) {
        console.log(`  - [${decisionId}] ${decision.description || '无描述'}`);
      } else {
        console.log(`  - [${decisionId}] (决策详情未找到)`);
      }
    });
  }
}

/**
 * 格式化显示决策关联文件
 */
function displayDecisionTrace(decisionId) {
  const trace = traceDecision(decisionId);

  if (!trace) {
    console.log(`\n📭 决策 "${decisionId}" 暂无文件记录\n`);
    return;
  }

  console.log(`\n🔗 决策追踪: ${decisionId}\n`);
  console.log(`📝 ${trace.description || '无描述'}`);
  console.log(`⏰ 首次关联: ${trace.firstLinked}`);
  console.log(`\n📄 关联的文件 (${trace.files.length}):\n`);

  trace.files.forEach(file => {
    const fullPath = path.join(PROJECT_DIR, file);
    const exists = fs.existsSync(fullPath) ? '✅' : '❌';
    console.log(`  ${exists} ${file}`);
  });
}

/**
 * 显示所有关联
 */
function displayAllLinks() {
  const { filesMap, decisionsMap } = readMaps();

  console.log('\n📊 代码-决策关联图谱\n');
  console.log(`📄 文件数量: ${Object.keys(filesMap.files).length}`);
  console.log(`🔗 决策数量: ${Object.keys(decisionsMap.decisions).length}\n`);

  if (Object.keys(filesMap.files).length > 0) {
    console.log('📄 文件列表:\n');
    Object.entries(filesMap.files).forEach(([file, data]) => {
      const decisionCount = data.decisions.length;
      const status = decisionCount > 0 ? `🔗 ${decisionCount} 决策` : '⚪ 无关联';
      console.log(`  ${status} - ${file}`);
    });
  }
}

/**
 * 从 DECISIONS.md 同步决策描述
 */
function syncDecisionDescriptions() {
  if (!fs.existsSync(DECISIONS_FILE)) {
    return;
  }

  const content = fs.readFileSync(DECISIONS_FILE, 'utf-8');
  const { decisionsMap } = readMaps();

  // 提取决策标题
  const decisionRegex = /^## \[([A-Z]\d+)\]\s+\d{4}-\d{2}-\d{2}.*?-\s*(.+?)$/gm;
  let match;

  while ((match = decisionRegex.exec(content)) !== null) {
    const [, decisionId, title] = match;
    if (decisionsMap.decisions[decisionId]) {
      if (!decisionsMap.decisions[decisionId].description) {
        decisionsMap.decisions[decisionId].description = title;
      }
    }
  }

  const { filesMap } = readMaps();
  writeMaps(filesMap, decisionsMap);
}

// CLI
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'trace': {
      // 追踪文件
      const filePath = args[1];
      if (!filePath) {
        console.error('用法: node code-tracer.cjs trace <文件路径>');
        process.exit(1);
      }
      displayFileTrace(filePath);
      break;
    }

    case 'decision': {
      // 查看决策的文件
      const decisionId = args[1];
      if (!decisionId) {
        console.error('用法: node code-tracer.cjs decision <决策ID>');
        process.exit(1);
      }
      displayDecisionTrace(decisionId);
      break;
    }

    case 'link': {
      // 手动关联
      const filePath = args[1];
      const decisionId = args[2];
      if (!filePath || !decisionId) {
        console.error('用法: node code-tracer.cjs link <文件路径> <决策ID>');
        process.exit(1);
      }
      linkFileToDecision(filePath, decisionId);
      console.log(`✅ 已关联 ${filePath} → ${decisionId}`);
      break;
    }

    case 'all': {
      displayAllLinks();
      break;
    }

    case 'sync': {
      syncDecisionDescriptions();
      console.log('✅ 已同步决策描述');
      break;
    }

    default:
      console.log(`
Code Tracer - 代码变更追踪工具

用法:
  node code-tracer.cjs trace <文件>        查看文件的决策历史
  node code-tracer.cjs decision <ID>      查看决策关联的文件
  node code-tracer.cjs link <文件> <ID>   手动关联文件到决策
  node code-tracer.cjs all                显示所有关联
  node code-tracer.cjs sync               同步决策描述

快捷命令:
  alias trace='node .claude/hooks/code-tracer.cjs trace'
  alias dtrace='node .claude/hooks/code-tracer.cjs decision'
      `);
  }
}

module.exports = {
  linkFileToDecision,
  linkFilesToDecision,
  traceFile,
  traceDecision,
  getAllLinks,
  syncDecisionDescriptions
};

if (require.main === module) {
  main();
}
