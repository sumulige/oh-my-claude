# Manus Kickoff 示例

> 一个完整的示例，展示如何使用 Manus 风格启动项目

## 示例场景

**项目**: 电商网站用户评论系统

## 启动对话

```
你: oh-my-claude kickoff

AI: 🚀 Project Kickoff - Manus 风格项目启动
    请回答以下问题来生成项目计划：

    1. 项目名称是什么？
    你: 用户评论系统

    2. 这个项目要解决什么问题？
    你: 允许用户对商品进行评论和评分

    3. 核心目标是什么？
    你: 实现评论的 CRUD 操作和评分统计

    4. 有什么技术约束？
    你: 使用 React + Node.js + PostgreSQL

    5. 预期时间框架？
    你: 2 周

AI: [生成 PROJECT_KICKOFF.md]
    [生成 TASK_PLAN.md]
    [生成 PROJECT_PROPOSAL.md]

    ✅ 项目计划已生成！
    请查看以下文件并确认：
    - PROJECT_KICKOFF.md
    - TASK_PLAN.md
    - PROJECT_PROPOSAL.md

你: [审查文件后] 计划看起来不错，开始执行

AI: [开始自主开发...]
```

## 生成文件预览

### PROJECT_KICKOFF.md
```markdown
## 项目概述
- 项目名称: 用户评论系统
- 一句话描述: 允许用户对商品进行评论和评分

## 项目目标
- P0: 实现评论 CRUD
- P1: 实现评分统计
- P2: 实现评论审核
```

### TASK_PLAN.md
```markdown
## 任务分解
- [ ] 数据库设计
- [ ] API 开发
- [ ] 前端界面
- [ ] 测试
```

### PROJECT_PROPOSAL.md
```markdown
## 技术架构
- 前端: React + TypeScript
- 后端: Node.js + Express
- 数据库: PostgreSQL

## 开发计划
- Week 1: 后端 API
- Week 2: 前端界面
```

## 下一步

确认计划后，切换到 auto-accept 模式让 AI 自主执行。
