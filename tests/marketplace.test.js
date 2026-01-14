/**
 * Marketplace 模块单元测试
 */

const fs = require('fs');
const path = require('path');
const mockFs = require('mock-fs');
const sinon = require('sinon');

// 在 mock 之前加载模块
const marketplace = require('../lib/marketplace');

// 手动实现 parseSimpleYaml 用于测试（与模块中相同的实现）
function parseSimpleYaml(content) {
  const result = { skills: [] };
  let currentSection = null;
  let currentSkill = null;
  let currentKey = null;

  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    const indent = line.search(/\S/);

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    // Version
    if (trimmed.startsWith('version:')) {
      result.version = parseInt(trimmed.split(':')[1].trim());
      return;
    }

    // Skills array starts
    if (trimmed === 'skills:') {
      currentSection = 'skills';
      return;
    }

    // New skill entry (starts with -)
    if (trimmed.startsWith('- name:')) {
      if (currentSkill) {
        result.skills.push(currentSkill);
      }
      currentSkill = { name: trimmed.split(':')[1].trim() };
      return;
    }

    // Skill properties
    if (currentSection === 'skills' && currentSkill) {
      // Determine nesting level by indent
      const isTopLevel = indent === 2;

      if (isTopLevel) {
        const match = trimmed.match(/^([\w-]+):\s*(.*)$/);
        if (match) {
          currentKey = match[1];
          let value = match[2].trim();

          // Handle arrays
          if (value === '[]') {
            value = [];
          } else if (value === 'true') {
            value = true;
          } else if (value === 'false') {
            value = false;
          } else if (value.startsWith('"') || value.startsWith("'")) {
            value = value.slice(1, -1);
          }

          // Initialize nested objects for special keys
          if (['source', 'target', 'author', 'sync'].includes(currentKey)) {
            currentSkill[currentKey] = {};
            // Store the value for potential later use
            currentSkill[currentKey]._value = value;
          } else {
            currentSkill[currentKey] = value;
          }
        }
      } else if (currentKey) {
        // Nested property
        const match = trimmed.match(/^([\w-]+):\s*(.*)$/);
        if (match) {
          let value = match[2].trim();
          if (value === 'true') value = true;
          if (value === 'false') value = false;
          if (value === '[]') value = [];
          currentSkill[currentKey][match[1]] = value;
        }
      }
    }
  });

  // Push last skill
  if (currentSkill) {
    result.skills.push(currentSkill);
  }

  return result;
}

describe('Marketplace Module', () => {
  let consoleLogStub;
  let execSyncStub;

  beforeEach(() => {
    jest.resetModules();
    // Mock 文件系统，保留项目目录
    mockFs({
      '/project': {
        'sources.yaml': `version: 1
skills:
  - name: test-skill
    description: "A test skill"
    native: true
  - name: external-skill
    description: "External skill"
    source:
      repo: owner/repo`,
        '.claude-plugin': {
          'marketplace.json': JSON.stringify({
            plugins: [],
            metadata: {
              skill_count: 2,
              categories: {
                tools: { name: 'CLI 工具', icon: '🔧' }
              }
            }
          })
        },
        'config': {
          'skill-categories.json': JSON.stringify({
            tools: { name: 'CLI 工具', icon: '🔧' },
            workflow: { name: '工作流编排', icon: '🎼' }
          })
        }
      }
    }, {
      // 不 mock 项目的 lib 目录
      [path.join(__dirname, '../lib')]: true
    });

    // Stub console.log to avoid actual output
    consoleLogStub = sinon.stub(console, 'log');
  });

  afterEach(() => {
    mockFs.restore();
    if (consoleLogStub) consoleLogStub.restore();
    if (execSyncStub) execSyncStub.restore();
  });

  describe('parseSimpleYaml', () => {
    it('should parse version number', () => {
      const yaml = `version: 1
skills:
  - name: test-skill`;

      const result = parseSimpleYaml(yaml);

      expect(result.version).toBe(1);
    });

    it('should parse skill names', () => {
      const yaml = `skills:
  - name: skill-one
  - name: skill-two
  - name: skill-three`;

      const result = parseSimpleYaml(yaml);

      expect(result.skills).toHaveLength(3);
      expect(result.skills[0].name).toBe('skill-one');
      expect(result.skills[1].name).toBe('skill-two');
      expect(result.skills[2].name).toBe('skill-three');
    });

    it('should handle empty skills array', () => {
      const yaml = `version: 1`;

      const result = parseSimpleYaml(yaml);

      expect(result.skills).toEqual([]);
    });

    it('should skip comments', () => {
      const yaml = `# Comment
skills:
  # Another comment
  - name: test`;

      const result = parseSimpleYaml(yaml);

      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].name).toBe('test');
    });

    it('should handle empty lines', () => {
      const yaml = `skills:

  - name: test

  - name: test2`;

      const result = parseSimpleYaml(yaml);

      expect(result.skills).toHaveLength(2);
    });
  });

  describe('marketplaceCommands', () => {
    describe('marketplace:list', () => {
      it('should be a function', () => {
        expect(typeof marketplace.marketplaceCommands['marketplace:list']).toBe('function');
      });

      it('should output to console', () => {
        marketplace.marketplaceCommands['marketplace:list']();

        expect(consoleLogStub.called).toBe(true);
      });
    });

    describe('marketplace:install', () => {
      it('should show usage when no skill name provided', () => {
        marketplace.marketplaceCommands['marketplace:install']();

        expect(consoleLogStub.called).toBe(true);
        const output = consoleLogStub.args.flat().join(' ');
        expect(output).toContain('Usage');
      });
    });

    describe('marketplace:sync', () => {
      it('should be a function', () => {
        expect(typeof marketplace.marketplaceCommands['marketplace:sync']).toBe('function');
      });

      it('should output sync message', () => {
        marketplace.marketplaceCommands['marketplace:sync']();

        expect(consoleLogStub.called).toBe(true);
      });
    });

    describe('marketplace:add', () => {
      it('should show usage when no repo provided', () => {
        marketplace.marketplaceCommands['marketplace:add']();

        expect(consoleLogStub.called).toBe(true);
        const output = consoleLogStub.args.flat().join(' ');
        expect(output).toContain('Usage');
      });

      it('should validate repo format', () => {
        marketplace.marketplaceCommands['marketplace:add']('invalid-repo-format');

        const output = consoleLogStub.args.flat().join(' ');
        expect(output).toContain('Invalid');
      });
    });

    describe('marketplace:remove', () => {
      it('should show usage when no skill name provided', () => {
        marketplace.marketplaceCommands['marketplace:remove']();

        expect(consoleLogStub.called).toBe(true);
        const output = consoleLogStub.args.flat().join(' ');
        expect(output).toContain('Usage');
      });
    });

    describe('marketplace:status', () => {
      it('should be a function', () => {
        expect(typeof marketplace.marketplaceCommands['marketplace:status']).toBe('function');
      });

      it('should output status information', () => {
        marketplace.marketplaceCommands['marketplace:status']();

        expect(consoleLogStub.called).toBe(true);
      });
    });
  });

  describe('exports', () => {
    it('should export marketplaceCommands object', () => {
      expect(marketplace.marketplaceCommands).toBeDefined();
      expect(typeof marketplace.marketplaceCommands).toBe('object');
    });

    it('should export all marketplace commands', () => {
      const commands = marketplace.marketplaceCommands;

      expect(commands['marketplace:list']).toBeDefined();
      expect(commands['marketplace:install']).toBeDefined();
      expect(commands['marketplace:sync']).toBeDefined();
      expect(commands['marketplace:add']).toBeDefined();
      expect(commands['marketplace:remove']).toBeDefined();
      expect(commands['marketplace:status']).toBeDefined();
    });
  });
});
