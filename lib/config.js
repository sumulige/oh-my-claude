/**
 * Config - Configuration management
 *
 * Loads default config and merges with user config from ~/.claude/config.json
 */

const fs = require('fs');
const path = require('path');
const defaults = require('../config/defaults.json');

const CONFIG_DIR = path.join(process.env.HOME, '.claude');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

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
 */
exports.saveConfig = function(config) {
  exports.ensureDir(CONFIG_DIR);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
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
