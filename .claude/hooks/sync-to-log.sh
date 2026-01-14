#!/bin/bash
# 对话摘要同步脚本 - 将对话摘要追加到 PROJECT_LOG.md
# 用法: .claude/hooks/sync-to-log.sh

set -e

# 自动检测项目目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

THINKING_DIR="$CLAUDE_PROJECT_DIR/.claude/thinking-routes"
ACTIVITY_FILE="$THINKING_DIR/.conversation-flow.json"
PROJECT_LOG="$CLAUDE_PROJECT_DIR/.claude/PROJECT_LOG.md"
SESSION_FILE="$THINKING_DIR/.current-session"

# 确保目录存在
mkdir -p "$THINKING_DIR"

# 获取对话数据
if [[ ! -f "$ACTIVITY_FILE" ]]; then
    echo "❌ 没有对话记录"
    exit 0
fi

# 生成摘要
SUMMARY=$(node -e "
const fs = require('fs');
const flow = JSON.parse(fs.readFileSync('$ACTIVITY_FILE', 'utf-8'));

const turns = flow.turns || [];
const today = new Date().toISOString().split('T')[0];

// 统计今天的对话
const todayTurns = turns.filter(t => t.time && t.time.startsWith(today));

// 统计工具使用
const toolCounts = {};
todayTurns.forEach(t => {
    const tool = t.toolName || 'unknown';
    toolCounts[tool] = (toolCounts[tool] || 0) + 1;
});

// 生成工具使用统计
const toolStats = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tool, count]) => \`  - \${tool}: \${count}\`)
    .join('\\n');

// 获取最近活动
const recent = todayTurns.slice(-3).map(t => {
    const time = t.time ? t.time.split('T')[1].split(':')[0] + ':' + t.time.split('T')[1].split(':')[1] : '??:??';
    return \`  - \${time} \${t.toolName || 'unknown'}\`;
}).join('\\n');

console.log('## ' + today + ' - 对话摘要');
console.log('');
console.log('### 统计');
console.log('- 对话轮次: ' + todayTurns.length);
console.log('- 会话 ID: ' + (flow.sessionId || 'unknown'));
console.log('');
console.log('### 工具使用');
console.log(toolStats || '  (无)');
console.log('');
console.log('### 最近活动');
console.log(recent || '  (无)');
console.log('');
console.log('---');
" 2>/dev/null || echo "生成摘要失败")

# 追加到 PROJECT_LOG.md
if [[ -n "$SUMMARY" ]]; then
    # 检查今天是否已有记录
    today=$(date +%Y-%m-%d)
    if grep -q "^## $today" "$PROJECT_LOG" 2>/dev/null; then
        # 更新今天的记录（删除旧记录，追加新的）
        # 简单处理：直接追加
        echo "$SUMMARY" >> "$PROJECT_LOG"
    else
        echo "$SUMMARY" >> "$PROJECT_LOG"
    fi
    echo "✅ 已同步到 PROJECT_LOG.md"
fi
