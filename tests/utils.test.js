/**
 * Utils 模块单元测试
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const utils = require('../lib/utils');

describe('Utils Module', () => {
  describe('copyRecursive', () => {
    let tempSrc, tempDest;

    beforeEach(() => {
      // 创建临时测试目录
      tempSrc = path.join(os.tmpdir(), 'test-src-' + Date.now());
      tempDest = path.join(os.tmpdir(), 'test-dest-' + Date.now());
      fs.mkdirSync(tempSrc, { recursive: true });
    });

    afterEach(() => {
      // 清理临时目录
      if (fs.existsSync(tempSrc)) {
        fs.rmSync(tempSrc, { recursive: true, force: true });
      }
      if (fs.existsSync(tempDest)) {
        fs.rmSync(tempDest, { recursive: true, force: true });
      }
    });

    it('should return 0 when source does not exist', () => {
      const nonExistent = path.join(os.tmpdir(), 'non-existent-' + Date.now());
      const count = utils.copyRecursive(nonExistent, tempDest);

      expect(count).toBe(0);
    });

    it('should copy files recursively', () => {
      // 创建测试文件结构
      fs.mkdirSync(path.join(tempSrc, 'subdir'));
      fs.writeFileSync(path.join(tempSrc, 'file1.txt'), 'content1');
      fs.writeFileSync(path.join(tempSrc, 'subdir', 'file2.txt'), 'content2');

      const count = utils.copyRecursive(tempSrc, tempDest);

      expect(count).toBe(2);
      expect(fs.existsSync(path.join(tempDest, 'file1.txt'))).toBe(true);
      expect(fs.existsSync(path.join(tempDest, 'subdir', 'file2.txt'))).toBe(true);
    });

    it('should set execute permission for script files', () => {
      fs.writeFileSync(path.join(tempSrc, 'test.sh'), '#!/bin/bash\necho test');
      fs.writeFileSync(path.join(tempSrc, 'test.cjs'), 'console.log("test");');
      fs.writeFileSync(path.join(tempSrc, 'test.txt'), 'plain text');

      utils.copyRecursive(tempSrc, tempDest);

      // 检查 .sh 文件权限
      const shStats = fs.statSync(path.join(tempDest, 'test.sh'));
      const cjsStats = fs.statSync(path.join(tempDest, 'test.cjs'));
      const txtStats = fs.statSync(path.join(tempDest, 'test.txt'));

      // 检查执行权限 (0o755 的执行位)
      expect(shStats.mode & 0o111).toBeTruthy();
      expect(cjsStats.mode & 0o111).toBeTruthy();
      // txt 文件不应该有执行权限
      expect(txtStats.mode & 0o111).toBeFalsy();
    });

    it('should not overwrite when overwrite=false', () => {
      fs.writeFileSync(path.join(tempSrc, 'file.txt'), 'new content');
      fs.mkdirSync(tempDest, { recursive: true });
      fs.writeFileSync(path.join(tempDest, 'file.txt'), 'old content');

      const count = utils.copyRecursive(tempSrc, tempDest, false);

      expect(count).toBe(0);
      const content = fs.readFileSync(path.join(tempDest, 'file.txt'), 'utf-8');
      expect(content).toBe('old content');
    });

    it('should overwrite when overwrite=true', () => {
      fs.writeFileSync(path.join(tempSrc, 'file.txt'), 'new content');
      fs.mkdirSync(tempDest, { recursive: true });
      fs.writeFileSync(path.join(tempDest, 'file.txt'), 'old content');

      const count = utils.copyRecursive(tempSrc, tempDest, true);

      expect(count).toBe(1);
      const content = fs.readFileSync(path.join(tempDest, 'file.txt'), 'utf-8');
      expect(content).toBe('new content');
    });
  });

  describe('ensureDir', () => {
    it('should create directory if not exists', () => {
      const tempDir = path.join(os.tmpdir(), 'test-ensure-' + Date.now());

      utils.ensureDir(tempDir);

      expect(fs.existsSync(tempDir)).toBe(true);

      // 清理
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should not error if directory already exists', () => {
      const tempDir = path.join(os.tmpdir(), 'test-ensure-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });

      expect(() => utils.ensureDir(tempDir)).not.toThrow();

      // 清理
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should create nested directories', () => {
      const tempDir = path.join(os.tmpdir(), 'test-nested-' + Date.now(), 'level1', 'level2', 'level3');

      utils.ensureDir(tempDir);

      expect(fs.existsSync(tempDir)).toBe(true);

      // 清理
      fs.rmSync(path.join(os.tmpdir(), 'test-nested-' + Date.now()), { recursive: true, force: true });
    });
  });

  describe('toTitleCase', () => {
    it('should convert string to title case', () => {
      expect(utils.toTitleCase('hello world')).toBe('Hello World');
      expect(utils.toTitleCase('foo-bar')).toBe('Foo-Bar');
    });

    it('should handle single word', () => {
      expect(utils.toTitleCase('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(utils.toTitleCase('')).toBe('');
    });

    it('should handle already capitalized string', () => {
      expect(utils.toTitleCase('Hello World')).toBe('Hello World');
    });

    it('should handle strings with multiple spaces', () => {
      expect(utils.toTitleCase('hello   world')).toBe('Hello   World');
    });

    it('should preserve special characters', () => {
      // 下划线 _ 是单词字符(\w)，所以 _t 中的 t 前面没有单词边界
      expect(utils.toTitleCase('hello-world_test')).toBe('Hello-World_test');
      // 连字符 - 不是单词字符，所以后面的字母会被大写
      expect(utils.toTitleCase('hello-world test')).toBe('Hello-World Test');
    });
  });

  describe('exports', () => {
    it('should export all functions', () => {
      expect(typeof utils.copyRecursive).toBe('function');
      expect(typeof utils.ensureDir).toBe('function');
      expect(typeof utils.toTitleCase).toBe('function');
    });
  });
});
