/**
 * Quality Rules Registry
 *
 * Pluggable rule system for code quality checks.
 * Rules can be defined in-code or loaded from config files (YAML/JSON).
 *
 * @module lib/quality-rules
 */

const fs = require('fs');
const path = require('path');

/**
 * Rule Registry
 * Manages quality check rules
 */
class RuleRegistry {
  constructor() {
    this.rules = new Map();
    this._registerBuiltInRules();
  }

  /**
   * Register a rule
   * @param {string} id - Rule identifier
   * @param {Object} definition - Rule definition
   */
  register(id, definition) {
    const rule = {
      id,
      name: definition.name || id,
      description: definition.description || '',
      severity: definition.severity || 'warn',
      enabled: definition.enabled !== false,
      check: definition.check,
      fix: definition.fix || null,
      config: definition.config || {}
    };
    this.rules.set(id, rule);
    return rule;
  }

  /**
   * Get rule by ID
   * @param {string} id - Rule identifier
   * @returns {Object|null} Rule object
   */
  get(id) {
    return this.rules.get(id) || null;
  }

  /**
   * Check if rule exists
   * @param {string} id - Rule identifier
   * @returns {boolean}
   */
  has(id) {
    return this.rules.has(id);
  }

  /**
   * Get all rules, optionally filtered
   * @param {Object} filter - Filter options
   * @returns {Array} Array of rules
   */
  getAll(filter = {}) {
    let rules = Array.from(this.rules.values());

    if (filter.severity) {
      rules = rules.filter(r => r.severity === filter.severity);
    }
    if (filter.enabled !== undefined) {
      rules = rules.filter(r => r.enabled === filter.enabled);
    }
    if (filter.category) {
      rules = rules.filter(r => r.category === filter.category);
    }

    return rules;
  }

  /**
   * Enable/disable a rule
   * @param {string} id - Rule identifier
   * @param {boolean} enabled - Enable state
   */
  setEnabled(id, enabled) {
    const rule = this.rules.get(id);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Update rule configuration
   * @param {string} id - Rule identifier
   * @param {Object} config - New configuration
   */
  updateConfig(id, config) {
    const rule = this.rules.get(id);
    if (rule) {
      rule.config = { ...rule.config, ...config };
    }
  }

  /**
   * Load rules from config file
   * @param {string} filePath - Path to rules config file
   */
  loadFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    let config;

    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      // Try to load YAML parser
      try {
        const yaml = require('yaml');
        config = yaml.parse(content);
      } catch {
        console.warn(`YAML parser not available, skipping ${filePath}`);
        return;
      }
    } else {
      config = JSON.parse(content);
    }

    // Register rules from config
    for (const ruleDef of config.rules || []) {
      if (ruleDef.id) {
        const existing = this.rules.get(ruleDef.id);
        if (existing) {
          // Update existing rule
          Object.assign(existing, ruleDef);
        } else {
          // Register new rule with function check
          this.register(ruleDef.id, ruleDef);
        }
      }
    }
  }

  /**
   * Register built-in rules
   */
  _registerBuiltInRules() {
    // File size rule
    this.register('file-size-limit', {
      name: 'File Size Limit',
      description: 'Ensure files do not exceed size limit',
      category: 'size',
      severity: 'warn',
      enabled: true,
      config: { maxSize: 800 * 1024 }, // 800KB
      check: (file, config) => {
        const stats = fs.statSync(file);
        const maxSize = config.maxSize || 800 * 1024;
        if (stats.size > maxSize) {
          return {
            pass: false,
            message: `File size (${(stats.size / 1024).toFixed(0)}KB) exceeds limit (${(maxSize / 1024).toFixed(0)}KB)`,
            fix: 'Consider splitting the file or removing unused code'
          };
        }
        return { pass: true };
      }
    });

    // Line count rule
    this.register('line-count-limit', {
      name: 'Line Count Limit',
      description: 'Ensure files do not exceed line count limit',
      category: 'size',
      severity: 'error',
      enabled: true,
      config: { maxLines: 800 },
      check: (file, config) => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n').length;
        const maxLines = config.maxLines || 800;
        if (lines > maxLines) {
          return {
            pass: false,
            message: `File (${lines} lines) exceeds line limit (${maxLines})`,
            fix: 'Consider splitting into smaller modules'
          };
        }
        return { pass: true };
      }
    });

    // Console.log detection rule
    this.register('no-console-logs', {
      name: 'No Console Logs',
      description: 'Detect console.log statements in production code',
      category: 'code-style',
      severity: 'warn',
      enabled: false,
      check: (file) => {
        const ext = path.extname(file);
        if (!['.js', '.jsx', '.ts', '.tsx', '.cjs', '.mjs'].includes(ext)) {
          return { pass: true, skip: true };
        }
        const content = fs.readFileSync(file, 'utf-8');
        // Match console.log/debug/info/warn but not console.error
        const matches = content.matchAll(/console\.(log|debug|info|warn)\(/g);
        const count = [...matches].length;
        if (count > 0) {
          return {
            pass: false,
            message: `Found ${count} console statement(s)`,
            fix: 'Remove or replace with proper logging library'
          };
        }
        return { pass: true };
      }
    });

    // TODO comments rule
    this.register('todo-comments', {
      name: 'TODO Comments Check',
      description: 'Track TODO/FIXME comments in code',
      category: 'documentation',
      severity: 'info',
      enabled: true,
      check: (file) => {
        const ext = path.extname(file);
        if (!['.js', '.jsx', '.ts', '.tsx', '.cjs', '.mjs', '.py', '.go'].includes(ext)) {
          return { pass: true, skip: true };
        }
        const content = fs.readFileSync(file, 'utf-8');
        const todoRegex = /(?:TODO|FIXME|XXX|HACK|NOTE):?\s*(.+)/gi;
        const todos = [...content.matchAll(todoRegex)];
        if (todos.length > 0) {
          return {
            pass: true, // Just informational
            message: `${todos.length} TODO comment(s) found`,
            details: todos.map(m => m[1].trim())
          };
        }
        return { pass: true };
      }
    });

    // Directory depth rule
    this.register('directory-depth', {
      name: 'Directory Depth Limit',
      description: 'Ensure directory structure is not too deep',
      category: 'structure',
      severity: 'warn',
      enabled: true,
      config: { maxDepth: 6 },
      check: (file, config) => {
        const maxDepth = config.maxDepth || 6;
        const depth = file.split(path.sep).length;
        if (depth > maxDepth) {
          return {
            pass: false,
            message: `Directory depth (${depth}) exceeds limit (${maxDepth})`,
            fix: 'Consider flattening the directory structure'
          };
        }
        return { pass: true };
      }
    });

    // Empty file rule
    this.register('no-empty-files', {
      name: 'No Empty Files',
      description: 'Detect empty or near-empty files',
      category: 'quality',
      severity: 'warn',
      enabled: true,
      config: { minLines: 3 },
      check: (file, config) => {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.trim().split('\n').filter(l => l.trim());
        const minLines = config.minLines || 3;
        if (lines.length < minLines) {
          return {
            pass: false,
            message: `File has only ${lines.length} line(s)`,
            fix: 'Add content or remove the file'
          };
        }
        return { pass: true };
      }
    });

    // Trailing whitespace rule
    this.register('no-trailing-whitespace', {
      name: 'No Trailing Whitespace',
      description: 'Detect trailing whitespace on lines',
      category: 'code-style',
      severity: 'warn',
      enabled: true,
      check: (file) => {
        const ext = path.extname(file);
        if (!['.js', '.jsx', '.ts', '.tsx', '.cjs', '.mjs', '.py', '.md', '.txt'].includes(ext)) {
          return { pass: true, skip: true };
        }
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        const trailing = [];
        lines.forEach((line, i) => {
          if (line !== line.trimEnd()) {
            trailing.push(i + 1);
          }
        });
        if (trailing.length > 0) {
          return {
            pass: false,
            message: `Trailing whitespace on ${trailing.length} line(s)`,
            fix: 'Run code formatter to fix',
            autoFix: true
          };
        }
        return { pass: true };
      }
    });

    // Large function rule (basic)
    this.register('function-length', {
      name: 'Function Length Limit',
      description: 'Functions should not exceed line limit',
      category: 'complexity',
      severity: 'warn',
      enabled: false,
      config: { maxLines: 50 },
      check: (file, config) => {
        const ext = path.extname(file);
        if (!['.js', '.jsx', '.ts', '.tsx', '.cjs', '.mjs'].includes(ext)) {
          return { pass: true, skip: true };
        }
        const content = fs.readFileSync(file, 'utf-8');
        const maxLines = config.maxLines || 50;

        // Simple function block detection
        const functionPattern = /(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?(?:\([^)]*\)\s*=>|\([^)]*\)\s*{))[\s\S]*?\n([\s\S]{30,})\n/g;
        const matches = [...content.matchAll(functionPattern)];

        if (matches.length > 0) {
          return {
            pass: false,
            message: `Found ${matches.length} function(s) exceeding ${maxLines} lines`,
            fix: 'Break large functions into smaller ones'
          };
        }
        return { pass: true };
      }
    });
  }
}

// Global registry instance
const globalRegistry = new RuleRegistry();

module.exports = {
  RuleRegistry,
  registry: globalRegistry,

  // Convenience functions using global registry
  register: (id, def) => globalRegistry.register(id, def),
  get: (id) => globalRegistry.get(id),
  has: (id) => globalRegistry.has(id),
  getAll: (filter) => globalRegistry.getAll(filter),
  setEnabled: (id, enabled) => globalRegistry.setEnabled(id, enabled),
  updateConfig: (id, config) => globalRegistry.updateConfig(id, config),
  loadFromFile: (path) => globalRegistry.loadFromFile(path)
};
