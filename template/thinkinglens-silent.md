# ThinkingLens 无感知模式

> 完全自动、完全静默的对话追踪
> 最后更新：2026-01-11

---

## 特点

✅ **完全静默** - 对话期间零输出、零打扰
✅ **自动追踪** - 每次 Prompt 自动记录
✅ **智能识别** - 自动识别关键操作
✅ **按需查看** - 想看的时候再看

---

## 工作原理

```
你: "帮我实现数据分析"
    ↓
[Hook 静默执行 - 1ms]
    ↓ (无输出)
AI: "好的，我来实现..."
```

后台自动记录：
- 对话时间
- 操作类型（代码编辑、关键决策等）
- 输入长度
- 上下文信息

---

## 使用方法

### 1. 自动追踪（已启用）

什么都不用做！系统在后台静默运行。

### 2. 查看摘要（按需）

```bash
.claude/hooks/tl-summary.sh
```

输出示例：
```
📅 今日对话摘要
────────────────────────────────────────
会话 ID: s-20260111-evolvemind
开始时间: 2026-01-11 10:30:00
对话轮次: 15

📊 操作统计:
  💬 normal: 10
  📝 code-edit: 4
  ⚡ potential-action: 1

🕐 最近活动:
  15:20 📝 Edit
  15:15 💬 UserPromptSubmit
  15:10 ⚡ 完成数据分析功能
```

---

## 文件位置

```
.claude/
├── hooks/
│   ├── thinking-silent.js    # 无感知追踪 Hook ✅ 当前使用
│   ├── tl-summary.sh         # 查看摘要命令
│   └── ...
└── thinking-routes/
    └── .conversation-flow.json  # 对话流数据
```

---

## 配置

在 `.claude/settings.json` 中：

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [{
          "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/thinking-silent.js",
          "timeout": 1
        }]
      }
    ]
  }
}
```

---

## 数据隐私

- 数据只保存在本地项目
- 不会上传到任何外部服务
- 你可以随时删除 `.conversation-flow.json`

---

## 迁移到新项目

只需复制 2 个文件：

```bash
# 1. 复制 Hook
cp .claude/hooks/thinking-silent.js /新项目/.claude/hooks/

# 2. 更新 settings.json
# 添加 UserPromptSubmit hook 配置
```

---

## 常见问题

**Q: 会影响性能吗？**
A: 不会，每次执行耗时 < 1ms

**Q: 会占用多少空间？**
A: 每次对话约 100-500 字节，可忽略

**Q: 如何清空记录？**
A: 删除 `.claude/thinking-routes/.conversation-flow.json`

**Q: 对话会保存到云端吗？**
A: 不会，只保存在本地
