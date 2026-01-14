---
description: Create git commit, push to remote, and create/merge pull request
---

You are tasked with creating a git commit, pushing to remote, and handling the pull request workflow.

## Step 1: Gather Information

First, run these commands in parallel to understand the current state:

```bash
git status
git diff --staged
git log -3 --oneline
git diff HEAD~3..HEAD --stat
```

## Step 2: Analyze and Plan

Analyze the changes and:
1. Determine what type of change this is (feat, fix, docs, refactor, test, chore)
2. Identify the main purpose of the changes
3. Check if there are any sensitive files that shouldn't be committed

## Step 3: Code Simplification (Before Commit)

**IMPORTANT**: Before creating the commit, simplify and refine the code changes:

1. Review the recently modified code sections
2. Apply code simplification focusing on:
   - Code clarity and consistency
   - Reducing unnecessary complexity and nesting
   - Eliminating redundant code and abstractions
   - Following project standards (if CLAUDE.md exists)
   - Preserving exact functionality
3. Use explicit, readable code over overly compact solutions

**Trigger phrases to apply simplification**:
- "简化此代码" (Simplify this code)
- "使这更清晰" (Make this clearer)
- "优化此实现" (Optimize this implementation)

Ask the user: "是否需要简化代码？(Need code simplification?)" - if yes, apply code-simplifier agent before proceeding.

## Step 4: Stage and Commit

If there are unstaged changes that should be included, ask the user first.

Then create a commit with a clear message following this format:

```
<type>: <brief description>

<optional detailed explanation>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## Step 5: Push and Create PR

1. Push the changes to remote
2. Check if there's an open PR for this branch using:
   ```bash
   gh pr list --head $(git branch --show-current)
   ```
3. If PR exists, ask if user wants to update it
4. If no PR, create one using `gh pr create` with:
   - A clear title based on the commit message
   - A body with:
     - Summary of changes (2-3 bullet points)
     - Test plan (checklist)
     - Link to any related issues

## Step 6: Verify

After creating the PR, show the PR URL and check CI status using:
```bash
gh pr checks
```
