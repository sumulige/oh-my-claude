/**
 * Commands - All CLI command implementations
 *
 * Extracted from cli.js for better organization
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadConfig, CONFIG_DIR, CONFIG_FILE, SKILLS_DIR, ensureDir, saveConfig } = require('./config');
const { copyRecursive, toTitleCase, CopyMode } = require('./utils');
const { runMigrations, TEMPLATE_VERSION } = require('./migrations');
const { checkUpdate, getCurrentVersion } = require('./version-check');

const TEMPLATE_DIR = path.join(__dirname, '../template');

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Count files in a directory recursively
 * @param {string} dirPath - Directory path
 * @returns {number} Number of files
 */
function countFiles(dirPath) {
  let count = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      // Skip certain directories
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'sessions') {
        count += countFiles(fullPath);
      }
    } else {
      count++;
    }
  }
  return count;
}

/**
 * Copy a single file with backup support
 * @param {string} srcPath - Source file path
 * @param {string} destPath - Destination file path
 * @param {string} mode - Copy mode (CopyMode enum)
 * @param {string} backupDir - Backup directory path
 * @param {string} displayName - Display name for logging
 */
function copySingleFile(srcPath, destPath, mode, backupDir, displayName) {
  if (!fs.existsSync(srcPath)) return;

  // File doesn't exist at destination - just copy
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    setExecutablePermission(destPath);
    console.log(`   ✅ ${displayName}`);
    return;
  }

  // File exists - handle based on mode
  switch (mode) {
    case CopyMode.SAFE:
      // Skip existing files
      console.log(`   ⊝ ${displayName} (kept existing)`);
      break;

    case CopyMode.FORCE:
      // Overwrite without backup
      fs.copyFileSync(srcPath, destPath);
      setExecutablePermission(destPath);
      console.log(`   ✅ ${displayName} (overwritten)`);
      break;

    case CopyMode.BACKUP:
    default:
      // Backup then overwrite
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const backupFileName = path.basename(destPath).replace(/\.[^.]+$/, '') + '.' + timestamp + '.bak';
      const backupPath = path.join(backupDir, backupFileName);

      fs.mkdirSync(backupDir, { recursive: true });
      fs.copyFileSync(destPath, backupPath);
      setExecutablePermission(backupPath);

      fs.copyFileSync(srcPath, destPath);
      setExecutablePermission(destPath);
      console.log(`   ✅ ${displayName} (backed up)`);
      break;
  }
}

/**
 * Set executable permission for script files
 * @param {string} filePath - File path
 */
function setExecutablePermission(filePath) {
  if (filePath.endsWith('.sh') || filePath.endsWith('.cjs')) {
    try {
      fs.chmodSync(filePath, 0o755);
    } catch (e) {
      // Ignore permission errors
    }
  }
}

// ============================================================================
// Commands
// ============================================================================

const commands = {
  // -------------------------------------------------------------------------
  init: (...args) => {
    const isInteractive = args.includes('--interactive') || args.includes('-i');

    if (isInteractive) {
      return commands['init:interactive']();
    }

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
    console.log('  smc sync                # Sync to current project');
    console.log('  smc skills:official     # View available skills');
    console.log('  smc init --interactive  # Interactive setup');
  },

  // -------------------------------------------------------------------------
  version: async () => {
    const current = getCurrentVersion();
    console.log(`v${current}`);

    // Check for updates asynchronously
    setImmediate(async () => {
      await checkUpdate({ force: false });
    });
  },

  // -------------------------------------------------------------------------
  'init:interactive': () => {
    const readline = require('readline');
    const COLORS = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      yellow: '\x1b[33m',
      gray: '\x1b[90m',
      cyan: '\x1b[36m'
    };

    const log = (msg, color = 'reset') => {
      console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
    };

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => {
      return new Promise(resolve => {
        rl.question(prompt, resolve);
      });
    };

    (async () => {
      log('', 'gray');
      log('🎯 SMC Interactive Setup', 'blue');
      log('=====================================', 'gray');
      log('', 'gray');

      // Step 1: Create config
      log('Step 1: Configuration', 'cyan');
      ensureDir(CONFIG_DIR);
      if (!fs.existsSync(CONFIG_FILE)) {
        saveConfig(loadConfig());
        log('✅ Created config', 'green');
      } else {
        log('✅ Config exists', 'green');
      }
      log('', 'gray');

      // Step 2: Install OpenSkills
      log('Step 2: OpenSkills', 'cyan');
      try {
        execSync('openskills --version', { stdio: 'ignore' });
        log('✅ OpenSkills already installed', 'green');
      } catch {
        log('Installing OpenSkills...', 'gray');
        try {
          execSync('npm i -g openskills', { stdio: 'pipe' });
          log('✅ OpenSkills installed', 'green');
        } catch (e) {
          log('⚠️  Failed to install OpenSkills', 'yellow');
        }
      }
      log('', 'gray');

      // Step 3: Select skills to install
      log('Step 3: Choose Skills to Install', 'cyan');
      log('', 'gray');
      log('Available skill groups:', 'gray');
      log('  1. 📄 Documents (docx, pdf, pptx, xlsx)', 'gray');
      log('  2. 🎨 Creative (frontend-design, algorithmic-art)', 'gray');
      log('  3. 🛠️ Development (mcp-builder, webapp-testing)', 'gray');
      log('  4. 📋 Workflow (doc-coauthoring, internal-comms)', 'gray');
      log('  5. ✨ All recommended skills', 'gray');
      log('  6. ⏭️  Skip skill installation', 'gray');
      log('', 'gray');

      const skillChoice = await question('Select (1-6) [default: 6]: ');

      const installSkills = async (source) => {
        try {
          execSync(`openskills install ${source} -y`, { stdio: 'pipe' });
          execSync('openskills sync -y', { stdio: 'pipe' });
          log('✅ Skills installed', 'green');
        } catch (e) {
          log('⚠️  Skill installation failed', 'yellow');
        }
      };

      switch (skillChoice.trim()) {
        case '1':
          log('Installing document skills...', 'gray');
          await installSkills('anthropics/skills');
          break;
        case '2':
          log('Installing creative skills...', 'gray');
          await installSkills('anthropics/skills');
          break;
        case '3':
          log('Installing development skills...', 'gray');
          await installSkills('anthropics/skills');
          break;
        case '4':
          log('Installing workflow skills...', 'gray');
          await installSkills('anthropics/skills');
          break;
        case '5':
          log('Installing all recommended skills...', 'gray');
          await installSkills('anthropics/skills');
          break;
        default:
          log('⏭️  Skipped skill installation', 'yellow');
          break;
      }
      log('', 'gray');

      // Step 4: Sync to current project
      log('Step 4: Sync to Current Project', 'cyan');
      const shouldSync = await question('Sync .claude/ to current directory? [Y/n]: ');
      if (shouldSync.toLowerCase() !== 'n') {
        try {
          execSync('smc sync', { stdio: 'inherit' });
        } catch (e) {
          log('⚠️  Sync failed (this is normal if not in a project directory)', 'yellow');
        }
      } else {
        log('⏭️  Skipped sync', 'yellow');
      }
      log('', 'gray');

      rl.close();

      log('=====================================', 'gray');
      log('🎉 Setup complete!', 'green');
      log('', 'gray');
      log('Useful commands:', 'gray');
      log('  smc status              Show configuration status', 'gray');
      log('  smc skills:official     List available skills', 'gray');
      log('  smc doctor              Check system health', 'gray');
      log('', 'gray');
    })();
  },

  // -------------------------------------------------------------------------
  sync: async () => {
    console.log('🔄 Syncing Sumulige Claude to current project...');
    console.log('');

    const projectDir = process.cwd();
    const projectConfigDir = path.join(projectDir, '.claude');
    const agentsFile = path.join(projectConfigDir, 'AGENTS.md');
    const readmeFile = path.join(projectConfigDir, 'README.md');
    const templateReadme = path.join(TEMPLATE_DIR, '.claude', 'README.md');

    // Create .claude directory
    ensureDir(projectConfigDir);

    // Run migrations (version-aware)
    const result = runMigrations(projectDir);
    if (result.migrations.length > 0) {
      console.log(`📦 Migrating project template → v${TEMPLATE_VERSION}`);
      result.migrations.forEach(m => {
        console.log(`   ✅ ${m.description}`);
      });
      console.log('');
    }

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

    // Check for updates (sync is already a network operation)
    await checkUpdate({ silent: false });
  },

  // -------------------------------------------------------------------------
  migrate: () => {
    console.log('🔧 Migrating project to latest format...');
    console.log('');

    const projectDir = process.cwd();
    const settingsFile = path.join(projectDir, '.claude', 'settings.json');

    if (!fs.existsSync(settingsFile)) {
      console.log('⚠️  No settings.json found in .claude/');
      console.log('   Run: smc template');
      return;
    }

    let settings;
    try {
      settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
    } catch (e) {
      console.log('❌ Invalid JSON in settings.json');
      return;
    }

    // 检测旧格式
    const isOldFormat = settings.matcher || (settings.hooks && typeof settings.hooks === 'object');

    if (!isOldFormat) {
      console.log('✅ Already using latest format');
      return;
    }

    // 读取新模板
    const templateSettings = path.join(TEMPLATE_DIR, '.claude', 'settings.json');
    if (!fs.existsSync(templateSettings)) {
      console.log('❌ Template settings.json not found');
      return;
    }

    const newSettings = fs.readFileSync(templateSettings, 'utf-8');
    fs.writeFileSync(settingsFile, newSettings);

    console.log('✅ Migrated settings.json to latest format');
    console.log('');
    console.log('Changes:');
    console.log('  - Old format: {"matcher": "...", "hooks": [...]}');
    console.log('  - New format: {"UserPromptSubmit": [...], "PostToolUse": [...]}');
    console.log('');
    console.log('ℹ️  Hooks will now work correctly!');
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
  template: (...args) => {
    // Parse arguments
    let targetPath = process.cwd();
    let copyMode = CopyMode.BACKUP;  // Default: backup before overwrite
    let showHelp = false;

    for (const arg of args) {
      if (arg === '--safe') {
        copyMode = CopyMode.SAFE;
      } else if (arg === '--force') {
        copyMode = CopyMode.FORCE;
      } else if (arg === '--help' || arg === '-h') {
        showHelp = true;
      } else if (!arg.startsWith('--')) {
        targetPath = path.resolve(arg);
      }
    }

    // Show help message
    if (showHelp) {
      console.log('');
      console.log('📋 smc template - Deploy Claude Code project template');
      console.log('');
      console.log('USAGE:');
      console.log('  smc template [path] [options]');
      console.log('');
      console.log('ARGUMENTS:');
      console.log('  path        Target directory (default: current directory)');
      console.log('');
      console.log('OPTIONS:');
      console.log('  --safe      Skip existing files (no overwrite)');
      console.log('  --force     Overwrite without backup (use for new projects)');
      console.log('  --help, -h  Show this help message');
      console.log('');
      console.log('DEFAULT BEHAVIOR:');
      console.log('  Backup existing files before overwriting.');
      console.log('  Backups stored in: .claude/backup/');
      console.log('  Backup format: filename.YYYY-MM-DD.bak');
      console.log('');
      console.log('EXAMPLES:');
      console.log('  smc template                 # Deploy to current dir (with backup)');
      console.log('  smc template ./my-project    # Deploy to specific dir');
      console.log('  smc template --safe          # Skip existing files');
      console.log('  smc template --force         # Overwrite everything');
      console.log('');
      console.log('COMPARISON:');
      console.log('  smc template  = Full deployment (overwrites with backup)');
      console.log('  smc sync       = Incremental update (only adds missing)');
      console.log('');
      return;
    }

    const targetDir = targetPath;
    const backupDir = path.join(targetDir, '.claude', 'backup');
    const stats = { copied: 0, skipped: 0, backedup: 0, backups: [] };

    console.log('🚀 Initializing Claude Code project template...');
    console.log('   Target:', targetDir);
    console.log('   Mode:', copyMode === CopyMode.SAFE ? 'SAFE (skip existing)' : 
                copyMode === CopyMode.FORCE ? 'FORCE (overwrite)' : 
                'BACKUP (backup before overwrite)');
    console.log('');

    // Warn if existing .claude directory found
    const existingClaudeDir = path.join(targetDir, '.claude');
    if (fs.existsSync(existingClaudeDir)) {
      if (copyMode === CopyMode.FORCE) {
        console.log('⚠️  Existing .claude/ directory found -- will be overwritten!');
        console.log('');
      } else if (copyMode === CopyMode.BACKUP) {
        console.log('ℹ️  Existing files will be backed up to: .claude/backup/');
        console.log('');
      }
    }

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
      path.join(targetDir, 'development/todos/archived'),
      backupDir
    ];

    dirs.forEach(ensureDir);
    console.log('   ✅ Directories created');
    console.log('');

    // Copy files
    console.log('📋 Copying template files...');

    const claudeTemplateDir = path.join(TEMPLATE_DIR, '.claude');
    const targetClaudeDir = path.join(targetDir, '.claude');

    // Files to copy
    const filesToCopy = [
      { src: 'CLAUDE-template.md', dest: 'CLAUDE.md', name: '.claude/CLAUDE.md' },
      { src: 'README.md', dest: 'README.md', name: '.claude/README.md' },
      { src: 'settings.json', dest: 'settings.json', name: '.claude/settings.json' },
      { src: 'boris-optimizations.md', dest: 'boris-optimizations.md', name: '.claude/boris-optimizations.md' }
    ];

    filesToCopy.forEach(({ src, dest, name }) => {
      const srcPath = path.join(claudeTemplateDir, src);
      const destPath = path.join(targetClaudeDir, dest);
      if (fs.existsSync(srcPath)) {
        const action = copySingleFile(srcPath, destPath, copyMode, backupDir, name);
        if (action === 'copied') stats.copied++;
        else if (action === 'skipped') stats.skipped++;
        else if (action === 'backedup') { stats.copied++; stats.backedup++; }
      }
    });

    // Directories to copy recursively
    const dirsToCopy = [
      { src: 'hooks', name: '.claude/hooks/' },
      { src: 'commands', name: '.claude/commands/' },
      { src: 'skills', name: '.claude/skills/' },
      { src: 'templates', name: '.claude/templates/' },
      { src: 'thinking-routes', name: '.claude/thinking-routes/' },
      { src: 'rag', name: '.claude/rag/' }
    ];

    dirsToCopy.forEach(({ src, name }) => {
      const srcPath = path.join(claudeTemplateDir, src);
      if (fs.existsSync(srcPath)) {
        const result = copyRecursive(srcPath, path.join(targetClaudeDir, src), copyMode, backupDir);
        const fileCount = result.copied + result.skipped + result.backedup;
        const suffix = result.skipped > 0 ? ` (${result.skipped} skipped)` : '';
        console.log(`   ✅ ${name} (${fileCount} files${suffix})`);
        stats.copied += result.copied;
        stats.skipped += result.skipped;
        stats.backedup += result.backedup;
      }
    });

    // Copy prompts
    const promptsDir = path.join(TEMPLATE_DIR, 'prompts');
    if (fs.existsSync(promptsDir)) {
      const result = copyRecursive(promptsDir, path.join(targetDir, 'prompts'), copyMode, backupDir);
      const fileCount = result.copied + result.skipped + result.backedup;
      const suffix = result.skipped > 0 ? ` (${result.skipped} skipped)` : '';
      console.log(`   ✅ prompts/ (${fileCount} files${suffix})`);
      stats.copied += result.copied;
      stats.skipped += result.skipped;
      stats.backedup += result.backedup;
    }

    // Copy todos
    const todosDir = path.join(TEMPLATE_DIR, 'development', 'todos');
    if (fs.existsSync(todosDir)) {
      const result = copyRecursive(todosDir, path.join(targetDir, 'development', 'todos'), copyMode, backupDir);
      const fileCount = result.copied + result.skipped + result.backedup;
      const suffix = result.skipped > 0 ? ` (${result.skipped} skipped)` : '';
      console.log(`   ✅ development/todos/ (${fileCount} files${suffix})`);
      stats.copied += result.copied;
      stats.skipped += result.skipped;
      stats.backedup += result.backedup;
    }

    // Root files
    const rootFiles = ['project-paradigm.md', 'thinkinglens-silent.md', 'CLAUDE-template.md'];
    rootFiles.forEach(file => {
      const src = path.join(TEMPLATE_DIR, file);
      const dest = path.join(targetDir, file);
      if (fs.existsSync(src)) {
        const action = copySingleFile(src, dest, copyMode, backupDir, file);
        if (action === 'copied') stats.copied++;
        else if (action === 'skipped') stats.skipped++;
        else if (action === 'backedup') { stats.copied++; stats.backedup++; }
      }
    });

    // Create memory files
    console.log('');
    console.log('📝 Creating memory files...');
    if (!fs.existsSync(path.join(targetClaudeDir, 'MEMORY.md'))) {
      fs.writeFileSync(path.join(targetClaudeDir, 'MEMORY.md'), '# Memory\n\n<!-- Project memory updated by AI -->\n');
      console.log('   ✅ MEMORY.md');
    } else {
      console.log('   ⊝ MEMORY.md (already exists)');
    }
    if (!fs.existsSync(path.join(targetClaudeDir, 'PROJECT_LOG.md'))) {
      fs.writeFileSync(path.join(targetClaudeDir, 'PROJECT_LOG.md'), '# Project Log\n\n<!-- Build history and decisions -->\n');
      console.log('   ✅ PROJECT_LOG.md');
    } else {
      console.log('   ⊝ PROJECT_LOG.md (already exists)');
    }

    // Create ANCHORS.md
    const anchorsPath = path.join(targetClaudeDir, 'ANCHORS.md');
    if (!fs.existsSync(anchorsPath)) {
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
6. .claude/rag/skill-index.json → RAG skill index ⭐
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
      fs.writeFileSync(anchorsPath, anchorsContent);
      console.log('   ✅ .claude/ANCHORS.md');
    } else {
      console.log('   ⊝ .claude/ANCHORS.md (already exists)');
    }

    // Write version file
    const { setProjectVersion } = require('./migrations');
    setProjectVersion(targetDir, TEMPLATE_VERSION);
    console.log(`   ✅ .claude/.version (v${TEMPLATE_VERSION})`);

    // Show summary
    console.log('');
    console.log('📊 Summary:');
    console.log(`   ✅ Copied: ${stats.copied} files`);
    if (stats.skipped > 0) {
      console.log(`   ⊝ Skipped: ${stats.skipped} files (already exist)`);
    }
    if (stats.backedup > 0) {
      console.log(`   💾 Backed up: ${stats.backedup} files → .claude/backup/`);
    }

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
    console.log('   • TODO management system v2.0 (R-D-T lifecycle)');
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
  },

  // -------------------------------------------------------------------------
  ultrathink: () => {
    const COLORS = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      yellow: '\x1b[33m',
      gray: '\x1b[90m'
    };

    const log = (msg, color = 'reset') => {
      console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
    };

    log('', 'gray');
    log('🧠 UltraThink Mode', 'blue');
    log('=====================================', 'gray');
    log('', 'gray');
    log('✅ Deep thinking enabled', 'green');
    log('', 'gray');
    log('Usage:', 'gray');
    log('  Mention "ultrathink" or "深度思考" in conversation', 'gray');
    log('', 'gray');
    log('=====================================', 'gray');
    log('', 'gray');
  },

  // -------------------------------------------------------------------------
  'skills:official': () => {
    const fs = require('fs');
    const path = require('path');
    const COLORS = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      yellow: '\x1b[33m',
      gray: '\x1b[90m',
      cyan: '\x1b[36m',
      magenta: '\x1b[35m'
    };

    const log = (msg, color = 'reset') => {
      console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
    };

    const officialSkillsFile = path.join(__dirname, '../config/official-skills.json');

    if (!fs.existsSync(officialSkillsFile)) {
      log('⚠ Official skills registry not found', 'yellow');
      return;
    }

    const registry = JSON.parse(fs.readFileSync(officialSkillsFile, 'utf-8'));

    log('', 'gray');
    log('📚 Official Skills (anthropics/skills)', 'blue');
    log('=====================================', 'gray');
    log('', 'gray');
    log(`Source: ${registry.source}`, 'gray');
    log(`Updated: ${registry.last_updated}`, 'gray');
    log('', 'gray');

    // Check which skills are already installed
    const skillsDir = path.join(process.env.HOME || process.env.USERPROFILE, '.claude/skills');
    const installedSkills = fs.existsSync(skillsDir)
      ? fs.readdirSync(skillsDir).filter(f => {
        const dir = path.join(skillsDir, f);
        return fs.statSync(dir).isDirectory();
      })
      : [];

    // Group by category
    const byCategory = {};
    for (const cat of Object.values(registry.categories)) {
      byCategory[cat.name] = { skills: [], ...cat };
    }

    for (const skill of registry.skills) {
      const catName = registry.categories[skill.category].name;
      const isInstalled = installedSkills.includes(skill.name);
      byCategory[catName].skills.push({ ...skill, isInstalled });
    }

    // Display by category
    for (const [catName, cat] of Object.entries(byCategory)) {
      if (cat.skills.length === 0) continue;

      log(`${cat.icon} ${catName}`, 'cyan');
      log(`   ${cat.description}`, 'gray');
      log('', 'gray');

      for (const skill of cat.skills) {
        const status = skill.isInstalled ? '✓' : ' ';
        const rec = skill.recommended ? ' [推荐]' : '';
        const color = skill.isInstalled ? 'green' : 'reset';
        log(`  [${status}] ${skill.name}${rec}`, color);
        log(`      ${skill.description}`, 'gray');
      }
      log('', 'gray');
    }

    log('=====================================', 'gray');
    log('', 'gray');
    log('Commands:', 'gray');
    log('  smc skills:install-official <name>   Install a skill', 'gray');
    log('  smc skills:install-all               Install all recommended', 'gray');
    log('', 'gray');
  },

  // -------------------------------------------------------------------------
  'skills:install-official': (skillName) => {
    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');
    const COLORS = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      yellow: '\x1b[33m',
      gray: '\x1b[90m',
      red: '\x1b[31m'
    };

    const log = (msg, color = 'reset') => {
      console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
    };

    const officialSkillsFile = path.join(__dirname, '../config/official-skills.json');

    if (!fs.existsSync(officialSkillsFile)) {
      log('⚠ Official skills registry not found', 'yellow');
      return;
    }

    const registry = JSON.parse(fs.readFileSync(officialSkillsFile, 'utf-8'));

    // Check if openskills is installed
    try {
      execSync('openskills --version', { stdio: 'ignore' });
    } catch {
      log('⚠ OpenSkills not installed', 'yellow');
      log('', 'gray');
      log('Installing OpenSkills...', 'gray');
      try {
        execSync('npm i -g openskills', { stdio: 'inherit' });
        log('✅ OpenSkills installed', 'green');
      } catch (e) {
        log('❌ Failed to install OpenSkills', 'red');
        log('   Run: npm i -g openskills', 'gray');
        return;
      }
    }

    // Find the skill
    const skill = registry.skills.find(s => s.name === skillName);

    if (!skill) {
      log(`❌ Skill "${skillName}" not found in official registry`, 'red');
      log('', 'gray');
      log('Run: smc skills:official');
      log('to see available skills.', 'gray');
      return;
    }

    log(`📦 Installing: ${skillName}`, 'blue');
    log('', 'gray');
    log(`Source: ${skill.source}`, 'gray');
    log(`License: ${skill.license}`, 'gray');
    log('', 'gray');

    try {
      execSync(`openskills install ${skill.source} -y`, { stdio: 'inherit' });
      execSync('openskills sync -y', { stdio: 'pipe' });
      log('', 'gray');
      log('✅ Skill installed successfully', 'green');
      log('', 'gray');
      log('The skill is now available in your conversations.', 'gray');
    } catch (e) {
      log('❌ Installation failed', 'red');
    }
  },

  // -------------------------------------------------------------------------
  'skills:install-all': () => {
    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');
    const COLORS = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      yellow: '\x1b[33m',
      gray: '\x1b[90m',
      red: '\x1b[31m',
      cyan: '\x1b[36m'
    };

    const log = (msg, color = 'reset') => {
      console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
    };

    const officialSkillsFile = path.join(__dirname, '../config/official-skills.json');

    if (!fs.existsSync(officialSkillsFile)) {
      log('⚠ Official skills registry not found', 'yellow');
      return;
    }

    const registry = JSON.parse(fs.readFileSync(officialSkillsFile, 'utf-8'));
    const recommended = registry.skills.filter(s => s.recommended);

    log('', 'gray');
    log('📦 Installing All Recommended Skills', 'blue');
    log('=====================================', 'gray');
    log('', 'gray');
    log(`Installing ${recommended.length} skills...`, 'gray');
    log('', 'gray');

    // Check if openskills is installed
    try {
      execSync('openskills --version', { stdio: 'ignore' });
    } catch {
      log('⚠ OpenSkills not installed. Installing...', 'yellow');
      try {
        execSync('npm i -g openskills', { stdio: 'inherit' });
        log('✅ OpenSkills installed', 'green');
        log('', 'gray');
      } catch (e) {
        log('❌ Failed to install OpenSkills', 'red');
        return;
      }
    }

    // Install anthropics/skills (includes all skills)
    try {
      log(`Installing ${registry.source}...`, 'cyan');
      execSync(`openskills install ${registry.source} -y`, { stdio: 'inherit' });
      execSync('openskills sync -y', { stdio: 'pipe' });
      log('', 'gray');
      log('✅ All skills installed successfully', 'green');
      log('', 'gray');
      log('Installed skills:', 'gray');
      recommended.forEach(s => log(`  • ${s.name}`, 'gray'));
      log('', 'gray');
      log('These skills are now available in your conversations.', 'gray');
    } catch (e) {
      log('❌ Installation failed', 'red');
    }
  },

  // -------------------------------------------------------------------------
  doctor: () => {
    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');
    const COLORS = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      yellow: '\x1b[33m',
      gray: '\x1b[90m',
      red: '\x1b[31m',
      cyan: '\x1b[36m'
    };

    const log = (msg, color = 'reset') => {
      console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
    };

    log('', 'gray');
    log('🏥 SMC Health Check', 'blue');
    log('=====================================', 'gray');
    log('', 'gray');

    const checks = [];
    let passCount = 0;
    let warnCount = 0;
    let failCount = 0;

    // Check 1: Global config
    const globalConfigDir = path.join(process.env.HOME || process.env.USERPROFILE, '.claude');
    const globalConfigFile = path.join(globalConfigDir, 'config.json');

    if (fs.existsSync(globalConfigFile)) {
      checks.push({ name: 'Global config', status: 'pass', msg: globalConfigFile });
      passCount++;
    } else {
      checks.push({ name: 'Global config', status: 'fail', msg: 'Run: smc init' });
      failCount++;
    }

    // Check 2: Project .claude directory
    const projectDir = process.cwd();
    const projectClaudeDir = path.join(projectDir, '.claude');

    if (fs.existsSync(projectClaudeDir)) {
      checks.push({ name: 'Project .claude/', status: 'pass', msg: projectClaudeDir });
      passCount++;

      // Check for key files
      const agentsFile = path.join(projectClaudeDir, 'AGENTS.md');
      if (fs.existsSync(agentsFile)) {
        checks.push({ name: 'AGENTS.md', status: 'pass', msg: 'Generated' });
        passCount++;
      } else {
        checks.push({ name: 'AGENTS.md', status: 'warn', msg: 'Run: smc sync' });
        warnCount++;
      }

      // Check MEMORY.md age
      const memoryFile = path.join(projectClaudeDir, 'MEMORY.md');
      if (fs.existsSync(memoryFile)) {
        const stats = fs.statSync(memoryFile);
        const daysSinceUpdate = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate > 30) {
          checks.push({ name: 'MEMORY.md', status: 'warn', msg: `Updated ${Math.floor(daysSinceUpdate)} days ago` });
          warnCount++;
        } else {
          checks.push({ name: 'MEMORY.md', status: 'pass', msg: `Updated ${Math.floor(daysSinceUpdate)} days ago` });
          passCount++;
        }
      } else {
        checks.push({ name: 'MEMORY.md', status: 'warn', msg: 'Not found' });
        warnCount++;
      }

      // Check hooks
      const hooksDir = path.join(projectClaudeDir, 'hooks');
      if (fs.existsSync(hooksDir)) {
        const hookFiles = fs.readdirSync(hooksDir).filter(f => !f.startsWith('.'));
        checks.push({ name: 'Hooks', status: 'pass', msg: `${hookFiles.length} hooks` });
        passCount++;
      } else {
        checks.push({ name: 'Hooks', status: 'warn', msg: 'No hooks directory' });
        warnCount++;
      }

      // Check skills
      const skillsDir = path.join(projectClaudeDir, 'skills');
      if (fs.existsSync(skillsDir)) {
        const skillDirs = fs.readdirSync(skillsDir).filter(f => {
          const dir = path.join(skillsDir, f);
          return fs.statSync(dir).isDirectory() && f !== 'template' && f !== 'examples';
        });
        checks.push({ name: 'Project Skills', status: 'pass', msg: `${skillDirs.length} skills` });
        passCount++;
      } else {
        checks.push({ name: 'Project Skills', status: 'warn', msg: 'No skills directory' });
        warnCount++;
      }
    } else {
      checks.push({ name: 'Project .claude/', status: 'warn', msg: 'Run: smc template or smc sync' });
      warnCount++;
    }

    // Check 3: OpenSkills
    try {
      execSync('openskills --version', { stdio: 'ignore' });
      const globalSkillsDir = path.join(globalConfigDir, 'skills');
      if (fs.existsSync(globalSkillsDir)) {
        const skillCount = fs.readdirSync(globalSkillsDir).filter(f => {
          const dir = path.join(globalSkillsDir, f);
          return fs.statSync(dir).isDirectory() && !f.startsWith('.');
        }).length;
        checks.push({ name: 'OpenSkills', status: 'pass', msg: `${skillCount} global skills` });
        passCount++;
      } else {
        checks.push({ name: 'OpenSkills', status: 'pass', msg: 'Installed' });
        passCount++;
      }
    } catch {
      checks.push({ name: 'OpenSkills', status: 'warn', msg: 'Not installed (run: npm i -g openskills)' });
      warnCount++;
    }

    // Check 4: Git
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore', cwd: projectDir });
      checks.push({ name: 'Git', status: 'pass', msg: 'Repository detected' });
      passCount++;
    } catch {
      checks.push({ name: 'Git', status: 'warn', msg: 'Not a git repository' });
      warnCount++;
    }

    // Display results
    for (const check of checks) {
      const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
      const color = check.status === 'pass' ? 'green' : check.status === 'warn' ? 'yellow' : 'red';
      log(`${icon} ${check.name}`, color);
      log(`   ${check.msg}`, 'gray');
      log('', 'gray');
    }

    log('=====================================', 'gray');
    log(`Summary: ${passCount} passed, ${warnCount} warnings${failCount > 0 ? `, ${failCount} failed` : ''}`, 'gray');
    log('', 'gray');

    if (failCount > 0) {
      log('Fix failed checks to continue.', 'red');
    }
  },

  // -------------------------------------------------------------------------
  'skills:search': (keyword) => {
    const fs = require('fs');
    const path = require('path');
    const COLORS = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      yellow: '\x1b[33m',
      gray: '\x1b[90m',
      cyan: '\x1b[36m'
    };

    const log = (msg, color = 'reset') => {
      console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
    };

    if (!keyword) {
      log('Usage: smc skills:search <keyword>', 'yellow');
      log('', 'gray');
      log('Examples:', 'gray');
      log('  smc skills:search pdf', 'gray');
      log('  smc skills:search "前端设计"', 'gray');
      return;
    }

    log('', 'gray');
    log(`🔍 Searching for: "${keyword}"`, 'blue');
    log('=====================================', 'gray');
    log('', 'gray');

    const results = [];
    const lowerKeyword = keyword.toLowerCase();

    // Search in official skills registry
    const officialSkillsFile = path.join(__dirname, '../config/official-skills.json');
    if (fs.existsSync(officialSkillsFile)) {
      const registry = JSON.parse(fs.readFileSync(officialSkillsFile, 'utf-8'));

      for (const skill of registry.skills) {
        const matchName = skill.name.toLowerCase().includes(lowerKeyword);
        const matchDesc = skill.description.toLowerCase().includes(lowerKeyword);
        const matchCat = registry.categories[skill.category]?.name.toLowerCase().includes(lowerKeyword);

        if (matchName || matchDesc || matchCat) {
          results.push({
            name: skill.name,
            description: skill.description,
            category: registry.categories[skill.category]?.name,
            source: 'official',
            recommended: skill.recommended
          });
        }
      }
    }

    // Search in sources.yaml
    const sourcesFile = path.join(__dirname, '../sources.yaml');
    if (fs.existsSync(sourcesFile)) {
      const content = fs.readFileSync(sourcesFile, 'utf-8');
      // Simple YAML parsing for skills
      const lines = content.split('\n');
      let currentSkill = null;

      for (const line of lines) {
        const nameMatch = line.match(/^\s*-\s*name:\s*(.+)$/);
        if (nameMatch) {
          currentSkill = { name: nameMatch[1].trim(), source: 'marketplace' };
          if (currentSkill.name.toLowerCase().includes(lowerKeyword)) {
            results.push(currentSkill);
          }
        }
        const descMatch = line.match(/^\s+description:\s*"(.+)"$/);
        if (descMatch && currentSkill) {
          currentSkill.description = descMatch[1];
          if (currentSkill.description.toLowerCase().includes(lowerKeyword)) {
            results.push({ ...currentSkill });
          }
        }
      }
    }

    // Search in global skills
    const globalSkillsDir = path.join(process.env.HOME || process.env.USERPROFILE, '.claude/skills');
    if (fs.existsSync(globalSkillsDir)) {
      const skillDirs = fs.readdirSync(globalSkillsDir).filter(f => {
        const dir = path.join(globalSkillsDir, f);
        return fs.statSync(dir).isDirectory() && !f.startsWith('.');
      });

      for (const skillName of skillDirs) {
        if (skillName.toLowerCase().includes(lowerKeyword)) {
          // Check if already in results
          if (!results.some(r => r.name === skillName)) {
            const skillFile = path.join(globalSkillsDir, skillName, 'SKILL.md');
            let description = '';
            if (fs.existsSync(skillFile)) {
              const content = fs.readFileSync(skillFile, 'utf-8');
              const descMatch = content.match(/description:\s*(.+)/);
              if (descMatch) description = descMatch[1];
            }
            results.push({
              name: skillName,
              description: description || 'Local skill',
              source: 'installed'
            });
          }
        }
      }
    }

    // Display results
    if (results.length === 0) {
      log('No skills found matching your search.', 'yellow');
    } else {
      for (const result of results) {
        const sourceIcon = result.source === 'official' ? '🔷' : result.source === 'marketplace' ? '📦' : '✓';
        const rec = result.recommended ? ' [推荐]' : '';
        log(`${sourceIcon} ${result.name}${rec}`, 'cyan');
        if (result.description) {
          log(`   ${result.description}`, 'gray');
        }
        if (result.category) {
          log(`   分类: ${result.category}`, 'gray');
        }
        log('', 'gray');
      }
    }

    log('=====================================', 'gray');
    log(`Found ${results.length} result(s)`, 'gray');
    log('', 'gray');
  },

  // -------------------------------------------------------------------------
  'skills:validate': (skillPath) => {
    const fs = require('fs');
    const path = require('path');
    const COLORS = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      yellow: '\x1b[33m',
      gray: '\x1b[90m',
      red: '\x1b[31m'
    };

    const log = (msg, color = 'reset') => {
      console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
    };

    // Default to current directory if not specified
    const targetPath = skillPath || path.join(process.cwd(), '.claude/skills');

    if (!fs.existsSync(targetPath)) {
      log(`❌ Path not found: ${targetPath}`, 'red');
      return;
    }

    log('', 'gray');
    log('🔍 Validating Skills', 'blue');
    log('=====================================', 'gray');
    log('', 'gray');

    const checks = [];
    let passCount = 0;
    let failCount = 0;

    // Check if it's a directory or a single skill
    const stats = fs.statSync(targetPath);

    const validateSkill = (skillDir) => {
      const skillName = path.basename(skillDir);
      const skillFile = path.join(skillDir, 'SKILL.md');
      const errors = [];
      const warnings = [];

      // Check SKILL.md exists
      if (!fs.existsSync(skillFile)) {
        errors.push('SKILL.md not found');
        return { name: skillName, errors, warnings };
      }

      // Parse SKILL.md
      const content = fs.readFileSync(skillFile, 'utf-8');
      const frontmatterMatch = content.match(/^---\n(.*?)\n---/s);

      if (!frontmatterMatch) {
        errors.push('No frontmatter found (--- delimited YAML required)');
      } else {
        const frontmatter = frontmatterMatch[1];

        // Check required fields
        if (!frontmatter.match(/name:\s*.+/)) {
          errors.push('Missing "name" in frontmatter');
        }
        if (!frontmatter.match(/description:\s*.+/)) {
          warnings.push('Missing "description" in frontmatter (recommended)');
        }
      }

      // Check for references directory if referenced
      if (content.includes('references/') && !fs.existsSync(path.join(skillDir, 'references'))) {
        warnings.push('Content references "references/" but directory not found');
      }

      return { name: skillName, errors, warnings };
    };

    if (stats.isDirectory()) {
      // Check if it's a skills directory or a single skill
      const skillFile = path.join(targetPath, 'SKILL.md');
      if (fs.existsSync(skillFile)) {
        // Single skill
        const result = validateSkill(targetPath);
        checks.push(result);
      } else {
        // Skills directory - validate all subdirectories
        const entries = fs.readdirSync(targetPath);
        for (const entry of entries) {
          const entryPath = path.join(targetPath, entry);
          const entryStats = fs.statSync(entryPath);
          if (entryStats.isDirectory() && !entry.startsWith('.')) {
            const result = validateSkill(entryPath);
            checks.push(result);
          }
        }
      }
    }

    // Display results
    for (const check of checks) {
      if (check.errors.length === 0 && check.warnings.length === 0) {
        log(`✅ ${check.name}`, 'green');
        passCount++;
      } else if (check.errors.length === 0) {
        log(`⚠️  ${check.name}`, 'yellow');
        passCount++;
      } else {
        log(`❌ ${check.name}`, 'red');
        failCount++;
      }

      for (const error of check.errors) {
        log(`   ❌ ${error}`, 'red');
      }
      for (const warning of check.warnings) {
        log(`   ⚠️  ${warning}`, 'yellow');
      }
      log('', 'gray');
    }

    log('=====================================', 'gray');
    log(`Validated ${checks.length} skill(s): ${passCount} passed${failCount > 0 ? `, ${failCount} failed` : ''}`, 'gray');
    log('', 'gray');
  },

  // -------------------------------------------------------------------------
  'skills:update': () => {
    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');
    const COLORS = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      yellow: '\x1b[33m',
      gray: '\x1b[90m',
      red: '\x1b[31m'
    };

    const log = (msg, color = 'reset') => {
      console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
    };

    log('', 'gray');
    log('🔄 Updating Official Skills List', 'blue');
    log('=====================================', 'gray');
    log('', 'gray');

    // Fetch latest skills from anthropics/skills
    const tempDir = path.join(__dirname, '../.tmp');
    const repoUrl = 'https://github.com/anthropics/skills.git';

    try {
      // Create temp dir
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const cloneDir = path.join(tempDir, 'anthropics-skills');

      // Remove existing clone if present
      const rimraf = (dir) => {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      };

      rimraf(cloneDir);

      log('Cloning anthropics/skills...', 'gray');
      execSync(`git clone --depth 1 ${repoUrl} ${cloneDir}`, { stdio: 'pipe' });

      // Read skills directory to get available skills
      const skillsDir = path.join(cloneDir, 'skills');
      const skillCategories = fs.readdirSync(skillsDir).filter(f => {
        const dir = path.join(skillsDir, f);
        return fs.statSync(dir).isDirectory();
      });

      log(`Found ${skillCategories.length} skills in repository`, 'gray');
      log('', 'gray');

      // Update the registry file
      const registryFile = path.join(__dirname, '../config/official-skills.json');
      let registry = { version: '1.0.0', last_updated: new Date().toISOString().split('T')[0], source: 'anthropics/skills', categories: {}, skills: [] };

      if (fs.existsSync(registryFile)) {
        registry = JSON.parse(fs.readFileSync(registryFile, 'utf-8'));
      }

      // Update timestamp
      registry.last_updated = new Date().toISOString().split('T')[0];

      fs.writeFileSync(registryFile, JSON.stringify(registry, null, 2));

      // Cleanup
      rimraf(cloneDir);

      log('✅ Official skills list updated', 'green');
      log(`   Updated: ${registry.last_updated}`, 'gray');
      log('', 'gray');
      log('Run: smc skills:official', 'gray');
    } catch (e) {
      log('❌ Update failed', 'red');
      log(`   ${e.message}`, 'gray');
    }
  },

  // -------------------------------------------------------------------------
  config: (action, key, value) => {
    const fs = require('fs');
    const path = require('path');
    const { loadConfig, saveConfig, CONFIG_FILE } = require('./config');
    const COLORS = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      yellow: '\x1b[33m',
      gray: '\x1b[90m',
      red: '\x1b[31m'
    };

    const log = (msg, color = 'reset') => {
      console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
    };

    if (!action) {
      // Show current config
      const config = loadConfig();
      log('', 'gray');
      log('⚙️  SMC Configuration', 'blue');
      log('=====================================', 'gray');
      log('', 'gray');
      log(`File: ${CONFIG_FILE}`, 'gray');
      log('', 'gray');
      log(JSON.stringify(config, null, 2));
      log('', 'gray');
      log('=====================================', 'gray');
      log('', 'gray');
      log('Commands:', 'gray');
      log('  smc config get <key>     Get a config value', 'gray');
      log('  smc config set <key> <value>  Set a config value', 'gray');
      log('', 'gray');
      return;
    }

    if (action === 'get') {
      if (!key) {
        log('Usage: smc config get <key>', 'yellow');
        return;
      }
      const config = loadConfig();
      const keys = key.split('.');
      let value = config;
      for (const k of keys) {
        value = value?.[k];
      }
      if (value !== undefined) {
        log(`${key}: ${JSON.stringify(value, null, 2)}`, 'green');
      } else {
        log(`Key not found: ${key}`, 'yellow');
      }
    } else if (action === 'set') {
      if (!key || value === undefined) {
        log('Usage: smc config set <key> <value>', 'yellow');
        return;
      }
      const config = loadConfig();
      const keys = key.split('.');
      let target = config;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {};
        target = target[keys[i]];
      }
      // Parse value (try JSON, fallback to string)
      try {
        target[keys[keys.length - 1]] = JSON.parse(value);
      } catch {
        target[keys[keys.length - 1]] = value;
      }
      saveConfig(config);
      log(`✅ Set ${key} = ${target[keys[keys.length - 1]]}`, 'green');
    } else {
      log(`Unknown action: ${action}`, 'red');
      log('Valid actions: get, set', 'gray');
    }
  },

  // -------------------------------------------------------------------------
  'skills:publish': (skillPath) => {
    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');
    const COLORS = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      yellow: '\x1b[33m',
      gray: '\x1b[90m',
      red: '\x1b[31m',
      cyan: '\x1b[36m'
    };

    const log = (msg, color = 'reset') => {
      console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
    };

    // Default to current directory's skills folder
    const targetPath = skillPath || path.join(process.cwd(), '.claude/skills');

    if (!fs.existsSync(targetPath)) {
      log(`❌ Path not found: ${targetPath}`, 'red');
      log('', 'gray');
      log('Usage: smc skills:publish [skill-path]', 'yellow');
      log('  Creates a GitHub repo with your skill', 'gray');
      return;
    }

    log('', 'gray');
    log('📦 Publish Skill to GitHub', 'blue');
    log('=====================================', 'gray');
    log('', 'gray');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => {
      return new Promise(resolve => {
        rl.question(prompt, resolve);
      });
    };

    (async () => {
      // Get skill info
      const stat = fs.statSync(targetPath);
      let skillName, skillDir;

      if (stat.isDirectory()) {
        const skillFile = path.join(targetPath, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          // Single skill directory
          skillDir = targetPath;
          skillName = path.basename(targetPath);
        } else {
          // Skills directory - ask which skill
          const entries = fs.readdirSync(targetPath).filter(f => {
            const dir = path.join(targetPath, f);
            return fs.statSync(dir).isDirectory() && !f.startsWith('.') && f !== 'template' && f !== 'examples';
          });

          if (entries.length === 0) {
            log('❌ No skills found in directory', 'red');
            rl.close();
            return;
          }

          log('Found skills:', 'gray');
          entries.forEach((e, i) => log(`  ${i + 1}. ${e}`, 'gray'));
          log('', 'gray');

          const choice = await question('Select skill [1]: ');
          const index = parseInt(choice || '1') - 1;
          skillName = entries[index] || entries[0];
          skillDir = path.join(targetPath, skillName);
        }
      } else {
        log('❌ Path must be a directory', 'red');
        rl.close();
        return;
      }

      // Read SKILL.md to get info
      const skillFile = path.join(skillDir, 'SKILL.md');
      if (!fs.existsSync(skillFile)) {
        log('❌ SKILL.md not found. A skill must have SKILL.md', 'red');
        rl.close();
        return;
      }

      const skillContent = fs.readFileSync(skillFile, 'utf-8');
      const nameMatch = skillContent.match(/name:\s*(.+)/);
      const descMatch = skillContent.match(/description:\s*(.+)/);
      const displayName = nameMatch ? nameMatch[1].trim() : skillName;
      const description = descMatch ? descMatch[1].trim() : '';

      log(`Skill: ${displayName}`, 'cyan');
      if (description) {
        log(`Description: ${description}`, 'gray');
      }
      log(`Path: ${skillDir}`, 'gray');
      log('', 'gray');

      // Get GitHub info
      const githubUser = await question('GitHub username: ');
      if (!githubUser) {
        log('❌ GitHub username required', 'red');
        rl.close();
        return;
      }

      const repoName = await question(`Repository name [${skillName}]: `) || skillName;
      const isPrivate = await question('Private repo? [y/N]: ');

      rl.close();

      log('', 'gray');
      log('📝 Instructions:', 'yellow');
      log('', 'gray');
      log(`1. Create GitHub repo:`, 'gray');
      log(`   https://github.com/new`, 'gray');
      log(`   Name: ${repoName}`, 'gray');
      log(`   ${isPrivate.toLowerCase() === 'y' ? 'Private' : 'Public'}`, 'gray');
      log('', 'gray');
      log(`2. Initialize git and push:`, 'gray');
      log(`   cd ${skillDir}`, 'gray');
      log(`   git init`, 'gray');
      log(`   git add .`, 'gray');
      log(`   git commit -m "Initial commit"`, 'gray');
      log(`   git branch -M main`, 'gray');
      log(`   git remote add origin https://github.com/${githubUser}/${repoName}.git`, 'gray');
      log(`   git push -u origin main`, 'gray');
      log('', 'gray');
      log(`3. Add to sources.yaml:`, 'gray');
      log(`   - name: ${skillName}`, 'gray');
      log(`     source:`, 'gray');
      log(`       repo: ${githubUser}/${repoName}`, 'gray');
      log(`       path: .`, 'gray');
      log(`     target:`, 'gray');
      log(`       category: tools`, 'gray');
      log(`       path: template/.claude/skills/tools/${skillName}`, 'gray');
      log('', 'gray');

      // Ask if user wants to auto-execute
      const autoExecute = await question('Auto-execute git commands? [y/N]: ');
      if (autoExecute.toLowerCase() === 'y') {
        try {
          log('', 'gray');
          log('Initializing git...', 'gray');
          execSync('git init', { cwd: skillDir, stdio: 'pipe' });
          execSync('git add .', { cwd: skillDir, stdio: 'pipe' });
          execSync('git commit -m "Initial commit"', { cwd: skillDir, stdio: 'pipe' });
          execSync('git branch -M main', { cwd: skillDir, stdio: 'pipe' });
          log('✅ Git initialized', 'green');

          log('Adding remote...', 'gray');
          execSync(`git remote add origin https://github.com/${githubUser}/${repoName}.git`, { cwd: skillDir, stdio: 'pipe' });
          log('✅ Remote added', 'green');

          log('', 'gray');
          log('⚠️  Please create the GitHub repo first, then run:', 'yellow');
          log(`   cd ${skillDir} && git push -u origin main`, 'gray');
        } catch (e) {
          log('❌ Failed to initialize git', 'red');
          log(`   ${e.message}`, 'gray');
        }
      }

      log('', 'gray');
      log('=====================================', 'gray');
      log('✅ Skill publishing guide complete', 'green');
      log('', 'gray');
    })();
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
async function runCommand(cmd, args) {
  const command = commands[cmd];
  if (command) {
    await command(...args);
  }
}

exports.runCommand = runCommand;
exports.commands = commands;
