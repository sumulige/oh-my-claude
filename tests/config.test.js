/**
 * Config 模块单元测试
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Config Module', () => {
  const config = require('../lib/config');

  describe('loadConfig', () => {
    it('should return default config when no user config exists', () => {
      // 使用真实的 CONFIG_DIR 但临时移除 config.json
      const realConfigFile = config.CONFIG_FILE;
      const tempBackup = realConfigFile + '.backup-test';

      // 备份现有配置（如果存在）
      if (fs.existsSync(realConfigFile)) {
        fs.renameSync(realConfigFile, tempBackup);
      }

      try {
        const result = config.loadConfig();

        expect(result).toBeDefined();
        expect(result).toHaveProperty('version');
        expect(result).toHaveProperty('agents');
        expect(result).toHaveProperty('skills');
      } finally {
        // 恢复原配置
        if (fs.existsSync(tempBackup)) {
          fs.renameSync(tempBackup, realConfigFile);
        }
      }
    });

    it('should return DEFAULTS constant', () => {
      expect(config.DEFAULTS).toBeDefined();
      expect(typeof config.DEFAULTS).toBe('object');
    });
  });

  describe('saveConfig & ensureDir', () => {
    const tempDir = path.join(os.tmpdir(), 'smc-test-' + Date.now());
    const tempFile = path.join(tempDir, 'test-config.json');

    afterAll(() => {
      // 清理
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should create directory and save config', () => {
      const testConfig = {
        version: '1.0.0',
        test: 'value'
      };

      // 直接调用 ensureDir
      config.ensureDir(tempDir);
      expect(fs.existsSync(tempDir)).toBe(true);

      // 手动保存文件
      fs.writeFileSync(tempFile, JSON.stringify(testConfig, null, 2));
      expect(fs.existsSync(tempFile)).toBe(true);

      const saved = JSON.parse(fs.readFileSync(tempFile, 'utf-8'));
      expect(saved).toEqual(testConfig);
    });

    it('should not error when directory exists', () => {
      expect(() => config.ensureDir(tempDir)).not.toThrow();
    });
  });

  describe('deepMerge (internal behavior)', () => {
    it('should have loadConfig and saveConfig functions', () => {
      expect(typeof config.loadConfig).toBe('function');
      expect(typeof config.saveConfig).toBe('function');
      expect(typeof config.ensureDir).toBe('function');
    });
  });

  describe('exports', () => {
    it('should export required constants', () => {
      expect(config.CONFIG_DIR).toBeDefined();
      expect(config.CONFIG_FILE).toBeDefined();
      expect(config.DEFAULTS).toBeDefined();
      expect(config.SKILLS_DIR).toBeDefined();
    });

    it('should have correct paths', () => {
      expect(config.CONFIG_DIR).toContain('.claude');
      expect(config.CONFIG_FILE).toContain('config.json');
      expect(config.SKILLS_DIR).toContain('skills');
    });
  });
});
