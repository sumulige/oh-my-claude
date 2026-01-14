---
description: View and manage pending verification tasks
---

You are helping the user review and verify completed work.

## Check Pending Tasks

First, read the verification log:

```bash
cat .claude/verify/verify-log.md 2>/dev/null || echo "No verification log found"
```

And check pending tasks:

```bash
cat .claude/verify/.pending-verify.json 2>/dev/null || echo "No pending tasks"
```

## Verification Process

For each pending task, guide the user through:

1. **What was done** - Summarize the action
2. **How to verify** - Run appropriate verification commands:
   - For code changes: run tests, linters
   - For deployments: check staging environment
   - For commits: verify CI/CD status

## Common Verification Commands

```bash
# Run tests
npm test

# Check test coverage
npm run test:coverage

# Run linter
npm run lint

# Type check
npm run type-check

# Build verification
npm run build

# Check CI status (if using GitHub)
gh run list --limit 5

# Check PR status
gh pr status
```

## Mark as Complete

After verification is successful, ask the user if they want to:
- Mark the task as verified (remove from pending)
- Keep it for later verification
- Add additional verification steps

To mark as complete, edit `.claude/verify/.pending-verify.json` to remove the completed task.
