/**
 * Errors 模块单元测试
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Error Types', () => {
  const {
    SMCError,
    ConfigError,
    ValidationError,
    QualityGateError,
    MigrationError,
    FileError,
    RuleError,
    parseAJVErrors,
    getSeverityFromKeyword,
    generateFixFromError
  } = require('../lib/errors');

  describe('SMCError (Base Class)', () => {
    it('should create error with all properties', () => {
      const error = new SMCError('Test error', {
        code: 'ERR_TEST',
        severity: 'error',
        details: { key: 'value' },
        hints: ['Fix this', 'Try that'],
        docUrl: 'https://example.com/docs'
      });

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('SMCError');
      expect(error.code).toBe('ERR_TEST');
      expect(error.severity).toBe('error');
      expect(error.details).toEqual({ key: 'value' });
      expect(error.hints).toEqual(['Fix this', 'Try that']);
      expect(error.docUrl).toBe('https://example.com/docs');
    });

    it('should use defaults when options not provided', () => {
      const error = new SMCError('Simple error');

      expect(error.code).toBe('ERR_UNKNOWN');
      expect(error.severity).toBe('error');
      expect(error.details).toEqual({});
      expect(error.hints).toEqual([]);
    });

    it('should serialize to JSON correctly', () => {
      const error = new SMCError('Test', {
        code: 'ERR_TEST',
        severity: 'warn',
        hints: ['Hint 1']
      });

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'SMCError',
        code: 'ERR_TEST',
        message: 'Test',
        severity: 'warn',
        details: {},
        hints: ['Hint 1'],
        docUrl: undefined
      });
    });

    it('should format toString with hints', () => {
      const error = new SMCError('Test error', {
        code: 'ERR_TEST',
        hints: ['First hint', 'Second hint']
      });

      const str = error.toString();

      expect(str).toContain('[ERR_TEST]');
      expect(str).toContain('Test error');
      expect(str).toContain('Suggestions:');
      expect(str).toContain('1. First hint');
      expect(str).toContain('2. Second hint');
    });

    it('should include docUrl in toString when present', () => {
      const error = new SMCError('Test', {
        code: 'ERR_TEST',
        docUrl: 'https://docs.example.com'
      });

      const str = error.toString();

      expect(str).toContain('https://docs.example.com');
    });

    it('should compare severity levels correctly', () => {
      const infoError = new SMCError('Test', { severity: 'info' });
      const warnError = new SMCError('Test', { severity: 'warn' });
      const errorError = new SMCError('Test', { severity: 'error' });
      const criticalError = new SMCError('Test', { severity: 'critical' });

      expect(infoError.hasSeverity('info')).toBe(true);
      expect(infoError.hasSeverity('warn')).toBe(false);

      expect(warnError.hasSeverity('info')).toBe(true);
      expect(warnError.hasSeverity('warn')).toBe(true);
      expect(warnError.hasSeverity('error')).toBe(false);

      expect(errorError.hasSeverity('info')).toBe(true);
      expect(errorError.hasSeverity('error')).toBe(true);
      expect(errorError.hasSeverity('critical')).toBe(false);

      expect(criticalError.hasSeverity('info')).toBe(true);
      expect(criticalError.hasSeverity('critical')).toBe(true);
    });

    it('should be instanceof Error', () => {
      const error = new SMCError('Test');
      expect(error instanceof Error).toBe(true);
    });

    it('should have correct stack trace', () => {
      const error = new SMCError('Test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('SMCError');
    });
  });

  describe('ConfigError', () => {
    it('should create config error with errors and fixes', () => {
      const errors = [
        { path: 'agents', message: 'Invalid agents config', severity: 'error' },
        { path: 'version', message: 'Missing version', severity: 'critical' }
      ];
      const fixes = ['Add version field', 'Fix agents structure'];

      const error = new ConfigError('Config validation failed', errors, fixes);

      expect(error.message).toBe('Config validation failed');
      expect(error.code).toBe('ERR_CONFIG');
      expect(error.severity).toBe('critical');
      expect(error.errors).toEqual(errors);
      expect(error.fixes).toEqual(fixes);
      expect(error.details.errorCount).toBe(2);
      expect(error.details.fixCount).toBe(2);
      expect(error.details.criticalCount).toBe(1);
    });

    it('should format toString with error details', () => {
      const errors = [
        { path: 'version', message: 'Missing version', severity: 'critical' },
        { path: 'agents', message: 'Invalid type', severity: 'error', fix: 'Use object type' }
      ];
      const fixes = ['Add version field'];

      const error = new ConfigError('Config error', errors, fixes);
      const str = error.toString();

      expect(str).toContain('ConfigError:');
      expect(str).toContain('Errors (2):');
      expect(str).toContain('[X] version: Missing version');
      expect(str).toContain('[E] agents: Invalid type');
      expect(str).toContain('Fix: Use object type');
      expect(str).toContain('Suggested fixes:');
      expect(str).toContain('1. Add version field');
    });

    it('should handle empty errors and fixes', () => {
      const error = new ConfigError('No errors', [], []);

      expect(error.details.errorCount).toBe(0);
      expect(error.details.fixCount).toBe(0);
      expect(error.details.criticalCount).toBe(0);
    });

    it('should accept additional options', () => {
      const error = new ConfigError('Test', [], [], {
        severity: 'error',
        code: 'CUSTOM_CODE'
      });

      expect(error.severity).toBe('error');
      expect(error.code).toBe('CUSTOM_CODE');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Validation failed');

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('ERR_VALIDATION');
      expect(error.severity).toBe('error');
    });

    it('should accept custom options', () => {
      const error = new ValidationError('Custom message', {
        severity: 'critical',
        details: { field: 'email' }
      });

      expect(error.severity).toBe('critical');
      expect(error.details.field).toBe('email');
    });
  });

  describe('QualityGateError', () => {
    it('should create quality gate error with results', () => {
      const results = {
        passed: false,
        summary: {
          total: 10,
          critical: 1,
          error: 2,
          warn: 7
        }
      };

      const error = new QualityGateError('Quality gate failed', results);

      expect(error.message).toBe('Quality gate failed');
      expect(error.code).toBe('ERR_QUALITY_GATE');
      expect(error.severity).toBe('error');
      expect(error.results).toEqual(results);
      expect(error.details.passed).toBe(false);
      expect(error.details.total).toBe(10);
      expect(error.details.critical).toBe(1);
      expect(error.details.error).toBe(2);
      expect(error.details.warn).toBe(7);
    });

    it('should handle empty results', () => {
      const error = new QualityGateError('Failed', {});

      expect(error.details.passed).toBe(false);
      expect(error.details.total).toBe(0);
      expect(error.details.critical).toBe(0);
    });
  });

  describe('MigrationError', () => {
    it('should create migration error', () => {
      const error = new MigrationError('Migration from v1.0.0 failed');

      expect(error.message).toBe('Migration from v1.0.0 failed');
      expect(error.code).toBe('ERR_MIGRATION');
      expect(error.severity).toBe('critical');
    });

    it('should accept custom options', () => {
      const error = new MigrationError('Test', {
        details: { fromVersion: '1.0.0', toVersion: '1.1.0' }
      });

      expect(error.details.fromVersion).toBe('1.0.0');
      expect(error.details.toVersion).toBe('1.1.0');
    });
  });

  describe('FileError', () => {
    it('should create file error with filePath', () => {
      const filePath = '/path/to/file.json';
      const error = new FileError('File not found', filePath);

      expect(error.message).toBe('File not found');
      expect(error.code).toBe('ERR_FILE');
      expect(error.severity).toBe('error');
      expect(error.filePath).toBe(filePath);
      expect(error.details.file).toBe(filePath);
    });

    it('should accept custom options', () => {
      const error = new FileError('Test', '/path', {
        severity: 'critical'
      });

      expect(error.severity).toBe('critical');
    });
  });

  describe('RuleError', () => {
    it('should create rule error with ruleId', () => {
      const ruleId = 'line-count-limit';
      const error = new RuleError('Rule execution failed', ruleId);

      expect(error.message).toBe('Rule execution failed');
      expect(error.code).toBe('ERR_RULE');
      expect(error.severity).toBe('warn');
      expect(error.ruleId).toBe(ruleId);
      expect(error.details.rule).toBe(ruleId);
    });

    it('should accept custom options', () => {
      const error = new RuleError('Test', 'my-rule', {
        severity: 'error'
      });

      expect(error.severity).toBe('error');
    });
  });

  describe('Utility Functions', () => {
    describe('getSeverityFromKeyword', () => {
      it('should map AJV keywords to severity levels', () => {
        expect(getSeverityFromKeyword('required')).toBe('critical');
        expect(getSeverityFromKeyword('type')).toBe('error');
        expect(getSeverityFromKeyword('enum')).toBe('error');
        expect(getSeverityFromKeyword('pattern')).toBe('warn');
        expect(getSeverityFromKeyword('format')).toBe('warn');
        expect(getSeverityFromKeyword('minimum')).toBe('warn');
        expect(getSeverityFromKeyword('maximum')).toBe('warn');
        expect(getSeverityFromKeyword('minLength')).toBe('warn');
        expect(getSeverityFromKeyword('maxLength')).toBe('warn');
      });

      it('should return warn for unknown keywords', () => {
        expect(getSeverityFromKeyword('unknown')).toBe('warn');
        expect(getSeverityFromKeyword('custom')).toBe('warn');
      });
    });

    describe('generateFixFromError', () => {
      it('should generate fix suggestions for known keywords', () => {
        expect(generateFixFromError({ keyword: 'required', params: { missingProperty: 'name' } }))
          .toBe('Add missing field: name');

        expect(generateFixFromError({ keyword: 'pattern', schema: { pattern: '^[a-z]+$' } }))
          .toBe('Value must match pattern: ^[a-z]+$');

        expect(generateFixFromError({ keyword: 'enum', schema: { enum: ['a', 'b', 'c'] } }))
          .toBe('Value must be one of: a, b, c');

        expect(generateFixFromError({ keyword: 'type', schema: { type: 'string' } }))
          .toBe('Change type to: string');

        expect(generateFixFromError({ keyword: 'minimum', schema: { minimum: 0 } }))
          .toBe('Value must be >= 0');

        expect(generateFixFromError({ keyword: 'maximum', schema: { maximum: 100 } }))
          .toBe('Value must be <= 100');

        expect(generateFixFromError({ keyword: 'minLength', schema: { minLength: 5 } }))
          .toBe('Length must be >= 5');

        expect(generateFixFromError({ keyword: 'maxLength', schema: { maxLength: 50 } }))
          .toBe('Length must be <= 50');
      });

      it('should return null for unknown keywords', () => {
        expect(generateFixFromError({ keyword: 'unknown' })).toBeNull();
      });
    });

    describe('parseAJVErrors', () => {
      it('should parse AJV error objects', () => {
        const ajvErrors = [
          {
            instancePath: '/agents',
            message: 'must be object',
            keyword: 'type',
            schema: { type: 'object' },
            data: 'string'
          },
          {
            instancePath: '/version',
            message: 'must match pattern',
            keyword: 'pattern',
            schema: { pattern: '^\\d+\\.\\d+\\.\\d+$' }
          },
          {
            instancePath: '',
            message: "must have required property 'name'",
            keyword: 'required',
            params: { missingProperty: 'name' }
          }
        ];

        const parsed = parseAJVErrors(ajvErrors);

        expect(parsed).toHaveLength(3);

        expect(parsed[0]).toEqual({
          path: '/agents',
          message: 'must be object',
          severity: 'error',
          expected: 'object',
          actual: 'string',
          keyword: 'type',
          fix: 'Change type to: object'
        });

        expect(parsed[1]).toEqual({
          path: '/version',
          message: 'must match pattern',
          severity: 'warn',
          expected: undefined,
          actual: undefined,
          keyword: 'pattern',
          fix: 'Value must match pattern: ^\\d+\\.\\d+\\.\\d+$'
        });

        expect(parsed[2]).toEqual({
          path: 'root',
          message: "must have required property 'name'",
          severity: 'critical',
          expected: undefined,
          actual: undefined,
          keyword: 'required',
          fix: 'Add missing field: name'
        });
      });

      it('should handle empty array', () => {
        expect(parseAJVErrors([])).toEqual([]);
      });

      it('should handle missing instancePath', () => {
        const ajvErrors = [
          {
            message: 'validation failed',
            keyword: 'unknown'
          }
        ];

        const parsed = parseAJVErrors(ajvErrors);

        expect(parsed[0].path).toBe('root');
      });

      it('should handle errors with no schema property', () => {
        const ajvErrors = [
          {
            instancePath: '/test',
            message: 'failed',
            keyword: 'custom'
          }
        ];

        const parsed = parseAJVErrors(ajvErrors);

        expect(parsed[0].severity).toBe('warn');
        expect(parsed[0].fix).toBeNull();
      });
    });
  });

  describe('Error Inheritance Chain', () => {
    it('should maintain instanceof for all error types', () => {
      const smcError = new SMCError('test');
      const configError = new ConfigError('test', [], []);
      const validationError = new ValidationError('test');
      const qualityGateError = new QualityGateError('test', {});
      const migrationError = new MigrationError('test');
      const fileError = new FileError('test', '/path');
      const ruleError = new RuleError('test', 'rule-id');

      expect(configError instanceof SMCError).toBe(true);
      expect(configError instanceof Error).toBe(true);

      expect(validationError instanceof SMCError).toBe(true);
      expect(validationError instanceof Error).toBe(true);

      expect(qualityGateError instanceof SMCError).toBe(true);
      expect(qualityGateError instanceof Error).toBe(true);

      expect(migrationError instanceof SMCError).toBe(true);
      expect(migrationError instanceof Error).toBe(true);

      expect(fileError instanceof SMCError).toBe(true);
      expect(fileError instanceof Error).toBe(true);

      expect(ruleError instanceof SMCError).toBe(true);
      expect(ruleError instanceof Error).toBe(true);
    });
  });
});
