# Oh My Claude

> **Claude Code 的终极 Agent 编排框架**

Oh My Claude 是一个专为 Claude Code 设计的配置管理和多 Agent 协作框架，让 AI 辅助开发更智能、更高效。

---

## 目录

1. [什么是 Oh My Claude？](#什么是-oh-my-claude)
2. [为什么使用它？](#为什么使用它)
3. [快速开始](#快速开始)
4. [详细使用指南](#详细使用指南)
5. [项目模板功能](#项目模板功能)
6. [常见问题](#常见问题)
7. [命令参考](#命令参考)

---

## 什么是 Oh My Claude？

Oh My Claude 是一个 **CLI 工具**（命令行工具），它帮你：

- **管理多个 AI Agent**：让不同的 Claude 模型各司其职
- **统一技能库**：安装和管理 Claude Skills
- **部署项目模板**：一键创建配置好的 Claude Code 项目
- **追踪对话历史**：ThinkingLens 系统自动记录 AI 思考过程

### 简单来说

想象你在管理一个开发团队：
- **Conductor**：项目经理，分配任务
- **Architect**：架构师，设计技术方案
- **Builder**：工程师，写代码
- **Reviewer**：代码审查员，检查质量
- **Librarian**：文档员，整理知识

Oh My Claude 让你拥有这样一个 AI 团队！

---

## 为什么使用它？

### 没有 Oh My Claude 时

```
你: 帮我写一个用户登录功能
Claude: [开始写代码...]
     [可能忘了某些最佳实践]
     [可能没有考虑到安全]
     [代码风格不统一]
```

### 有 Oh My Claude 时

```
你: 帮我写一个用户登录功能
Conductor: 我来分解任务...
Architect: 我来设计架构...
Builder: 我来写代码...
Reviewer: 我来检查质量...
结果: 代码更规范、更安全、更易维护
```

---

## 快速开始

### 第一步：安装 Node.js

如果你已经安装了 Node.js，跳过这步。

检查是否已安装：
```bash
node --version
```

如果没安装，访问 [nodejs.org](https://nodejs.org/) 下载安装。

### 第二步：安装 Oh My Claude

```bash
npm install -g oh-my-claude
```

### 第三步：初始化配置

```bash
oh-my-claude init
```

这会创建 `~/.claude/config.json` 配置文件。

### 第四步：验证安装

```bash
oh-my-claude status
```

你应该看到类似输出：

```
📊 Oh My Claude Status

Config: /Users/你的用户名/.claude/config.json

  Agents + Skills + Hooks + MCP
  ├── Conductor → 任务分解
  ├── Architect → 架构设计
  ├── Builder   → 代码实现
  ├── Reviewer  → 质量检查
  └── Librarian → 文档整理

Agents:
  conductor    claude-opus-4.5      (Task coordination and decomposition)
  architect    claude-opus-4.5      (Architecture design and decisions)
  builder      claude-opus-4.5      (Code implementation and testing)
  reviewer     claude-opus-4.5      (Code review and quality check)
  librarian    claude-opus-4.5      (Documentation and knowledge)

Skills: anthropics/skills, numman-ali/n-skills

ThinkingLens: ✅ Enabled
```

恭喜！安装成功了！

---

## 详细使用指南

### 1. 创建新项目

Oh My Claude 内置了一个完整的项目模板，包含：

- AI 自治记忆系统（ThinkingLens）
- RAG 动态技能索引
- 20+ 预配置技能
- 完整的 Hook 系统

**在当前目录创建项目：**

```bash
cd /path/to/your/project
oh-my-claude template
```

**指定目录创建项目：**

```bash
oh-my-claude template /path/to/project
```

创建后，项目结构如下：

```
your-project/
├── .claude/
│   ├── CLAUDE.md           # 项目说明（AI 首先读取）
│   ├── MEMORY.md           # 增量记忆
│   ├── PROJECT_LOG.md      # 构建历史
│   ├── ANCHORS.md          # 技能锚点索引
│   ├── settings.json       # Claude Code 设置
│   ├── hooks/              # 自动化脚本
│   ├── skills/             # 项目技能
│   ├── rag/                # RAG 技能索引
│   └── thinking-routes/    # 思维轨迹
└── prompts/                # 教学资源
    ├── project-paradigm.md # 项目开发范式
    └── how-to-find.md      # 对话查找指南
```

### 2. 同步到现有项目

如果你已经有一个项目，想加入 Oh My Claude：

```bash
cd /path/to/your/project
oh-my-claude sync
```

这会创建 `.claude/AGENTS.md` 文件，Claude Code 会自动识别。

### 3. 在 Claude Code 中使用

打开 Claude Code，在你的项目中：

**方式一：直接请求**

```
帮我用 frontend-design 技能创建一个登录页面
```

**方式二：指定 Agent**

```
让 Builder Agent 实现一个 REST API
```

**方式三：读取技能内容**

```
用 openskills read frontend-design
```

### 4. 安装新技能

```bash
# 查看已安装的技能
oh-my-claude skill:list

# 安装新技能
oh-my-claude skill:install anthropics/skills

# 同步到项目
oh-my-claude sync
```

### 5. 自定义配置

编辑配置文件：

```bash
# macOS/Linux
nano ~/.claude/config.json
```

配置示例：

```json
{
  "version": "1.0.0",
  "agents": {
    "conductor": {
      "model": "claude-opus-4.5",
      "role": "项目总协调，负责任务分解"
    },
    "builder": {
      "model": "claude-opus-4.5",
      "role": "代码实现和单元测试"
    }
  },
  "skills": [
    "anthropics/skills",
    "numman-ali/n-skills",
    "your-custom-skills"
  ],
  "thinkingLens": {
    "enabled": true,
    "autoSync": true,
    "syncInterval": 20
  }
}
```

修改后运行 `oh-my-claude sync` 更新项目。

---

## 项目模板功能

### 内置技能索引

模板包含 20+ 预配置技能，支持 RAG 动态发现：

| 技能 | 关键词 | 用途 |
|------|--------|------|
| frontend-design | frontend, ui, react | 前端界面设计 |
| docx | document, word | Word 文档处理 |
| pdf | pdf, form | PDF 操作 |
| pptx | slide, powerpoint | PPT 制作 |
| xlsx | excel, spreadsheet | 表格处理 |
| mcp-builder | api, mcp, server | MCP 服务器构建 |
| webapp-testing | test, playwright | Web 应用测试 |
| orchestration | agent, multi-agent | 多 Agent 编排 |

### RAG 自动技能发现

当你在 Claude Code 中工作时，RAG 系统会自动：

1. 分析你的任务内容
2. 匹配相关技能
3. 提示你使用合适的技能

无需手动查找，自动感知需求！

### ThinkingLens 对话追踪

自动记录每次对话的关键信息：

- **MEMORY.md**：增量记忆，记录最新变更
- **PROJECT_LOG.md**：完整构建历史和决策
- **thinking-routes/**：思维轨迹系统

---

## 常见问题

### Q1: 安装后命令找不到？

**原因**：npm 全局安装路径可能不在 PATH 中。

**解决**：

```bash
# 查找 npm 全局路径
npm config get prefix

# 添加到 PATH（macOS/Linux）
echo 'export PATH="$PATH:$(npm config get prefix)/bin"' >> ~/.zshrc
source ~/.zshrc
```

### Q2: 权限错误？

**原因**：npm 全局安装需要权限。

**解决**：

```bash
# 使用 sudo
sudo npm install -g oh-my-claude

# 或者配置 npm 使用用户目录
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### Q3: template 命令失败？

**原因**：目标目录可能没有写权限。

**解决**：

```bash
# 检查目录权限
ls -la /path/to/project

# 修改权限
chmod +w /path/to/project
```

### Q4: OpenSkills 相关命令失败？

**原因**：OpenSkills 没有安装。

**解决**：

```bash
npm install -g openskills
```

### Q5: 如何重置配置？

```bash
# 删除配置目录
rm -rf ~/.claude

# 重新初始化
oh-my-claude init
```

### Q6: Agent 可以用不同的模型吗？

可以！编辑 `~/.claude/config.json`：

```json
{
  "agents": {
    "conductor": { "model": "claude-opus-4.5" },
    "builder": { "model": "claude-sonnet-4.5" },
    "reviewer": { "model": "claude-haiku-4.5" }
  }
}
```

可用的模型：
- `claude-opus-4.5` - 最强大
- `claude-sonnet-4.5` - 平衡性能
- `claude-haiku-4.5` - 最快速

---

## 命令参考

### 基础命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `init` | 初始化配置 | `oh-my-claude init` |
| `status` | 查看状态 | `oh-my-claude status` |
| `sync` | 同步到项目 | `oh-my-claude sync` |

### 项目模板

| 命令 | 说明 | 示例 |
|------|------|------|
| `template [path]` | 部署项目模板 | `oh-my-claude template` |
| `template <path>` | 指定目录部署 | `oh-my-claude template ~/my-project` |

### 技能管理

| 命令 | 说明 | 示例 |
|------|------|------|
| `skill:list` | 列出技能 | `oh-my-claude skill:list` |
| `skill:install <source>` | 安装技能 | `oh-my-claude skill:install anthropics/skills` |

### Agent 编排

| 命令 | 说明 | 示例 |
|------|------|------|
| `agent <task>` | 启动编排 | `oh-my-claude agent "Build a REST API"` |

---

## Agent 团队介绍

### Conductor（指挥家）

- **模型**: Claude Opus 4.5
- **职责**: 任务分解和协调
- **何时工作**: 复杂任务需要拆分时

### Architect（架构师）

- **模型**: Claude Opus 4.5
- **职责**: 架构设计和技术决策
- **何时工作**: 设计系统架构时

### Builder（建造者）

- **模型**: Claude Opus 4.5
- **职责**: 代码实现和测试
- **何时工作**: 编写具体代码时

### Reviewer（审查员）

- **模型**: Claude Opus 4.5
- **职责**: 代码审查和质量检查
- **何时工作**: 检查代码质量时

### Librarian（图书管理员）

- **模型**: Claude Opus 4.5
- **职责**: 文档编写和知识整理
- **何时工作**: 编写或更新文档时

---

## 配置文件详解

### 默认配置位置

**macOS/Linux**: `~/.claude/config.json`

### 完整配置示例

```json
{
  "version": "1.0.0",

  "agents": {
    "conductor": {
      "model": "claude-opus-4.5",
      "role": "Task coordination and decomposition"
    },
    "architect": {
      "model": "claude-opus-4.5",
      "role": "Architecture design and decisions"
    },
    "builder": {
      "model": "claude-opus-4.5",
      "role": "Code implementation and testing"
    },
    "reviewer": {
      "model": "claude-opus-4.5",
      "role": "Code review and quality check"
    },
    "librarian": {
      "model": "claude-opus-4.5",
      "role": "Documentation and knowledge"
    }
  },

  "skills": [
    "anthropics/skills",
    "numman-ali/n-skills"
  ],

  "hooks": {
    "preTask": [],
    "postTask": []
  },

  "thinkingLens": {
    "enabled": true,
    "autoSync": true,
    "syncInterval": 20
  }
}
```

---

## 进阶使用

### 创建自定义技能

1. 在项目中创建 `.claude/skills/my-skill.md`
2. 编写技能内容
3. 在 `CLAUDE.md` 中引用

### 使用 Hooks

Hooks 是在特定事件触发的脚本：

- `UserPromptSubmit` - 用户提交请求时
- `PreToolUse` - 工具调用前
- `PostToolUse` - 工具调用后

在 `.claude/settings.json` 中配置：

```json
{
  "matcher": "UserPromptSubmit|PreToolUse|PostToolUse",
  "hooks": [
    {
      "command": ".claude/hooks/my-script.js",
      "timeout": 5
    }
  ]
}
```

---

## 更新日志

### v1.0.0 (2026-01-11)

- 初始版本发布
- 5 个 Agent 全部使用 Opus 4.5
- 内置项目模板
- RAG 动态技能发现
- ThinkingLens 对话追踪

---

## License

MIT

---

## 致谢

灵感来自 [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)

---

## 获取帮助

- 遇到问题？查看 [常见问题](#常见问题)
- 需要更多信息？运行 `oh-my-claude status`
- 查看完整命令：运行 `oh-my-claude` 不带参数

---

**Happy Coding with Oh My Claude! 🚀**
