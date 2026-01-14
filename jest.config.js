/**
 * Jest 配置
 * Sumulige-Claude 测试框架
 */

module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],

  // 覆盖率收集配置
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/**/*.test.js',
    '!**/node_modules/**'
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html'],

  // 覆盖率输出目录
  coverageDirectory: 'coverage',

  // 是否显示每个测试的耗时
  verbose: true,

  // 测试超时时间（毫秒）
  testTimeout: 10000,

  // 模块路径别名（可选）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },

  // 忽略的目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/template/',
    '/coverage/'
  ],

  // 清除 mock
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
