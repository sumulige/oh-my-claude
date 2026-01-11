#!/usr/bin/env node
/**
 * Oh My Claude - CLI Entry Point
 * Agent harness for Claude Code
 *
 * Features:
 * - Multi-agent orchestration
 * - Skills management via OpenSkills
 * - Built-in Claude Code project template
 * - ThinkingLens conversation tracking
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_DIR = path.join(process.env.HOME, '.claude');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const SKILLS_DIR = path.join(CONFIG_DIR, 'skills');
const TEMPLATE_DIR = path.join(__dirname, 'template');

// 默认配置 - 所有 Agent 使用 Opus 4.5
const DEFAULT_CONFIG = {
  version: '1.0.0',
  agents: {
    conductor: { model: 'claude-opus-4.5', role: 'Task coordination and decomposition' },
    architect: { model: 'claude-opus-4.5', role: 'Architecture design and decisions' },
    builder: { model: 'claude-opus-4.5', role: 'Code implementation and testing' },
    reviewer: { model: 'claude-opus-4.5', role: 'Code review and quality check' },
    librarian: { model: 'claude-opus-4.5', role: 'Documentation and knowledge' }
  },
  skills: [
    'anthropics/skills',
    'numman-ali/n-skills'
  ],
  hooks: {
    preTask: [],
    postTask: []
  },
  thinkingLens: {
    enabled: true,
    autoSync: true,
    syncInterval: 20
  }
};

// 命令处理
const commands = {
  init: () => {
    console.log('🚀 Initializing Oh My Claude...');

    // 创建配置目录
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // 创建配置文件
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
      console.log('✅ Created config:', CONFIG_FILE);
    } else {
      console.log('ℹ️  Config already exists:', CONFIG_FILE);
    }

    // 创建技能目录
    if (!fs.existsSync(SKILLS_DIR)) {
      fs.mkdirSync(SKILLS_DIR, { recursive: true });
      console.log('✅ Created skills directory:', SKILLS_DIR);
    }

    // 安装 openskills（如果未安装）
    try {
      execSync('openskills --version', { stdio: 'ignore' });
      console.log('✅ OpenSkills already installed');
    } catch {
      console.log('📦 Installing OpenSkills...');
      try {
        execSync('npm i -g openskills', { stdio: 'inherit' });
        console.log('✅ OpenSkills installed');
      } catch (e) {
        console.log('⚠️  Failed to install OpenSkills. Run: npm i -g openskills');
      }
    }

    console.log('');
    console.log('🎉 Oh My Claude initialized!');
    console.log('');
    console.log('Next steps:');
    console.log('  oh-my-claude sync      # Sync to current project');
    console.log('  oh-my-claude agent     # Run agent orchestration');
    console.log('  oh-my-claude status    # Show configuration');
  },

  sync: () => {
    console.log('🔄 Syncing Oh My Claude to current project...');

    const projectDir = process.cwd();
    const projectConfigDir = path.join(projectDir, '.claude');
    const agentsFile = path.join(projectConfigDir, 'AGENTS.md');
    const readmeFile = path.join(projectConfigDir, 'README.md');
    const templateReadme = path.join(TEMPLATE_DIR, '.claude', 'README.md');

    // 创建 .claude 目录
    if (!fs.existsSync(projectConfigDir)) {
      fs.mkdirSync(projectConfigDir, { recursive: true });
      console.log('✅ Created .claude directory');
    }

    // 同步配置
    const config = loadConfig();

    // 生成 AGENTS.md
    const agentsMd = generateAgentsMd(config);
    fs.writeFileSync(agentsFile, agentsMd);
    console.log('✅ Created AGENTS.md');

    // 静默同步 README.md（如果 template 更新了）
    if (fs.existsSync(templateReadme)) {
      const templateContent = fs.readFileSync(templateReadme, 'utf-8');
      let needsUpdate = true;

      // 检查是否需要更新（比较文件内容）
      if (fs.existsSync(readmeFile)) {
        const existingContent = fs.readFileSync(readmeFile, 'utf-8');
        // 提取版本标记（如果有）
        const templateVersion = templateContent.match(/@version:\s*(\d+\.\d+\.\d+)/)?.[1] || '0.0.0';
        const existingVersion = existingContent.match(/@version:\s*(\d+\.\d+\.\d+)/)?.[1] || '0.0.0';
        needsUpdate = templateVersion !== existingVersion;
      }

      if (needsUpdate) {
        fs.writeFileSync(readmeFile, templateContent);
        // 静默更新，不输出
      }
    }

    // 同步 todos 目录结构
    const todosTemplateDir = path.join(TEMPLATE_DIR, 'development', 'todos');
    const todosProjectDir = path.join(projectDir, 'development', 'todos');

    if (fs.existsSync(todosTemplateDir)) {
      // 复制 todos 模板文件（如果不存在）
      const copyRecursive = (src, dest) => {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
          } else if (!fs.existsSync(destPath)) {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };
      copyRecursive(todosTemplateDir, todosProjectDir);
      // 静默同步，不输出
    }

    // 同步技能
    try {
      execSync('openskills sync -y', { stdio: 'pipe' });
      console.log('✅ Synced skills');
    } catch (e) {
      console.log('⚠️  Failed to sync skills');
    }

    console.log('');
    console.log('✅ Sync complete!');
  },

  agent: (task) => {
    if (!task) {
      console.log('Usage: oh-my-claude agent <task>');
      console.log('');
      console.log('Example: oh-my-claude agent "Build a React dashboard"');
      return;
    }

    const config = loadConfig();
    console.log('🤖 Starting Agent Orchestration...');
    console.log('');
    console.log('Task:', task);
    console.log('');
    console.log('Available Agents:');
    Object.entries(config.agents).forEach(([name, agent]) => {
      console.log(`  - ${name}: ${agent.model} (${agent.role})`);
    });
    console.log('');
    console.log('💡 In Claude Code, use /skill <name> to invoke specific agent capabilities');
  },

  status: () => {
    const config = loadConfig();
    console.log('📊 Oh My Claude Status');
    console.log('');
    console.log('Config:', CONFIG_FILE);
    console.log('');
    console.log('Agents:');
    Object.entries(config.agents).forEach(([name, agent]) => {
      console.log(`  ${name.padEnd(12)} ${agent.model.padEnd(20)} (${agent.role})`);
    });
    console.log('');
    console.log('Skills:', config.skills.join(', '));
    console.log('');
    console.log('ThinkingLens:', config.thinkingLens.enabled ? '✅ Enabled' : '❌ Disabled');
  },

  'skill:list': () => {
    try {
      const result = execSync('openskills list', { encoding: 'utf-8' });
      console.log(result);
    } catch (e) {
      console.log('⚠️  OpenSkills not installed. Run: npm i -g openskills');
    }
  },

  'skill:create': (skillName) => {
    if (!skillName) {
      console.log('Usage: oh-my-claude skill:create <skill-name>');
      console.log('');
      console.log('Example: oh-my-claude skill:create api-tester');
      console.log('');
      console.log('The skill will be created at:');
      console.log('  .claude/skills/<skill-name>/');
      return;
    }

    // 验证 skill 名称 (kebab-case)
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(skillName)) {
      console.log('❌ Invalid skill name. Use kebab-case (e.g., api-tester, code-reviewer)');
      return;
    }

    const projectDir = process.cwd();
    const skillsDir = path.join(projectDir, '.claude', 'skills');
    const skillDir = path.join(skillsDir, skillName);
    const templateDir = path.join(TEMPLATE_DIR, '.claude', 'skills', 'template');

    // 检查技能是否已存在
    if (fs.existsSync(skillDir)) {
      console.log(`⚠️  Skill "${skillName}" already exists at ${skillDir}`);
      return;
    }

    console.log(`📝 Creating skill: ${skillName}`);
    console.log('');

    // 创建技能目录结构
    fs.mkdirSync(path.join(skillDir, 'templates'), { recursive: true });
    fs.mkdirSync(path.join(skillDir, 'examples'), { recursive: true });
    console.log('✅ Created directory structure');

    // 复制模板文件
    if (fs.existsSync(templateDir)) {
      const skillTemplate = fs.readFileSync(path.join(templateDir, 'SKILL.md'), 'utf-8');
      const metadataTemplate = fs.readFileSync(path.join(templateDir, 'metadata.yaml'), 'utf-8');

      // 替换占位符
      const date = new Date().toISOString().split('T')[0];
      let skillContent = skillTemplate
        .replace(/Skill Name/g, toTitleCase(skillName.replace(/-/g, ' ')))
        .replace(/{current-date}/g, date)
        .replace(/skill-name/g, skillName);

      let metadataContent = metadataTemplate
        .replace(/skill-name/g, skillName)
        .replace(/dependencies: \[\]/g, 'dependencies: []')  // 保持依赖为空，用户手动添加
        .replace(/difficulty: beginner/g, 'difficulty: beginner');  // 默认难度

      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillContent);
      fs.writeFileSync(path.join(skillDir, 'metadata.yaml'), metadataContent);
      console.log('✅ Created SKILL.md and metadata.yaml');
    }

    // 创建示例模板
    fs.writeFileSync(
      path.join(skillDir, 'templates', 'default.md'),
      `# Default Template for ${skillName}\n\nReplace this with your actual template.\n`
    );
    fs.writeFileSync(
      path.join(skillDir, 'examples', 'basic.md'),
      `# Basic Example for ${skillName}\n\nReplace this with your actual example.\n`
    );
    console.log('✅ Created templates and examples');

    // 更新 RAG 索引
    const ragDir = path.join(projectDir, '.claude', 'rag');
    const ragIndexFile = path.join(ragDir, 'skill-index.json');
    let ragIndex = { skills: [], auto_load: { enabled: true } };

    // 确保 rag 目录存在
    if (!fs.existsSync(ragDir)) {
      fs.mkdirSync(ragDir, { recursive: true });
    }

    if (fs.existsSync(ragIndexFile)) {
      try {
        ragIndex = JSON.parse(fs.readFileSync(ragIndexFile, 'utf-8'));
      } catch (e) {}
    }

    // 添加新技能到索引
    const newSkill = {
      name: skillName,
      description: `TODO: Add description for ${skillName}`,
      keywords: [skillName.replace(/-/g, ' ')],
      path: `.claude/skills/${skillName}/SKILL.md`
    };

    // 避免重复
    if (!ragIndex.skills.some(s => s.name === skillName)) {
      ragIndex.skills.push(newSkill);
      fs.writeFileSync(ragIndexFile, JSON.stringify(ragIndex, null, 2));
      console.log('✅ Updated RAG skill index');
    }

    console.log('');
    console.log('✅ Skill created successfully!');
    console.log('');
    console.log(`Next steps:`);
    console.log(`  1. Edit .claude/skills/${skillName}/SKILL.md`);
    console.log(`  2. Add your templates and examples`);
    console.log(`  3. Use in Claude Code: /skill ${skillName}`);
  },

  'skill:check': (skillName) => {
    const projectDir = process.cwd();
    const skillsDir = path.join(projectDir, '.claude', 'skills');

    console.log('🔍 Checking skill dependencies...');
    console.log('');

    const checkSkill = (name, visited = new Set()) => {
      if (visited.has(name)) {
        console.log(`⚠️  Circular dependency detected: ${name}`);
        return;
      }
      visited.add(name);

      const skillDir = path.join(skillsDir, name);
      const metadataFile = path.join(skillDir, 'metadata.yaml');

      if (!fs.existsSync(skillDir)) {
        console.log(`❌ Skill "${name}" not found`);
        return;
      }

      if (!fs.existsSync(metadataFile)) {
        console.log(`ℹ️  ${name}: No metadata.yaml`);
        return;
      }

      // 简单解析 YAML（只支持基本的 key: value 格式）
      const parseSimpleYaml = (content) => {
        const result = {};
        content.split('\n').forEach(line => {
          const match = line.match(/^(\w+):\s*(.*)$/);
          if (match) {
            const value = match[2].trim();
            if (value === '[]') {
              result[match[1]] = [];
            } else if (value.startsWith('[')) {
              try {
                result[match[1]] = JSON.parse(value.replace(/'/g, '"'));
              } catch (e) {
                result[match[1]] = [];
              }
            } else {
              result[match[1]] = value;
            }
          }
        });
        return result;
      };

      const metadata = parseSimpleYaml(fs.readFileSync(metadataFile, 'utf-8'));
      const deps = metadata.dependencies || [];

      if (deps.length === 0) {
        console.log(`✅ ${name}: No dependencies`);
        return;
      }

      console.log(`📦 ${name} depends on:`);
      deps.forEach(dep => {
        const depDir = path.join(skillsDir, dep);
        if (fs.existsSync(depDir)) {
          console.log(`   ✅ ${dep}`);
          checkSkill(dep, new Set(visited));
        } else {
          console.log(`   ❌ ${dep} (missing)`);
        }
      });
    };

    if (skillName) {
      checkSkill(skillName);
    } else {
      // 检查所有技能
      const allSkills = fs.existsSync(skillsDir)
        ? fs.readdirSync(skillsDir).filter(f => {
            const dir = path.join(skillsDir, f);
            return fs.statSync(dir).isDirectory() && f !== 'template' && f !== 'examples';
          })
        : [];

      console.log(`Found ${allSkills.length} skills\n`);
      allSkills.forEach(skill => checkSkill(skill));
    }
  },

  'skill:install': (source) => {
    if (!source) {
      console.log('Usage: oh-my-claude skill:install <source>');
      console.log('Example: oh-my-claude skill:install anthropics/skills');
      return;
    }
    try {
      execSync(`openskills install ${source} -y`, { stdio: 'inherit' });
      execSync('openskills sync -y', { stdio: 'pipe' });
      console.log('✅ Skill installed and synced');
    } catch (e) {
      console.log('❌ Failed to install skill');
    }
  },

  template: (targetPath) => {
    const targetDir = targetPath ? path.resolve(targetPath) : process.cwd();

    console.log('🚀 Initializing Claude Code project template...');
    console.log('   Target:', targetDir);
    console.log('');

    // 检查模板目录是否存在
    if (!fs.existsSync(TEMPLATE_DIR)) {
      console.log('❌ Template not found at:', TEMPLATE_DIR);
      console.log('   Please reinstall oh-my-claude');
      process.exit(1);
    }

    // 创建目录结构
    console.log('📁 Creating directory structure...');
    const dirs = [
      path.join(targetDir, '.claude/hooks'),
      path.join(targetDir, '.claude/thinking-routes'),
      path.join(targetDir, '.claude/skills'),
      path.join(targetDir, '.claude/rag'),
      path.join(targetDir, 'prompts')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    console.log('   ✅ Directories created');

    // 复制文件
    console.log('📋 Copying template files...');

    // 复制 .claude 文件
    const claudeTemplateDir = path.join(TEMPLATE_DIR, '.claude');
    if (fs.existsSync(claudeTemplateDir)) {
      // CLAUDE-template.md
      const claudeTemplate = path.join(claudeTemplateDir, 'CLAUDE-template.md');
      if (fs.existsSync(claudeTemplate)) {
        fs.copyFileSync(claudeTemplate, path.join(targetDir, '.claude/CLAUDE.md'));
        console.log('   ✅ .claude/CLAUDE.md');
      }

      // settings.json
      const settingsFile = path.join(claudeTemplateDir, 'settings.json');
      if (fs.existsSync(settingsFile)) {
        fs.copyFileSync(settingsFile, path.join(targetDir, '.claude/settings.json'));
        console.log('   ✅ .claude/settings.json');
      }

      // hooks/
      const hooksDir = path.join(claudeTemplateDir, 'hooks');
      if (fs.existsSync(hooksDir)) {
        const hooks = fs.readdirSync(hooksDir);
        hooks.forEach(hook => {
          const src = path.join(hooksDir, hook);
          const dest = path.join(targetDir, '.claude/hooks', hook);
          fs.copyFileSync(src, dest);
          // 添加执行权限
          if (hook.endsWith('.js') || hook.endsWith('.sh')) {
            fs.chmodSync(dest, 0o755);
          }
        });
        console.log('   ✅ .claude/hooks/ (' + hooks.length + ' files)');
      }

      // thinking-routes/
      const routesDir = path.join(claudeTemplateDir, 'thinking-routes');
      if (fs.existsSync(routesDir)) {
        const files = fs.readdirSync(routesDir);
        files.forEach(file => {
          fs.copyFileSync(
            path.join(routesDir, file),
            path.join(targetDir, '.claude/thinking-routes', file)
          );
        });
        console.log('   ✅ .claude/thinking-routes/');
      }

      // rag/
      const ragDir = path.join(claudeTemplateDir, 'rag');
      if (fs.existsSync(ragDir)) {
        const files = fs.readdirSync(ragDir);
        files.forEach(file => {
          fs.copyFileSync(
            path.join(ragDir, file),
            path.join(targetDir, '.claude/rag', file)
          );
        });
        console.log('   ✅ .claude/rag/');
      }
    }

    // 复制 prompts/
    const promptsDir = path.join(TEMPLATE_DIR, 'prompts');
    if (fs.existsSync(promptsDir)) {
      const files = fs.readdirSync(promptsDir);
      files.forEach(file => {
        fs.copyFileSync(
          path.join(promptsDir, file),
          path.join(targetDir, 'prompts', file)
        );
      });
      console.log('   ✅ prompts/');
    }

    // 复制根目录文件
    const files = ['project-paradigm.md', 'thinkinglens-silent.md'];
    files.forEach(file => {
      const src = path.join(TEMPLATE_DIR, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(targetDir, file));
        console.log('   ✅ ' + file);
      }
    });

    // 创建记忆文件
    console.log('📝 Creating memory files...');
    if (!fs.existsSync(path.join(targetDir, '.claude/MEMORY.md'))) {
      fs.writeFileSync(path.join(targetDir, '.claude/MEMORY.md'), '# Memory\n\n<!-- Project memory updated by AI -->\n');
    }
    if (!fs.existsSync(path.join(targetDir, '.claude/PROJECT_LOG.md'))) {
      fs.writeFileSync(path.join(targetDir, '.claude/PROJECT_LOG.md'), '# Project Log\n\n<!-- Build history and decisions -->\n');
    }
    console.log('   ✅ Memory files created');

    // 创建 ANCHORS.md
    const anchorsContent = `# [Project Name] - Skill Anchors Index

> This file is auto-maintained by AI as a quick index for the skill system
> Last updated: ${new Date().toISOString().split('T')[0]}

---

## 🚀 AI Startup: Memory Loading Order

\`\`\`
1. ANCHORS.md (this file)     → Quick locate modules
2. PROJECT_LOG.md            → Understand build history
3. MEMORY.md                 → View latest changes
4. CLAUDE.md                 → Load core knowledge
5. prompts/                  → View tutorials
6. .claude/rag/skills.md     → RAG skill index ⭐
7. Specific files            → Deep dive into implementation
\`\`\`

---

## Current Anchor Mapping

### Teaching Resources
| Anchor | File Path | Purpose |
|--------|-----------|---------|
| \`[doc:paradigm]\` | \`prompts/project-paradigm.md\` | General development paradigm ⭐ |
| \`[doc:claude-template]\` | \`.claude/CLAUDE.md\` | CLAUDE.md template for new projects |

### RAG System
| Anchor | File Path | Purpose |
|--------|-----------|---------|
| \`[system:rag-index]\` | \`.claude/rag/skill-index.json\` | Dynamic skill index ⭐ |

---

## Add Your Anchors Here...

`;
    fs.writeFileSync(path.join(targetDir, '.claude/ANCHORS.md'), anchorsContent);
    console.log('   ✅ .claude/ANCHORS.md');

    // 初始化 Oh My Claude（如果已安装）
    console.log('');
    console.log('🤖 Initializing Oh My Claude...');
    try {
      execSync('oh-my-claude sync', { cwd: targetDir, stdio: 'pipe' });
      console.log('   ✅ Oh My Claude synced');
    } catch (e) {
      console.log('   ⚠️  Oh My Claude not available (run: npm i -g oh-my-claude)');
    }

    console.log('');
    console.log('✅ Template initialization complete!');
    console.log('');
    console.log('📦 What was included:');
    console.log('   • AI autonomous memory system (ThinkingLens)');
    console.log('   • Oh My Claude integration');
    console.log('   • RAG dynamic skill index');
    console.log('   • 20+ pre-configured skills');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Run: oh-my-claude kickoff  # 开始项目规划');
    console.log('   2. Edit .claude/CLAUDE.md with your project info');
    console.log('   3. Run: oh-my-claude status');
    console.log('');
  },

  kickoff: () => {
    const projectDir = process.cwd();
    const kickoffFile = path.join(projectDir, 'PROJECT_KICKOFF.md');
    const hintFile = path.join(projectDir, '.claude/.kickoff-hint.txt');

    console.log('🚀 Project Kickoff - Manus 风格项目启动');
    console.log('');

    if (fs.existsSync(kickoffFile)) {
      console.log('ℹ️  项目已经完成启动流程');
      console.log('   文件:', kickoffFile);
      console.log('');
      console.log('如需重新规划，请先删除以下文件：');
      console.log('   - PROJECT_KICKOFF.md');
      console.log('   - TASK_PLAN.md');
      console.log('   - PROJECT_PROPOSAL.md');
      return;
    }

    // 运行启动 Hook
    const kickoffHook = path.join(projectDir, '.claude/hooks/project-kickoff.cjs');
    if (fs.existsSync(kickoffHook)) {
      try {
        execSync(`node "${kickoffHook}"`, {
          cwd: projectDir,
          env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
          stdio: 'inherit'
        });
      } catch (e) {
        // Hook 可能会输出内容然后退出，这是正常的
      }

      // 显示提示文件内容（如果存在）
      if (fs.existsSync(hintFile)) {
        const hint = fs.readFileSync(hintFile, 'utf-8');
        console.log(hint);
      }
    } else {
      console.log('⚠️  启动 Hook 不存在');
      console.log('   请先运行: oh-my-claude template');
      console.log('   或: oh-my-claude sync');
    }
  }
};

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  }
  return DEFAULT_CONFIG;
}

function toTitleCase(str) {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

function generateAgentsMd(config) {
  const agentsList = Object.entries(config.agents)
    .map(([name, agent]) => `### ${name}\n- **Model**: ${agent.model}\n- **Role**: ${agent.role}`)
    .join('\n\n');

  return `# AGENTS

<skills_system priority="1">

## Agent Orchestration

This project uses **Oh My Claude** for multi-agent collaboration.

${agentsList}

## Usage

\`\`\`bash
# View agent status
oh-my-claude status

# Run agent task
oh-my-claude agent <task>

# List skills
oh-my-claude skill:list
\`\`\`

</skills_system>
`;
}

// CLI 入口
function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const arg = args[1];

  if (cmd === 'init') {
    commands.init();
  } else if (cmd === 'sync') {
    commands.sync();
  } else if (cmd === 'agent') {
    commands.agent(arg);
  } else if (cmd === 'status') {
    commands.status();
  } else if (cmd === 'skill:list') {
    commands['skill:list']();
  } else if (cmd === 'skill:create') {
    commands['skill:create'](arg);
  } else if (cmd === 'skill:check') {
    commands['skill:check'](arg);
  } else if (cmd === 'skill:install') {
    commands['skill:install'](arg);
  } else if (cmd === 'template') {
    commands.template(arg);
  } else if (cmd === 'kickoff') {
    commands.kickoff();
  } else {
    console.log('Oh My Claude (omc) - Agent Harness for Claude Code');
    console.log('');
    console.log('Usage: omc <command> [args]');
    console.log('   (or: oh-my-claude <command> [args])');
    console.log('');
    console.log('Commands:');
    console.log('  init              Initialize configuration');
    console.log('  sync              Sync to current project');
    console.log('  template [path]   Deploy Claude Code project template');
    console.log('  kickoff           Start project planning workflow (Manus-style)');
    console.log('  agent <task>      Run agent orchestration');
    console.log('  status            Show configuration status');
    console.log('  skill:list        List installed skills');
    console.log('  skill:create <n>  Create a new skill');
    console.log('  skill:check [n]   Check skill dependencies');
    console.log('  skill:install <s> Install a skill');
    console.log('');
    console.log('Examples:');
    console.log('  omc init');
    console.log('  omc sync');
    console.log('  omc template');
    console.log('  omc template /path/to/project');
    console.log('  omc kickoff        # Start project planning');
    console.log('  omc agent "Build a REST API"');
    console.log('  omc skill:create api-tester');
    console.log('  omc skill:check manus-kickoff');
    console.log('  omc skill:install anthropics/skills');
  }
}

main();
