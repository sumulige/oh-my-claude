# Manus 风格项目启动 (Manus Kickoff)

> AI 2.0 开发范式 - 项目启动时完整规划，AI 自主执行

**版本**: 1.0.0
**作者**: sumulige
**标签**: [workflow, planning, manuscript]
**难度**: 中级

---

## 概述

基于 Manus 风格的 AI 2.0 开发范式，在项目启动时进行完整规划，然后让 AI 自主执行。强调"AI 负责编写和维护，人负责最终确认"。

## 适用场景

- 新项目启动
- 重大项目功能开发
- 需要完整规划的技术任务
- 多人协作的项目初始化

## 触发关键词

```
project kickoff, manus style, project planning, 启动项目, 项目规划
```

## 使用方法

### 方式一：使用 CLI 命令

```bash
oh-my-claude kickoff
```

### 方式二：在 Claude Code 中

```
帮我用 Manus 风格启动项目规划
```

## 启动流程

```
┌─────────────────────────────────────────────────────────────┐
│                  AI Project Kickoff Workflow               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 运行 oh-my-claude kickoff                              │
│     ↓                                                       │
│  2. AI 生成任务计划 (TASK_PLAN.md)                         │
│     ├── 任务分解 (WBS)                                      │
│     ├── 依赖关系                                           │
│     ├── Agent 分配                                         │
│     └── 检查点设置                                         │
│     ↓                                                       │
│  3. AI 生成项目计划书 (PROJECT_PROPOSAL.md)                │
│     ├── 技术架构                                           │
│     ├── 功能需求                                           │
│     ├── 开发迭代                                           │
│     └── 风险评估                                           │
│     ↓                                                       │
│  4. Human 确认                                             │
│     ↓                                                       │
│  5. AI 自主执行 (带检查点)                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 生成的文件

| 文件 | 说明 |
|------|------|
| `PROJECT_KICKOFF.md` | 项目启动清单，定义目标和约束 |
| `TASK_PLAN.md` | 任务执行计划，包含 WBS 和状态追踪 |
| `PROJECT_PROPOSAL.md` | 完整项目计划书，技术架构和里程碑 |

## AI/Human 责任划分

| AI 负责 | Human 确认 |
|---------|-----------|
| 代码编写与重构 | ✅ 架构设计变更 |
| 测试编写与执行 | ✅ 数据模型变更 |
| 文档更新 | ✅ 新增外部依赖 |
| 技术方案选择 | ✅ 安全与隐私 |
| 问题诊断与修复 | ✅ 用户体验重大变更 |
| | ✅ 成本与资源 |

## 核心理念

```
传统模式                    Manus 模式
─────────────────────────────────────────
问什么做什么    VS    先规划再执行
每次重新理解    VS    持久化上下文
人工管理任务    VS    AI 自主管理
被动响应需求    VS    主动规划里程碑
```

## 输出格式

- PROJECT_KICKOFF.md：项目启动文档
- TASK_PLAN.md：详细任务计划
- PROJECT_PROPOSAL.md：项目提案

## 注意事项

- 启动前确保项目已初始化 (`oh-my-claude template`)
- 准备回答 AI 关于项目的问题
- 规划完成后务必仔细审查
- 确认后切换到 auto-accept 模式让 AI 自主执行

## 相关技能

- [planning-with-files](../planning-with-files/) - 文件规划工作流
- [complex-task](../complex-task/) - 复杂任务处理

## 模板文件

- [PROJECT_KICKOFF.md](./templates/PROJECT_KICKOFF.md) - 启动清单模板
- [TASK_PLAN.md](./templates/TASK_PLAN.md) - 任务计划模板
- [PROJECT_PROPOSAL.md](./templates/PROJECT_PROPOSAL.md) - 项目提案模板

## 更新日志

### 1.0.0 (2026-01-11)
- 初始版本，提取自 oh-my-claude 内置功能
