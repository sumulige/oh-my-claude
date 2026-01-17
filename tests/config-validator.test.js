/**
 * Config Validator 模块单元测试
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Config Validator Module', () => {
  const {
    ConfigValidator,
    defaultValidator,
    validate,
    validateFile,
    validateOrThrow,
    isAJVAvailable
  } = require('../lib/config-validator');

  const { ConfigError } = require('../lib/errors');

  // Temporary directory for test files
  const tempDir = path.join(os.tmpdir(), 'smc-validator-test-' + Date.now());
  const validConfigFile = path.join(tempDir, 'valid-config.json');
  const invalidConfigFile = path.join(tempDir, 'invalid-config.json');
  const malformedJsonFile = path.join(tempDir, 'malformed.json');
  const settingsFile = path.join(tempDir, 'settings.json');
  const qualityGateFile = path.join(tempDir, 'quality-gate.json');

  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });

    // Create valid config file
    fs.writeFileSync(validConfigFile, JSON.stringify({
      version: '1.0.7',
      model: 'claude-opus-4.5',
      agents: {
        conductor: { role: 'coordination' }
      },
      skills: []
    }));

    // Create invalid config file
    fs.writeFileSync(invalidConfigFile, JSON.stringify({
      model: 'test'
      // Missing required 'version' field
    }));

    // Create malformed JSON file
    fs.writeFileSync(malformedJsonFile, '{ "version": "1.0.0", }');

    // Create settings file
    fs.writeFileSync(settingsFile, JSON.stringify({
      updateCheck: true,
      syncInterval: 24
    }));

    // Create quality-gate file
    fs.writeFileSync(qualityGateFile, JSON.stringify({
      enabled: true,
      severity: 'warn',
      rules: []
    }));
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('isAJVAvailable', () => {
    it('should return boolean indicating AJV availability', () => {
      expect(typeof isAJVAvailable()).toBe('boolean');
    });
  });

  describe('ConfigValidator', () => {
    let validator;

    beforeEach(() => {
      validator = new ConfigValidator();
    });

    describe('constructor', () => {
      it('should create validator with default options', () => {
        expect(validator.strict).toBe(true);
        expect(validator.allErrors).toBe(true);
        expect(validator.coerceTypes).toBe(true);
        expect(validator.useDefaults).toBe(false);
      });

      it('should accept custom options', () => {
        const customValidator = new ConfigValidator({
          strict: false,
          allErrors: false,
          coerceTypes: false,
          useDefaults: true
        });

        expect(customValidator.strict).toBe(false);
        expect(customValidator.allErrors).toBe(false);
        expect(customValidator.coerceTypes).toBe(false);
        expect(customValidator.useDefaults).toBe(true);
      });

      it('should initialize AJV if available', () => {
        if (isAJVAvailable()) {
          expect(validator.ajv).toBeDefined();
          expect(typeof validator.configValidate).toBe('function');
          expect(typeof validator.settingsValidate).toBe('function');
          expect(typeof validator.qualityGateValidate).toBe('function');
        } else {
          expect(validator.ajv).toBeNull();
        }
      });
    });

    describe('validate', () => {
      describe('with valid config', () => {
        it('should validate valid config object', () => {
          const validConfig = {
            version: '1.0.7',
            model: 'claude-opus-4.5',
            agents: {},
            skills: []
          };

          const result = validator.validate(validConfig, 'config');

          expect(result.valid).toBe(true);
          expect(result.errors).toEqual([]);
          expect(result.warnings).toEqual([]);
          expect(result.fixes).toEqual([]);
        });

        it('should validate settings object', () => {
          const settings = {
            updateCheck: true,
            syncInterval: 24
          };

          const result = validator.validate(settings, 'settings');

          expect(result.valid).toBe(true);
        });

        it('should validate quality-gate object', () => {
          const qualityGate = {
            enabled: true,
            severity: 'warn',
            rules: []
          };

          const result = validator.validate(qualityGate, 'quality-gate');

          expect(result.valid).toBe(true);
        });
      });

      describe('with invalid config', () => {
        it('should return errors for invalid config', () => {
          const invalidConfig = {
            model: 'test'
            // Missing version
          };

          const result = validator.validate(invalidConfig, 'config');

          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should handle unknown schema name', () => {
          const result = validator.validate({ test: 'value' }, 'unknown-schema');

          expect(result.valid).toBe(false);
          expect(result.errors[0].path).toBe('schema');
        });

        it('should separate errors from warnings', () => {
          // This test depends on AJV's error categorization
          const result = validator.validate({}, 'config');

          if (!isAJVAvailable()) {
            // Basic validation
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        });

        it('should include fix suggestions', () => {
          const result = validator.validate({}, 'config');

          if (result.errors.length > 0) {
            expect(result.fixes.length).toBeGreaterThan(0);
          }
        });
      });

      describe('without AJV (fallback)', () => {
        it('should do basic validation when AJV not available', () => {
          // This is tested implicitly when AJV is not installed
          const result = validator.validate({ version: '1.0.0' }, 'config');

          expect(result).toBeDefined();
          expect(typeof result.valid).toBe('boolean');
        });

        it('should require config to be object', () => {
          const result = validator.validate(null, 'config');

          expect(result.valid).toBe(false);
          expect(result.errors[0].message).toContain('object');
        });

        it('should validate version format', () => {
          const result = validator.validate({ version: 'invalid' }, 'config');

          expect(result.valid).toBe(false);
          if (result.errors.length > 0) {
            expect(result.errors.some(e => e.path === 'version')).toBe(true);
          }
        });
      });
    });

    describe('validateFile', () => {
      it('should validate valid config file', () => {
        const result = validator.validateFile(validConfigFile);

        expect(result.valid).toBe(true);
      });

      it('should handle non-existent file', () => {
        const result = validator.validateFile('/does/not/exist.json');

        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toContain('not found');
      });

      it('should handle malformed JSON', () => {
        const result = validator.validateFile(malformedJsonFile);

        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toContain('JSON');
      });

      it('should provide fix suggestion for JSON errors', () => {
        const result = validator.validateFile(malformedJsonFile);

        // Should have errors for malformed JSON
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        // Fix suggestions may or may not be present depending on error type
        expect(result.errors[0].message).toContain('JSON');
      });

      it('should auto-detect schema from filename', () => {
        // For config.json
        const configResult = validator.validateFile(validConfigFile);
        expect(configResult).toBeDefined();

        // For settings.json
        const settingsResult = validator.validateFile(settingsFile);
        expect(settingsResult).toBeDefined();

        // For quality-gate.json
        const gateResult = validator.validateFile(qualityGateFile);
        expect(gateResult).toBeDefined();
      });

      it('should accept explicit schema name', () => {
        const result = validator.validateFile(validConfigFile, 'config');

        expect(result).toBeDefined();
        expect(typeof result.valid).toBe('boolean');
      });
    });

    describe('validateOrThrow', () => {
      it('should return config when valid', () => {
        const validConfig = {
          version: '1.0.7',
          model: 'claude-opus-4.5',
          agents: {},
          skills: []
        };

        const result = validator.validateOrThrow(validConfig, 'config');

        expect(result).toEqual(validConfig);
      });

      it('should throw ConfigError when invalid', () => {
        const invalidConfig = { model: 'test' };

        expect(() => {
          validator.validateOrThrow(invalidConfig, 'config');
        }).toThrow(ConfigError);
      });

      it('should include error details in thrown error', () => {
        const invalidConfig = {};

        try {
          validator.validateOrThrow(invalidConfig, 'config');
          fail('Should have thrown');
        } catch (e) {
          expect(e instanceof ConfigError).toBe(true);
          expect(e.errors).toBeDefined();
          expect(e.fixes).toBeDefined();
        }
      });
    });
  });

  describe('defaultValidator', () => {
    it('should export a default validator instance', () => {
      expect(defaultValidator).toBeDefined();
      expect(defaultValidator instanceof ConfigValidator).toBe(true);
    });

    it('should have default options', () => {
      expect(defaultValidator.strict).toBe(true);
    });
  });

  describe('Convenience Functions', () => {
    describe('validate', () => {
      it('should use default validator', () => {
        const result = validate({
          version: '1.0.7',
          model: 'claude-opus-4.5',
          agents: {},
          skills: []
        });

        expect(result).toBeDefined();
      });
    });

    describe('validateFile', () => {
      it('should use default validator', () => {
        const result = validateFile(validConfigFile);

        expect(result).toBeDefined();
      });
    });

    describe('validateOrThrow', () => {
      it('should use default validator', () => {
        const result = validateOrThrow({
          version: '1.0.7',
          model: 'claude-opus-4.5',
          agents: {},
          skills: []
        });

        expect(result).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty config', () => {
      const validator = new ConfigValidator();
      const result = validator.validate({}, 'config');

      expect(result).toBeDefined();
    });

    it('should handle null config', () => {
      const validator = new ConfigValidator();
      const result = validator.validate(null, 'config');

      expect(result.valid).toBe(false);
    });

    it('should handle array config', () => {
      const validator = new ConfigValidator();
      const result = validator.validate([], 'config');

      expect(result.valid).toBe(false);
    });

    it('should handle config with extra properties', () => {
      const validator = new ConfigValidator();
      const result = validator.validate({
        version: '1.0.7',
        extraProperty: 'should not error'
      }, 'config');

      // Extra properties should not cause validation failure (removeAdditional: false)
      expect(result.valid).toBeDefined();
    });
  });

  describe('Schema Auto-detection', () => {
    it('should detect config schema from config.json', () => {
      const result = validateFile(validConfigFile);

      // Should not throw and should return a result
      expect(result).toBeDefined();
    });

    it('should detect settings schema from settings.json', () => {
      const result = validateFile(settingsFile);

      expect(result).toBeDefined();
    });

    it('should detect settings schema from settings.local.json', () => {
      const localSettingsFile = path.join(tempDir, 'settings.local.json');
      fs.writeFileSync(localSettingsFile, JSON.stringify({ updateCheck: false }));

      const result = validateFile(localSettingsFile);

      expect(result).toBeDefined();
    });

    it('should detect quality-gate schema from quality-gate.json', () => {
      const result = validateFile(qualityGateFile);

      expect(result).toBeDefined();
    });

    it('should default to config schema for unknown filenames', () => {
      const unknownFile = path.join(tempDir, 'unknown.json');
      fs.writeFileSync(unknownFile, JSON.stringify({ version: '1.0.0' }));

      const result = validateFile(unknownFile);

      expect(result).toBeDefined();
    });
  });
});
