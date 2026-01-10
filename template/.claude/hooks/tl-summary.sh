#!/bin/bash
# tl-summary - 查看今日对话摘要
#
# 用法：
#   .claude/hooks/tl-summary.sh

# 自动检测项目目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

THINKING_DIR="$CLAUDE_PROJECT_DIR/.claude/thinking-routes"
FLOW_FILE="$THINKING_DIR/.conversation-flow.json"

if [[ ! -f "$FLOW_FILE" ]]; then
  echo "📭 暂无对话记录"
  exit 0
fi

# 解析 JSON（使用 Node.js）
node -e "
const fs = require('fs');
const flow = JSON.parse(fs.readFileSync('$FLOW_FILE', 'utf-8'));

console.log('');
console.log('📅 今日对话摘要');
console.log('─'.repeat(40));
console.log('会话 ID: ' + flow.sessionId);
console.log('开始时间: ' + new Date(flow.startTime).toLocaleString('zh-CN'));
console.log('对话轮次: ' + flow.turns.length);
console.log('');

// 统计操作类型
const types = {};
flow.turns.forEach(t => {
  types[t.type] = (types[t.type] || 0) + 1;
});

console.log('📊 操作统计:');
Object.entries(types).forEach(([type, count]) => {
  const emoji = type === 'potential-action' ? '⚡' :
                type === 'code-edit' ? '📝' : '💬';
  console.log('  ' + emoji + ' ' + type + ': ' + count);
});
console.log('');

// 显示最近 5 个操作
console.log('🕐 最近活动:');
flow.turns.slice(-5).reverse().forEach(t => {
  const time = new Date(t.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const emoji = t.type === 'potential-action' ? '⚡' :
                t.type === 'code-edit' ? '📝' : '💬';
  console.log('  ' + time + ' ' + emoji + ' ' + t.toolName);
});
"
