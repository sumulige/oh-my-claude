---
description: Review current changes before committing
---

Review the current uncommitted or staged changes.

## Step 1: Show Changes

```bash
git status

# Show unstaged changes
git diff

# Show staged changes
git diff --staged
```

## Step 2: Code Review Checklist

Review the changes for:

### Functionality
- [ ] Does the change accomplish the intended goal?
- [ ] Are there any obvious bugs or logic errors?
- [ ] Are edge cases handled?

### Security
- [ ] No hardcoded credentials or API keys
- [ ] No SQL injection, XSS, or other vulnerabilities
- [ ] Proper input validation

### Code Quality
- [ ] Code is readable and self-documenting
- [ ] No unnecessary complexity
- [ ] Follows DRY (Don't Repeat Yourself)
- [ ] Proper error handling

### Testing
- [ ] Tests cover new functionality
- [ ] No tests are broken
- [ ] Edge cases are tested

### Performance
- [ ] No obvious performance issues
- [ ] No unnecessary database queries or API calls
- [ ] Proper use of caching (if applicable)

## Step 3: Provide Feedback

For each issue found:
1. Point out the specific file and line
2. Explain the issue
3. Suggest a fix

## Step 4: Summary

Provide an overall assessment:
- ✅ Ready to commit
- ⚠️ Minor issues to address
- ❌ Major issues that need fixing
