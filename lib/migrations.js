/**
 * Migrations - Version control for project templates
 *
 * 每个迁移函数：
 * - from: 起始版本
 * - to: 目标版本
 * - migrate: 实际迁移逻辑
 *
 * 迁移链：v1.0.0 → v1.0.2 → v1.0.10 → ...
 */

const fs = require('fs');
const path = require('path');

// 当前模板版本
const TEMPLATE_VERSION = '1.0.10';

// 版本文件路径
const getVersionFile = (projectDir) => path.join(projectDir, '.claude', '.version');

// 读取项目版本
function getProjectVersion(projectDir) {
  const versionFile = getVersionFile(projectDir);
  if (!fs.existsSync(versionFile)) {
    // 没有 version 文件说明是旧版本项目
    return '1.0.0';
  }
  try {
    return fs.readFileSync(versionFile, 'utf-8').trim();
  } catch {
    return '1.0.0';
  }
}

// 写入项目版本
function setProjectVersion(projectDir, version) {
  const versionFile = getVersionFile(projectDir);
  fs.writeFileSync(versionFile, version + '\n');
}

// 版本比较
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] < parts2[i]) return -1;
    if (parts1[i] > parts2[i]) return 1;
  }
  return 0;
}

// 迁移列表
const migrations = [
  {
    from: '1.0.0',
    to: '1.0.10',
    description: 'Migrate hooks format from old to new',
    migrate: (projectDir) => {
      const settingsFile = path.join(projectDir, '.claude', 'settings.json');
      if (!fs.existsSync(settingsFile)) return;

      let settings;
      try {
        settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
      } catch {
        return; // 无效 JSON，跳过
      }

      // 检测旧格式
      const isOldFormat = settings.matcher || (settings.hooks && typeof settings.hooks === 'object');
      if (!isOldFormat) return;

      // 读取新模板
      const templateDir = path.join(__dirname, '../template');
      const templateSettings = path.join(templateDir, '.claude', 'settings.json');

      if (fs.existsSync(templateSettings)) {
        fs.writeFileSync(settingsFile, fs.readFileSync(templateSettings, 'utf-8'));
      }
    }
  }
];

/**
 * 执行迁移
 * @param {string} projectDir - 项目目录
 * @param {boolean} silent - 是否静默模式
 * @returns {object} { success, migrations, currentVersion }
 */
function runMigrations(projectDir, silent = false) {
  const currentVersion = getProjectVersion(projectDir);

  // 已经是最新版本
  if (compareVersions(currentVersion, TEMPLATE_VERSION) >= 0) {
    return {
      success: true,
      migrations: [],
      currentVersion,
      templateVersion: TEMPLATE_VERSION
    };
  }

  // 找到需要执行的迁移
  const pendingMigrations = migrations.filter(m => {
    const cmp = compareVersions(currentVersion, m.to);
    return cmp < 0; // 只执行版本高于当前版本的迁移
  });

  // 按版本顺序执行
  pendingMigrations.sort((a, b) => compareVersions(a.to, b.to));

  const executed = [];

  for (const migration of pendingMigrations) {
    try {
      if (!silent) {
        console.log(`⬆️  Migrating: ${currentVersion} → ${migration.to}`);
        console.log(`   ${migration.description}`);
      }
      migration.migrate(projectDir);
      executed.push(migration);
      setProjectVersion(projectDir, migration.to);
      if (!silent) {
        console.log(`   ✅ Done`);
      }
    } catch (error) {
      if (!silent) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
      return {
        success: false,
        error: error.message,
        currentVersion,
        executed
      };
    }
  }

  return {
    success: true,
    migrations: executed,
    currentVersion: TEMPLATE_VERSION,
    templateVersion: TEMPLATE_VERSION
  };
}

module.exports = {
  TEMPLATE_VERSION,
  getProjectVersion,
  setProjectVersion,
  compareVersions,
  runMigrations
};
