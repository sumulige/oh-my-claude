# Prompt: Claude Code 项目开发范式

> 通用项目开发范式 - 适用于任何需要 Claude Code 深度集成的项目
> 最后更新：2026-01-11

---

## 核心理念

**Personal Panopticon（个人全景塔）** - 数据主权反转

传统的 legibility 是单向的：平台看见你。Claude Code 让你反转这个方向：你看见自己。

```
┌─────────────────────────────────────────────────────────┐
│              Personal Panopticon 架构                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐│
│  │   数据源    │───→│   AI 观察者  │───→│   行动      ││
│  │             │    │             │    │             ││
│  │ GitHub      │    │   Claude    │    │   代码      ││
│  │ Notion      │    │   Code      │    │   文档      ││
│  │ Email       │    │             │    │   生活      ││
│  └─────────────┘    └─────────────┘    └─────────────┘│
│         │                   │                   │         │
│         └───────────────────┼───────────────────┘         │
│                             ↓                            │
│                    ┌─────────────┐                       │
│                    │ 思维轨迹    │                       │
│                    │ ThinkingLens│                       │
│                    └─────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

---

## 第一阶段：AI 自治记忆系统

### 目录结构

```
.claude/
├── CLAUDE.md              # AI 启动检查清单 + 核心知识
├── ANCHORS.md            # 技能锚点索引（快速定位）
├── MEMORY.md             # 增量记忆日志（变更记录）
├── PROJECT_LOG.md        # 完整项目构建历史
├── settings.json         # Claude Code 配置
├── hooks/                # 自动化钩子
├── skills/               # 领域知识库
├── thinking-routes/      # 思维轨迹系统
└── agents/               # AI Agent 角色定义（可选）
```

### AI 启动流程

```
1. ANCHORS.md      → 快速定位模块
2. PROJECT_LOG.md   → 理解完整历史和决策
3. MEMORY.md        → 查看最新变更
4. CLAUDE.md        → 加载核心知识
5. 具体文件         → 深入实现
```

### 锚点系统

**格式**：`[类型:名称]`

| 类型 | 前缀 | 示例 |
|------|------|------|
| 技能文档 | `skill:` | `[skill:periodization]` |
| Agent 模块 | `agent:` | `[agent:analyzer]` |
| API 客户端 | `client:` | `[client:api]` |
| 数据层 | `db:` | `[db:schema]` |
| API 路由 | `api:` | `[api:router]` |
| 测试文件 | `test:` | `[test:auth]` |
| 系统组件 | `system:` | `[system:memory]` |
| 教学文档 | `doc:` | `[doc:readme]` |

---

## 第二阶段：技能系统（Skills）

### 何时创建 Skill

- 需要反复引用的领域知识
- 包含特定模式、反模式、最佳实践
- 需要文献/资料引用的内容

### Skill 模板

```markdown
---
name: [技能名称]
description: [一句话描述]
see_also: [相关技能]
---

## 概述

[技能的核心概念和原理]

## 关键模式

### 模式1
- **何时使用**: ...
- **如何使用**: ...
- **示例代码**: ...

### 模式2
...

## 反模式

- ❌ 不要这样做，因为...
- ❌ 避免使用...

## 参考资料

- [文献/教程链接]
```

---

## 第三阶段：自动化钩子（Hooks）

### settings.json 配置

```json
{
  "matcher": "Edit|MultiEdit|Write",
  "hooks": [{
    "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/memory-sync.sh",
    "timeout": 5
  }]
}
```

### Hook 示例：记忆同步

```bash
#!/bin/bash
# .claude/hooks/memory-sync.sh

REL_PATH="$1"
EVENT_TYPE="$2"

# 检测新模块
if [[ "$REL_PATH" =~ server/.*\.ts$ ]]; then
  MODULE=$(basename "$REL_PATH" .ts)
  echo "🧠 新模块: [$MODULE] → $REL_PATH"
  echo "   请更新 ANCHORS.md 和 MEMORY.md"
fi
```

---

## 第四阶段：思维轨迹系统（ThinkingLens）

### 设计理念

```
GitLens                    ThinkingLens
────────────────────────────────────────
代码变更                   →  思维轨迹
Commit 历史               →  决策节点
Branch                    →  探索路径
Merge                     →  综合判断
```

### 数据模型

```typescript
interface ThinkingNode {
  id: string;
  sessionId: string;
  timestamp: string;
  parentIds: string[];
  type: "inquiry" | "analysis" | "decision" | "action" | "observation";
  summary: string;
  content?: string;
  tags: string[];
  decision?: {
    question: string;
    alternatives: Array<{ name, pros, cons }>;
    chosen: string;
    rationale: string;
  };
}
```

---

## 第五阶段：代码风格规范

### Linus Torvalds 哲学

1. **消除特殊情况**
   - 通过优雅的数据结构让边界情况自然消失
   - 避免用 if/else 打补丁

2. **极简主义**
   - 函数只做一件事
   - 命名直白、精准

3. **实用主义**
   - 解决真实问题，拒绝过度设计

### 质量指标

- 单文件不超过 800 行
- 单目录不超过 8 个文件
- 零循环依赖
- 零代码重复

---

## 第六阶段：AI 自治开发流程

### 当 AI 接收任务时

1. **加载上下文**: 读取 CLAUDE.md、ANCHORS.md、MEMORY.md
2. **任务分解**: 将任务分解为具体的子任务
3. **实现与测试**: 实现功能并编写测试
4. **文档更新**: 更新 MEMORY.md、ANCHORS.md
5. **记录决策**: 在 thinking-routes/ 中记录关键决策

### 人类确认点

AI 在以下情况必须请求人类确认：
- 架构设计变更
- 数据模型变更
- 新增外部依赖
- 质量标准定义
- 安全与隐私相关变更

---

## 受保护目录

以下目录包含核心基础设施，**严禁删除**：

```
.claude/          # AI 自治记忆系统核心
.claude/thinking-routes/  # 思维轨迹系统
.claude/skills/         # 知识库
prompts/         # Prompt 教学库
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

## 快速开始

### 新项目初始化

```bash
# 1. 创建基础结构
mkdir -p .claude/{skills,hooks,thinking-routes}
mkdir -p prompts

# 2. 复制本文件到 prompts/
cp project-paradigm.md prompts/

# 3. 创建基础配置文件
# - CLAUDE.md（项目核心知识）
# - ANCHORS.md（模块索引）
# - MEMORY.md（增量日志）

# 4. 配置 settings.json
```

### 最小化 CLAUDE.md 模板

```markdown
# [项目名称]

## AI 启动检查清单

1. 加载 ANCHORS.md（快速索引）
2. 加载 MEMORY.md（最新变更）
3. 加载 CLAUDE.md（核心知识）

## 受保护目录

- `prompts/` - Prompt 教学库
- `.claude/` - AI 自治记忆系统

## 核心架构

[简要描述项目架构]

## 开发规范

[代码风格、质量标准等]
```

---

**记住**：目标不是让 AI 帮你写代码，而是让 AI 成为你思维的延伸——在你睡觉时它仍在工作，在你忘记时它还记得，当你困惑时它已理清。

"Take the tower early. Do not let it take you."
