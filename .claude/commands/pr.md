---
description: Create or update a GitHub pull request
---

Create or update a pull request with proper documentation.

## Step 1: Check Current State

```bash
git status
git log -5 --oneline
git branch --show-current
```

## Step 2: Check for Existing PR

```bash
gh pr list --head $(git branch --show-current)
```

## Step 3: Create PR (if none exists)

### Analyze Changes

```bash
# Get commit history since branch from main/master
git diff $(git merge-base main HEAD)..HEAD --stat

# Get detailed diff
git diff $(git merge-base main HEAD)..HEAD
```

### Create PR with Template

Use `gh pr create` with:

```markdown
## Summary

<!-- 2-3 bullet points describing the main changes -->

## Changes

<!-- Detailed list of changes -->

## Test Plan

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Documentation updated

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

## Step 4: Update PR (if exists)

If PR already exists, ask user if they want to:
- Update description
- Add comments
- Request review
- Merge if ready

## Step 5: Show Result

Display PR URL and check CI status:

```bash
gh pr checks
```
