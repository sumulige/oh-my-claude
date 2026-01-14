/**
 * Commands 模块单元测试 - 简化版
 * 使用基本的验证而非复杂的 mock-fs
 */

const commands = require('../lib/commands');

describe('Commands Module - Basic Tests', () => {
  describe('exports', () => {
    it('should export runCommand function', () => {
      expect(typeof commands.runCommand).toBe('function');
    });

    it('should export commands object', () => {
      expect(typeof commands.commands).toBe('object');
    });

    it('should have all expected commands', () => {
      const cmdList = commands.commands;
      expect(cmdList.init).toBeDefined();
      expect(cmdList.sync).toBeDefined();
      expect(cmdList.migrate).toBeDefined();
      expect(cmdList.agent).toBeDefined();
      expect(cmdList.status).toBeDefined();
      expect(cmdList['skill:list']).toBeDefined();
      expect(cmdList['skill:create']).toBeDefined();
      expect(cmdList['skill:check']).toBeDefined();
      expect(cmdList['skill:install']).toBeDefined();
      expect(cmdList.template).toBeDefined();
      expect(cmdList.kickoff).toBeDefined();
    });
  });

  describe('runCommand', () => {
    it('should call the correct command function', () => {
      const initSpy = jest.spyOn(commands.commands, 'init');
      commands.runCommand('init', []);
      expect(initSpy).toHaveBeenCalled();
      initSpy.mockRestore();
    });

    it('should pass arguments to command function', () => {
      const agentSpy = jest.spyOn(commands.commands, 'agent');
      commands.runCommand('agent', ['test task']);
      expect(agentSpy).toHaveBeenCalledWith('test task');
      agentSpy.mockRestore();
    });

    it('should handle unknown commands gracefully', () => {
      expect(() => {
        commands.runCommand('unknown-command', []);
      }).not.toThrow();
    });
  });

  describe('init command', () => {
    it('should be a function', () => {
      expect(typeof commands.commands.init).toBe('function');
    });

    it('should not throw', () => {
      expect(() => commands.commands.init()).not.toThrow();
    });
  });

  describe('sync command', () => {
    it('should be a function', () => {
      expect(typeof commands.commands.sync).toBe('function');
    });

    it('should not throw', () => {
      expect(() => commands.commands.sync()).not.toThrow();
    });
  });

  describe('migrate command', () => {
    it('should be a function', () => {
      expect(typeof commands.commands.migrate).toBe('function');
    });
  });

  describe('agent command', () => {
    it('should show usage when no task provided', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      commands.commands.agent();
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.flat().join(' ');
      expect(output).toContain('Usage');
      consoleSpy.mockRestore();
    });

    it('should display agent information when task provided', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      commands.commands.agent('Build a REST API');
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.flat().join(' ');
      expect(output).toContain('Agent Orchestration');
      expect(output).toContain('Build a REST API');
      consoleSpy.mockRestore();
    });
  });

  describe('status command', () => {
    it('should be a function', () => {
      expect(typeof commands.commands.status).toBe('function');
    });
  });

  describe('skill:list command', () => {
    it('should be a function', () => {
      expect(typeof commands.commands['skill:list']).toBe('function');
    });
  });

  describe('skill:create command', () => {
    it('should show usage when no skill name provided', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      commands.commands['skill:create']();
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.flat().join(' ');
      expect(output).toContain('Usage');
      consoleSpy.mockRestore();
    });

    it('should validate skill name format', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      commands.commands['skill:create']('Invalid_Name');
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.flat().join(' ');
      expect(output).toContain('Invalid skill name');
      consoleSpy.mockRestore();
    });
  });

  describe('skill:check command', () => {
    it('should be a function', () => {
      expect(typeof commands.commands['skill:check']).toBe('function');
    });
  });

  describe('skill:install command', () => {
    it('should show usage when no source provided', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      commands.commands['skill:install']();
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.flat().join(' ');
      expect(output).toContain('Usage');
      consoleSpy.mockRestore();
    });
  });

  describe('template command', () => {
    it('should be a function', () => {
      expect(typeof commands.commands.template).toBe('function');
    });
  });

  describe('kickoff command', () => {
    it('should be a function', () => {
      expect(typeof commands.commands.kickoff).toBe('function');
    });
  });
});
