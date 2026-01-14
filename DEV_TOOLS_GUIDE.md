# 🛠️ 开发工具速查手册

> 写给高中生的通俗指南 - 每个工具一句话解释 + 常用命令

---

## 📋 工具一览表

| 工具 | 一句话解释 | 类比 |
|------|-----------|------|
| **zellij** | 终端分屏器 | 像把一个窗口分成多个小窗口 |
| **fnm** | Node.js 版本管理 | 像手机可以装多个微信 |
| **pyenv** | Python 版本管理 | 同时装多个 Python 版本 |
| **uv** | Python 包安装器 | pip 的超快替代品 |
| **pgcli** | 数据库命令行 | 带自动补全的 PostgreSQL 客户端 |
| **bat** | 更好看的查看文件 | cat 命令的美化版 |
| **eza** | 更好看的文件列表 | ls 命令的美化版 |
| **fzf** | 模糊搜索 | Ctrl+R 搜历史命令 |
| **lazygit** | Git 图形界面 | 在终端里用图形化操作 Git |

---

## 🎯 分屏神器 - Zellij

**干啥用**：把一个终端窗口分成多个区域，同时运行多个命令

**启动**：
```bash
zellij      # 启动
zj          # 快捷别名
```

**常用操作**：
| 按键 | 作用 |
|------|------|
| `Ctrl+p` 然后 `n` | 新建标签页 |
| `Ctrl+p` 然后 `d` | 垂直分屏 |
| `Ctrl+p` 然后 `r` | 水平分屏 |
| `Ctrl+p` 然后 `x` | 关闭当前面板 |
| `Ctrl+p` 然后 `w` | 切换面板 |

**使用场景**：
- 一边写代码，一边看日志
- 同时运行前端和后端服务器

---

## 📦 Node 版本管理 - fnm

**干啥用**：不同项目可能需要不同版本的 Node.js，fnm 帮你切换

**常用命令**：
```bash
fnm list-remote     # 看有哪些版本可以装
fnm install 20      # 安装 Node 20
fnm install 22      # 安装 Node 22
fnm use 20          # 切换到 Node 20
fnm default 22      # 设置默认版本
fnm current         # 查看当前版本
```

**使用场景**：
- 老项目需要 Node 18，新项目需要 Node 22
- 进入项目文件夹自动切换版本（如果有 .node-version 文件）

---

## 🐍 Python 版本管理 - pyenv

**干啥用**：管理多个 Python 版本

**常用命令**：
```bash
pyenv install --list    # 看有哪些版本
pyenv install 3.12.0    # 安装 Python 3.12
pyenv global 3.12.0     # 设置全局默认
pyenv local 3.11.0      # 当前目录用 3.11
pyenv versions          # 查看已安装版本
```

---

## ⚡ 超快包管理 - uv

**干啥用**：替代 pip，安装 Python 包快 10-100 倍

**常用命令**：
```bash
uv pip install pandas      # 安装包
uv pip install -r req.txt  # 从文件安装
uv venv                    # 创建虚拟环境
uv run python script.py    # 运行脚本
```

**对比**：
| 命令 | pip 用时 | uv 用时 |
|------|---------|---------|
| 安装 pandas | 30 秒 | 2 秒 |
| 创建环境 | 5 秒 | 0.5 秒 |

---

## 🐘 数据库工具 - pgcli

**干啥用**：连接 PostgreSQL 数据库，带自动补全

**使用**：
```bash
pgcli -h localhost -u postgres -d mydb
# 或
pgcli postgres://user:pass@host/db
```

**特点**：
- 自动补全表名、列名
- 语法高亮
- 历史命令搜索

---

## 👀 更好看的命令 - bat & eza

**bat** - 替代 cat：
```bash
bat README.md       # 带语法高亮看文件
bat -A file.txt     # 显示隐藏字符
```

**eza** - 替代 ls：
```bash
ls          # 已经是 eza 的别名
ll          # 详细列表 + 图标
lt          # 树形目录
```

---

## 🔍 模糊搜索 - fzf

**干啥用**：快速搜索文件、命令历史

**使用**：
```bash
Ctrl+R      # 搜索历史命令
Ctrl+T      # 搜索文件
```

---

## 🌳 Git 图形化 - lazygit

**干啥用**：在终端用图形界面操作 Git

**启动**：
```bash
lg          # 快捷别名
lazygit     # 完整命令
```

**常用操作**：
| 按键 | 作用 |
|------|------|
| `space` | 暂存/取消暂存文件 |
| `c` | 提交 |
| `p` | 推送 |
| `P` | 拉取 |
| `b` | 查看分支 |
| `q` | 退出 |

---

## 🎨 快捷别名总结

```bash
# 你现在可以用的快捷命令
ls   → eza（带图标的文件列表）
ll   → 详细列表
lt   → 树形目录
cat  → bat（带高亮的查看）
lg   → lazygit（Git 图形界面）
zj   → zellij（终端分屏）
gs   → git status
ga   → git add
gc   → git commit
gp   → git push
```

---

*最后更新：2026-01-14*
