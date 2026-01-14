#!/usr/bin/env node
/**
 * Export Tool - 导出对话和决策数据
 *
 * 功能：
 * - 导出为 JSON 格式
 * - 导出为 Markdown（可转换为 PDF）
 * - 支持按日期范围导出
 * - 支持按主题导出
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const TRANSCRIPTS_DIR = path.join(PROJECT_DIR, '.claude', 'transcripts');
const DECISIONS_DIR = path.join(PROJECT_DIR, '.claude', 'decisions');
const CODE_TRACE_DIR = path.join(PROJECT_DIR, '.claude', 'code-trace');
const EXPORT_DIR = path.join(PROJECT_DIR, '.claude', 'export');

// 确保导出目录存在
try { fs.mkdirSync(EXPORT_DIR, { recursive: true }); } catch (e) {}

/**
 * 获取今日日期字符串
 */
function getDateStamp() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * 读取所有 transcripts
 */
function readAllTranscripts() {
  const transcripts = [];

  function readDir(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        readDir(fullPath, prefix + entry.name + '/');
      } else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        transcripts.push({
          path: prefix + entry.name,
          fullPath,
          content,
          size: content.length,
          modified: fs.statSync(fullPath).mtime
        });
      }
    });
  }

  readDir(TRANSCRIPTS_DIR);
  return transcripts.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * 读取所有决策
 */
function readAllDecisions() {
  const decisionsPath = path.join(DECISIONS_DIR, 'DECISIONS.md');
  if (!fs.existsSync(decisionsPath)) {
    return { content: '', count: 0 };
  }

  const content = fs.readFileSync(decisionsPath, 'utf-8');
  const blocks = content.split(/^## /m).filter(s => s.trim());

  return {
    content,
    count: blocks.length,
    blocks
  };
}

/**
 * 读取代码追踪数据
 */
function readCodeTrace() {
  const filesMapPath = path.join(CODE_TRACE_DIR, 'files-map.json');
  const decisionsMapPath = path.join(CODE_TRACE_DIR, 'decisions-map.json');

  let filesMap = { files: {}, lastUpdated: null };
  let decisionsMap = { decisions: {}, lastUpdated: null };

  if (fs.existsSync(filesMapPath)) {
    filesMap = JSON.parse(fs.readFileSync(filesMapPath, 'utf-8'));
  }
  if (fs.existsSync(decisionsMapPath)) {
    decisionsMap = JSON.parse(fs.readFileSync(decisionsMapPath, 'utf-8'));
  }

  return { filesMap, decisionsMap };
}

/**
 * 导出为 JSON
 */
function exportJSON(options = {}) {
  const { includeTranscripts = true, includeDecisions = true, includeTrace = true } = options;

  const data = {
    exportedAt: new Date().toISOString(),
    project: path.basename(PROJECT_DIR),
    version: '1.0'
  };

  if (includeTranscripts) {
    data.transcripts = readAllTranscripts();
    data.transcriptCount = data.transcripts.length;
  }

  if (includeDecisions) {
    const decisions = readAllDecisions();
    data.decisions = decisions;
    data.decisionCount = decisions.count;
  }

  if (includeTrace) {
    const trace = readCodeTrace();
    data.codeTrace = trace;
  }

  return data;
}

/**
 * 导出为 Markdown
 */
function exportMarkdown(options = {}) {
  const { includeTranscripts = true, includeDecisions = true, includeTrace = true } = options;

  let md = `# Thinking Chain Export\n\n`;
  md += `**项目**: ${path.basename(PROJECT_DIR)}\n`;
  md += `**导出时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
  md += `---\n\n`;

  if (includeTranscripts) {
    md += `## 📝 对话记录\n\n`;
    const transcripts = readAllTranscripts();
    transcripts.forEach(t => {
      md += `### ${t.path}\n\n`;
      md += t.content + '\n\n---\n\n';
    });
  }

  if (includeDecisions) {
    md += `## 🔗 决策记录\n\n`;
    const decisions = readAllDecisions();
    md += decisions.content + '\n\n---\n\n';
  }

  if (includeTrace) {
    md += `## 🔍 代码追踪\n\n`;
    const trace = readCodeTrace();
    md += `### 文件关联\n\n`;
    Object.entries(trace.filesMap.files || {}).forEach(([file, data]) => {
      md += `- **${file}**: ${data.decisions.join(', ') || '无关联'}\n`;
    });
    md += `\n### 决策关联\n\n`;
    Object.entries(trace.decisionsMap.decisions || {}).forEach(([id, data]) => {
      md += `- **${id}**: ${data.files.join(', ') || '无文件'}\n`;
    });
  }

  return md;
}

/**
 * 保存导出文件
 */
function saveExport(content, format, filename) {
  const dateStamp = getDateStamp();
  const defaultName = `thinking-chain-${dateStamp}.${format}`;
  const outputName = filename || defaultName;
  const outputPath = path.join(EXPORT_DIR, outputName);

  if (format === 'json') {
    fs.writeFileSync(outputPath, JSON.stringify(content, null, 2), 'utf-8');
  } else {
    fs.writeFileSync(outputPath, content, 'utf-8');
  }

  return outputPath;
}

/**
 * 获取导出文件大小
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  const size = stats.size;
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

// CLI
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'json': {
      const data = exportJSON();
      const outputPath = saveExport(data, 'json', args[1]);
      console.log(`✅ 导出 JSON → ${outputPath} (${getFileSize(outputPath)})`);
      console.log(`   包含 ${data.transcriptCount || 0} 个对话, ${data.decisionCount || 0} 个决策`);
      break;
    }

    case 'md': {
      const content = exportMarkdown();
      const outputPath = saveExport(content, 'md', args[1]);
      console.log(`✅ 导出 Markdown → ${outputPath} (${getFileSize(outputPath)})`);
      break;
    }

    case 'pdf': {
      // Markdown 转 PDF 需要额外工具
      console.log(`
PDF 导出需要安装额外工具。请选择一种方式：

方式 1 - 使用 pandoc:
  brew install pandoc
  pandoc .claude/export/thinking-chain.md -o .claude/export/thinking-chain.pdf

方式 2 - 使用 markdown-pdf:
  npm install -g markdown-pdf
  markdown-pdf .claude/export/thinking-chain.md

方式 3 - 在 VSCode 中:
  1. 安装 Markdown PDF 扩展
  2. 打开 .claude/export/thinking-chain.md
  3. 右键 → Markdown PDF: Export (pdf)
      `);

      // 先导出 Markdown
      const content = exportMarkdown();
      const mdPath = saveExport(content, 'md', null);
      console.log(`\n✅ 已准备 Markdown 文件: ${mdPath}`);
      break;
    }

    case 'decisions': {
      // 只导出决策
      const content = exportMarkdown({ includeTranscripts: false, includeTrace: false });
      const outputPath = saveExport(content, 'md', `decisions-${getDateStamp()}.md`);
      console.log(`✅ 导出决策 → ${outputPath}`);
      break;
    }

    case 'transcripts': {
      // 只导出对话
      const content = exportMarkdown({ includeDecisions: false, includeTrace: false });
      const outputPath = saveExport(content, 'md', `transcripts-${getDateStamp()}.md`);
      console.log(`✅ 导出对话 → ${outputPath}`);
      break;
    }

    case 'list': {
      // 列出导出文件
      if (fs.existsSync(EXPORT_DIR)) {
        const files = fs.readdirSync(EXPORT_DIR);
        console.log('\n📂 导出文件:\n');
        files.forEach(f => {
          const filePath = path.join(EXPORT_DIR, f);
          const stats = fs.statSync(filePath);
          console.log(`  ${f} (${getFileSize(filePath)}) ${stats.mtime.toLocaleDateString()}`);
        });
      } else {
        console.log('📭 暂无导出文件');
      }
      break;
    }

    case 'clean': {
      // 清理旧导出
      if (fs.existsSync(EXPORT_DIR)) {
        const files = fs.readdirSync(EXPORT_DIR);
        let cleaned = 0;
        files.forEach(f => {
          const filePath = path.join(EXPORT_DIR, f);
          if (f !== '.gitkeep') {
            fs.unlinkSync(filePath);
            cleaned++;
          }
        });
        console.log(`✅ 清理了 ${cleaned} 个导出文件`);
      }
      break;
    }

    default:
      console.log(`
Export Tool - 数据导出工具

用法:
  node export.cjs json [文件名]     导出为 JSON
  node export.cjs md [文件名]       导出为 Markdown
  node export.cjs pdf               导出为 PDF（需要额外工具）
  node export.cjs decisions         只导出决策
  node export.cjs transcripts       只导出对话
  node export.cjs list              列出导出文件
  node export.cjs clean             清理导出文件

快捷命令:
  alias export='node .claude/hooks/export.cjs'
      `);
  }
}

module.exports = {
  exportJSON,
  exportMarkdown,
  readAllTranscripts,
  readAllDecisions,
  readCodeTrace
};

if (require.main === module) {
  main();
}
