---
description: Manage project todos and tasks
---

Manage project tasks in the development/todos directory.

## Show Task Overview

Display the task overview:

```bash
cat development/todos/INDEX.md
```

## Task Operations

### Create a New Task

When user asks to create a task:
1. Create file in `development/todos/active/`
2. Use kebab-case for filename (e.g., `user-login.md`)
3. Use the template format:

```markdown
# [Task Name]

**状态**: 🚧 进行中
**优先级**: P0/P1/P2/P3
**负责人**: AI/Human
**分支**: `feature/xxx`
**创建时间**: YYYY-MM-DD
**预计完成**: YYYY-MM-DD

## 描述

[Task description]

## 子任务

- [ ] Subtask 1
- [ ] Subtask 2

## 依赖

- [Dependencies]

## 进度

- [x] Planning
- [ ] In progress
- [ ] Testing
- [ ] Review

## 备注

[Notes]
```

### Update Task Status

To move a task:
- **Complete**: Move from `active/` to `completed/`
- **Backlog**: Move from `active/` to `backlog/`
- **Archive**: Move from `completed/` to `archived/`

### Update Task Progress

Edit the task file and update:
- Subtask checkboxes
- Progress checklist
- Add notes

## Refresh Task Index

After any task changes, refresh the index:

```bash
node .claude/hooks/todo-manager.cjs --force
```

## Task Priority Levels

| Priority | Usage |
|----------|-------|
| P0 | Critical - blocks release |
| P1 | High - important for next milestone |
| P2 | Medium - normal feature work |
| P3 | Low - nice to have |

## Examples

User says: "Create a task for implementing user authentication"
→ Create `active/user-authentication.md`

User says: "Mark the login task as complete"
→ Move `active/login.md` to `completed/login.md`

User says: "Show all active tasks"
→ List all files in `development/todos/active/`
