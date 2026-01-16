/**
 * Configuration Validator
 *
 * AJV-based configuration validation with detailed error reporting.
 * Provides structured error messages, severity levels, and auto-fix suggestions.
 *
 * @module lib/config-validator
 */

const fs = require('fs');
const path = require('path');
const { CONFIG_SCHEMA, SETTINGS_SCHEMA, QUALITY_GATE_SCHEMA } = require('./config-schema');
const { ConfigError, parseAJVErrors } = require('./errors');

// Try to load AJV, provide fallback if not available
let Ajv = null;
let addFormats = null;

try {
  Ajv = require('ajv');
  addFormats = require('ajv-formats');
} catch {
  // AJV not installed - will use basic validation
}

/**
 * Configuration Validator class
 */
class ConfigValidator {
  /**
   * @param {Object} options - Validator options
   * @param {boolean} options.strict - Strict mode (default: false)
   * @param {boolean} options.allErrors - Collect all errors (default: true)
   * @param {boolean} options.coerceTypes - Coerce types (default: true)
   * @param {boolean} options.useDefaults - Use default values (default: false)
   */
  constructor(options = {}) {
    this.strict = options.strict !== false;
    this.allErrors = options.allErrors !== false;
    this.coerceTypes = options.coerceTypes !== false;
    this.useDefaults = options.useDefaults || false;

    // Initialize AJV if available
    if (Ajv) {
      this.ajv = new Ajv({
        allErrors: this.allErrors,
        verbose: true,
        coerceTypes: this.coerceTypes,
        useDefaults: this.useDefaults,
        allowUnionTypes: true,
        strict: false,
        removeAdditional: false  // Keep additional properties
      });

      // Add formats if available
      if (addFormats) {
        addFormats(this.ajv);
      }

      // Compile schemas
      this.configValidate = this.ajv.compile(CONFIG_SCHEMA);
      this.settingsValidate = this.ajv.compile(SETTINGS_SCHEMA);
      this.qualityGateValidate = this.ajv.compile(QUALITY_GATE_SCHEMA);
    } else {
      // Fallback: basic validation without AJV
      this.configValidate = null;
      this.settingsValidate = null;
      this.qualityGateValidate = null;
    }
  }

  /**
   * Validate configuration object
   * @param {Object} config - Configuration to validate
   * @param {string} schemaName - Schema name ('config' | 'settings' | 'quality-gate')
   * @returns {Object} Validation result
   */
  validate(config, schemaName = 'config') {
    // If AJV not available, do basic validation
    if (!this.ajv) {
      return this._basicValidate(config, schemaName);
    }

    const validate = this._getValidator(schemaName);

    if (!validate) {
      return {
        valid: false,
        errors: [{
          path: 'schema',
          message: `Unknown schema: ${schemaName}`,
          severity: 'critical',
          fix: `Use valid schema name: config, settings, quality-gate`
        }],
        warnings: [],
        fixes: []
      };
    }

    const valid = validate(config);

    if (valid) {
      return { valid: true, errors: [], warnings: [], fixes: [] };
    }

    // Process AJV errors
    const result = {
      valid: false,
      errors: [],
      warnings: [],
      fixes: []
    };

    const processedErrors = parseAJVErrors(validate.errors);

    for (const error of processedErrors) {
      if (error.severity === 'warn' || error.severity === 'info') {
        result.warnings.push(error);
      } else {
        result.errors.push(error);
      }
      if (error.fix) {
        result.fixes.push(error.fix);
      }
    }

    return result;
  }

  /**
   * Validate configuration file
   * @param {string} configPath - Path to config file
   * @param {string} schemaName - Schema name to use
   * @returns {Object} Validation result
   */
  validateFile(configPath, schemaName = null) {
    // Auto-detect schema from filename if not provided
    if (!schemaName) {
      const filename = path.basename(configPath);
      if (filename === 'config.json') {
        schemaName = 'config';
      } else if (filename === 'settings.json' || filename === 'settings.local.json') {
        schemaName = 'settings';
      } else if (filename === 'quality-gate.json') {
        schemaName = 'quality-gate';
      } else {
        schemaName = 'config';
      }
    }

    if (!fs.existsSync(configPath)) {
      return {
        valid: false,
        errors: [{
          path: configPath,
          message: 'Configuration file not found',
          severity: 'critical',
          fix: `Create config at: ${configPath}`
        }],
        warnings: [],
        fixes: []
      };
    }

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);
      return this.validate(config, schemaName);
    } catch (e) {
      if (e instanceof SyntaxError) {
        return {
          valid: false,
          errors: [{
            path: configPath,
            message: `JSON parse error: ${e.message}`,
            severity: 'critical',
            fix: this._suggestJsonFix(e, configPath)
          }],
          warnings: [],
          fixes: []
        };
      }
      throw e;
    }
  }

  /**
   * Validate with error throwing
   * @param {Object} config - Configuration to validate
   * @param {string} schemaName - Schema name
   * @throws {ConfigError} If validation fails
   */
  validateOrThrow(config, schemaName = 'config') {
    const result = this.validate(config, schemaName);
    if (!result.valid) {
      throw new ConfigError(
        'Configuration validation failed',
        result.errors,
        result.fixes
      );
    }
    return config;
  }

  /**
   * Get validator for schema name
   * @param {string} schemaName - Schema name
   * @returns {Function|null} Validator function
   */
  _getValidator(schemaName) {
    const validators = {
      config: this.configValidate,
      settings: this.settingsValidate,
      'quality-gate': this.qualityGateValidate
    };
    return validators[schemaName] || null;
  }

  /**
   * Basic validation without AJV
   * @param {Object} config - Configuration to validate
   * @param {string} schemaName - Schema name
   * @returns {Object} Validation result
   */
  _basicValidate(config, schemaName) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      fixes: []
    };

    // Basic type check
    if (!config || typeof config !== 'object') {
      result.valid = false;
      result.errors.push({
        path: 'root',
        message: 'Configuration must be an object',
        severity: 'critical',
        fix: 'Ensure config is valid JSON object'
      });
      return result;
    }

    // Schema-specific basic validation
    if (schemaName === 'config') {
      if (!config.version) {
        result.valid = false;
        result.errors.push({
          path: 'version',
          message: 'Missing required field: version',
          severity: 'critical',
          fix: 'Add "version": "1.0.0" to config'
        });
      } else if (typeof config.version === 'string' &&
                 !/^\d+\.\d+\.\d+/.test(config.version)) {
        result.valid = false;
        result.errors.push({
          path: 'version',
          message: 'Invalid version format',
          severity: 'error',
          expected: 'X.Y.Z',
          actual: config.version,
          fix: 'Use semantic version format (e.g., 1.0.0)'
        });
      }
    }

    return result;
  }

  /**
   * Suggest fix for JSON parsing errors
   * @param {Error} error - JSON parse error
   * @param {string} filePath - Path to file
   * @returns {string} Fix suggestion
   */
  _suggestJsonFix(error, filePath) {
    const match = error.message.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1]);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const line = content.substring(0, pos).split('\n').length;
        const col = pos - content.lastIndexOf('\n', pos - 1);
        return `Check line ${line}, column ${col} for syntax errors (missing comma, quote, bracket, etc.)`;
      } catch {
        return `Check around position ${pos} for syntax errors`;
      }
    }
    return 'Verify JSON syntax (commas, quotes, brackets are properly closed)';
  }

  /**
   * Check if AJV is available
   * @returns {boolean}
   */
  static isAJVAvailable() {
    return Ajv !== null;
  }
}

/**
 * Create a default validator instance
 */
const defaultValidator = new ConfigValidator();

/**
 * Convenience functions using default validator
 */
function validate(config, schemaName) {
  return defaultValidator.validate(config, schemaName);
}

function validateFile(configPath, schemaName) {
  return defaultValidator.validateFile(configPath, schemaName);
}

function validateOrThrow(config, schemaName) {
  return defaultValidator.validateOrThrow(config, schemaName);
}

module.exports = {
  ConfigValidator,
  defaultValidator,
  validate,
  validateFile,
  validateOrThrow,
  isAJVAvailable: ConfigValidator.isAJVAvailable
};
