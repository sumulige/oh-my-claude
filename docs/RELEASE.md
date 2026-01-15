# Release Guide

Automated version release with `standard-version`.

## How It Works

`standard-version` analyzes your git commits to generate CHANGELOG entries and bump the version automatically.

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <description>

[optional body]
```

### Types

| Type | Section | Example |
|------|---------|---------|
| `feat` | Added | `feat: add user authentication` |
| `fix` | Fixed | `fix: resolve migration bug` |
| `docs` | Changed | `docs: update README installation steps` |
| `refactor` | Changed | `refactor: simplify config loading` |
| `perf` | Changed | `perf: optimize startup time` |
| `test` | Changed | `test: add unit tests for marketplace` |
| `chore` | Changed | `chore: update dependencies` |
| `style` | (hidden) | `style: format code` |

## Usage

### 1. Development

Make commits following the convention:

```bash
git commit -m "feat: add new command"
git commit -m "fix: resolve migration issue"
git commit -m "docs: update API documentation"
```

### 2. Release

Run the release command:

```bash
# Auto-detect version bump (patch/minor/major)
npm run release

# Or specify the version type
npm run release:patch   # 1.0.11 → 1.0.12
npm run release:minor   # 1.0.11 → 1.1.0
npm run release:major   # 1.0.11 → 2.0.0
```

This will:
1. Analyze commits since last tag
2. Generate CHANGELOG entry
3. Bump version in package.json
4. Create a git commit

### 3. Tag & Push

```bash
# Create and push tag (skipped by standard-version)
git tag v$(node -p "require('./package.json').version")
git push --follow-tags origin main

# Optional: publish to npm
npm publish
```

## Configuration

See `.versionrc` for customization.

## Example Workflow

```bash
# 1. Make some changes
git commit -m "feat: add dark mode support"
git commit -m "fix: resolve layout issue"

# 2. Release
npm run release

# 3. Review and push
git log -1                    # Review the release commit
git tag v1.0.12               # Create tag
git push --follow-tags origin main
```
