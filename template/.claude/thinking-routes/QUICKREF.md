# 对话历史速查卡

> 快速找到你的对话记录

---

## 🚀 最常用

| 命令 | 效果 |
|------|------|
| `tl` | 查看今日对话摘要 |
| `log` | 查看项目完整日志 |
| `memory` | 查看最近变更 |

---

## 📂 数据位置

```
.claude/
├── thinking-routes/
│   └── .conversation-flow.json    ← 对话流数据
├── MEMORY.md                       ← 增量记忆
├── PROJECT_LOG.md                  ← 完整日志
└── ANCHORS.md                      ← 快速索引
```

---

## 🔍 查找方式

### 按时间查找
```bash
# 最近对话摘要
.claude/hooks/tl-summary.sh

# 完整项目日志（按时间顺序）
cat .claude/PROJECT_LOG.md | grep "2026-01-11"
```

### 按关键词查找
```bash
# 搜索思维节点
npx -p tsx tsx .claude/thinking-routes/index.ts search "数据分析"

# 在日志中搜索
cat .claude/PROJECT_LOG.md | grep -i "API"
```

### 按类型查找
```bash
# 查看所有决策
cat .claude/PROJECT_LOG.md | grep "决策"

# 查看所有变更
cat .claude/MEMORY.md | grep "新增"
```

---

## ⚡ 快捷别名

添加到 `~/.zshrc` 或 `~/.bashrc`：

```bash
# 对话历史
alias tl='.claude/hooks/tl-summary.sh'
alias log='less .claude/PROJECT_LOG.md'
alias memory='cat .claude/MEMORY.md'

# 思维节点
alias tl-recent='npx -p tsx tsx .claude/thinking-routes/index.ts recent'
alias tl-graph='npx -p tsx tsx .claude/thinking-routes/index.ts log --graph'
alias tl-search='npx -p tsx tsx .claude/thinking-routes/index.ts search'
```

---

## 📱 Claude Code 内置

```bash
# 查看对话历史列表
claude-code history

# 恢复某个对话
claude-code resume <conversation-id>
```

---

## 💡 使用建议

| 场景 | 使用 |
|------|------|
| 每天回顾 | `tl` |
| 找决策理由 | `tl-search "关键词"` |
| 了解项目全貌 | `log` |
| 查看最近变更 | `memory` |
