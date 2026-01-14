/**
 * Commands - All CLI command implementations
 *
 * Extracted from cli.js for better organization
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadConfig, CONFIG_DIR, CONFIG_FILE, SKILLS_DIR, ensureDir, saveConfig } = require('./config');
const { copyRecursive, toTitleCase } = require('./utils');

const TEMPLATE_DIR = path.join(__dirname, '../template');

// ============================================================================
// Commands
// ============================================================================

const commands = {
  // -------------------------------------------------------------------------
  init: () => {
    console.log('🚀 Initializing Sumulige Claude...');

    // Create config directory
    ensureDir(CONFIG_DIR);

    // Create config file
    if (!fs.existsSync(CONFIG_FILE)) {
      saveConfig(loadConfig());
      console.log('✅ Created config:', CONFIG_FILE);
    } else {
      console.log('ℹ️  Config already exists:', CONFIG_FILE);
    }

    // Create skills directory
    ensureDir(SKILLS_DIR);
    console.log('✅ Created skills directory:', SKILLS_DIR);

    // Install openskills if not installed
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
    console.log('🎉 Sumulige Claude initialized!');
    console.log('');
    console.log('Next steps:');
    console.log('  sumulige-claude sync      # Sync to current project');
    console.log('  sumulige-claude agent     # Run agent orchestration');
    console.log('  sumulige-claude status    # Show configuration');
  },

  // -------------------------------------------------------------------------
  sync: () => {
    console.log('🔄 Syncing Sumulige Claude to current project...');

    const projectDir = process.cwd();
    const projectConfigDir = path.join(projectDir, '.claude');
    const agentsFile = path.join(projectConfigDir, 'AGENTS.md');
    const readmeFile = path.join(projectConfigDir, 'README.md');
    const templateReadme = path.join(TEMPLATE_DIR, '.claude', 'README.md');

    // Create .claude directory
    ensureDir(projectConfigDir);
    console.log('✅ Created .claude directory');

    // Sync config
    const config = loadConfig();

    // Generate AGENTS.md
    const agentsMd = generateAgentsMd(config);
    fs.writeFileSync(agentsFile, agentsMd);
    console.log('✅ Created AGENTS.md');

    // Silently sync README.md if template updated
    if (fs.existsSync(templateReadme)) {
      const templateContent = fs.readFileSync(templateReadme, 'utf-8');
      let needsUpdate = true;

      if (fs.existsSync(readmeFile)) {
        const existingContent = fs.readFileSync(readmeFile, 'utf-8');
        const templateVersion = templateContent.match(/@version:\s*(\d+\.\d+\.\d+)/)?.[1] || '0.0.0';
        const existingVersion = existingContent.match(/@version:\s*(\d+\.\d+\.\d+)/)?.[1] || '0.0.0';
        needsUpdate = templateVersion !== existingVersion;
      }

      if (needsUpdate) {
        fs.writeFileSync(readmeFile, templateContent);
      }
    }

    // Sync todos directory structure
    const todosTemplateDir = path.join(TEMPLATE_DIR, 'development', 'todos');
    const todosProjectDir = path.join(projectDir, 'development', 'todos');

    if (fs.existsSync(todosTemplateDir)) {
      copyRecursive(todosTemplateDir, todosProjectDir);
    }

    // Sync skills
    try {
      execSync('openskills sync -y', { stdio: 'pipe' });
      console.log('✅ Synced skills');
    } catch (e) {
      console.log('⚠️  Failed to sync skills');
    }

    console.log('');
    console.log('✅ Sync complete!');
  },

  // -------------------------------------------------------------------------
  agent: (task) => {
    if (!task) {
      console.log('Usage: sumulige-claude agent <task>');
      console.log('');
      console.log('Example: sumulige-claude agent "Build a React dashboard"');
      return;
    }

    const config = loadConfig();
    console.log('🤖 Starting Agent Orchestration...');
    console.log('');
    console.log('Task:', task);
    console.log('');
    console.log('Available Agents:');
    Object.entries(config.agents).forEach(([name, agent]) => {
      const model = agent.model || config.model;
      console.log(`  - ${name}: ${model} (${agent.role})`);
    });
    console.log('');
    console.log('💡 In Claude Code, use /skill <name> to invoke specific agent capabilities');
  },

  // -------------------------------------------------------------------------
  status: () => {
    const config = loadConfig();
    console.log('📊 Sumulige Claude Status');
    console.log('');
    console.log('Config:', CONFIG_FILE);
    console.log('');
    console.log('Agents:');
    Object.entries(config.agents).forEach(([name, agent]) => {
      const model = agent.model || config.model;
      console.log(`  ${name.padEnd(12)} ${model.padEnd(20)} (${agent.role})`);
    });
    console.log('');
    console.log('Skills:', config.skills.join(', '));
    console.log('');
    console.log('ThinkingLens:', config.thinkingLens.enabled ? '✅ Enabled' : '❌ Disabled');
    console.log('');

    // Show project todos status
    const projectDir = process.cwd();
    const todosIndex = path.join(projectDir, 'development', 'todos', 'INDEX.md');

    if (fs.existsSync(todosIndex)) {
      const content = fs.readFileSync(todosIndex, 'utf-8');

      const totalMatch = content.match(/Total:\s+`([^`]+)`\s+(\d+)%/);
      const p0Match = content.match(/P0[^`]*`([^`]+)`\s+(\d+)%\s+\((\d+)\/(\d+)\)/);
      const p1Match = content.match(/P1[^`]*`([^`]+)`\s+(\d+)%\s+\((\d+)\/(\d+)\)/);
      const p2Match = content.match(/P2[^`]*`([^`]+)`\s+(\d+)%\s+\((\d+)\/(\d+)\)/);

      const activeMatch = content.match(/\|\s+🚧 进行中[^|]*\|\s+`active\/`\s+\|\s+(\d+)/);
      const completedMatch = content.match(/\|\s+✅ 已完成[^|]*\|\s+`completed\/`\s+\|\s+(\d+)/);
      const backlogMatch = content.match(/\|\s+📋 待办[^|]*\|\s+`backlog\/`\s+\|\s+(\d+)/);

      console.log('📋 Project Tasks:');
      console.log('');
      if (totalMatch) {
        console.log(`  Total: ${totalMatch[1]} ${totalMatch[2]}%`);
      }
      if (p0Match) {
        console.log(`  P0:   ${p0Match[1]} ${p0Match[2]}% (${p0Match[3]}/${p0Match[4]})`);
      }
      if (p1Match) {
        console.log(`  P1:   ${p1Match[1]} ${p1Match[2]}% (${p1Match[3]}/${p1Match[4]})`);
      }
      if (p2Match) {
        console.log(`  P2:   ${p2Match[1]} ${p2Match[2]}% (${p2Match[3]}/${p2Match[4]})`);
      }
      console.log('');
      console.log(`  🚧 Active:    ${activeMatch ? activeMatch[1] : 0}`);
      console.log(`  ✅ Completed: ${completedMatch ? completedMatch[1] : 0}`);
      console.log(`  📋 Backlog:   ${backlogMatch ? backlogMatch[1] : 0}`);
      console.log('');
      console.log(`  View: cat development/todos/INDEX.md`);
    } else {
      console.log('📋 Project Tasks: (not initialized)');
      console.log('  Run: node .claude/hooks/todo-manager.cjs --force');
    }
  },

  // -------------------------------------------------------------------------
  'skill:list': () => {
    try {
      const result = execSync('openskills list', { encoding: 'utf-8' });
      console.log(result);
    } catch (e) {
      console.log('⚠️  OpenSkills not installed. Run: npm i -g openskills');
    }
  },

  // -------------------------------------------------------------------------
  'skill:create': (skillName) => {
    if (!skillName) {
      console.log('Usage: sumulige-claude skill:create <skill-name>');
      console.log('');
      console.log('Example: sumulige-claude skill:create api-tester');
      console.log('');
      console.log('The skill will be created at:');
      console.log('  .claude/skills/<skill-name>/');
      return;
    }

    // Validate skill name (kebab-case)
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(skillName)) {
      console.log('❌ Invalid skill name. Use kebab-case (e.g., api-tester, code-reviewer)');
      return;
    }

    const projectDir = process.cwd();
    const skillsDir = path.join(projectDir, '.claude', 'skills');
    const skillDir = path.join(skillsDir, skillName);
    const templateDir = path.join(TEMPLATE_DIR, '.claude', 'skills', 'template');

    // Check if skill already exists
    if (fs.existsSync(skillDir)) {
      console.log(`⚠️  Skill "${skillName}" already exists at ${skillDir}`);
      return;
    }

    console.log(`📝 Creating skill: ${skillName}`);
    console.log('');

    // Create skill directory structure
    fs.mkdirSync(path.join(skillDir, 'templates'), { recursive: true });
    fs.mkdirSync(path.join(skillDir, 'examples'), { recursive: true });
    console.log('✅ Created directory structure');

    // Copy template files
    if (fs.existsSync(templateDir)) {
      const skillTemplate = fs.readFileSync(path.join(templateDir, 'SKILL.md'), 'utf-8');
      const metadataTemplate = fs.readFileSync(path.join(templateDir, 'metadata.yaml'), 'utf-8');

      // Replace placeholders
      const date = new Date().toISOString().split('T')[0];
      let skillContent = skillTemplate
        .replace(/Skill Name/g, toTitleCase(skillName.replace(/-/g, ' ')))
        .replace(/{current-date}/g, date)
        .replace(/skill-name/g, skillName);

      let metadataContent = metadataTemplate
        .replace(/skill-name/g, skillName);

      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillContent);
      fs.writeFileSync(path.join(skillDir, 'metadata.yaml'), metadataContent);
      console.log('✅ Created SKILL.md and metadata.yaml');
    }

    // Create example templates
    fs.writeFileSync(
      path.join(skillDir, 'templates', 'default.md'),
      `# Default Template for ${skillName}\n\nReplace this with your actual template.\n`
    );
    fs.writeFileSync(
      path.join(skillDir, 'examples', 'basic.md'),
      `# Basic Example for ${skillName}\n\nReplace this with your actual example.\n`
    );
    console.log('✅ Created templates and examples');

    // Update RAG index
    const ragDir = path.join(projectDir, '.claude', 'rag');
    const ragIndexFile = path.join(ragDir, 'skill-index.json');
    let ragIndex = { skills: [], auto_load: { enabled: true } };

    ensureDir(ragDir);

    if (fs.existsSync(ragIndexFile)) {
      try {
        ragIndex = JSON.parse(fs.readFileSync(ragIndexFile, 'utf-8'));
      } catch (e) { }
    }

    // Add new skill to index
    const newSkill = {
      name: skillName,
      description: `TODO: Add description for ${skillName}`,
      keywords: [skillName.replace(/-/g, ' ')],
      path: `.claude/skills/${skillName}/SKILL.md`
    };

    // Avoid duplicates
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

  // -------------------------------------------------------------------------
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

      // Simple YAML parser (basic key: value format only)
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
      // Check all skills
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

  // -------------------------------------------------------------------------
  'skill:install': (source) => {
    if (!source) {
      console.log('Usage: sumulige-claude skill:install <source>');
      console.log('Example: sumulige-claude skill:install anthropics/skills');
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

  // -------------------------------------------------------------------------
  template: (targetPath) => {
    const targetDir = targetPath ? path.resolve(targetPath) : process.cwd();

    console.log('🚀 Initializing Claude Code project template...');
    console.log('   Target:', targetDir);
    console.log('');

    // Check template directory exists
    if (!fs.existsSync(TEMPLATE_DIR)) {
      console.log('❌ Template not found at:', TEMPLATE_DIR);
      console.log('   Please reinstall sumulige-claude');
      process.exit(1);
    }

    // Create directory structure
    console.log('📁 Creating directory structure...');
    const dirs = [
      path.join(targetDir, '.claude'),
      path.join(targetDir, 'prompts'),
      path.join(targetDir, 'development/todos/active'),
      path.join(targetDir, 'development/todos/completed'),
      path.join(targetDir, 'development/todos/backlog'),
      path.join(targetDir, 'development/todos/archived')
    ];

    dirs.forEach(ensureDir);
    console.log('   ✅ Directories created');

    // Copy files
    console.log('📋 Copying template files...');

    const claudeTemplateDir = path.join(TEMPLATE_DIR, '.claude');
    const targetClaudeDir = path.join(targetDir, '.claude');

    // Files to copy
    const filesToCopy = [
      { src: 'CLAUDE-template.md', dest: 'CLAUDE.md' },
      { src: 'README.md', dest: 'README.md' },
      { src: 'settings.json', dest: 'settings.json' },
      { src: 'boris-optimizations.md', dest: 'boris-optimizations.md' }
    ];

    filesToCopy.forEach(({ src, dest }) => {
      const srcPath = path.join(claudeTemplateDir, src);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(targetClaudeDir, dest));
        console.log(`   ✅ .claude/${dest}`);
      }
    });

    // Directories to copy recursively
    const dirsToCopy = [
      { src: 'hooks', overwrite: true },
      { src: 'commands', overwrite: true },
      { src: 'skills', overwrite: false },
      { src: 'templates', overwrite: false },
      { src: 'thinking-routes', overwrite: false },
      { src: 'rag', overwrite: true }
    ];

    dirsToCopy.forEach(({ src, overwrite }) => {
      const srcPath = path.join(claudeTemplateDir, src);
      if (fs.existsSync(srcPath)) {
        const count = copyRecursive(srcPath, path.join(targetClaudeDir, src), overwrite);
        console.log(`   ✅ .claude/${src}/ (${count} files)`);
      }
    });

    // Copy prompts
    const promptsDir = path.join(TEMPLATE_DIR, 'prompts');
    if (fs.existsSync(promptsDir)) {
      const count = copyRecursive(promptsDir, path.join(targetDir, 'prompts'), false);
      console.log(`   ✅ prompts/ (${count} files)`);
    }

    // Copy todos
    const todosDir = path.join(TEMPLATE_DIR, 'development', 'todos');
    if (fs.existsSync(todosDir)) {
      const count = copyRecursive(todosDir, path.join(targetDir, 'development', 'todos'), false);
      console.log(`   ✅ development/todos/ (${count} files)`);
    }

    // Root files
    const rootFiles = ['project-paradigm.md', 'thinkinglens-silent.md', 'CLAUDE-template.md'];
    rootFiles.forEach(file => {
      const src = path.join(TEMPLATE_DIR, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(targetDir, file));
        console.log('   ✅ ' + file);
      }
    });

    // Create memory files
    console.log('📝 Creating memory files...');
    if (!fs.existsSync(path.join(targetClaudeDir, 'MEMORY.md'))) {
      fs.writeFileSync(path.join(targetClaudeDir, 'MEMORY.md'), '# Memory\n\n<!-- Project memory updated by AI -->\n');
    }
    if (!fs.existsSync(path.join(targetClaudeDir, 'PROJECT_LOG.md'))) {
      fs.writeFileSync(path.join(targetClaudeDir, 'PROJECT_LOG.md'), '# Project Log\n\n<!-- Build history and decisions -->\n');
    }
    console.log('   ✅ Memory files created');

    // Create ANCHORS.md
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
    fs.writeFileSync(path.join(targetClaudeDir, 'ANCHORS.md'), anchorsContent);
    console.log('   ✅ .claude/ANCHORS.md');

    // Initialize Sumulige Claude if installed
    console.log('');
    console.log('🤖 Initializing Sumulige Claude...');
    try {
      execSync('sumulige-claude sync', { cwd: targetDir, stdio: 'pipe' });
      console.log('   ✅ Sumulige Claude synced');
    } catch (e) {
      console.log('   ⚠️  Sumulige Claude not available (run: npm i -g sumulige-claude)');
    }

    console.log('');
    console.log('✅ Template initialization complete!');
    console.log('');
    console.log('📦 What was included:');
    console.log('   • AI autonomous memory system (ThinkingLens)');
    console.log('   • Slash commands (/commit, /test, /review, etc.)');
    console.log('   • Skills system with templates');
    console.log('   • RAG dynamic skill index');
    console.log('   • Hooks for automation');
    console.log('   • TODO management system');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Edit .claude/CLAUDE.md with your project info');
    console.log('   2. Run: claude  # Start Claude Code');
    console.log('   3. Try: /commit, /test, /review');
    console.log('');
  },

  // -------------------------------------------------------------------------
  kickoff: () => {
    const projectDir = process.cwd();
    const kickoffFile = path.join(projectDir, 'PROJECT_KICKOFF.md');
    const hintFile = path.join(projectDir, '.claude', '.kickoff-hint.txt');

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

    // Run kickoff hook
    const kickoffHook = path.join(projectDir, '.claude', 'hooks', 'project-kickoff.cjs');
    if (fs.existsSync(kickoffHook)) {
      try {
        execSync(`node "${kickoffHook}"`, {
          cwd: projectDir,
          env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
          stdio: 'inherit'
        });
      } catch (e) {
        // Hook may output and exit, this is normal
      }

      // Show hint file if exists
      if (fs.existsSync(hintFile)) {
        const hint = fs.readFileSync(hintFile, 'utf-8');
        console.log(hint);
      }
    } else {
      console.log('⚠️  启动 Hook 不存在');
      console.log('   请先运行: sumulige-claude template');
      console.log('   或: sumulige-claude sync');
    }
  }
};

// ============================================================================
// Helpers
// ============================================================================

function generateAgentsMd(config) {
  const agentsList = Object.entries(config.agents)
    .map(([name, agent]) => {
      const model = agent.model || config.model;
      return `### ${name}\n- **Model**: ${model}\n- **Role**: ${agent.role}`;
    })
    .join('\n\n');

  return `# AGENTS

<skills_system priority="1">

## Agent Orchestration

This project uses **Sumulige Claude** for multi-agent collaboration.

${agentsList}

## Usage

\`\`\`bash
# View agent status
sumulige-claude status

# Run agent task
sumulige-claude agent <task>

# List skills
sumulige-claude skill:list
\`\`\`

</skills_system>
`;
}

// ============================================================================
// Exports
// ============================================================================

/**
 * Run a command
 * @param {string} cmd - Command name
 * @param {Array} args - Command arguments
 */
function runCommand(cmd, args) {
  const command = commands[cmd];
  if (command) {
    command(...args);
  }
}

exports.runCommand = runCommand;
exports.commands = commands;
