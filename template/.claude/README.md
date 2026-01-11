# Claude Code 使用指南

> 本文档说明如何在项目中使用 Claude Code

@version: 1.0.0

## 快速开始

### 1. 启动 Claude Code

在项目根目录打开终端：

```bash
cd /path/to/your/project
claude
```

### 2. 首次使用 - Plan 模式

**重要**: 大多数会话应该从 Plan 模式开始（按 `Shift+Tab` 两次）

Plan 模式的优势：
- Claude 先规划再执行
- 你可以审查计划后再开始
- 减少返工，提高效率

```
你: 按 Shift+Tab 两次进入 Plan 模式
Claude: 我来先分析项目结构，然后制定计划...
[分析项目后]
Claude: 这是我的计划...
你: [审查计划，确认无误后]
Claude: 开始执行...
```

### 3. 常用 Slash Commands

在 Claude Code 中直接输入：

| 命令 | 用途 | 示例场景 |
|------|------|----------|
| `/commit-push-pr` | 提交代码并创建 PR | 完成一个功能后 |
| `/commit` | 创建 commit | 代码写完后 |
| `/pr` | 创建/更新 PR | 需要 code review 时 |
| `/test` | 运行测试 | 修改代码后验证 |
| `/review` | 审查当前更改 | 提交前自查 |
| `/verify-work` | 查看待验证任务 | 检查是否有遗漏 |
| `/sessions` | 查看并行会话 | 多终端协作时 |

### 4. 典型工作流程

```
1. Plan 模式开始 (Shift+Tab 两次)
   ↓
2. Claude 分析项目，制定计划
   ↓
3. 你审查并确认计划
   ↓
4. Claude 执行任务
   ↓
5. /review 审查更改
   ↓
6. /test 运行测试
   ↓
7. /commit 创建提交
   ↓
8. /commit-push-pr 推送并创建 PR
```

## 进阶技巧

### 并行多会话工作

根据 Boris Cherny (Claude Code 创造者) 的经验：

```bash
# 终端标签 1: Conductor - 任务规划
# 终端标签 2: Architect - 架构设计
# 终端标签 3: Builder - 代码实现
# 终端标签 4: Reviewer - 代码审查
# 终端标签 5: Explorer - 代码探索

# 同时使用 claude.ai/code Web 版
# 可以用 & 符号将会话传递到 Web
```

### 验证反馈循环

**重要**: 给 Claude 验证工作的方法，质量能提升 2-3 倍

```
你: 实现一个登录功能
Claude: [实现代码]
你: 运行测试验证一下
Claude: [测试失败，修复 bug]
Claude: [再次测试，通过]
你: 好，提交吧
```

### 自动化功能

本项目已配置以下自动化：

- **代码格式化**: 代码编辑后自动格式化
- **验证提醒**: commit/push 后自动提醒验证
- **会话追踪**: 自动记录对话历史

## 项目文件说明

| 文件/目录 | 说明 |
|-----------|------|
| `CLAUDE.md` | Claude 首先阅读的项目说明 |
| `MEMORY.md` | AI 的增量记忆，自动更新 |
| `PROJECT_LOG.md` | 完整的开发历史 |
| `settings.json` | Claude Code 配置 |
| `hooks/` | 自动化脚本 |
| `commands/` | Slash 命令定义 |
| `templates/` | 项目计划模板 |

## 常见问题

### Q: Claude 做错了怎么办？

将错误做法添加到 `CLAUDE.md`，Claude 会记住不再犯。

### Q: 如何查看对话历史？

查看 `.claude/thinking-routes/` 目录或 `PROJECT_LOG.md`。

### Q: 如何让多个项目共享配置？

将常用配置放入 `CLAUDE.md`，用 `oh-my-claude sync` 同步。

### Q: 权限提示太多怎么办？

使用 `/permissions` 预先允许常用命令，或编辑 `settings.local.json`。

## 获取帮助

- 查看项目根 README: `cat README.md`
- 查看优化指南: `cat .claude/boris-optimizations.md`
- 查看命令帮助: 在 Claude Code 中输入 `/help`
