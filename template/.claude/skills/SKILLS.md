# 技能索引 (Skills Index)

> Oh My Claude 技能库总览

@version: 1.0.0

## 目录

- [内置技能](#内置技能)
- [示例技能](#示例技能)
- [技能模板](#技能模板)
- [创建新技能](#创建新技能)

---

## 内置技能

### 工作流类

| 技能 | 说明 | 难度 |
|------|------|------|
| [manus-kickoff](./manus-kickoff/) | Manus 风格项目启动流程 | 中级 |

### 开发类

*(待补充)*

### 设计类

*(待补充)*

---

## 示例技能

| 技能 | 说明 | 难度 |
|------|------|------|
| [basic-task](./examples/basic-task.md) | 基础任务处理模板 | 初级 |
| [feature-development](./examples/feature-development.md) | 功能开发工作流 | 中级 |
| [bug-fix-workflow](./examples/bug-fix-workflow.md) | Bug 修复流程 | 中级 |

---

## 技能模板

### 标准技能结构

```
skill-name/
├── SKILL.md          # 技能定义（必需）
├── metadata.yaml     # 技能元数据（必需）
├── templates/        # 模板文件（可选）
│   └── default.md
└── examples/         # 示例文件（可选）
    └── basic.md
```

### SKILL.md 模板

参考 [template/SKILL.md](./template/SKILL.md)

### metadata.yaml 模板

```yaml
name: skill-name
version: 1.0.0
author: @username
description: 技能描述

tags:
  - category1
  - category2

triggers:
  - keyword1
  - keyword2

dependencies: []  # 依赖的其他技能

difficulty: beginner  # beginner | intermediate | advanced
```

---

## 创建新技能

### 使用 CLI 命令

```bash
oh-my-claude skill:create my-skill
```

### 手动创建

1. 复制模板：
```bash
cp -r .claude/skills/template .claude/skills/my-skill
```

2. 编辑 SKILL.md

3. 更新 metadata.yaml

4. 更新本索引

---

## 技能依赖管理

### 定义依赖

在 metadata.yaml 中声明：

```yaml
dependencies:
  - manus-kickoff
  - code-review
```

### 依赖解析

当使用技能时，系统会：
1. 检查依赖是否已安装
2. 按顺序加载依赖技能
3. 提示缺失的依赖

### 循环依赖检测

系统会自动检测并警告循环依赖。

---

## RAG 集成

技能会自动注册到 RAG 索引中 (`.claude/rag/skill-index.json`)，实现智能发现。

---

## 更新日志

### 1.0.0 (2026-01-11)
- 初始版本
- 添加 Manus Kickoff 技能
- 添加 3 个示例技能
- 添加技能模板
