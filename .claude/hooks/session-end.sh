#!/bin/bash
# 会话结束 Hook - 自动生成对话摘要并同步到 PROJECT_LOG.md
#
# 用法：在 shell 中 source 此文件
# source .claude/hooks/session-end.sh
#
# 或者添加到 ~/.zshrc 或 ~/.bashrc：
#   source /path/to/project/.claude/hooks/session-end.sh

# 检测是否在项目目录中
CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# 会话数据文件
THINKING_DIR="$CLAUDE_PROJECT_DIR/.claude/thinking-routes"
ACTIVITY_FILE="$THINKING_DIR/.conversation-flow.json"
PROJECT_LOG="$CLAUDE_PROJECT_DIR/.claude/PROJECT_LOG.md"

# 生成会话摘要并追加到 PROJECT_LOG.md
save_session_summary() {
    # 只在项目目录内执行
    if [[ ! -f "$ACTIVITY_FILE" ]]; then
        return
    fi

    local today=$(date +%Y-%m-%d)
    local time=$(date +%H:%M:%S)
    local turn_count=0

    # 读取对话流数据
    if [[ -f "$ACTIVITY_FILE" ]]; then
        turn_count=$(node -e "
            const fs = require('fs');
            try {
                const flow = JSON.parse(fs.readFileSync('$ACTIVITY_FILE', 'utf-8'));
                console.log(flow.turns ? flow.turns.length : 0);
            } catch(e) {
                console.log(0);
            }
        " 2>/dev/null || echo "0")
    fi

    # 只在有对话记录时保存
    if [[ "$turn_count" -gt 0 ]]; then
        # 追加到 PROJECT_LOG.md
        cat >> "$PROJECT_LOG" << EOF

## $today $time - 会话结束
- 对话轮次: $turn_count
- 会话文件: .claude/thinking-routes/.conversation-flow.json
- 查看摘要: 运行 \`.claude/hooks/tl-summary.sh\`

---
EOF
    fi
}

# 注册退出时的处理
trap 'save_session_summary' EXIT INT TERM

# 导出函数供手动调用
export -f save_session_summary
