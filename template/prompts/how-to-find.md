# 对话历史快速查看指南

> 如何找到你的对话记录
> 最后更新：2026-01-11

---

## 方式一：Claude Code 内置历史（完整对话）

### 方法 A：CLI 查看

```bash
# 查看最近的对话列表
claude-code history

# 查看特定项目的对话
claude-code history --project evolvemind

# 查看某个对话的详情
claude-code show <conversation-id>
```

### 方法 B：重启时恢复

```bash
# 在项目目录下启动 Claude Code
cd /Users/sumulige/Documents/Antigravity/evolvemind
claude-code

# 会自动恢复上次的对话上下文
```

---

## 方式二：对话摘要（快速回顾）

### 查看今日对话

```bash
.claude/hooks/tl-summary.sh
```

输出示例：
```
📅 今日对话摘要
────────────────────────────────────────
会话 ID: s-20260111-evolvemind
开始时间: 2026-01-11 10:30:00
对话轮次: 15

📊 操作统计:
  💬 normal: 10
  📝 code-edit: 4
  ⚡ potential-action: 1

🕐 最近活动:
  15:20 📝 Edit
  15:15 💬 UserPromptSubmit
  15:10 ⚡ 完成数据分析功能
```

---

## 方式三：原始数据（开发者）

### 查看对话流原始数据

```bash
# 查看原始 JSON
cat .claude/thinking-routes/.conversation-flow.json

# 或用 jq 格式化查看
cat .claude/thinking-routes/.conversation-flow.json | jq '.'
```

### 查看思维节点

```bash
# 查看最近 10 个思维节点
npx -p tsx tsx .claude/thinking-routes/index.ts recent 10

# 查看思维图谱（图形化）
npx -p tsx tsx .claude/thinking-routes/index.ts log --graph

# 搜索思维节点
npx -p tsx tsx .claude/thinking-routes/index.ts search "数据分析"
```

---

## 方式四：项目日志（完整记录）

### 查看 PROJECT_LOG.md

```bash
# 查看完整项目构建历史
cat .claude/PROJECT_LOG.md

# 或用 less 分页查看
less .claude/PROJECT_LOG.md
```

### 查看 MEMORY.md（增量）

```bash
# 查看最近的变更
cat .claude/MEMORY.md
```

---

## 快捷命令

把以下命令加到你的 shell 配置（`.zshrc` 或 `.bashrc`）：

```bash
# 对话摘要
alias tl='.claude/hooks/tl-summary.sh'

# 思维节点
alias tl-recent='npx -p tsx tsx .claude/thinking-routes/index.ts recent'
alias tl-graph='npx -p tsx tsx .claude/thinking-routes/index.ts log --graph'
alias tl-search='npx -p tsx tsx .claude/thinking-routes/index.ts search'

# 项目日志
alias log='cat .claude/PROJECT_LOG.md | less'
alias memory='cat .claude/MEMORY.md'
```

使用：
```bash
tl          # 查看对话摘要
tl-recent   # 查看最近思维节点
tl-graph    # 查看思维图谱
tl-search   # 搜索思维节点
```

---

## 数据位置

```
.claude/thinking-routes/
├── .conversation-flow.json      # 对话流数据
├── .current-session            # 当前会话 ID
├── sessions/                    # 会话记录
├── decisions/                   # 思维节点
└── index/                       # 全局索引

.claude/
├── MEMORY.md                    # 增量记忆
├── PROJECT_LOG.md               # 完整日志
└── ANCHORS.md                  # 快速索引
```

---

## 推荐工作流

1. **日常回顾**：每天结束前执行 `tl` 查看摘要
2. **查找决策**：用 `tl-search "关键词"` 搜索
3. **了解历史**：查看 `MEMORY.md` 或 `PROJECT_LOG.md`
4. **完整对话**：用 `claude-code history` 查看内置历史
