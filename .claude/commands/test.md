---
description: Run tests and show coverage report
---

Run the test suite and provide comprehensive results.

## Step 1: Detect Test Framework

Check what test framework is being used:

```bash
cat package.json | grep -E '"test"|"jest"|"vitest"|"mocha"|"pytest"'
```

## Step 2: Run Tests

Run the appropriate test command:

```bash
# Node.js / JavaScript
npm test

# Python
pytest

# Rust
cargo test

# Go
go test ./...
```

## Step 3: Show Coverage

If coverage is available, run:

```bash
npm run test:coverage
# or
pytest --cov
```

## Step 4: Analyze Results

Provide a summary:
- Total tests run
- Pass/fail counts
- Coverage percentage
- Any failing tests with details

## Step 5: Fix Failures (if any)

If tests fail, help the user:
1. Identify the root cause
2. Fix the issue
3. Re-run tests to verify
