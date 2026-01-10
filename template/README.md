# Claude Code 项目模板

> 通用 Claude Code 深度集成模板 - 适用于任何项目

---

## 快速开始

```bash
# 1. 复制整个模板文件夹到你的项目根目录
cp -r claude-project-template/* /你的项目/

# 2. 重命名 CLAUDE-template.md 为 CLAUDE.md
mv /你的项目/.claude/CLAUDE-template.md /你的项目/.claude/CLAUDE.md

# 3. 编辑 CLAUDE.md，填入你的项目信息
vim /你的项目/.claude/CLAUDE.md

# 4. 给 hooks 添加执行权限
chmod +x /你的项目/.claude/hooks/*.js
chmod +x /你的项目/.claude/hooks/*.sh

# 5. 配置 Claude Code（如果还没配置）
vim /你的项目/.claude/settings.json
```

---

## 文件结构

```
claude-project-template/
├── README.md                   # 本文件
├── init.sh                     # 一键初始化脚本 ⭐
├── project-paradigm.md         # 通用项目开发范式 ⭐
├── CLAUDE-template.md          # CLAUDE.md 模板
├── thinkinglens-silent.md      # 无感知追踪说明
└── .claude/
    ├── CLAUDE-template.md      # 项目 CLAUDE.md 模板
    ├── settings.json           # Claude Code 配置模板
    ├── hooks/
    │   ├── thinking-silent.js  # 无感知对话追踪 Hook
    │   ├── tl-summary.sh       # 查看对话摘要脚本
    │   ├── sync-to-log.sh      # 同步对话到 PROJECT_LOG.md ⭐
    │   └── session-end.sh      # 退出时保存摘要（可选）
    └── thinking-routes/
        └── QUICKREF.md         # 对话查找速查卡
```

---

## 核心特性

### 1. AI 自治记忆系统
- **ANCHORS.md** - 锚点索引，快速定位模块
- **MEMORY.md** - 增量记忆日志
- **PROJECT_LOG.md** - 完整项目构建历史
- **CLAUDE.md** - 项目核心知识

### 2. 无感知追踪
- **thinking-silent.js** - 零输出、自动追踪对话
- **每 20 轮自动同步** - 对话摘要自动追加到 PROJECT_LOG.md ⭐
- **tl-summary.sh** - 按需查看对话摘要
- 数据本地存储，隐私安全

### 3. 项目范式
- **Personal Panopticon** - 个人全景塔理念
- **锚点系统** - `[类型:名称]` 索引规范
- **Skills 模板** - 领域知识库结构
- **Hooks 配置** - 自动化钩子示例

---

## 配置说明

### settings.json

```json
{
  "matcher": "UserPromptSubmit|PreToolUse|PostToolUse",
  "hooks": [{
    "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/thinking-silent.js",
    "timeout": 1
  }]
}
```

### CLAUDE.md 模板

编辑以下部分：

```markdown
## Project Vision
[你的项目愿景]

## Stack
[技术栈：React, TypeScript, Node.js...]

## Common Commands
[常用命令]
```

---

## 使用命令

```bash
# 一键初始化（推荐）
/path/to/claude-project-template/init.sh .

# 查看对话摘要
tl                    # 或 .claude/hooks/tl-summary.sh

# 手动同步到日志
.claude/hooks/sync-to-log.sh

# 查看项目日志
cat .claude/PROJECT_LOG.md

# 查看记忆变更
cat .claude/MEMORY.md
```

---

## 成功标准

完成后，项目应该具备：

- ✅ AI 能够理解项目规范并生成符合标准的代码
- ✅ AI 启动时自动加载完整上下文
- ✅ 关键决策可追溯（ThinkingLens）
- ✅ 知识可累积（Skills 系统）
- ✅ 记忆可同步（Hooks）

---

## 更多文档

- `project-paradigm.md` - 详细的开发范式说明
- `thinkinglens-silent.md` - 无感知追踪原理
- `.claude/thinking-routes/QUICKREF.md` - 对话查找速查

---

**记住**：目标不是让 AI 帮你写代码，而是让 AI 成为你思维的延伸。

"Take the tower early. Do not let it take you."
