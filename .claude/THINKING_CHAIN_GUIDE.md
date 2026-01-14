# 思维链管理系统使用指南

> 类似 GitLens，但用于对话和决策追踪

---

## 🎯 核心功能

| 功能 | 说明 |
|------|------|
| 📝 完整对话记录 | 记录每轮对话（用户 + AI） |
| 🔗 决策追踪 | 自动识别并记录重要决策 |
| 🔍 代码关联 | 追踪代码变更与决策的关系 |
| 🚫 隐私保护 | 自动过滤 API Key 等敏感信息 |
| 📤 导出功能 | 支持 JSON/Markdown/PDF 导出 |

---

## 📂 数据结构

```
.claude/
├── transcripts/              # 完整对话存档
│   └── 2026/01/14.md        # 按日期组织
├── decisions/                # 决策记录
│   ├── DECISIONS.md         # 决策索引
│   └── by-topic/            # 按主题分类
├── code-trace/              # 代码变更追踪
│   ├── files-map.json      # 文件 → 决策
│   └── decisions-map.json  # 决策 → 文件
└── export/                  # 导出目录
```

---

## 🚀 快速开始

### 1. 查看今日对话

```bash
# 方式 1: 直接查看
cat .claude/transcripts/$(date +%Y/%m/%d).md

# 方式 2: 使用脚本
node .claude/hooks/conversation-recorder.cjs today

# 添加别名后
today
```

### 2. 查看所有决策

```bash
# 方式 1: 直接查看
cat .claude/decisions/DECISIONS.md

# 方式 2: 使用脚本
node .claude/hooks/decision-tracker.cjs list

# 添加别名后
decisions
```

### 3. 追踪代码来源

```bash
# 查看某个文件的决策历史
node .claude/hooks/code-tracer.cjs trace src/file.ts

# 添加别名后
trace src/file.ts
```

---

## 📝 命令参考

### 对话记录 (conversation-recorder.cjs)

```bash
# 记录用户消息
node .claude/hooks/conversation-recorder.cjs user "消息内容"

# 记录 AI 回复
node .claude/hooks/conversation-recorder.cjs assistant "回复内容"

# 手动记录决策
node .claude/hooks/conversation-recorder.cjs decision "标题" "理由" "内容"

# 查看今日对话
node .claude/hooks/conversation-recorder.cjs today

# 列出所有 transcript
node .claude/hooks/conversation-recorder.cjs list
```

### 决策追踪 (decision-tracker.cjs)

```bash
# 手动添加决策
node .claude/hooks/decision-tracker.cjs add "标题" "内容" "tag1,tag2"

# 列出所有决策
node .claude/hooks/decision-tracker.cjs list

# 搜索决策
node .claude/hooks/decision-tracker.cjs search "关键词"

# 列出所有主题
node .claude/hooks/decision-tracker.cjs topics

# 从文本中提取决策
node .claude/hooks/decision-tracker.cjs extract "文本内容"
```

### 代码追踪 (code-tracer.cjs)

```bash
# 查看文件的决策历史
node .claude/hooks/code-tracer.cjs trace <文件路径>

# 查看决策关联的文件
node .claude/hooks/code-tracer.cjs decision <决策ID>

# 手动关联文件到决策
node .claude/hooks/code-tracer.cjs link <文件> <决策ID>

# 显示所有关联
node .claude/hooks/code-tracer.cjs all

# 同步决策描述
node .claude/hooks/code-tracer.cjs sync
```

### 隐私过滤 (privacy-filter.js)

```bash
# 检查文件是否包含敏感信息
node .claude/hooks/privacy-filter.js --check <文件>

# 过滤敏感信息
node .claude/hooks/privacy-filter.js --filter <输入> [输出]

# 列出所有过滤模式
node .claude/hooks/privacy-filter.js --patterns
```

### 导出 (export.cjs)

```bash
# 导出为 JSON
node .claude/hooks/export.cjs json [文件名]

# 导出为 Markdown
node .claude/hooks/export.cjs md [文件名]

# 导出为 PDF（需要 pandoc）
node .claude/hooks/export.cjs pdf

# 只导出决策
node .claude/hooks/export.cjs decisions

# 只导出对话
node .claude/hooks/export.cjs transcripts

# 列出导出文件
node .claude/hooks/export.cjs list

# 清理导出文件
node .claude/hooks/export.cjs clean
```

---

## ⚡ 推荐别名

添加到 `~/.zshrc` 或 `~/.bashrc`：

```bash
# 对话历史
alias today='node .claude/hooks/conversation-recorder.cjs today'
alias transcripts='node .claude/hooks/conversation-recorder.cjs list'

# 决策
alias decisions='node .claude/hooks/decision-tracker.cjs list'
alias dadd='node .claude/hooks/decision-tracker.cjs add'
alias dsearch='node .claude/hooks/decision-tracker.cjs search'
alias dtopics='node .claude/hooks/decision-tracker.cjs topics'

# 代码追踪
alias trace='node .claude/hooks/code-tracer.cjs trace'
alias dtrace='node .claude/hooks/code-tracer.cjs decision'
alias codelink='node .claude/hooks/code-tracer.cjs link'

# 导出
alias export='node .claude/hooks/export.cjs'
```

---

## 🔒 隐私保护

系统会自动过滤以下敏感信息：

| 类型 | 示例 |
|------|------|
| API Key | `sk-xxxxx` → `sk-[REDACTED]` |
| Bearer Token | `Bearer xxxxx` → `Bearer [REDACTED]` |
| AWS Key | `AKIAxxxxx` → `AKIA[REDACTED]` |
| GitHub Token | `ghp_xxxxx` → `ghp_[REDACTED]` |
| 配置中的密钥 | `key: "xxxxx"` → `key: [REDACTED]` |

---

## 📊 工作流示例

### 场景：实现一个新功能

1. **开始对话** → 系统自动记录到 `transcripts/`
2. **做出决策** → 系统自动识别并记录到 `decisions/`
3. **修改代码** → 手动关联代码到决策
4. **完成回顾** → 导出完整记录

```bash
# 查看今天做了什么
today

# 查看所有相关决策
decisions | grep "功能"

# 追踪某个文件的来源
trace src/feature.ts

# 导出完整记录
export json my-feature.json
```

---

## 📱 VSCode 集成

在 `.vscode/settings.json` 中添加：

```json
{
  "files.exclude": {
    "**/.claude/transcripts": true,
    "**/.claude/code-trace": true
  },
  "search.exclude": {
    "**/.claude/export": true
  }
}
```

---

## 🔄 数据持久化

- 所有数据存储在本地项目 `.claude/` 目录
- 已配置 `.gitignore`，不会提交到 git
- 可随时使用 `export.cjs` 导出备份

---

## 🤝 AI 辅助

系统会自动：

- **识别决策**：检测对话中的决策关键词
- **分类主题**：自动为决策打标签
- **过滤隐私**：自动替换敏感信息
- **关联代码**：追踪文件变更

你也可以手动：

- **添加决策**：使用 `dadd` 命令
- **关联代码**：使用 `codelink` 命令
- **修正分类**：编辑 `decisions/by-topic/` 文件

---

## 📚 更多

- 查看决策按主题：`cat .claude/decisions/by-topic/*.md`
- 搜索历史对话：`grep -r "关键词" .claude/transcripts/`
- 查看完整思维链：`node .claude/hooks/export.cjs md && open .claude/export/`
