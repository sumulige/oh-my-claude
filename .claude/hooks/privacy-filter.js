/**
 * Privacy Filter - 过滤对话中的敏感信息
 *
 * 功能：
 * - 检测并过滤 API Key、Token 等敏感信息
 * - 支持自定义过滤规则
 * - 保留敏感信息的标记而非完全删除
 */

const fs = require('fs');
const path = require('path');

// 敏感信息模式匹配
const SENSITIVE_PATTERNS = [
  // API Keys (sk-开头，通常很长)
  {
    pattern: /sk-[a-zA-Z0-9_-]{20,}/g,
    replace: 'sk-[REDACTED]',
    name: 'OpenAI API Key'
  },
  // Bearer Tokens (JWT格式)
  {
    pattern: /Bearer\s+[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/gi,
    replace: 'Bearer [REDACTED]',
    name: 'Bearer Token'
  },
  // API Key/Token/Secret 配置格式
  {
    pattern: /(?:api[_-]?key|token|secret|password|passwd)["'']?\s*[:=]\s*["'']([a-zA-Z0-9_\-+=]{8,})["'']?/gi,
    replace: (match) => {
      const key = match.split(/[:=]/)[0].trim();
      return `${key}: [REDACTED]`;
    },
    name: 'Config Key'
  },
  // URL 中的敏感参数
  {
    pattern: /([?&](key|token|api[_-]?key|secret|password|passwd)=)[a-zA-Z0-9_\-+=%]{8,}/gi,
    replace: '$1[REDACTED]',
    name: 'URL Param'
  },
  // JSON 中的敏感字段
  {
    pattern: /(["'](?:api[_-]?key|token|secret|password|passwd)["']\s*:\s*["'])([a-zA-Z0-9_\-+=]{8,})(["'])/gi,
    replace: '$1[REDACTED]$3',
    name: 'JSON Field'
  },
  // AWS Access Key
  {
    pattern: /AKIA[0-9A-Z]{16}/g,
    replace: 'AKIA[REDACTED]',
    name: 'AWS Access Key'
  },
  // GitHub Token
  {
    pattern: /ghp_[a-zA-Z0-9]{36,}/g,
    replace: 'ghp_[REDACTED]',
    name: 'GitHub Token'
  },
  // 信用卡号 (简单模式)
  {
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replace: '[CARD-REDACTED]',
    name: 'Credit Card'
  },
  // IP 地址 (可选)
  {
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    replace: '[IP-REDACTED]',
    name: 'IP Address'
  },
  // 邮箱 (可选)
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replace: '[EMAIL-REDACTED]',
    name: 'Email'
  }
];

/**
 * 过滤文本中的敏感信息
 * @param {string} text - 原始文本
 * @param {Object} options - 选项
 * @returns {Object} { filteredText, detectedItems }
 */
function filterSensitive(text, options = {}) {
  const {
    excludePatterns = [],      // 排除的模式名称
    includePatterns = [],      // 只包含的模式名称
    markOnly = false,          // 只标记不过滤
  } = options;

  let filteredText = text;
  const detectedItems = [];

  // 确定要使用的模式
  let patterns = SENSITIVE_PATTERNS;
  if (includePatterns.length > 0) {
    patterns = patterns.filter(p => includePatterns.includes(p.name));
  }
  if (excludePatterns.length > 0) {
    patterns = patterns.filter(p => !excludePatterns.includes(p.name));
  }

  // 应用每个模式
  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern.pattern);
    for (const match of matches) {
      detectedItems.push({
        type: pattern.name,
        original: match[0],
        position: match.index,
        length: match[0].length
      });
    }

    if (markOnly) {
      // 只标记，不过滤
      filteredText = filteredText.replace(pattern.pattern, `🚨${match[0]}🚨`);
    } else {
      // 过滤替换
      if (typeof pattern.replace === 'string') {
        filteredText = filteredText.replace(pattern.pattern, pattern.replace);
      } else if (typeof pattern.replace === 'function') {
        filteredText = filteredText.replace(pattern.pattern, pattern.replace);
      }
    }
  });

  return {
    filteredText,
    detectedItems,
    hasSensitive: detectedItems.length > 0
  };
}

/**
 * 检查文本是否包含敏感信息
 */
function hasSensitive(text) {
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * 获取所有可用的模式名称
 */
function getPatternNames() {
  return SENSITIVE_PATTERNS.map(p => p.name);
}

// CLI 使用
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--check') {
    // 检查文件
    const filePath = args[1];
    if (!filePath) {
      console.error('Usage: node privacy-filter.js --check <file>');
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = filterSensitive(content);

    if (result.hasSensitive) {
      console.log(`🚨 检测到 ${result.detectedItems.length} 处敏感信息:`);
      result.detectedItems.forEach(item => {
        console.log(`  - [${item.type}] ${item.original.substring(0, 50)}...`);
      });
      process.exit(1);
    } else {
      console.log('✅ 未检测到敏感信息');
      process.exit(0);
    }
  } else if (args[0] === '--filter') {
    // 过滤文件
    const filePath = args[1];
    const outputPath = args[2] || filePath;

    if (!filePath) {
      console.error('Usage: node privacy-filter.js --filter <input> [output]');
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const result = filterSensitive(content);

    fs.writeFileSync(outputPath, result.filteredText, 'utf-8');

    if (result.hasSensitive) {
      console.log(`⚠️ 已过滤 ${result.detectedItems.length} 处敏感信息 → ${outputPath}`);
    } else {
      console.log(`✅ 无敏感信息，已复制 → ${outputPath}`);
    }
  } else if (args[0] === '--patterns') {
    // 列出所有模式
    console.log('可用的过滤模式:');
    getPatternNames().forEach(name => console.log(`  - ${name}`));
  } else {
    console.log(`
Privacy Filter - 敏感信息过滤工具

用法:
  node privacy-filter.js --check <file>          检查文件是否包含敏感信息
  node privacy-filter.js --filter <input> [out] 过滤敏感信息
  node privacy-filter.js --patterns              列出所有过滤模式

导出使用:
  const { filterSensitive, hasSensitive } = require('./privacy-filter.js');
    `);
  }
}

module.exports = {
  filterSensitive,
  hasSensitive,
  getPatternNames,
  SENSITIVE_PATTERNS
};
