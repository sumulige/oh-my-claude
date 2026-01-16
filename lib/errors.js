/**
 * Structured Error Types
 *
 * Provides structured error information with recovery hints.
 * All errors include:
 * - Error code for programmatic handling
 * - Severity level (info/warn/error/critical)
 * - Details object with context
 * - Hints array with recovery suggestions
 * - Optional documentation URL
 *
 * @module lib/errors
 */

/**
 * Base SMC Error class
 */
class SMCError extends Error {
  /**
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @param {string} options.code - Error code (e.g., 'ERR_CONFIG')
   * @param {string} options.severity - Severity level: 'info' | 'warn' | 'error' | 'critical'
   * @param {Object} options.details - Additional error details
   * @param {string[]} options.hints - Recovery hints
   * @param {string} options.docUrl - Documentation URL
   */
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || 'ERR_UNKNOWN';
    this.severity = options.severity || 'error';
    this.details = options.details || {};
    this.hints = options.hints || [];
    this.docUrl = options.docUrl;

    // Maintain proper stack trace
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * Convert error to JSON-serializable object
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      details: this.details,
      hints: this.hints,
      docUrl: this.docUrl
    };
  }

  /**
   * Format error for console output
   */
  toString() {
    let output = `[${this.code}] ${this.message}`;
    if (this.hints.length > 0) {
      output += '\n\nSuggestions:\n';
      this.hints.forEach((h, i) => {
        output += `  ${i + 1}. ${h}\n`;
      });
    }
    if (this.docUrl) {
      output += `\nDocs: ${this.docUrl}\n`;
    }
    return output;
  }

  /**
   * Check if this error has a specific severity level or higher
   * @param {string} minSeverity - Minimum severity to check against
   * @returns {boolean}
   */
  hasSeverity(minSeverity) {
    const levels = { info: 0, warn: 1, error: 2, critical: 3 };
    return levels[this.severity] >= levels[minSeverity];
  }
}

/**
 * Configuration-related errors
 * Used for config file parsing, validation, and loading issues
 */
class ConfigError extends SMCError {
  /**
   * @param {string} message - Error message
   * @param {Object[]} errors - Array of validation errors
   * @param {string[]} fixes - Array of auto-fix suggestions
   * @param {Object} options - Additional options passed to SMCError
   */
  constructor(message, errors = [], fixes = [], options = {}) {
    super(message, {
      code: 'ERR_CONFIG',
      severity: 'critical',
      ...options
    });
    this.errors = errors;
    this.fixes = fixes;
    this.details = {
      errorCount: errors.length,
      fixCount: fixes.length,
      criticalCount: errors.filter(e => e.severity === 'critical').length,
      errorCount: errors.length,
      fixCount: fixes.length,
      criticalCount: errors.filter(e => e.severity === 'critical').length
    };
  }

  /**
   * Format config error for console output
   */
  toString() {
    let output = `ConfigError: ${this.message}\n`;

    if (this.details.errorCount > 0) {
      output += `\nErrors (${this.details.errorCount}):\n`;
      this.errors.forEach(e => {
        const icon = e.severity === 'critical' ? 'X' : e.severity === 'error' ? 'E' : 'W';
        output += `  [${icon}] ${e.path}: ${e.message}\n`;
        if (e.fix) {
          output += `      Fix: ${e.fix}\n`;
        }
      });
    }

    if (this.details.fixCount > 0) {
      output += `\nSuggested fixes:\n`;
      this.fixes.forEach((f, i) => {
        output += `  ${i + 1}. ${f}\n`;
      });
    }

    return output;
  }
}

/**
 * Validation errors
 * Used when data validation fails
 */
class ValidationError extends SMCError {
  constructor(message, options = {}) {
    super(message, {
      code: 'ERR_VALIDATION',
      severity: 'error',
      ...options
    });
  }
}

/**
 * Quality gate errors
 * Used when quality checks fail
 */
class QualityGateError extends SMCError {
  /**
   * @param {string} message - Error message
   * @param {Object} results - Quality check results
   * @param {Object} options - Additional options
   */
  constructor(message, results = {}, options = {}) {
    super(message, {
      code: 'ERR_QUALITY_GATE',
      severity: 'error',
      ...options
    });
    this.results = results;
    this.details = {
      passed: results.passed || false,
      total: results.summary?.total || 0,
      critical: results.summary?.critical || 0,
      error: results.summary?.error || 0,
      warn: results.summary?.warn || 0
    };
  }
}

/**
 * Migration errors
 * Used during config migration
 */
class MigrationError extends SMCError {
  constructor(message, options = {}) {
    super(message, {
      code: 'ERR_MIGRATION',
      severity: 'critical',
      ...options
    });
  }
}

/**
 * File operation errors
 * Used for file read/write issues
 */
class FileError extends SMCError {
  constructor(message, filePath, options = {}) {
    super(message, {
      code: 'ERR_FILE',
      severity: 'error',
      ...options
    });
    this.filePath = filePath;
    this.details.file = filePath;
  }
}

/**
 * Rule execution errors
 * Used when a quality rule fails to execute
 */
class RuleError extends SMCError {
  constructor(message, ruleId, options = {}) {
    super(message, {
      code: 'ERR_RULE',
      severity: 'warn',
      ...options
    });
    this.ruleId = ruleId;
    this.details.rule = ruleId;
  }
}

/**
 * Parse error details from AJV validation output
 * @param {Object[]} ajvErrors - AJV validation errors
 * @returns {Object[]} Parsed error objects
 */
function parseAJVErrors(ajvErrors) {
  return ajvErrors.map(error => {
    const path = error.instancePath || 'root';
    const message = error.message || 'Validation failed';

    return {
      path,
      message,
      severity: getSeverityFromKeyword(error.keyword),
      expected: error.schema?.type || error.schema?.enum?.join('|'),
      actual: error.data,
      keyword: error.keyword,
      fix: generateFixFromError(error)
    };
  });
}

/**
 * Map AJV keyword to severity level
 * @param {string} keyword - AJV error keyword
 * @returns {string} Severity level
 */
function getSeverityFromKeyword(keyword) {
  const severityMap = {
    required: 'critical',
    type: 'error',
    enum: 'error',
    pattern: 'warn',
    format: 'warn',
    minimum: 'warn',
    maximum: 'warn',
    minLength: 'warn',
    maxLength: 'warn'
  };
  return severityMap[keyword] || 'warn';
}

/**
 * Generate auto-fix suggestion from AJV error
 * @param {Object} error - AJV error object
 * @returns {string|null} Fix suggestion
 */
function generateFixFromError(error) {
  const fixes = {
    required: `Add missing field: ${error.params?.missingProperty}`,
    pattern: `Value must match pattern: ${error.schema?.pattern}`,
    enum: `Value must be one of: ${error.schema?.enum?.join(', ')}`,
    type: `Change type to: ${error.schema?.type}`,
    minimum: `Value must be >= ${error.schema?.minimum}`,
    maximum: `Value must be <= ${error.schema?.maximum}`,
    minLength: `Length must be >= ${error.schema?.minLength}`,
    maxLength: `Length must be <= ${error.schema?.maxLength}`
  };
  return fixes[error.keyword] || null;
}

module.exports = {
  // Base class
  SMCError,

  // Specific error types
  ConfigError,
  ValidationError,
  QualityGateError,
  MigrationError,
  FileError,
  RuleError,

  // Utility functions
  parseAJVErrors,
  getSeverityFromKeyword,
  generateFixFromError
};
