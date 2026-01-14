# 项目增量记忆

> 记录最近变更和重要决策

---

## 2026-01-14

### 新增
- **SMC 对话历史系统** - 从 template 同步完整系统
  - `.claude/hooks/` - 10 个自动化脚本
    - `code-formatter.cjs` - 代码格式化
    - `multi-session.cjs` - 多会话管理
    - `tl-summary.sh` - 对话摘要 ⭐
    - `sync-to-log.sh` - 同步到日志
    - `todo-manager.cjs` - 任务管理
    - `thinking-silent.cjs` - 静默思考
    - `session-end.sh` - 会话结束处理
    - `project-kickoff.cjs` - 项目启动
    - `rag-skill-loader.cjs` - RAG 技能加载
    - `verify-work.cjs` - 工作验证
  - `.claude/thinking-routes/` - 对话流数据目录
  - `.claude/commands/` - 9 个技能命令定义

### 创建
- `.claude/MEMORY.md` - 本文件，增量变更记录
- `.claude/PROJECT_LOG.md` - 完整项目日志
- `.claude/ANCHORS.md` - 快速索引
- `.claude/thinking-routes/.conversation-flow.json` - 对话流数据结构

### 可用命令
- `tl` - 查看今日对话摘要
- `log` - 查看完整项目日志
- `memory` - 查看最近变更
