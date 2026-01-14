---
description: Create a git commit with proper message format
---

Create a git commit following best practices.

## Step 1: Assess Current State

Run these commands in parallel:

```bash
git status
git diff
git log -5 --oneline
```

## Step 2: Stage Changes

1. Review what files are changed
2. Ask user if all changes should be committed, or if some should be staged separately
3. Never commit these patterns:
   - `.env`, `.env.local`, credentials
   - `node_modules/`, `dist/`, `build/`
   - `.DS_Store`, `*.log`
   - Any API keys, tokens, or secrets

## Step 3: Write Commit Message

Follow this format based on change type:

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style changes (formatting) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Build process, tooling |

Commit message template:

```
<type>: <brief description (50 chars max)>

<detailed explanation if needed>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## Step 4: Create Commit

Use git commit with the message, then run `git status` to confirm.
