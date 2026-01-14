---
description: Create a new skill with template
---

Create a new skill using the standard template.

## Step 1: Get Skill Information

Ask the user for:
1. **Skill name** (kebab-case, e.g., `code-reviewer`)
2. **Description** (one-line summary)
3. **Category** (development, design, analysis, workflow, etc.)
4. **Difficulty** (beginner, intermediate, advanced)

## Step 2: Create Skill Directory

Create the skill directory structure:

```bash
mkdir -p .claude/skills/{skill-name}/{templates,examples}
```

## Step 3: Generate SKILL.md

Use this template:

```markdown
# {Skill Name}

> {Description}

**版本**: 1.0.0
**作者**: AI
**标签**: [{category}]
**难度**: {difficulty}

---

## 概述

{Detailed description of what this skill does}

## 适用场景

- {Scenario 1}
- {Scenario 2}
- {Scenario 3}

## 触发关键词

```
{trigger keywords}
```

## 使用方法

### 基础用法

{Example usage}

## 输出格式

{Output format description}

## 注意事项

- {Note 1}
- {Note 2}

## 相关技能

- [Related Skill](../related-skill/)

## 更新日志

### 1.0.0 ({current-date})
- 初始版本
```

## Step 4: Generate metadata.yaml

```yaml
name: {skill-name}
version: 1.0.0
author: AI
description: {description}

tags:
  - {category}

triggers:
  - {trigger1}
  - {trigger2}

dependencies: []
difficulty: {difficulty}
```

## Step 5: Add to RAG Index

Update `.claude/rag/skill-index.json`:

```json
{
  "skills": [
    {
      "name": "{skill-name}",
      "description": "{description}",
      "keywords": ["{trigger1}", "{trigger2}"],
      "path": ".claude/skills/{skill-name}/SKILL.md"
    }
  ]
}
```

## Step 6: Verify

Confirm with user:
- Skill created at `.claude/skills/{skill-name}/`
- Added to RAG index
- Ready to use

## Example

User: "Create a skill called api-tester for testing REST APIs"

→ Create `.claude/skills/api-tester/` with:
- SKILL.md (filled with API testing content)
- metadata.yaml
- templates/request.md
- examples/basic-test.md
