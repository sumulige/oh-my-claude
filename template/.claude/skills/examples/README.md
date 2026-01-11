# 技能示例库

> 本目录包含常用技能示例，供参考和学习

@version: 1.0.0

## 示例列表

| 示例 | 难度 | 说明 |
|------|------|------|
| [basic-task](./basic-task.md) | 初级 | 基础任务处理模板 |
| [feature-development](./feature-development.md) | 中级 | 完整功能开发工作流 |
| [bug-fix-workflow](./bug-fix-workflow.md) | 中级 | 系统 Bug 修复流程 |

## 使用方式

### 1. 参考示例创建新技能

```bash
oh-my-claude skill:create my-skill
# 然后参考示例内容完善 SKILL.md
```

### 2. 直接复制示例

```bash
cp -r .claude/skills/examples/basic-task.md .claude/skills/my-skill/SKILL.md
```

## 示例结构

每个示例包含：

- **概述**: 技能用途
- **适用场景**: 何时使用
- **触发关键词**: 如何激活
- **使用方法**: 具体用法
- **输出格式**: 返回结果
- **注意事项**: 重要提醒

## 贡献新示例

欢迎贡献更多实用示例！

1. 创建示例文件
2. 更新本索引
3. 提交 PR
