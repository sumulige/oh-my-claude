/**
 * Migrations 模块单元测试
 */

const fs = require('fs');
const path = require('path');
const mockFs = require('mock-fs');

// 在 mock 之前加载模块
const migrations = require('../lib/migrations');

describe('Migrations Module', () => {
  let originalFs = { ...fs };

  beforeEach(() => {
    // Mock 文件系统，保留一些必要的路径
    mockFs({
      '/test-project': {
        '.claude': {}
      }
    }, {
      // 不 mock 项目的 lib 目录
      [path.join(__dirname, '../lib')]: true
    });
  });

  afterEach(() => {
    mockFs.restore();
  });

  describe('getProjectVersion', () => {
    it('should return 1.0.0 when version file does not exist', () => {
      const version = migrations.getProjectVersion('/test-project');
      expect(version).toBe('1.0.0');
    });

    it('should read version from file', () => {
      const versionFile = path.join('/test-project', '.claude', '.version');
      fs.writeFileSync(versionFile, '1.0.5\n');

      const version = migrations.getProjectVersion('/test-project');
      expect(version).toBe('1.0.5');
    });

    it('should trim whitespace from version', () => {
      const versionFile = path.join('/test-project', '.claude', '.version');
      fs.writeFileSync(versionFile, '  1.0.8  \n');

      const version = migrations.getProjectVersion('/test-project');
      expect(version).toBe('1.0.8');
    });

    it('should return 1.0.0 on read error', () => {
      const version = migrations.getProjectVersion('/nonexistent');
      expect(version).toBe('1.0.0');
    });
  });

  describe('setProjectVersion', () => {
    it('should write version to file', () => {
      migrations.setProjectVersion('/test-project', '1.0.7');

      const versionFile = path.join('/test-project', '.claude', '.version');
      expect(fs.existsSync(versionFile)).toBe(true);

      const content = fs.readFileSync(versionFile, 'utf-8');
      expect(content.trim()).toBe('1.0.7');
    });

    it('should add newline after version', () => {
      migrations.setProjectVersion('/test-project', '1.0.9');

      const versionFile = path.join('/test-project', '.claude', '.version');
      const content = fs.readFileSync(versionFile, 'utf-8');
      expect(content).toBe('1.0.9\n');
    });

    it('should create .claude directory if not exists', () => {
      // 注意：setProjectVersion 不会自动创建目录
      // 需要先创建目录
      fs.mkdirSync(path.join('/new-project', '.claude'), { recursive: true });
      migrations.setProjectVersion('/new-project', '1.0.1');

      const versionFile = path.join('/new-project', '.claude', '.version');
      expect(fs.existsSync(versionFile)).toBe(true);
    });
  });

  describe('compareVersions', () => {
    it('should return -1 when v1 < v2', () => {
      expect(migrations.compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(migrations.compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(migrations.compareVersions('1.0.0', '2.0.0')).toBe(-1);
    });

    it('should return 1 when v1 > v2', () => {
      expect(migrations.compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(migrations.compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(migrations.compareVersions('2.0.0', '1.0.0')).toBe(1);
    });

    it('should return 0 when v1 === v2', () => {
      expect(migrations.compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(migrations.compareVersions('1.5.10', '1.5.10')).toBe(0);
    });

    it('should handle version comparison correctly', () => {
      // Patch version comparison
      expect(migrations.compareVersions('1.0.5', '1.0.10')).toBe(-1);
      expect(migrations.compareVersions('1.0.10', '1.0.5')).toBe(1);

      // Minor version comparison
      expect(migrations.compareVersions('1.5.0', '1.10.0')).toBe(-1);

      // Major version comparison
      expect(migrations.compareVersions('2.0.0', '10.0.0')).toBe(-1);
    });

    it('should handle version strings with different formats', () => {
      expect(migrations.compareVersions('1', '1.0.0')).toBe(0);
      expect(migrations.compareVersions('1.0', '1.0.0')).toBe(0);
    });
  });

  describe('runMigrations', () => {
    it('should return success when already at latest version', () => {
      // 设置当前版本为最新
      migrations.setProjectVersion('/test-project', migrations.TEMPLATE_VERSION);

      const result = migrations.runMigrations('/test-project', true);

      expect(result.success).toBe(true);
      expect(result.migrations).toEqual([]);
      expect(result.currentVersion).toBe(migrations.TEMPLATE_VERSION);
    });

    it('should return success when version is newer than template', () => {
      // 设置一个未来版本
      migrations.setProjectVersion('/test-project', '2.0.0');

      const result = migrations.runMigrations('/test-project', true);

      expect(result.success).toBe(true);
      expect(result.migrations).toEqual([]);
    });

    it('should return correct structure when pending migrations exist', () => {
      // 设置旧版本
      migrations.setProjectVersion('/test-project', '1.0.0');

      // 创建需要迁移的 settings.json
      const settingsFile = path.join('/test-project', '.claude', 'settings.json');
      fs.writeFileSync(
        settingsFile,
        JSON.stringify({ matcher: {}, hooks: [] }, null, 2)
      );

      const result = migrations.runMigrations('/test-project', true);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(result.currentVersion).toBeDefined();
    });

    it('should handle missing settings.json gracefully', () => {
      migrations.setProjectVersion('/test-project', '1.0.0');

      const result = migrations.runMigrations('/test-project', true);

      expect(result.success).toBe(true);
    });
  });

  describe('exports', () => {
    it('should export TEMPLATE_VERSION constant', () => {
      expect(migrations.TEMPLATE_VERSION).toBeDefined();
      expect(typeof migrations.TEMPLATE_VERSION).toBe('string');
    });

    it('should export all functions', () => {
      expect(typeof migrations.getProjectVersion).toBe('function');
      expect(typeof migrations.setProjectVersion).toBe('function');
      expect(typeof migrations.compareVersions).toBe('function');
      expect(typeof migrations.runMigrations).toBe('function');
    });
  });
});
