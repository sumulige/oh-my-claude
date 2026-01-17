/**
 * Version Check 模块单元测试
 */

describe('Version Check Module', () => {
  const versionCheck = require('../lib/version-check');

  describe('compareVersions', () => {
    it('should return -1 when v1 < v2', () => {
      expect(versionCheck.compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(versionCheck.compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(versionCheck.compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(versionCheck.compareVersions('0.9.0', '1.0.0')).toBe(-1);
    });

    it('should return 0 when versions are equal', () => {
      expect(versionCheck.compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(versionCheck.compareVersions('2.5.10', '2.5.10')).toBe(0);
    });

    it('should return 1 when v1 > v2', () => {
      expect(versionCheck.compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(versionCheck.compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(versionCheck.compareVersions('2.0.0', '1.0.0')).toBe(1);
    });

    it('should handle different length versions', () => {
      expect(versionCheck.compareVersions('1.0', '1.0.0')).toBe(0);
      expect(versionCheck.compareVersions('1.0.0', '1.0')).toBe(0);
      expect(versionCheck.compareVersions('1.0', '1.0.1')).toBe(-1);
      expect(versionCheck.compareVersions('1.0.1', '1.0')).toBe(1);
    });

    it('should handle pre-release tags', () => {
      // Pre-release tags are stripped, so these compare equal
      expect(versionCheck.compareVersions('1.0.0', '1.0.0-alpha')).toBe(0);
    });
  });

  describe('getCurrentVersion', () => {
    it('should return current version from package.json', () => {
      const version = versionCheck.getCurrentVersion();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should export CURRENT_VERSION constant', () => {
      expect(versionCheck.CURRENT_VERSION).toBeDefined();
      expect(typeof versionCheck.CURRENT_VERSION).toBe('string');
    });

    it('should have consistent current version', () => {
      expect(versionCheck.getCurrentVersion()).toBe(versionCheck.CURRENT_VERSION);
    });
  });

  describe('exports', () => {
    it('should export all functions', () => {
      expect(versionCheck.checkUpdate).toBeDefined();
      expect(versionCheck.getCurrentVersion).toBeDefined();
      expect(versionCheck.compareVersions).toBeDefined();
      expect(versionCheck.getLastCheckTime).toBeDefined();
      expect(versionCheck.saveLastCheckTime).toBeDefined();
      expect(versionCheck.CURRENT_VERSION).toBeDefined();
    });

    it('should export correct types', () => {
      expect(typeof versionCheck.checkUpdate).toBe('function');
      expect(typeof versionCheck.getCurrentVersion).toBe('function');
      expect(typeof versionCheck.compareVersions).toBe('function');
      expect(typeof versionCheck.getLastCheckTime).toBe('function');
      expect(typeof versionCheck.saveLastCheckTime).toBe('function');
    });
  });
});
