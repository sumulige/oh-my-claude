/**
 * Quality Rules 模块单元测试
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Quality Rules Module', () => {
  const { RuleRegistry, registry } = require('../lib/quality-rules');

  // Create temporary test files
  const tempDir = path.join(os.tmpdir(), 'smc-rules-test-' + Date.now());
  const testJsFile = path.join(tempDir, 'test.js');
  const testPyFile = path.join(tempDir, 'test.py');
  const testMdFile = path.join(tempDir, 'test.md');
  const testJsonFile = path.join(tempDir, 'test.json');
  const largeJsFile = path.join(tempDir, 'large.js');
  const emptyJsFile = path.join(tempDir, 'empty.js');
  const rulesJsonFile = path.join(tempDir, 'rules.json');
  const rulesYamlFile = path.join(tempDir, 'rules.yaml');

  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });

    // Create test files with various content
    fs.writeFileSync(testJsFile, 'console.log("hello");\nconsole.log("world");\nconst x = 1;\n');
    fs.writeFileSync(testPyFile, '# Python file\nprint("hello")');
    fs.writeFileSync(testMdFile, '# Title\n\nContent here\n');
    fs.writeFileSync(testJsonFile, '{"key": "value"}');

    // Create a large JavaScript file (over 800 lines)
    const lines = ['// Large file'];
    for (let i = 0; i < 850; i++) {
      lines.push(`const line${i} = ${i};`);
    }
    fs.writeFileSync(largeJsFile, lines.join('\n'));

    // Create an empty file
    fs.writeFileSync(emptyJsFile, '\n\n');

    // Create custom rules JSON file
    fs.writeFileSync(rulesJsonFile, JSON.stringify({
      rules: [
        {
          id: 'custom-rule-1',
          name: 'Custom Rule 1',
          severity: 'error',
          enabled: true,
          description: 'A custom rule',
          check: () => ({ pass: true, skip: true })
        }
      ]
    }));

    // Create custom rules YAML file
    fs.writeFileSync(rulesYamlFile, `
rules:
  - id: custom-yaml-rule
    name: Custom YAML Rule
    severity: warn
    enabled: true
    description: A custom YAML rule
`);
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('RuleRegistry', () => {
    let customRegistry;

    beforeEach(() => {
      customRegistry = new RuleRegistry();
    });

    describe('register', () => {
      it('should register a new rule', () => {
        const rule = customRegistry.register('test-rule', {
          name: 'Test Rule',
          severity: 'warn',
          check: () => ({ pass: true })
        });

        expect(rule.id).toBe('test-rule');
        expect(rule.name).toBe('Test Rule');
        expect(rule.severity).toBe('warn');
        expect(rule.enabled).toBe(true);
      });

      it('should use id as default name', () => {
        const rule = customRegistry.register('no-name', {
          check: () => ({ pass: true })
        });

        expect(rule.name).toBe('no-name');
      });

      it('should use default severity', () => {
        const rule = customRegistry.register('default-severity', {
          check: () => ({ pass: true })
        });

        expect(rule.severity).toBe('warn');
      });

      it('should enable rule by default', () => {
        const rule = customRegistry.register('enabled-default', {
          enabled: undefined,
          check: () => ({ pass: true })
        });

        expect(rule.enabled).toBe(true);
      });

      it('should allow explicit disable', () => {
        const rule = customRegistry.register('disabled-rule', {
          enabled: false,
          check: () => ({ pass: true })
        });

        expect(rule.enabled).toBe(false);
      });

      it('should store config object', () => {
        const rule = customRegistry.register('config-rule', {
          config: { maxLines: 100 },
          check: () => ({ pass: true })
        });

        expect(rule.config).toEqual({ maxLines: 100 });
      });

      it('should return registered rule', () => {
        const registered = customRegistry.register('return-test', {
          name: 'Return Test',
          check: () => ({ pass: true })
        });

        expect(registered).toBeDefined();
        expect(registered.id).toBe('return-test');
      });
    });

    describe('get', () => {
      beforeEach(() => {
        customRegistry.register('get-test', {
          name: 'Get Test',
          check: () => ({ pass: true })
        });
      });

      it('should get existing rule', () => {
        const rule = customRegistry.get('get-test');

        expect(rule).toBeDefined();
        expect(rule.id).toBe('get-test');
        expect(rule.name).toBe('Get Test');
      });

      it('should return null for non-existent rule', () => {
        const rule = customRegistry.get('does-not-exist');

        expect(rule).toBeNull();
      });
    });

    describe('has', () => {
      beforeEach(() => {
        customRegistry.register('has-test', {
          check: () => ({ pass: true })
        });
      });

      it('should return true for existing rule', () => {
        expect(customRegistry.has('has-test')).toBe(true);
      });

      it('should return false for non-existent rule', () => {
        expect(customRegistry.has('does-not-exist')).toBe(false);
      });
    });

    describe('getAll', () => {
      beforeEach(() => {
        customRegistry.register('rule-1', {
          severity: 'error',
          enabled: true,
          category: 'code-style',
          check: () => ({ pass: true })
        });
        customRegistry.register('rule-2', {
          severity: 'warn',
          enabled: false,
          category: 'code-style',
          check: () => ({ pass: true })
        });
        customRegistry.register('rule-3', {
          severity: 'warn',
          enabled: true,
          category: 'quality',
          check: () => ({ pass: true })
        });
      });

      it('should return all rules when no filter provided', () => {
        const rules = customRegistry.getAll();

        expect(rules.length).toBeGreaterThan(0);
      });

      it('should filter by severity', () => {
        const errorRules = customRegistry.getAll({ severity: 'error' });

        expect(errorRules.length).toBeGreaterThan(0);
        expect(errorRules.every(r => r.severity === 'error')).toBe(true);
      });

      it('should filter by enabled status', () => {
        const enabledRules = customRegistry.getAll({ enabled: true });
        const disabledRules = customRegistry.getAll({ enabled: false });

        expect(enabledRules.every(r => r.enabled === true)).toBe(true);
        expect(disabledRules.every(r => r.enabled === false)).toBe(true);
      });

      it('should filter by category', () => {
        const styleRules = customRegistry.getAll({ category: 'code-style' });

        expect(styleRules.every(r => r.category === 'code-style')).toBe(true);
      });

      it('should combine multiple filters', () => {
        const rules = customRegistry.getAll({
          enabled: true,
          severity: 'warn'
        });

        expect(rules.every(r => r.enabled === true && r.severity === 'warn')).toBe(true);
      });
    });

    describe('setEnabled', () => {
      it('should enable a disabled rule', () => {
        customRegistry.register('to-enable', {
          enabled: false,
          check: () => ({ pass: true })
        });

        customRegistry.setEnabled('to-enable', true);
        const rule = customRegistry.get('to-enable');

        expect(rule.enabled).toBe(true);
      });

      it('should disable an enabled rule', () => {
        customRegistry.register('to-disable', {
          enabled: true,
          check: () => ({ pass: true })
        });

        customRegistry.setEnabled('to-disable', false);
        const rule = customRegistry.get('to-disable');

        expect(rule.enabled).toBe(false);
      });

      it('should do nothing for non-existent rule', () => {
        expect(() => {
          customRegistry.setEnabled('non-existent', true);
        }).not.toThrow();
      });
    });

    describe('updateConfig', () => {
      it('should update rule config', () => {
        customRegistry.register('config-update', {
          config: { maxLines: 100 },
          check: () => ({ pass: true })
        });

        customRegistry.updateConfig('config-update', { maxLines: 200, newSize: 500 });
        const rule = customRegistry.get('config-update');

        expect(rule.config.maxLines).toBe(200);
        expect(rule.config.newSize).toBe(500);
      });

      it('should merge configs', () => {
        customRegistry.register('merge-config', {
          config: { a: 1, b: 2 },
          check: () => ({ pass: true })
        });

        customRegistry.updateConfig('merge-config', { b: 3, c: 4 });
        const rule = customRegistry.get('merge-config');

        expect(rule.config.a).toBe(1);
        expect(rule.config.b).toBe(3);
        expect(rule.config.c).toBe(4);
      });

      it('should do nothing for non-existent rule', () => {
        expect(() => {
          customRegistry.updateConfig('non-existent', {});
        }).not.toThrow();
      });
    });

    describe('loadFromFile', () => {
      it('should load rules from JSON file', () => {
        customRegistry.loadFromFile(rulesJsonFile);

        expect(customRegistry.has('custom-rule-1')).toBe(true);
        const rule = customRegistry.get('custom-rule-1');
        expect(rule.name).toBe('Custom Rule 1');
        expect(rule.severity).toBe('error');
      });

      it('should update existing rule from file', () => {
        customRegistry.register('custom-rule-1', {
          name: 'Original Name',
          severity: 'warn',
          check: () => ({ pass: true })
        });

        customRegistry.loadFromFile(rulesJsonFile);

        const rule = customRegistry.get('custom-rule-1');
        expect(rule.name).toBe('Custom Rule 1');
        expect(rule.severity).toBe('error');
      });

      it('should do nothing for non-existent file', () => {
        expect(() => {
          customRegistry.loadFromFile('/does/not/exist.json');
        }).not.toThrow();
      });

      it('should load rules from YAML file (if yaml available)', () => {
        const hasYaml = (() => {
          try {
            require('yaml');
            return true;
          } catch {
            return false;
          }
        })();

        customRegistry.loadFromFile(rulesYamlFile);

        if (hasYaml) {
          expect(customRegistry.has('custom-yaml-rule')).toBe(true);
        }
        // If yaml not available, just verify it doesn't crash
      });
    });
  });

  describe('Global Registry', () => {
    it('should export global registry instance', () => {
      expect(registry).toBeDefined();
      expect(registry instanceof RuleRegistry).toBe(true);
    });

    it('should export convenience functions', () => {
      const {
        register,
        get,
        has,
        getAll,
        setEnabled,
        updateConfig,
        loadFromFile
      } = require('../lib/quality-rules');

      expect(typeof register).toBe('function');
      expect(typeof get).toBe('function');
      expect(typeof has).toBe('function');
      expect(typeof getAll).toBe('function');
      expect(typeof setEnabled).toBe('function');
      expect(typeof updateConfig).toBe('function');
      expect(typeof loadFromFile).toBe('function');
    });
  });

  describe('Built-in Rules', () => {
    describe('file-size-limit', () => {
      const rule = registry.get('file-size-limit');

      it('should exist', () => {
        expect(rule).toBeDefined();
        expect(rule.id).toBe('file-size-limit');
      });

      it('should pass small files', () => {
        const result = rule.check(testJsFile, rule.config);
        expect(result.pass).toBe(true);
      });

      it('should fail files exceeding size limit', () => {
        // Create a large temporary file
        const largeFile = path.join(tempDir, 'large-size.js');
        const largeContent = 'x'.repeat(900000); // ~900KB
        fs.writeFileSync(largeFile, largeContent);

        const result = rule.check(largeFile, { maxSize: 800 * 1024 });

        expect(result.pass).toBe(false);
        expect(result.message).toContain('exceeds limit');

        fs.unlinkSync(largeFile);
      });
    });

    describe('line-count-limit', () => {
      const rule = registry.get('line-count-limit');

      it('should exist', () => {
        expect(rule).toBeDefined();
        expect(rule.id).toBe('line-count-limit');
      });

      it('should pass files under limit', () => {
        const result = rule.check(testJsFile, rule.config);
        expect(result.pass).toBe(true);
      });

      it('should fail files exceeding line limit', () => {
        const result = rule.check(largeJsFile, { maxLines: 800 });

        expect(result.pass).toBe(false);
        expect(result.message).toContain('exceeds line limit');
      });
    });

    describe('no-console-logs', () => {
      const rule = registry.get('no-console-logs');

      it('should exist', () => {
        expect(rule).toBeDefined();
        expect(rule.id).toBe('no-console-logs');
      });

      it('should detect console.log statements', () => {
        const result = rule.check(testJsFile);

        expect(result.pass).toBe(false);
        expect(result.message).toContain('console statement');
      });

      it('should skip non-JS files', () => {
        const result = rule.check(testMdFile);

        expect(result.pass).toBe(true);
        expect(result.skip).toBe(true);
      });
    });

    describe('todo-comments', () => {
      const rule = registry.get('todo-comments');

      it('should exist', () => {
        expect(rule).toBeDefined();
        expect(rule.id).toBe('todo-comments');
      });

      it('should find TODO comments', () => {
        const todoFile = path.join(tempDir, 'todo.js');
        fs.writeFileSync(todoFile, '// TODO: fix this\n// FIXME: later\n');

        const result = rule.check(todoFile);

        expect(result.pass).toBe(true); // TODO is just informational
        expect(result.message).toContain('TODO');
      });

      it('should skip non-code files', () => {
        const result = rule.check(testJsonFile);

        expect(result.pass).toBe(true);
        expect(result.skip).toBe(true);
      });
    });

    describe('directory-depth', () => {
      const rule = registry.get('directory-depth');

      it('should exist', () => {
        expect(rule).toBeDefined();
        expect(rule.id).toBe('directory-depth');
      });

      it('should pass normal depth paths', () => {
        const result = rule.check(testJsFile, { maxDepth: 10 });

        expect(result.pass).toBe(true);
      });

      it('should fail deep paths', () => {
        const deepPath = '/a/b/c/d/e/f/g/h/i/j/k/l/file.js';
        const result = rule.check(deepPath, { maxDepth: 6 });

        expect(result.pass).toBe(false);
        expect(result.message).toContain('depth');
      });
    });

    describe('no-empty-files', () => {
      const rule = registry.get('no-empty-files');

      it('should exist', () => {
        expect(rule).toBeDefined();
        expect(rule.id).toBe('no-empty-files');
      });

      it('should pass files with content', () => {
        const result = rule.check(testJsFile, rule.config);

        expect(result.pass).toBe(true);
      });

      it('should fail empty or near-empty files', () => {
        const result = rule.check(emptyJsFile, { minLines: 3 });

        expect(result.pass).toBe(false);
        expect(result.message).toContain('line');
      });
    });

    describe('no-trailing-whitespace', () => {
      const rule = registry.get('no-trailing-whitespace');

      it('should exist', () => {
        expect(rule).toBeDefined();
        expect(rule.id).toBe('no-trailing-whitespace');
      });

      it('should pass files without trailing whitespace', () => {
        const cleanFile = path.join(tempDir, 'clean.js');
        fs.writeFileSync(cleanFile, 'const x = 1;\nconst y = 2;\n');

        const result = rule.check(cleanFile);

        expect(result.pass).toBe(true);
      });

      it('should detect trailing whitespace', () => {
        const dirtyFile = path.join(tempDir, 'dirty.js');
        fs.writeFileSync(dirtyFile, 'const x = 1;   \nconst y = 2;\t\n');

        const result = rule.check(dirtyFile);

        expect(result.pass).toBe(false);
        expect(result.message).toContain('Trailing whitespace');
        expect(result.autoFix).toBe(true);
      });

      it('should skip non-text files', () => {
        const result = rule.check(testJsonFile);

        // JSON is not in the check list, so it should be skipped
        expect(result.pass).toBe(true);
      });
    });

    describe('function-length', () => {
      const rule = registry.get('function-length');

      it('should exist', () => {
        expect(rule).toBeDefined();
        expect(rule.id).toBe('function-length');
      });

      it('should be disabled by default', () => {
        expect(rule.enabled).toBe(false);
      });

      it('should skip non-JS files', () => {
        const result = rule.check(testPyFile);

        expect(result.pass).toBe(true);
        expect(result.skip).toBe(true);
      });
    });
  });

  describe('Rule Execution', () => {
    it('should handle non-existent files by throwing or returning error', () => {
      const rule = registry.get('line-count-limit');

      // The rule will try to read the file, which will throw
      expect(() => {
        rule.check('/does/not/exist.js');
      }).toThrow();
    });

    it('should handle various file extensions', () => {
      const consoleRule = registry.get('no-console-logs');

      // Should check JS files
      let result = consoleRule.check(testJsFile);
      expect(result.pass).toBe(false); // Has console.log

      // Should check TS files
      const tsFile = path.join(tempDir, 'test.ts');
      fs.writeFileSync(tsFile, 'console.log("test");');
      result = consoleRule.check(tsFile);
      expect(result.pass).toBe(false);

      // Should skip markdown
      result = consoleRule.check(testMdFile);
      expect(result.skip).toBe(true);
    });
  });
});
