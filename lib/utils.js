/**
 * Utils - Common utility functions
 *
 * Extracted from cli.js to eliminate code duplication
 */

const fs = require('fs');
const path = require('path');

/**
 * Recursively copy directory contents
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 * @param {boolean} overwrite - Whether to overwrite existing files
 * @returns {number} Number of files copied
 */
exports.copyRecursive = function(src, dest, overwrite = false) {
  if (!fs.existsSync(src)) return 0;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  let count = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      count += exports.copyRecursive(srcPath, destPath, overwrite);
    } else if (overwrite || !fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
      // Add execute permission for scripts
      if (entry.name.endsWith('.sh') || entry.name.endsWith('.cjs')) {
        fs.chmodSync(destPath, 0o755);
      }
      count++;
    }
  }
  return count;
};

/**
 * Ensure a directory exists
 * @param {string} dir - Directory path
 */
exports.ensureDir = function(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Convert string to Title Case
 * @param {string} str - Input string
 * @returns {string} Title cased string
 */
exports.toTitleCase = function(str) {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};
