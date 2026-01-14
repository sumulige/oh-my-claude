#!/usr/bin/env node
/**
 * Code Formatter Hook - 自动代码格式化
 *
 * 根据 Boris Cherny 的最佳实践，Claude 通常能生成格式良好的代码，
 * 但这个 hook 处理最后 10% 的格式问题，避免 CI 中的格式错误。
 *
 * 触发时机：PostToolUse 事件
 * 支持语言：JavaScript, TypeScript, Python, Rust, Go, JSON, Markdown
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// 支持的格式化器配置
const FORMATTERS = {
  // JavaScript/TypeScript
  '.js': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },
  '.jsx': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },
  '.ts': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },
  '.tsx': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },
  '.mjs': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },
  '.cjs': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },

  // Python
  '.py': { cmd: 'black', args: ['--quiet'] },

  // Rust
  '.rs': { cmd: 'rustfmt', args: [] },

  // Go
  '.go': { cmd: 'gofmt', args: ['-w'] },

  // JSON
  '.json': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },

  // Markdown
  '.md': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },

  // CSS/SCSS
  '.css': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },
  '.scss': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },
  '.less': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },

  // HTML
  '.html': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },
  '.htm': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },

  // YAML
  '.yaml': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },
  '.yml': { cmd: 'prettier', args: ['--write', '--log-level', 'warn'] },
};

// 检查命令是否可用
function isCommandAvailable(cmd) {
  try {
    // 首先尝试 which
    spawn('which', [cmd], { stdio: 'ignore' });

    // 对于 prettier，额外检查 npx
    if (cmd === 'prettier') {
      spawn('npx', [cmd, '--version'], { stdio: 'ignore' });
    }
    return true;
  } catch (e) {
    return false;
  }
}

// 获取工具修改的文件
function getModifiedFiles() {
  const toolName = process.env.CLAUDE_TOOL_NAME || '';
  const toolInput = process.env.CLAUDE_TOOL_INPUT || '';

  // 从工具输入中提取文件路径
  const filePaths = [];

  // Edit 工具
  if (toolName === 'Edit') {
    // Edit 工具的文件路径在 file_path 参数中
    const match = toolInput.match(/"filePath":\s*"([^"]+)"/);
    if (match) {
      filePaths.push(match[1]);
    }
  }

  // Write 工具
  if (toolName === 'Write') {
    const match = toolInput.match(/"file_path":\s*"([^"]+)"/);
    if (match) {
      filePaths.push(match[1]);
    }
  }

  // NotebookEdit 工具
  if (toolName === 'NotebookEdit') {
    const match = toolInput.match(/"notebook_path":\s*"([^"]+)"/);
    if (match) {
      filePaths.push(match[1]);
    }
  }

  return filePaths;
}

// 格式化文件
function formatFile(filePath) {
  const ext = path.extname(filePath);

  // 跳过不需要格式化的目录
  const skipDirs = ['node_modules', '.git', 'dist', 'build', 'target', 'vendor', '.venv'];
  if (skipDirs.some(dir => filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`))) {
    return null;
  }

  const formatter = FORMATTERS[ext];
  if (!formatter) {
    return null;
  }

  // 检查格式化器是否可用
  if (!isCommandAvailable(formatter.cmd)) {
    return null;
  }

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    // 对于 prettier，使用 npx 来支持本地安装
    const cmd = formatter.cmd === 'prettier' ? 'npx' : formatter.cmd;
    const args = formatter.cmd === 'prettier'
      ? ['prettier', ...formatter.args, filePath]
      : [...formatter.args, filePath];

    // 运行格式化器
    spawn(cmd, args, {
      stdio: 'ignore',
      cwd: PROJECT_DIR,
      detached: true
    }).unref();
    return { file: filePath, formatter: formatter.cmd };
  } catch (e) {
    return null;
  }
}

// 主函数
function main() {
  try {
    const eventType = process.env.CLAUDE_EVENT_TYPE || '';

    // 只在 PostToolUse 事件时运行
    if (eventType !== 'PostToolUse') {
      process.exit(0);
    }

    const modifiedFiles = getModifiedFiles();

    if (modifiedFiles.length === 0) {
      process.exit(0);
    }

    // 格式化所有修改的文件
    const formatted = modifiedFiles
      .map(formatFile)
      .filter(result => result !== null);

    // 输出格式化结果（可选，用于调试）
    if (formatted.length > 0 && process.env.DEBUG_FORMATTER) {
      console.log(`\n🎨 [格式化] 已格式化 ${formatted.length} 个文件:`);
      formatted.forEach(f => console.log(`   - ${f.file} (${f.formatter})`));
    }

  } catch (e) {
    // 完全静默，不输出任何错误
  }

  process.exit(0);
}

main();
