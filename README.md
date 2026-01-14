# Sumulige Claude

**The Ultimate Agent Harness for Claude Code**
**Claude Code 的终极 Agent 编排框架**

[![npm version](https://badge.fury.io/js/sumulige-claude.svg)](https://www.npmjs.com/package/sumulige-claude)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-78%20passing-brightgreen)](./tests)

---

## About / 关于

**English** | Sumulige Claude is a CLI tool designed for Claude Code, providing multi-agent orchestration, skill marketplace, and project template management for AI-assisted development.

**中文** | Sumulige Claude 是专为 Claude Code 设计的 CLI 工具，提供多 Agent 编排、技能市场和项目模板管理，让 AI 辅助开发更智能、更高效。

---

## Table of Contents / 目录

1. [Features / 核心功能](#features--核心功能)
2. [Quick Start / 快速开始](#quick-start--快速开始)
3. [Commands Reference / 命令参考](#commands-reference--命令参考)
4. [Configuration / 配置](#configuration--配置)
5. [Documentation / 文档](#documentation--文档)
6. [Changelog / 更新日志](#changelog--更新日志)
7. [License / 许可证](#license--许可证)

---

## Features / 核心功能

### Multi-Agent System / 多 Agent 系统

**English** | Coordinate 5 specialized AI agents, each with specific roles:

**中文** | 协调 5 个专业 AI Agent，各司其职：

| Agent | Role / 职责 |
|-------|-------------|
| **Conductor** | Task coordination and decomposition / 任务分解与协调 |
| **Architect** | Architecture design and decisions / 架构设计与决策 |
| **Builder** | Code implementation and testing / 代码实现与测试 |
| **Reviewer** | Code review and quality check / 代码审查与质量检查 |
| **Librarian** | Documentation and knowledge / 文档与知识管理 |

---

### Skill Marketplace / 技能市场 🆕

**English** | Discover, install, and sync skills from external repositories. Features automatic daily sync via GitHub Actions.

**中文** | 从外部仓库发现、安装和同步技能。支持 GitHub Actions 每日自动同步。

```bash
# List available skills / 列出可用技能
smc marketplace:list

# Install a skill / 安装技能
smc marketplace:install dev-browser

# Sync external skills / 同步外部技能
smc marketplace:sync
```

**Skill Categories / 技能分类:**

| Category | Description / 说明 |
|----------|-------------------|
| 🔧 **tools** | CLI tools and utilities / CLI 工具和实用程序 |
| 💻 **development** | Language-specific dev assistance / 语言特定开发辅助 |
| ⚡ **productivity** | Workflow automation / 工作流自动化 |
| 🤖 **automation** | Browser, CI/CD, system automation / 浏览器、CI/CD、系统自动化 |
| 📊 **data** | Database, data processing / 数据库、数据处理 |
| 📚 **documentation** | Docs, diagrams, specs / 文档、图表、规范 |
| 🎼 **workflow** | Multi-agent orchestration / 多代理编排 |

---

### Project Template / 项目模板

**English** | One-click deployment of a fully configured Claude Code project with:

**中文** | 一键部署完整配置的 Claude Code 项目，包含：

- **ThinkingLens** - Autonomous memory system / AI 自治记忆系统
- **RAG System** - Dynamic skill discovery / 动态技能发现
- **Slash Commands** - 7 pre-configured commands / 7 个预配置命令
- **Hooks** - Automation for code formatting, TODO management / 代码格式化、任务管理自动化
- **TODO System** - GTD-style task tracking / GTD 风格任务追踪

---

### Manus Workflow / Manus 工作流

**English** | AI 2.0 development paradigm emphasizing comprehensive project planning before execution.

**中文** | AI 2.0 开发范式，强调执行前的完整项目规划。

```bash
# Start project planning / 启动项目规划
smc kickoff
```

Generated files / 生成文件:
- `PROJECT_KICKOFF.md` - Project goals and constraints / 项目目标和约束
- `TASK_PLAN.md` - Task execution plan with WBS / 任务执行计划
- `PROJECT_PROPOSAL.md` - Complete project proposal / 完整项目计划书

---

## Quick Start / 快速开始

### Installation / 安装

```bash
npm install -g sumulige-claude
```

### Initialize / 初始化

```bash
smc init
```

### Deploy Template / 部署模板

```bash
# Create a new project / 创建新项目
mkdir my-project && cd my-project
smc template

# Or specify a path / 或指定路径
smc template /path/to/project
```

### Start Planning / 开始规划

```bash
smc kickoff
```

---

## Commands Reference / 命令参考

### Basic Commands / 基础命令

| Command | Description / 说明 |
|---------|-------------------|
| `smc init` | Initialize configuration / 初始化配置 |
| `smc status` | Show configuration status / 显示配置状态 |
| `smc sync` | Sync to current project / 同步到当前项目 |

### Project Template / 项目模板

| Command | Description / 说明 |
|---------|-------------------|
| `smc template [path]` | Deploy project template / 部署项目模板 |
| `smc kickoff` | Start project planning (Manus-style) / 启动项目规划 |

### Skill Management / 技能管理

| Command | Description / 说明 |
|---------|-------------------|
| `smc skill:list` | List installed skills / 列出已安装技能 |
| `smc skill:create <name>` | Create a new skill / 创建新技能 |
| `smc skill:check [name]` | Check skill dependencies / 检查技能依赖 |
| `smc skill:install <source>` | Install a skill / 安装技能 |

### Marketplace Commands / 市场命令 🆕

| Command | Description / 说明 |
|---------|-------------------|
| `smc marketplace:list` | List all available skills / 列出所有可用技能 |
| `smc marketplace:install <name>` | Install a skill from marketplace / 从市场安装技能 |
| `smc marketplace:sync` | Sync external skills / 同步外部技能 |
| `smc marketplace:add <repo>` | Add external skill source / 添加外部技能源 |
| `smc marketplace:remove <name>` | Remove skill from sources / 从源中移除技能 |
| `smc marketplace:status` | Show marketplace status / 显示市场状态 |

### Agent Orchestration / Agent 编排

| Command | Description / 说明 |
|---------|-------------------|
| `smc agent <task>` | Run agent orchestration / 运行 Agent 编排 |

---

## Configuration / 配置

### Config Location / 配置位置

**macOS/Linux**: `~/.claude/config.json`

### Example / 示例

```json
{
  "version": "1.0.7",
  "model": "claude-opus-4.5",
  "agents": {
    "conductor": {
      "role": "Task coordination and decomposition"
    },
    "architect": {
      "role": "Architecture design and decisions"
    },
    "builder": {
      "role": "Code implementation and testing"
    },
    "reviewer": {
      "role": "Code review and quality check"
    },
    "librarian": {
      "role": "Documentation and knowledge"
    }
  },
  "skills": [
    "anthropics/skills",
    "numman-ali/n-skills"
  ],
  "thinkingLens": {
    "enabled": true,
    "autoSync": true,
    "syncInterval": 20
  }
}
```

---

## Testing / 测试

```bash
# Run tests / 运行测试
npm test

# Run with coverage / 运行测试并生成覆盖率报告
npm run test:coverage
```

**Coverage / 覆盖率**:
- utils.js: 100%
- migrations.js: 86.66%
- config.js: 86.2%
- Overall: 36.58%

See **[tests/README.md](tests/README.md)** for detailed test documentation.

---

## Documentation / 文档

- **[Development Guide / 开发指南](docs/DEVELOPMENT.md)** - Architecture, adding skills, sync mechanism / 架构、添加技能、同步机制
- **[Marketplace Guide / 市场指南](docs/MARKETPLACE.md)** - User guide for marketplace features / 市场功能用户指南
- **[Tests Documentation / 测试文档](tests/README.md)** - Test coverage and strategy / 测试覆盖率和策略

---

## Changelog / 更新日志

### v1.0.7 (2025-01-14)

**English** | Added Skill Marketplace system with auto-sync from external repositories.

**中文** | 新增技能市场系统，支持从外部仓库自动同步。

- **Marketplace System / 市场系统**
  - `.claude-plugin/marketplace.json` - Claude Code native plugin registry / 原生插件注册表
  - `sources.yaml` - External skills configuration / 外部技能配置
  - 6 new marketplace commands / 6 个新市场命令
- **Auto-Sync / 自动同步**
  - `scripts/sync-external.mjs` - Sync engine / 同步引擎
  - `scripts/update-registry.mjs` - Registry generator / 注册表生成器
  - GitHub Actions daily sync / GitHub Actions 每日同步
- **Documentation / 文档**
  - `docs/DEVELOPMENT.md` - Development guide / 开发指南
  - `docs/MARKETPLACE.md` - Marketplace user guide / 市场用户指南

### v1.0.6 (2026-01-14)

**English** | Code refactoring - modularized cli.js from 862 lines.

**中文** | 代码重构 - cli.js 从 862 行模块化拆分。

- `lib/commands.js` - Command implementations / 命令实现
- `lib/config.js` - Configuration management / 配置管理
- `lib/utils.js` - Common utilities / 公共工具函数
- Data-driven command dispatch / 数据驱动的命令分发

### v1.0.0 (2026-01-11)

**English** | Initial release with 5 agents, project template, and RAG system.

**中文** | 初始版本，包含 5 个 Agent、项目模板和 RAG 系统。

---

## License / 许可证

MIT © [sumulige](https://github.com/sumulige)

---

## Acknowledgments / 致谢

Inspired by [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) and [n-skills](https://github.com/numman-ali/n-skills).

---

**Happy Coding with AI! / 祝编码愉快! 🚀**
