#!/bin/bash
# Claude Code 项目模板初始化脚本
# 用法: ./init.sh /目标项目路径

set -e

TARGET_DIR="${1:-.}"
TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 初始化 Claude Code 项目模板..."
echo "   目标目录: $TARGET_DIR"

# 创建目录结构
echo "📁 创建目录结构..."
mkdir -p "$TARGET_DIR/.claude/hooks"
mkdir -p "$TARGET_DIR/.claude/thinking-routes"
mkdir -p "$TARGET_DIR/.claude/skills"
mkdir -p "$TARGET_DIR/.claude/rag"
mkdir -p "$TARGET_DIR/prompts"

# 复制文件
echo "📋 复制模板文件..."
cp "$TEMPLATE_DIR/.claude/CLAUDE-template.md" "$TARGET_DIR/.claude/CLAUDE.md"
cp "$TEMPLATE_DIR/.claude/settings.json" "$TARGET_DIR/.claude/"
cp "$TEMPLATE_DIR/.claude/hooks/thinking-silent.js" "$TARGET_DIR/.claude/hooks/"
cp "$TEMPLATE_DIR/.claude/hooks/tl-summary.sh" "$TARGET_DIR/.claude/hooks/"
cp "$TEMPLATE_DIR/.claude/hooks/sync-to-log.sh" "$TARGET_DIR/.claude/hooks/"
cp "$TEMPLATE_DIR/.claude/hooks/session-end.sh" "$TARGET_DIR/.claude/hooks/"
cp "$TEMPLATE_DIR/.claude/thinking-routes/QUICKREF.md" "$TARGET_DIR/.claude/thinking-routes/"
cp "$TEMPLATE_DIR/.claude/rag/skill-index.json" "$TARGET_DIR/.claude/rag/" 2>/dev/null || true
cp "$TEMPLATE_DIR/project-paradigm.md" "$TARGET_DIR/prompts/"
cp "$TEMPLATE_DIR/thinkinglens-silent.md" "$TARGET_DIR/prompts/"
cp "$TEMPLATE_DIR/README.md" "$TARGET_DIR/prompts/claude-template-README.md"

# 添加执行权限
echo "🔧 设置执行权限..."
chmod +x "$TARGET_DIR/.claude/hooks/thinking-silent.js"
chmod +x "$TARGET_DIR/.claude/hooks/tl-summary.sh"
chmod +x "$TARGET_DIR/.claude/hooks/sync-to-log.sh"
chmod +x "$TARGET_DIR/.claude/hooks/session-end.sh"

# 创建空文件
echo "📝 创建记忆文件..."
touch "$TARGET_DIR/.claude/MEMORY.md"
touch "$TARGET_DIR/.claude/PROJECT_LOG.md"

# 初始化 Oh My Claude
echo "🤖 初始化 Oh My Claude..."
if command -v oh-my-claude &> /dev/null; then
    cd "$TARGET_DIR"
    oh-my-claude sync 2>/dev/null || echo "   (Oh My Claude 未安装，跳过)"
    cd - > /dev/null
else
    echo "   💡 提示: 安装 Oh My Claude 获得更多功能"
    echo "      npm install -g oh-my-claude"
fi

# 初始化 RAG 技能索引
echo "🧠 初始化 RAG 技能索引..."
cat > "$TARGET_DIR/.claude/rag/skills.md" << 'EOF'
# RAG 技能索引

此文件用于动态技能检索。当 Claude 需要特定能力时，会自动搜索此文件。

## 技能映射

| 关键词 | 技能 | 说明 |
|--------|------|------|
| frontend, ui, react, design | frontend-design | 前端界面设计 |
| document, docx, word | docx | Word 文档处理 |
| pdf, form | pdf | PDF 操作 |
| slide, ppt, presentation | pptx | PPT 制作 |
| spreadsheet, excel, xlsx | xlsx | 表格处理 |
| art, generative, canvas | canvas-design | 算法艺术 |
| api, mcp, server | mcp-builder | MCP 服务器构建 |
| architecture, design | orchestration | 多 Agent 编排 |

## 动态加载

当检测到任务类型时，自动使用：
\`\`\`bash
openskills read <skill-name>
\`\`\`
EOF

# 创建 ANCHORS.md
cat > "$TARGET_DIR/.claude/ANCHORS.md" << 'EOF'
# [项目名称] - 技能锚点索引

> 此文件由 AI 自动维护，作为技能系统的快速索引
> 最后更新：[日期]

---

## 🚀 AI 启动：记忆加载顺序

```
1. ANCHORS.md (本文件)     → 快速定位模块
2. PROJECT_LOG.md          → 了解完整构建历史
3. MEMORY.md               → 查看最新变更
4. CLAUDE.md               → 加载核心知识
5. prompts/                → 查看教学指南
6. .claude/rag/skills.md   → RAG 技能索引 ⭐
7. 具体文件                → 深入实现细节
```

---

## 当前锚点映射

### 教学资源
| 锚点 | 文件路径 | 用途 |
|------|----------|------|
| `[doc:paradigm]` | `prompts/project-paradigm.md` | 通用项目开发范式 ⭐ |
| `[doc:claude-template]` | `prompts/CLAUDE-template.md` | 新项目 CLAUDE.md 模板 ⭐ |
| `[doc:how-to-find]` | `prompts/how-to-find.md` | 对话历史查找指南 ⭐ |

### RAG 系统
| 锚点 | 文件路径 | 用途 |
|------|----------|------|
| `[system:rag-index]` | `.claude/rag/skills.md` | 动态技能索引 ⭐ |
| `[system:oh-my-claude]` | `~/.claude/config.json` | Agent 编排配置 |

### [添加你的锚点...]

---

## 锚点使用规则

1. **AI 启动任务时**：先检查相关锚点，加载对应文件
2. **AI 完成任务时**：如果是新模块，自动添加锚点到此文件
3. **锚点命名**：使用英文，格式为 `[类型:名称]`
EOF

echo ""
echo "✅ 初始化完成！"
echo ""
echo "📦 已包含："
echo "   • AI 自治记忆系统 (ThinkingLens)"
echo "   • Oh My Claude 集成"
echo "   • RAG 动态技能索引"
echo "   • 24+ 预置技能"
echo ""
echo "下一步："
echo "   1. 编辑 $TARGET_DIR/.claude/CLAUDE.md 填入项目信息"
echo "   2. 运行 tl 查看对话摘要（需先配置别名）"
echo ""
echo "建议添加到 ~/.zshrc 或 ~/.bashrc："
echo "   alias tl='.claude/hooks/tl-summary.sh'"
echo ""
