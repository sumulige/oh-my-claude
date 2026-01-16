/**
 * Quality Gate Implementation
 *
 * Multi-level validation engine with pluggable rules.
 * Supports multiple output formats and gate enforcement.
 *
 * @module lib/quality-gate
 */

const fs = require('fs');
const path = require('path');
const { registry } = require('./quality-rules');
const { QualityGateError } = require('./errors');

/**
 * Quality Gate class
 */
class QualityGate {
  /**
   * @param {Object} options - Gate options
   * @param {string} options.projectDir - Project directory
   * @param {Object} options.config - Gate configuration
   * @param {Array} options.reporters - Output reporters
   */
  constructor(options = {}) {
    this.projectDir = options.projectDir || process.cwd();
    this.config = options.config || this._loadConfig();
    this.reporters = options.reporters || [new ConsoleReporter()];
  }

  /**
   * Run quality gate check
   * @param {Object} options - Check options
   * @returns {Promise<Object>} Check results
   */
  async check(options = {}) {
    const {
      files = null,
      severity = this.config.severity || 'warn',
      rules = null,
      fix = false
    } = options;

    const filesToCheck = files || this._getProjectFiles();
    const rulesToRun = rules || this._getActiveRules();

    const results = [];
    let criticalCount = 0;
    let errorCount = 0;
    let warnCount = 0;
    let infoCount = 0;

    for (const file of filesToCheck) {
      const fileResults = await this._checkFile(file, rulesToRun);
      results.push(...fileResults);

      for (const r of fileResults) {
        switch (r.severity) {
          case 'critical': criticalCount++; break;
          case 'error': errorCount++; break;
          case 'warn': warnCount++; break;
          case 'info': infoCount++; break;
        }
      }
    }

    const summary = {
      total: results.length,
      critical: criticalCount,
      error: errorCount,
      warn: warnCount,
      info: infoCount,
      filesChecked: filesToCheck.length,
      rulesRun: rulesToRun.length
    };

    // Apply fixes if requested
    let fixedCount = 0;
    if (fix) {
      fixedCount = await this._applyFixes(results.filter(r => r.autoFix));
      summary.fixed = fixedCount;
    }

    // Determine if gate passes
    const minSeverity = this._severityLevel(severity);
    const passed = this._hasBlockingIssues(results, minSeverity) === false;

    const checkResult = {
      passed,
      results,
      summary
    };

    // Run reporters
    for (const reporter of this.reporters) {
      reporter.report(checkResult);
    }

    return checkResult;
  }

  /**
   * Check single file against all rules
   * @param {string} filePath - File path
   * @param {Array} rules - Rules to run
   * @returns {Promise<Array>} File check results
   */
  async _checkFile(filePath, rules) {
    const results = [];

    if (!fs.existsSync(filePath)) {
      return [{
        file: filePath,
        rule: 'file-exists',
        ruleName: 'File Exists',
        severity: 'error',
        message: 'File not found',
        pass: false
      }];
    }

    for (const rule of rules) {
      if (!rule.enabled) continue;

      try {
        const result = await rule.check(filePath, rule.config || {});
        results.push({
          file: filePath,
          rule: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          message: result.message,
          pass: result.pass,
          skip: result.skip || false,
          fix: result.fix || rule.fix,
          autoFix: result.autoFix || false,
          details: result.details
        });
      } catch (e) {
        results.push({
          file: filePath,
          rule: rule.id,
          ruleName: rule.name,
          severity: 'error',
          message: `Rule execution error: ${e.message}`,
          pass: false
        });
      }
    }

    return results;
  }

  /**
   * Apply automatic fixes
   * @param {Array} fixableResults - Results with autoFix flag
   * @returns {Promise<number>} Number of fixes applied
   */
  async _applyFixes(fixableResults) {
    let fixedCount = 0;

    for (const result of fixableResults) {
      try {
        const content = fs.readFileSync(result.file, 'utf-8');
        let fixed = content;

        // Trailing whitespace fix
        if (result.rule === 'no-trailing-whitespace') {
          fixed = content.replace(/[ \t]+$/gm, '');
        }

        if (fixed !== content) {
          fs.writeFileSync(result.file, fixed, 'utf-8');
          fixedCount++;
        }
      } catch (e) {
        // Skip files that can't be fixed
      }
    }

    return fixedCount;
  }

  /**
   * Get all project files
   * @returns {Array<string>} File paths
   */
  _getProjectFiles() {
    const files = [];
    const ignoreDirs = new Set([
      'node_modules', '.git', 'dist', 'build', '.next',
      'coverage', '.nyc_output', '.cache', 'vendor'
    ]);
    const checkExts = new Set([
      '.js', '.ts', '.jsx', '.tsx', '.cjs', '.mjs',
      '.json', '.md', '.py', '.go', '.rs'
    ]);

    const scanDir = (dir, depth = 0) => {
      if (depth > 10) return; // Max depth limit

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!ignoreDirs.has(entry.name)) {
              scanDir(fullPath, depth + 1);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (checkExts.has(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (e) {
        // Skip directories we can't read
      }
    };

    scanDir(this.projectDir);
    return files;
  }

  /**
   * Get active rules from config
   * @returns {Array} Active rules
   */
  _getActiveRules() {
    const rules = registry.getAll({ enabled: true });
    const configured = this.config.rules || [];

    // Apply config overrides
    for (const override of configured) {
      const rule = registry.get(override.id);
      if (rule) {
        if (override.enabled !== undefined) {
          rule.enabled = override.enabled;
        }
        if (override.severity) {
          rule.severity = override.severity;
        }
        if (override.config) {
          rule.config = { ...rule.config, ...override.config };
        }
      }
    }

    return rules.filter(r => r.enabled);
  }

  /**
   * Load quality gate config
   * @returns {Object} Configuration
   */
  _loadConfig() {
    const configPath = path.join(this.projectDir, '.claude', 'quality-gate.json');

    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch {
        // Fall back to default
      }
    }

    // Default config
    return {
      enabled: true,
      severity: 'warn',
      rules: [
        { id: 'line-count-limit', enabled: true, severity: 'error' },
        { id: 'file-size-limit', enabled: true, severity: 'warn' },
        { id: 'no-empty-files', enabled: true, severity: 'warn' },
        { id: 'no-trailing-whitespace', enabled: true, severity: 'warn' }
      ],
      gates: {
        preCommit: true,
        prePush: true,
        onToolUse: false
      },
      reporting: {
        format: 'console'
      }
    };
  }

  /**
   * Convert severity string to number
   * @param {string} severity - Severity level
   * @returns {number} Numeric level
   */
  _severityLevel(severity) {
    const levels = { info: 0, warn: 1, error: 2, critical: 3 };
    return levels[severity] || 1;
  }

  /**
   * Check if results contain blocking issues
   * @param {Array} results - Check results
   * @param {number} minSeverity - Minimum blocking severity
   * @returns {boolean} Has blocking issues
   */
  _hasBlockingIssues(results, minSeverity) {
    return results.some(r =>
      !r.pass &&
      !r.skip &&
      this._severityLevel(r.severity) >= minSeverity
    );
  }
}

/**
 * Console reporter
 */
class ConsoleReporter {
  report(checkResult) {
    const { passed, results, summary } = checkResult;

    console.log('\n' + '='.repeat(60));
    console.log('Quality Gate Report');
    console.log('='.repeat(60));
    console.log(`Status: ${passed ? 'PASS' : 'FAIL'}`);
    console.log(`Files: ${summary.filesChecked}`);
    console.log(`Issues: ${summary.total} (${summary.critical} critical, ${summary.error} errors, ${summary.warn} warnings)`);
    console.log('='.repeat(60));

    // Group by file
    const byFile = {};
    for (const result of results) {
      if (!result.pass && !result.skip) {
        const relPath = path.relative(process.cwd(), result.file);
        if (!byFile[relPath]) byFile[relPath] = [];
        byFile[relPath].push(result);
      }
    }

    for (const [file, issues] of Object.entries(byFile)) {
      console.log(`\n${file}:`);
      for (const issue of issues) {
        const icon = { critical: 'X', error: 'E', warn: 'W', info: 'I' }[issue.severity];
        console.log(`  [${icon}] ${issue.ruleName}: ${issue.message}`);
        if (issue.fix) {
          console.log(`      Fix: ${issue.fix}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }
}

/**
 * JSON reporter
 */
class JsonReporter {
  report(checkResult) {
    console.log(JSON.stringify(checkResult, null, 2));
  }
}

/**
 * Markdown reporter
 */
class MarkdownReporter {
  report(checkResult) {
    const { passed, results, summary } = checkResult;

    let output = `# Quality Gate Report\n\n`;
    output += `**Status**: ${passed ? 'PASS :white_check_mark:' : 'FAIL :x:'}\n\n`;
    output += `## Summary\n\n`;
    output += `- Files: ${summary.filesChecked}\n`;
    output += `- Issues: ${summary.total}\n`;
    output += `  - Critical: ${summary.critical}\n`;
    output += `  - Errors: ${summary.error}\n`;
    output += `  - Warnings: ${summary.warn}\n\n`;

    if (results.length > 0) {
      output += `## Issues\n\n`;
      const byFile = {};
      for (const result of results.filter(r => !r.pass && !r.skip)) {
        const relPath = path.relative(process.cwd(), result.file);
        if (!byFile[relPath]) byFile[relPath] = [];
        byFile[relPath].push(result);
      }

      for (const [file, issues] of Object.entries(byFile)) {
        output += `### ${file}\n`;
        for (const issue of issues) {
          output += `- **${issue.ruleName}** (${issue.severity}): ${issue.message}\n`;
          if (issue.fix) {
            output += `  - Fix: ${issue.fix}\n`;
          }
        }
        output += '\n';
      }
    }

    console.log(output);
  }
}

/**
 * Check quality gate and throw if failed
 * @param {Object} options - Check options
 * @throws {QualityGateError} If check fails
 */
async function checkOrThrow(options = {}) {
  const gate = new QualityGate(options);
  const result = await gate.check(options);

  if (!result.passed) {
    throw new QualityGateError(
      'Quality gate check failed',
      result
    );
  }

  return result;
}

module.exports = {
  QualityGate,
  ConsoleReporter,
  JsonReporter,
  MarkdownReporter,
  checkOrThrow
};
