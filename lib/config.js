/**
 * Config - Configuration management
 *
 * Loads default config and merges with user config from ~/.claude/config.json
 *
 * v2.0: Supports new ConfigManager with validation, backup, and rollback.
 *       Enable with SMC_USE_NEW_CONFIG=1 environment variable.
 */

const fs = require('fs');
const path = require('path');
const defaults = require('../config/defaults.json');

const CONFIG_DIR = path.join(process.env.HOME, '.claude');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Try to load new ConfigManager (v2.0)
let ConfigManager = null;
let newManager = null;

try {
  ({ ConfigManager } = require('./config-manager'));
} catch {
  // New system not available, use legacy
}

/**
 * Check if new config system should be used
 */
function useNewSystem() {
  return process.env.SMC_USE_NEW_CONFIG === '1' ||
         process.env.SMC_CONFIG_V2 === '1' ||
         process.env.SMC_STRICT_CONFIG === '1';
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Load configuration (defaults + user overrides)
 * @returns {Object} Merged configuration
 */
exports.loadConfig = function() {
  // Use new system if enabled and available
  if (useNewSystem() && ConfigManager) {
    if (!newManager) {
      newManager = new ConfigManager();
    }
    try {
      return newManager.load({ expandEnv: true });
    } catch (e) {
      console.warn(`[Config] ${e.message}`);
      if (process.env.SMC_STRICT_CONFIG === '1') {
        throw e;
      }
      // Fall back to legacy on validation error
      console.warn('[Config] Falling back to legacy config system');
    }
  }

  // Legacy implementation
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const userConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      // Deep merge: user config overrides defaults
      return deepMerge(defaults, userConfig);
    } catch (e) {
      console.warn('Warning: Failed to parse user config, using defaults');
      return defaults;
    }
  }
  return defaults;
};

/**
 * Save configuration to file
 * @param {Object} config - Configuration to save
 * @param {Object} options - Save options
 */
exports.saveConfig = function(config, options = {}) {
  // Use new system if enabled and available
  if (useNewSystem() && ConfigManager) {
    if (!newManager) {
      newManager = new ConfigManager();
    }
    return newManager.save(config, options);
  }

  // Legacy implementation
  exports.ensureDir(CONFIG_DIR);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  return { success: true };
};

/**
 * Ensure a directory exists
 */
exports.ensureDir = function(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Export constants
exports.CONFIG_DIR = CONFIG_DIR;
exports.CONFIG_FILE = CONFIG_FILE;
exports.DEFAULTS = defaults;

// Calculate derived paths
exports.SKILLS_DIR = path.join(CONFIG_DIR, 'skills');
