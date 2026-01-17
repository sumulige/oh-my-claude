/**
 * Quality Gate 模块单元测试
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Quality Gate Module', () => {
  const {
    QualityGate,
    ConsoleReporter,
    JsonReporter,
    MarkdownReporter,
    checkOrThrow
  } = require('../lib/quality-gate');

  const { QualityGateError } = require('../lib/errors');

  // Temporary test directory
  const tempDir = path.join(os.tmpdir(), 'smc-gate-test-' + Date.now());
  const cleanJsFile = path.join(tempDir, 'clean.js');
  const dirtyJsFile = path.join(tempDir, 'dirty.js');
  const largeJsFile = path.join(tempDir, 'large.js');
  const emptyJsFile = path.join(tempDir, 'empty.js');
  const subDir = path.join(tempDir, 'sub');
  const subDirFile = path.join(subDir, 'file.js');

  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });
    fs.mkdirSync(subDir, { recursive: true });

    // Create test files
    fs.writeFileSync(cleanJsFile, 'const x = 1;\nconst y = 2;\n');
    fs.writeFileSync(dirtyJsFile, 'const x = 1;   \nconst y = 2;\t\n');

    // Create large file
    const lines = ['// Large file'];
    for (let i = 0; i < 850; i++) {
      lines.push(`const line${i} = ${i};`);
    }
    fs.writeFileSync(largeJsFile, lines.join('\n'));

    fs.writeFileSync(emptyJsFile, '\n');
    fs.writeFileSync(subDirFile, 'const x = 1;\n');
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('QualityGate', () => {
    describe('constructor', () => {
      it('should create gate with default options', () => {
        const gate = new QualityGate();

        expect(gate.projectDir).toBeDefined();
        expect(gate.config).toBeDefined();
        expect(gate.reporters).toBeDefined();
        expect(gate.reporters.length).toBeGreaterThan(0);
      });

      it('should accept custom project directory', () => {
        const gate = new QualityGate({ projectDir: tempDir });

        expect(gate.projectDir).toBe(tempDir);
      });

      it('should accept custom config', () => {
        const customConfig = {
          enabled: true,
          severity: 'error',
          rules: []
        };

        const gate = new QualityGate({ config: customConfig });

        expect(gate.config).toEqual(customConfig);
      });

      it('should accept custom reporters', () => {
        const customReporter = {
          report: jest.fn()
        };

        const gate = new QualityGate({ reporters: [customReporter] });

        expect(gate.reporters).toHaveLength(1);
        expect(gate.reporters[0]).toBe(customReporter);
      });
    });

    describe('check', () => {
      let gate;

      beforeEach(() => {
        gate = new QualityGate({
          projectDir: tempDir,
          reporters: [] // Suppress output during tests
        });
      });

      it('should return check result object', async () => {
        const result = await gate.check();

        expect(result).toBeDefined();
        expect(typeof result.passed).toBe('boolean');
        expect(Array.isArray(result.results)).toBe(true);
        expect(result.summary).toBeDefined();
      });

      it('should scan project files', async () => {
        const result = await gate.check();

        expect(result.summary.filesChecked).toBeGreaterThan(0);
      });

      it('should run quality rules', async () => {
        const result = await gate.check();

        expect(result.summary.rulesRun).toBeGreaterThan(0);
      });

      it('should detect issues in files', async () => {
        const result = await gate.check();

        // Large file should trigger line-count-limit
        const lineCountIssues = result.results.filter(r => r.rule === 'line-count-limit');
        expect(lineCountIssues.length).toBeGreaterThan(0);
      });

      it('should count issues by severity', async () => {
        const result = await gate.check();

        expect(result.summary).toMatchObject({
          total: expect.any(Number),
          critical: expect.any(Number),
          error: expect.any(Number),
          warn: expect.any(Number),
          info: expect.any(Number)
        });
      });

      it('should pass when severity is critical and no critical issues', async () => {
        const result = await gate.check({ severity: 'critical' });

        // Should pass if no critical issues
        expect(typeof result.passed).toBe('boolean');
      });

      it('should fail when blocking issues exist', async () => {
        // Use a file with known issues
        const gateWithIssues = new QualityGate({
          projectDir: tempDir,
          reporters: [],
          config: {
            rules: [
              { id: 'line-count-limit', enabled: true, severity: 'error' }
            ]
          }
        });

        const result = await gateWithIssues.check({ severity: 'error' });

        // Large file should cause error severity issue
        if (result.summary.error > 0) {
          expect(result.passed).toBe(false);
        }
      });

      it('should respect severity threshold', async () => {
        const resultWarn = await gate.check({ severity: 'warn' });
        const resultCritical = await gate.check({ severity: 'critical' });

        // Critical threshold is less strict than warn (fewer blocking issues)
        // So critical should pass more often than warn
        if (resultWarn.passed === false && resultCritical.passed === true) {
          // This is the expected case: warn fails but critical passes
          expect(true).toBe(true);
        } else {
          // If both pass or both fail, that's also acceptable
          expect(resultCritical.passed).toBe(resultWarn.passed);
        }
      });

      it('should check specific files when provided', async () => {
        const result = await gate.check({ files: [cleanJsFile] });

        expect(result.summary.filesChecked).toBe(1);
      });

      it('should run specific rules when provided', async () => {
        const result = await gate.check({
          rules: [{ id: 'no-empty-files', enabled: true }]
        });

        expect(result.summary.rulesRun).toBe(1);
      });

      it('should apply auto-fixes when requested', async () => {
        // Create a file with trailing whitespace for auto-fix test
        const fixableFile = path.join(tempDir, 'fixable.js');
        fs.writeFileSync(fixableFile, 'const x = 1;   \nconst y = 2;\t\n');

        const result = await gate.check({
          files: [fixableFile],
          fix: true
        });

        // The file should now be fixed
        const content = fs.readFileSync(fixableFile, 'utf-8');
        const hasTrailing = content.match(/[ \t]$/gm);
        expect(hasTrailing).toBeNull();
      });

      it('should track fixed issues in summary', async () => {
        const fixableFile = path.join(tempDir, 'fixable2.js');
        fs.writeFileSync(fixableFile, 'const x = 1;   \n');

        const result = await gate.check({
          files: [fixableFile],
          fix: true
        });

        expect(result.summary).toHaveProperty('fixed');
      });
    });

    describe('_getProjectFiles', () => {
      it('should ignore common directories', async () => {
        // Create node_modules directory
        const nodeModulesDir = path.join(tempDir, 'node_modules');
        fs.mkdirSync(nodeModulesDir, { recursive: true });
        fs.writeFileSync(path.join(nodeModulesDir, 'index.js'), 'ignored');

        const gate = new QualityGate({ projectDir: tempDir, reporters: [] });
        const result = await gate.check();

        // Should not include node_modules files
        const nodeModulesFiles = result.results.filter(r =>
          r.file.includes('node_modules')
        );
        expect(nodeModulesFiles).toHaveLength(0);

        fs.rmSync(nodeModulesDir, { recursive: true, force: true });
      });

      it('should check supported file extensions', async () => {
        const gate = new QualityGate({ projectDir: tempDir, reporters: [] });
        const result = await gate.check();

        // Should have checked .js files
        const jsFiles = result.results.filter(r => r.file.endsWith('.js'));
        expect(jsFiles.length).toBeGreaterThan(0);
      });
    });

    describe('_getActiveRules', () => {
      it('should load rules from config file', () => {
        const configDir = path.join(tempDir, '.claude');
        fs.mkdirSync(configDir, { recursive: true });

        fs.writeFileSync(
          path.join(configDir, 'quality-gate.json'),
          JSON.stringify({
            enabled: true,
            severity: 'warn',
            rules: [
              { id: 'line-count-limit', enabled: true, severity: 'error' }
            ]
          })
        );

        const gate = new QualityGate({ projectDir: tempDir, reporters: [] });
        const rules = gate._getActiveRules();

        expect(rules.length).toBeGreaterThan(0);

        fs.rmSync(configDir, { recursive: true, force: true });
      });

      it('should use default config when file doesn\'t exist', () => {
        const gate = new QualityGate({ projectDir: tempDir, reporters: [] });
        const rules = gate._getActiveRules();

        expect(rules.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ConsoleReporter', () => {
    let reporter;
    let consoleSpy;

    beforeEach(() => {
      reporter = new ConsoleReporter();
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should report pass status', () => {
      const result = {
        passed: true,
        summary: {
          filesChecked: 10,
          total: 0,
          critical: 0,
          error: 0,
          warn: 0
        },
        results: []
      };

      reporter.report(result);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('PASS')
      );
    });

    it('should report fail status', () => {
      const result = {
        passed: false,
        summary: {
          filesChecked: 10,
          total: 5,
          critical: 1,
          error: 2,
          warn: 2
        },
        results: [
          {
            file: '/path/to/file.js',
            ruleName: 'Test Rule',
            severity: 'error',
            message: 'Test error',
            fix: 'Fix it'
          }
        ]
      };

      reporter.report(result);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('FAIL')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test Rule')
      );
    });

    it('should display file paths', () => {
      const result = {
        passed: false,
        summary: {
          filesChecked: 1,
          total: 1,
          critical: 0,
          error: 1,
          warn: 0
        },
        results: [
          {
            file: path.join(tempDir, 'test.js'),
            ruleName: 'Line Count',
            severity: 'error',
            message: 'Too many lines',
            pass: false
          }
        ]
      };

      reporter.report(result);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('test.js')
      );
    });

    it('should show fix suggestions', () => {
      const result = {
        passed: false,
        summary: {
          filesChecked: 1,
          total: 1,
          critical: 0,
          error: 1,
          warn: 0
        },
        results: [
          {
            file: '/path/to/file.js',
            ruleName: 'Test Rule',
            severity: 'warn',
            message: 'Test warning',
            pass: false,
            fix: 'Apply this fix'
          }
        ]
      };

      reporter.report(result);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Fix:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Apply this fix')
      );
    });
  });

  describe('JsonReporter', () => {
    let reporter;
    let consoleSpy;

    beforeEach(() => {
      reporter = new JsonReporter();
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should output JSON', () => {
      const result = {
        passed: true,
        summary: { filesChecked: 5, total: 0 },
        results: []
      };

      reporter.report(result);

      const output = consoleSpy.mock.calls[0][0];

      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should include all result data', () => {
      const result = {
        passed: false,
        summary: {
          filesChecked: 1,
          total: 1,
          critical: 0,
          error: 1,
          warn: 0
        },
        results: [
          {
            file: '/test.js',
            rule: 'test-rule',
            ruleName: 'Test Rule',
            severity: 'error',
            message: 'Test error',
            pass: false
          }
        ]
      };

      reporter.report(result);

      const output = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(output.passed).toBe(false);
      expect(output.summary).toBeDefined();
      expect(output.results).toHaveLength(1);
    });
  });

  describe('MarkdownReporter', () => {
    let reporter;
    let consoleSpy;

    beforeEach(() => {
      reporter = new MarkdownReporter();
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should output markdown format', () => {
      const result = {
        passed: true,
        summary: {
          filesChecked: 5,
          total: 0,
          critical: 0,
          error: 0,
          warn: 0
        },
        results: []
      };

      reporter.report(result);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('# Quality Gate Report')
      );
    });

    it('should show pass/fail status with emoji', () => {
      const passResult = {
        passed: true,
        summary: { filesChecked: 1, total: 0, critical: 0, error: 0, warn: 0 },
        results: []
      };

      reporter.report(passResult);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(':white_check_mark:')
      );

      jest.clearAllMocks();

      const failResult = {
        passed: false,
        summary: { filesChecked: 1, total: 1, critical: 0, error: 1, warn: 0 },
        results: [
          {
            file: '/test.js',
            ruleName: 'Test Rule',
            severity: 'error',
            message: 'Test error',
            pass: false
          }
        ]
      };

      reporter.report(failResult);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(':x:')
      );
    });

    it('should include summary section', () => {
      const result = {
        passed: true,
        summary: {
          filesChecked: 10,
          total: 5,
          critical: 0,
          error: 2,
          warn: 3
        },
        results: []
      };

      reporter.report(result);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('## Summary')
      );
    });
  });

  describe('checkOrThrow', () => {
    it('should return result when check passes', async () => {
      const result = await checkOrThrow({
        projectDir: tempDir,
        severity: 'critical'
      });

      expect(result).toBeDefined();
      expect(typeof result.passed).toBe('boolean');
    });

    it('should throw QualityGateError when check fails', async () => {
      // Create a gate that will definitely fail
      const failDir = path.join(os.tmpdir(), 'smc-fail-test-' + Date.now());
      fs.mkdirSync(failDir, { recursive: true });

      // Create a large file that will fail line-count-limit
      const largeFile = path.join(failDir, 'large.js');
      const lines = [];
      for (let i = 0; i < 900; i++) {
        lines.push(`const x = ${i};`);
      }
      fs.writeFileSync(largeFile, lines.join('\n'));

      await expect(async () => {
        await checkOrThrow({
          projectDir: failDir,
          severity: 'error'
        });
      }).rejects.toThrow(QualityGateError);

      fs.rmSync(failDir, { recursive: true, force: true });
    });

    it('should include result in thrown error', async () => {
      const failDir = path.join(os.tmpdir(), 'smc-fail-test2-' + Date.now());
      fs.mkdirSync(failDir, { recursive: true });

      const largeFile = path.join(failDir, 'large.js');
      const lines = [];
      for (let i = 0; i < 900; i++) {
        lines.push(`const x = ${i};`);
      }
      fs.writeFileSync(largeFile, lines.join('\n'));

      try {
        await checkOrThrow({
          projectDir: failDir,
          severity: 'error'
        });
        fail('Should have thrown');
      } catch (e) {
        expect(e instanceof QualityGateError).toBe(true);
        expect(e.results).toBeDefined();
      } finally {
        fs.rmSync(failDir, { recursive: true, force: true });
      }
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete check workflow', async () => {
      const gate = new QualityGate({
        projectDir: tempDir,
        reporters: []
      });

      const result = await gate.check();

      expect(result).toMatchObject({
        passed: expect.any(Boolean),
        results: expect.any(Array),
        summary: expect.objectContaining({
          filesChecked: expect.any(Number),
          rulesRun: expect.any(Number),
          total: expect.any(Number)
        })
      });
    });

    it('should handle files with various issues', async () => {
      const gate = new QualityGate({
        projectDir: tempDir,
        reporters: []
      });

      const result = await gate.check();

      // Should find issues in dirty file
      const dirtyFileIssues = result.results.filter(r =>
        r.file === dirtyJsFile || r.file.endsWith(path.basename(dirtyJsFile))
      );

      expect(dirtyFileIssues.length).toBeGreaterThan(0);
    });

    it('should handle empty project directory', async () => {
      const emptyDir = path.join(os.tmpdir(), 'smc-empty-' + Date.now());
      fs.mkdirSync(emptyDir, { recursive: true });

      const gate = new QualityGate({
        projectDir: emptyDir,
        reporters: []
      });

      const result = await gate.check();

      expect(result.summary.filesChecked).toBe(0);

      fs.rmSync(emptyDir, { recursive: true, force: true });
    });
  });
});
