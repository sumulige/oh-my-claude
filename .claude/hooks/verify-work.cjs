#!/usr/bin/env node
/**
 * Verify Work Hook - 验证反馈循环
 *
 * 根据 Boris Cherny 的最佳实践，这是获得高质量结果的关键。
 * 在重要任务完成后自动触发验证流程，能让最终质量提升 2-3 倍。
 *
 * 触发时机：
 * - AgentStop 事件（会话结束时）
 * - 检测到关键操作完成（如 commit、push 等）
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const VERIFY_DIR = path.join(PROJECT_DIR, '.claude/verify');
const VERIFY_PENDING_FILE = path.join(VERIFY_DIR, '.pending-verify.json');
const VERIFY_LOG_FILE = path.join(VERIFY_DIR, 'verify-log.md');

// 确保目录存在
try { fs.mkdirSync(VERIFY_DIR, { recursive: true }); } catch (e) {}

// 检测是否需要验证
function shouldVerify(toolName, toolInput) {
  // 在这些操作后建议验证
  const verifyAfterOps = [
    'git commit',
    'git push',
    'deploy',
    'build',
    'test',
    'release'
  ];

  const lowerInput = toolInput.toLowerCase();
  return verifyAfterOps.some(op => lowerInput.includes(op));
}

// 获取待验证任务
function getPendingVerifies() {
  if (!fs.existsSync(VERIFY_PENDING_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(VERIFY_PENDING_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

// 保存待验证任务
function savePendingVerifies(tasks) {
  fs.writeFileSync(VERIFY_PENDING_FILE, JSON.stringify(tasks, null, 2));
}

// 添加验证提示到输出
function addVerifyHint(toolInput) {
  const hints = {
    'git commit': '建议运行测试套件验证更改是否破坏现有功能',
    'git push': '建议在 CI/CD 中确认所有检查通过',
    'deploy': '建议在预发布环境验证关键用户流程',
    'build': '建议运行构建产物检查是否有警告',
    'test': '建议检查测试覆盖率是否满足要求',
    'release': '建议进行完整的回归测试'
  };

  for (const [key, hint] of Object.entries(hints)) {
    if (toolInput.toLowerCase().includes(key)) {
      return hint;
    }
  }
  return '建议验证核心功能是否正常工作';
}

// 记录验证日志
function logVerify(action, hint) {
  const timestamp = new Date().toISOString();
  const logEntry = `\n## ${timestamp}\n**操作**: ${action}\n**验证建议**: ${hint}\n`;

  if (!fs.existsSync(VERIFY_LOG_FILE)) {
    fs.writeFileSync(VERIFY_LOG_FILE, `# 验证日志\n\n此文件记录所有建议验证的操作。\n${logEntry}`);
  } else {
    fs.appendFileSync(VERIFY_LOG_FILE, logEntry);
  }
}

// 主函数
function main() {
  try {
    const toolName = process.env.CLAUDE_TOOL_NAME || '';
    const toolInput = process.env.CLAUDE_TOOL_INPUT || '';
    const eventType = process.env.CLAUDE_EVENT_TYPE || '';

    // 检查是否需要验证
    if (shouldVerify(toolName, toolInput)) {
      const hint = addVerifyHint(toolInput);

      // 保存到待验证列表
      const pending = getPendingVerifies();
      pending.push({
        time: new Date().toISOString(),
        action: toolName + ': ' + toolInput.slice(0, 100),
        hint
      });
      savePendingVerifies(pending);

      // 记录到日志
      logVerify(toolName, hint);

      // 输出验证提示（仅在非 PostToolUse 事件，避免重复）
      if (eventType !== 'PostToolUse') {
        console.log(`\n🔍 [验证提醒] ${hint}`);
        console.log(`使用 /verify-work 查看待验证任务列表\n`);
      }
    }

    // AgentStop 时显示待验证任务摘要
    if (eventType === 'AgentStop') {
      const pending = getPendingVerifies();
      if (pending.length > 0) {
        console.log(`\n🔍 [待验证任务] 还有 ${pending.length} 个任务待验证`);
        console.log(`使用 /verify-work 查看详情并标记完成\n`);
      }
    }

  } catch (e) {
    // 静默处理错误
  }

  process.exit(0);
}

main();
