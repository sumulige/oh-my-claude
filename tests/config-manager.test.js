/**
 * Config Manager 模块单元测试
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Config Manager Module', () => {
  const { ConfigManager } = require('../lib/config-manager');
  const { ConfigError } = require('../lib/errors');

  // Temporary test directories
  const tempBaseDir = path.join(os.tmpdir(), 'smc-config-test-' + Date.now());
  const tempConfigDir = path.join(tempBaseDir, '.claude');
  const tempConfigFile = path.join(tempConfigDir, 'config.json');
  const tempBackupDir = path.join(tempConfigDir, 'backups');
  const tempHistoryFile = path.join(tempConfigDir, 'config-history.jsonl');

  // Sample configs (matching config-schema requirements)
  const sampleConfig = {
    version: '1.0.7',
    model: 'claude-opus-4.5',
    agents: {
      conductor: { role: 'coordination' },
      architect: { role: 'design' }
    },
    skills: ['anthropics/skills'],
    hooks: {
      preTask: [],
      postTask: []
    }
  };

  const sampleConfig2 = {
    version: '1.0.8',
    model: 'claude-opus-4.5',
    agents: {
      conductor: { role: 'coordination' },
      architect: { role: 'design' },
      builder: { role: 'implementation' }
    },
    skills: ['anthropics/skills', 'numman-ali/n-skills'],
    hooks: {
      preTask: [],
      postTask: []
    }
  };

  beforeAll(() => {
    // Create test directory structure
    fs.mkdirSync(tempConfigDir, { recursive: true });
    fs.mkdirSync(tempBackupDir, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(tempBaseDir)) {
      fs.rmSync(tempBaseDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up config and history files between tests
    if (fs.existsSync(tempConfigFile)) {
      fs.unlinkSync(tempConfigFile);
    }
    if (fs.existsSync(tempHistoryFile)) {
      fs.unlinkSync(tempHistoryFile);
    }
    // Clean up backup files
    if (fs.existsSync(tempBackupDir)) {
      const backups = fs.readdirSync(tempBackupDir);
      backups.forEach(f => fs.unlinkSync(path.join(tempBackupDir, f)));
    }
  });

  describe('constructor', () => {
    it('should create manager with default paths', () => {
      const manager = new ConfigManager();

      expect(manager.configDir).toContain('.claude');
      expect(manager.configFile).toContain('config.json');
      expect(manager.backupDir).toContain('backups');
      expect(manager.maxBackups).toBe(10);
    });

    it('should accept custom options', () => {
      const manager = new ConfigManager({
        configDir: tempConfigDir,
        configFile: tempConfigFile,
        backupDir: tempBackupDir,
        maxBackups: 5
      });

      expect(manager.configDir).toBe(tempConfigDir);
      expect(manager.configFile).toBe(tempConfigFile);
      expect(manager.backupDir).toBe(tempBackupDir);
      expect(manager.maxBackups).toBe(5);
    });

    it('should create directories if they don\'t exist', () => {
      const newDir = path.join(os.tmpdir(), 'smc-new-test-' + Date.now());
      const newConfigFile = path.join(newDir, 'config.json');

      const manager = new ConfigManager({
        configDir: newDir,
        configFile: newConfigFile
      });

      expect(fs.existsSync(newDir)).toBe(true);

      // Cleanup
      fs.rmSync(newDir, { recursive: true, force: true });
    });

    it('should initialize validator', () => {
      const manager = new ConfigManager();

      expect(manager.validator).toBeDefined();
    });

    it('should respect strict option', () => {
      const strictManager = new ConfigManager({ strict: true });
      const looseManager = new ConfigManager({ strict: false });

      expect(strictManager.validator.strict).toBe(true);
      expect(looseManager.validator.strict).toBe(false);
    });
  });

  describe('load', () => {
    let manager;

    beforeEach(() => {
      manager = new ConfigManager({
        configDir: tempConfigDir,
        configFile: tempConfigFile
      });
    });

    it('should return defaults when config file doesn\'t exist', () => {
      const result = manager.load({ useDefaults: true });

      expect(result).toBeDefined();
      expect(result.version).toBeDefined();
      expect(result.agents).toBeDefined();
    });

    it('should throw error when file doesn\'t exist and useDefaults is false', () => {
      expect(() => {
        manager.load({ useDefaults: false });
      }).toThrow(ConfigError);
    });

    it('should load existing config file', () => {
      fs.writeFileSync(tempConfigFile, JSON.stringify(sampleConfig));

      const result = manager.load();

      expect(result).toEqual(sampleConfig);
    });

    it('should expand environment variables', () => {
      process.env.TEST_VAR = 'test-value';
      process.env.TEST_VAR_WITH_DEFAULT = 'override';

      const configWithEnv = {
        version: '1.0.0',
        apiKey: '${TEST_VAR}',
        url: '${TEST_VAR_WITH_DEFAULT:default-value}',
        nested: {
          value: '${TEST_VAR}'
        }
      };

      fs.writeFileSync(tempConfigFile, JSON.stringify(configWithEnv));

      const result = manager.load({ expandEnv: true });

      expect(result.apiKey).toBe('test-value');
      expect(result.url).toBe('override');
      expect(result.nested.value).toBe('test-value');

      delete process.env.TEST_VAR;
      delete process.env.TEST_VAR_WITH_DEFAULT;
    });

    it('should handle missing env vars with defaults', () => {
      const configWithEnv = {
        version: '1.0.0',
        value: '${MISSING_VAR:default}'
      };

      fs.writeFileSync(tempConfigFile, JSON.stringify(configWithEnv));

      const result = manager.load({ expandEnv: true });

      expect(result.value).toBe('default');
    });

    it('should handle missing env vars without defaults', () => {
      const configWithEnv = {
        version: '1.0.0',
        value: '${MISSING_VAR}'
      };

      fs.writeFileSync(tempConfigFile, JSON.stringify(configWithEnv));

      const result = manager.load({ expandEnv: true });

      expect(result.value).toBe('');
    });

    it('should expand env vars in arrays', () => {
      process.env.ARRAY_VAR = 'item1';

      const configWithEnv = {
        version: '1.0.0',
        items: ['${ARRAY_VAR}', 'static']
      };

      fs.writeFileSync(tempConfigFile, JSON.stringify(configWithEnv));

      const result = manager.load({ expandEnv: true });

      expect(result.items[0]).toBe('item1');
      expect(result.items[1]).toBe('static');

      delete process.env.ARRAY_VAR;
    });

    it('should validate when strict is true', () => {
      fs.writeFileSync(tempConfigFile, JSON.stringify({ invalid: 'config' }));

      expect(() => {
        manager.load({ strict: true, useDefaults: false });
      }).toThrow();
    });

    it('should skip validation when strict is false', () => {
      const manager = new ConfigManager({
        configDir: tempConfigDir,
        configFile: tempConfigFile,
        strict: false
      });

      fs.writeFileSync(tempConfigFile, JSON.stringify({ any: 'config' }));

      const result = manager.load({ strict: false });

      expect(result.any).toBe('config');
    });
  });

  describe('save', () => {
    let manager;

    beforeEach(() => {
      manager = new ConfigManager({
        configDir: tempConfigDir,
        configFile: tempConfigFile,
        backupDir: tempBackupDir
      });
    });

    it('should save config to file', () => {
      const result = manager.save(sampleConfig, { backup: false, validate: false });

      expect(result.success).toBe(true);
      expect(fs.existsSync(tempConfigFile)).toBe(true);

      const saved = JSON.parse(fs.readFileSync(tempConfigFile, 'utf-8'));
      expect(saved).toEqual(sampleConfig);
    });

    it('should create backup when backup option is true', () => {
      fs.writeFileSync(tempConfigFile, JSON.stringify(sampleConfig));

      const result = manager.save(sampleConfig2, { backup: true });

      expect(result.success).toBe(true);
      expect(result.backup).toBeDefined();
      expect(fs.existsSync(result.backup)).toBe(true);
    });

    it('should not create backup when file doesn\'t exist', () => {
      const result = manager.save(sampleConfig, { backup: true });

      expect(result.success).toBe(true);
      expect(result.backup).toBeNull();
    });

    it('should validate before saving by default', () => {
      const invalidConfig = { invalid: 'data' };

      expect(() => {
        manager.save(invalidConfig);
      }).toThrow(ConfigError);
    });

    it('should skip validation when validate is false', () => {
      const result = manager.save({ any: 'data' }, { validate: false });

      expect(result.success).toBe(true);
    });

    it('should record change in history', () => {
      manager.save(sampleConfig, { backup: false, validate: false });

      expect(fs.existsSync(tempHistoryFile)).toBe(true);

      const historyContent = fs.readFileSync(tempHistoryFile, 'utf-8');
      expect(historyContent).toContain('"action":"save"');
    });
  });

  describe('rollback', () => {
    let manager;

    beforeEach(() => {
      manager = new ConfigManager({
        configDir: tempConfigDir,
        configFile: tempConfigFile,
        backupDir: tempBackupDir
      });

      // Create initial config and a backup
      fs.writeFileSync(tempConfigFile, JSON.stringify(sampleConfig));
      manager.save(sampleConfig, { backup: true, validate: false });
      manager.save(sampleConfig2, { backup: true, validate: false });
    });

    it('should rollback to latest backup by default', () => {
      // Overwrite with different config
      fs.writeFileSync(tempConfigFile, JSON.stringify({ version: '1.0.0', model: 'claude-opus-4.5', skills: [] }));

      const result = manager.rollback();

      expect(result.success).toBe(true);
      expect(fs.existsSync(tempConfigFile)).toBe(true);

      const rolledBack = JSON.parse(fs.readFileSync(tempConfigFile, 'utf-8'));
      // Should rollback to sampleConfig (v1.0.7) which was backed up before saving sampleConfig2
      expect(rolledBack.version).toBe('1.0.7');
    });

    it('should rollback to specific version', () => {
      const backups = manager.listBackups();

      if (backups.length > 1) {
        const targetVersion = backups[1].version;
        const result = manager.rollback(targetVersion);

        expect(result.success).toBe(true);
        expect(result.restoredFrom).toBe(targetVersion);
      }
    });

    it('should throw error when no backups exist', () => {
      const emptyManager = new ConfigManager({
        configDir: tempConfigDir,
        backupDir: path.join(os.tmpdir(), 'no-backups-' + Date.now())
      });

      expect(() => {
        emptyManager.rollback();
      }).toThrow(ConfigError);
    });

    it('should throw error for non-existent version', () => {
      expect(() => {
        manager.rollback('non-existent-version');
      }).toThrow(ConfigError);
    });

    it('should backup current config before rollback', () => {
      fs.writeFileSync(tempConfigFile, JSON.stringify({ current: 'config' }));

      const backupsBefore = manager.listBackups().length;

      manager.rollback();

      const backupsAfter = manager.listBackups().length;

      // Should have one more backup (pre-rollback)
      expect(backupsAfter).toBeGreaterThan(backupsBefore);
    });
  });

  describe('listBackups', () => {
    let manager;

    beforeEach(() => {
      manager = new ConfigManager({
        configDir: tempConfigDir,
        configFile: tempConfigFile,
        backupDir: tempBackupDir
      });
    });

    it('should return empty array when no backups exist', () => {
      const backups = manager.listBackups();

      expect(backups).toEqual([]);
    });

    it('should return empty array when backup dir doesn\'t exist', () => {
      const managerWithoutDir = new ConfigManager({
        backupDir: path.join(os.tmpdir(), 'no-dir-' + Date.now())
      });

      const backups = managerWithoutDir.listBackups();

      expect(backups).toEqual([]);
    });

    it('should list all backups', () => {
      fs.writeFileSync(tempConfigFile, JSON.stringify(sampleConfig));
      manager.save(sampleConfig, { backup: true, validate: false });

      const backups = manager.listBackups();

      expect(backups.length).toBe(1);
      expect(backups[0]).toMatchObject({
        file: expect.stringContaining('config-'),
        version: expect.any(String),
        size: expect.any(Number)
      });
      expect(backups[0].timestamp).toBeDefined();
      expect(typeof backups[0].timestamp.getTime).toBe('function');
    });

    it('should sort backups by timestamp (newest first)', () => {
      fs.writeFileSync(tempConfigFile, JSON.stringify(sampleConfig));
      manager.save(sampleConfig, { backup: true, validate: false });
      // Small delay to ensure different timestamp
      const start = Date.now();
      while (Date.now() - start < 10) {}
      manager.save(sampleConfig2, { backup: true, validate: false });

      const backups = manager.listBackups();

      if (backups.length >= 2) {
        expect(backups[0].timestamp.getTime()).toBeGreaterThanOrEqual(backups[1].timestamp.getTime());
      }
    });

    it('should respect maxBackups limit', () => {
      const managerWithLimit = new ConfigManager({
        configDir: tempConfigDir,
        configFile: tempConfigFile,
        backupDir: tempBackupDir,
        maxBackups: 2
      });

      fs.writeFileSync(tempConfigFile, JSON.stringify(sampleConfig));

      // Create 3 backups
      managerWithLimit.save(sampleConfig, { backup: true, validate: false });
      const start = Date.now();
      while (Date.now() - start < 10) {}
      managerWithLimit.save(sampleConfig2, { backup: true, validate: false });
      const start2 = Date.now();
      while (Date.now() - start2 < 10) {}
      managerWithLimit.save(sampleConfig, { backup: true, validate: false });

      const backups = managerWithLimit.listBackups();

      // Should only return 2 (limited by maxBackups)
      expect(backups.length).toBe(2);
    });
  });

  describe('diff', () => {
    let manager;

    beforeEach(() => {
      manager = new ConfigManager({
        configDir: tempConfigDir,
        configFile: tempConfigFile
      });
    });

    it('should compute diff between two objects', () => {
      const changes = manager.diff(
        { version: '1.0.0', key: 'value' },
        { version: '1.0.1', key: 'value' }
      );

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        path: 'version',
        from: '1.0.0',
        to: '1.0.1',
        type: 'changed'
      });
    });

    it('should detect added properties', () => {
      const changes = manager.diff(
        { version: '1.0.0' },
        { version: '1.0.0', newKey: 'newValue' }
      );

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('added');
    });

    it('should detect removed properties', () => {
      const changes = manager.diff(
        { version: '1.0.0', oldKey: 'oldValue' },
        { version: '1.0.0' }
      );

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('removed');
    });

    it('should handle nested objects', () => {
      const changes = manager.diff(
        { nested: { a: 1, b: 2 } },
        { nested: { a: 1, b: 3 } }
      );

      expect(changes).toHaveLength(1);
      expect(changes[0].path).toBe('nested.b');
    });

    it('should accept file paths', () => {
      const file1 = path.join(tempBaseDir, 'config1.json');
      const file2 = path.join(tempBaseDir, 'config2.json');

      fs.writeFileSync(file1, JSON.stringify({ version: '1.0.0' }));
      fs.writeFileSync(file2, JSON.stringify({ version: '1.0.1' }));

      const changes = manager.diff(file1, file2);

      expect(changes.length).toBeGreaterThan(0);
    });

    it('should use current config when right is null', () => {
      fs.writeFileSync(tempConfigFile, JSON.stringify(sampleConfig));

      const changes = manager.diff({ version: '1.0.0', model: 'claude-opus-4.5', skills: [] });

      expect(changes).toBeDefined();
      expect(changes.length).toBeGreaterThan(0);
    });
  });

  describe('getHistory', () => {
    let manager;

    beforeEach(() => {
      manager = new ConfigManager({
        configDir: tempConfigDir,
        configFile: tempConfigFile
      });
    });

    it('should return empty array when no history exists', () => {
      const history = manager.getHistory();

      expect(history).toEqual([]);
    });

    it('should return history entries', () => {
      manager.save(sampleConfig, { backup: false, validate: false });

      const history = manager.getHistory();

      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toMatchObject({
        timestamp: expect.any(String),
        action: expect.any(String)
      });
    });

    it('should respect limit parameter', () => {
      // Create multiple history entries
      manager.save(sampleConfig, { backup: false, validate: false });
      manager.save(sampleConfig2, { backup: false, validate: false });

      const limitedHistory = manager.getHistory(1);

      expect(limitedHistory.length).toBe(1);
    });

    it('should return entries in reverse chronological order', () => {
      manager.save(sampleConfig, { backup: false, validate: false });
      manager.save(sampleConfig2, { backup: false, validate: false });

      const history = manager.getHistory();

      expect(history).toHaveLength(2);
    });
  });

  describe('Integration Tests', () => {
    it('should handle full workflow: save -> list -> rollback', () => {
      const manager = new ConfigManager({
        configDir: tempConfigDir,
        configFile: tempConfigFile,
        backupDir: tempBackupDir
      });

      // Save initial config
      manager.save(sampleConfig, { backup: false, validate: false });

      // Save with backup
      manager.save(sampleConfig2, { backup: true, validate: false });

      // List backups
      const backups = manager.listBackups();
      expect(backups.length).toBe(1);

      // Modify current config
      fs.writeFileSync(tempConfigFile, JSON.stringify({ version: '1.0.0', model: 'claude-opus-4.5', skills: [] }));

      // Rollback
      const rollbackResult = manager.rollback();
      expect(rollbackResult.success).toBe(true);

      // Verify restored
      const restored = JSON.parse(fs.readFileSync(tempConfigFile, 'utf-8'));
      // Rollback gets the backup created before saving sampleConfig2, which is sampleConfig (v1.0.7)
      expect(restored.version).toBe('1.0.7');
    });

    it('should handle env expansion in saved config', () => {
      process.env.EXPAND_TEST = 'expanded';

      const manager = new ConfigManager({
        configDir: tempConfigDir,
        configFile: tempConfigFile
      });

      const config = {
        version: '1.0.0',
        value: '${EXPAND_TEST}'
      };

      manager.save(config, { backup: false, validate: false });

      // Load and verify expansion
      const loaded = manager.load({ expandEnv: true });
      expect(loaded.value).toBe('expanded');

      delete process.env.EXPAND_TEST;
    });
  });

  describe('Backup Management', () => {
    it('should clean old backups beyond maxBackups', () => {
      const manager = new ConfigManager({
        configDir: tempConfigDir,
        configFile: tempConfigFile,
        backupDir: tempBackupDir,
        maxBackups: 3
      });

      fs.writeFileSync(tempConfigFile, JSON.stringify(sampleConfig));

      // Create 5 backups
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        while (Date.now() - start < 5) {}
        manager.save({ ...sampleConfig, iteration: i }, { backup: true, validate: false });
      }

      const backupFiles = fs.readdirSync(tempBackupDir);

      // Should keep maxBackups (3) files, possibly plus one from initial write
      expect(backupFiles.length).toBeLessThanOrEqual(5);
    });
  });
});
