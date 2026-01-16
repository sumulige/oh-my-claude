/**
 * Configuration Manager
 *
 * Advanced configuration management with:
 * - Automatic backup before changes
 * - Environment variable expansion
 * - Rollback capability
 * - Change history tracking
 *
 * @module lib/config-manager
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ConfigValidator } = require('./config-validator');
const { ConfigError } = require('./errors');

/**
 * Configuration Manager class
 */
class ConfigManager {
  /**
   * @param {Object} options - Manager options
   * @param {string} options.configDir - Configuration directory
   * @param {string} options.configFile - Configuration file path
   * @param {string} options.backupDir - Backup directory
   * @param {number} options.maxBackups - Maximum number of backups to keep
   * @param {boolean} options.strict - Strict validation mode
   */
  constructor(options = {}) {
    this.configDir = options.configDir || path.join(process.env.HOME, '.claude');
    this.configFile = options.configFile || path.join(this.configDir, 'config.json');
    this.backupDir = options.backupDir || path.join(this.configDir, 'backups');
    this.maxBackups = options.maxBackups || 10;

    this.validator = new ConfigValidator({
      strict: options.strict !== false
    });

    this._ensureDirectories();
  }

  /**
   * Load configuration with validation
   * @param {Object} options - Load options
   * @returns {Object} Configuration object
   */
  load(options = {}) {
    const {
      useDefaults = true,
      expandEnv = true,
      strict = null
    } = options;

    if (!fs.existsSync(this.configFile)) {
      if (useDefaults) {
        return this._getDefaults();
      }
      throw new ConfigError('Configuration file not found', [], [
        `Create file at: ${this.configFile}`,
        'Or run: smc init'
      ]);
    }

    const content = fs.readFileSync(this.configFile, 'utf-8');
    let config;

    try {
      config = JSON.parse(content);
    } catch (e) {
      const validation = this.validator.validateFile(this.configFile);
      throw new ConfigError(
        'Invalid JSON in configuration file',
        validation.errors,
        validation.fixes
      );
    }

    // Expand environment variables
    if (expandEnv) {
      config = this._expandEnvVars(config);
    }

    // Validate against schema
    const effectiveStrict = strict !== null ? strict : this.validator.strict;
    if (effectiveStrict) {
      const validation = this.validator.validate(config);
      if (!validation.valid) {
        throw new ConfigError(
          'Configuration validation failed',
          validation.errors,
          validation.fixes
        );
      }
    }

    return config;
  }

  /**
   * Save configuration with backup
   * @param {Object} config - Configuration to save
   * @param {Object} options - Save options
   * @returns {Object} Save result
   */
  save(config, options = {}) {
    const { backup = true, validate = true } = options;

    // Validate before saving
    if (validate) {
      const validation = this.validator.validate(config);
      if (!validation.valid) {
        throw new ConfigError(
          'Cannot save invalid configuration',
          validation.errors,
          validation.fixes
        );
      }
    }

    // Create backup
    let backupPath = null;
    if (backup && fs.existsSync(this.configFile)) {
      backupPath = this._createBackup();
    }

    // Write new config
    const content = JSON.stringify(config, null, 2);
    fs.writeFileSync(this.configFile, content, 'utf-8');

    // Record change
    this._recordChange('save', {
      hash: this._hash(content),
      backup: backupPath
    });

    return { success: true, backup: backupPath };
  }

  /**
   * Rollback to previous configuration
   * @param {string|null} version - Backup version (null for latest)
   * @returns {Object} Rollback result
   */
  rollback(version = null) {
    const backups = this.listBackups();

    if (backups.length === 0) {
      throw new ConfigError('No backups available', [], [
        'Backups are created when you save config changes',
        'Enable backup option when saving'
      ]);
    }

    const targetBackup = version
      ? backups.find(b => b.version === version)
      : backups[0];

    if (!targetBackup) {
      throw new ConfigError(`Backup version ${version} not found`, [], [
        'Available versions: ' + backups.map(b => b.version).join(', ')
      ]);
    }

    const backupPath = path.join(this.backupDir, targetBackup.file);
    const content = fs.readFileSync(backupPath, 'utf-8');

    // Create backup of current before rollback
    if (fs.existsSync(this.configFile)) {
      this._createBackup('pre-rollback');
    }

    fs.writeFileSync(this.configFile, content, 'utf-8');

    return {
      success: true,
      restoredFrom: targetBackup.version,
      timestamp: targetBackup.timestamp
    };
  }

  /**
   * List available backups
   * @returns {Array} List of backup info objects
   */
  listBackups() {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.startsWith('config-') && f.endsWith('.json'))
      .map(f => {
        const stat = fs.statSync(path.join(this.backupDir, f));
        return {
          file: f,
          version: f.replace('config-', '').replace('.json', ''),
          timestamp: stat.mtime,
          size: stat.size
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, this.maxBackups);

    return files;
  }

  /**
   * Get configuration diff
   * @param {string|Object} left - Left config (file path or object)
   * @param {string|Object} right - Right config (file path or object, null for current)
   * @returns {Array} Array of change objects
   */
  diff(left, right = null) {
    const leftConfig = typeof left === 'string'
      ? JSON.parse(fs.readFileSync(left, 'utf-8'))
      : left;

    const rightConfig = right
      ? (typeof right === 'string'
          ? JSON.parse(fs.readFileSync(right, 'utf-8'))
          : right)
      : this.load({ validate: false });

    return this._computeDiff(leftConfig, rightConfig);
  }

  /**
   * Create backup of current config
   * @param {string} suffix - Optional suffix for backup name
   * @returns {string} Backup file path
   */
  _createBackup(suffix = null) {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0];

    const version = `${timestamp}${suffix ? '-' + suffix : ''}`;
    const filename = `config-${version}.json`;
    const backupPath = path.join(this.backupDir, filename);

    fs.copyFileSync(this.configFile, backupPath);

    // Clean old backups
    this._cleanOldBackups();

    return backupPath;
  }

  /**
   * Remove old backups beyond maxBackups limit
   */
  _cleanOldBackups() {
    const backups = this.listBackups();
    if (backups.length <= this.maxBackups) return;

    const toRemove = backups.slice(this.maxBackups);
    for (const backup of toRemove) {
      fs.unlinkSync(path.join(this.backupDir, backup.file));
    }
  }

  /**
   * Expand environment variables in config values
   * Supports ${VAR} and ${VAR:default} syntax
   * @param {*} value - Value to expand
   * @returns {*} Expanded value
   */
  _expandEnvVars(value) {
    if (typeof value === 'string') {
      return value.replace(/\$\{([^:}]+)(?::([^}]*))?\}/g, (_, name, defaultValue) => {
        return process.env[name] !== undefined
          ? process.env[name]
          : (defaultValue !== undefined ? defaultValue : '');
      });
    }

    if (Array.isArray(value)) {
      return value.map(item => this._expandEnvVars(item));
    }

    if (value && typeof value === 'object') {
      const result = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this._expandEnvVars(val);
      }
      return result;
    }

    return value;
  }

  /**
   * Ensure necessary directories exist
   */
  _ensureDirectories() {
    [this.configDir, this.backupDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Get default configuration
   * @returns {Object} Default config
   */
  _getDefaults() {
    const defaultsPath = path.join(__dirname, '../config/defaults.json');
    if (fs.existsSync(defaultsPath)) {
      return JSON.parse(fs.readFileSync(defaultsPath, 'utf-8'));
    }
    return {
      version: '1.0.7',
      model: 'claude-opus-4.5',
      agents: {
        conductor: { role: 'Task coordination and decomposition' },
        architect: { role: 'Architecture design and decisions' },
        builder: { role: 'Code implementation and testing' },
        reviewer: { role: 'Code review and quality check' },
        librarian: { role: 'Documentation and knowledge' }
      },
      skills: ['anthropics/skills', 'numman-ali/n-skills'],
      hooks: { preTask: [], postTask: [] },
      thinkingLens: {
        enabled: true,
        autoSync: true,
        syncInterval: 20
      }
    };
  }

  /**
   * Compute SHA256 hash of content
   * @param {string} content - Content to hash
   * @returns {string} Hex hash
   */
  _hash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Record configuration change
   * @param {string} action - Action type
   * @param {Object} details - Change details
   */
  _recordChange(action, details = {}) {
    const historyPath = path.join(this.configDir, 'config-history.jsonl');
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      ...details
    };

    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(historyPath, line, 'utf-8');

    // Keep only last 100 entries
    try {
      const history = fs.readFileSync(historyPath, 'utf-8').trim().split('\n');
      if (history.length > 100) {
        const recent = history.slice(-100);
        fs.writeFileSync(historyPath, recent.join('\n') + '\n', 'utf-8');
      }
    } catch {
      // First write, ignore
    }
  }

  /**
   * Get configuration history
   * @param {number} limit - Maximum entries to return
   * @returns {Array} History entries
   */
  getHistory(limit = 20) {
    const historyPath = path.join(this.configDir, 'config-history.jsonl');
    if (!fs.existsSync(historyPath)) {
      return [];
    }

    const content = fs.readFileSync(historyPath, 'utf-8');
    const lines = content.trim().split('\n');
    const entries = lines
      .slice(-limit)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return entries.reverse();
  }

  /**
   * Compute diff between two configs
   * @param {Object} left - Left config
   * @param {Object} right - Right config
   * @returns {Array} Array of changes
   */
  _computeDiff(left, right) {
    const changes = [];

    const compare = (l, r, path = '') => {
      const allKeys = new Set([
        ...(l ? Object.keys(l) : []),
        ...(r ? Object.keys(r) : [])
      ]);

      for (const key of allKeys) {
        const keyPath = path ? `${path}.${key}` : key;
        const lv = l?.[key];
        const rv = r?.[key];

        if (JSON.stringify(lv) !== JSON.stringify(rv)) {
          if (typeof lv === 'object' && typeof rv === 'object' &&
              lv !== null && rv !== null && !Array.isArray(lv) && !Array.isArray(rv)) {
            compare(lv, rv, keyPath);
          } else {
            changes.push({
              path: keyPath,
              from: lv,
              to: rv,
              type: lv === undefined ? 'added' :
                     rv === undefined ? 'removed' : 'changed'
            });
          }
        }
      }
    };

    compare(left, right);
    return changes;
  }
}

module.exports = { ConfigManager };
