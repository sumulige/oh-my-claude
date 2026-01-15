/**
 * Version Check - Check for updates from npm registry
 *
 * Implements lazy checking with local caching to minimize
 * network requests and performance impact.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CONFIG_DIR = path.join(process.env.HOME, '.claude');
const CHECK_FILE = path.join(CONFIG_DIR, '.last-update-check');
const ONE_DAY = 24 * 60 * 60 * 1000;

// Current version from package.json
const CURRENT_VERSION = require('../package.json').version;
const PACKAGE_NAME = 'sumulige-claude';

/**
 * Get timestamp of last update check
 * @returns {number} Timestamp of last check, or 0 if never checked
 */
function getLastCheckTime() {
  try {
    const content = fs.readFileSync(CHECK_FILE, 'utf-8');
    return parseInt(content, 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Save timestamp of current update check
 * @param {number} timestamp - Timestamp to save
 */
function saveLastCheckTime(timestamp = Date.now()) {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CHECK_FILE, timestamp.toString());
  } catch {
    // Ignore errors
  }
}

/**
 * Fetch latest version from npm registry
 * @returns {Promise<string|null>} Latest version or null if failed
 */
function fetchLatestVersion() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'registry.npmjs.org',
      path: `/${PACKAGE_NAME}`,
      timeout: 5000, // 5 second timeout
      headers: {
        'User-Agent': `${PACKAGE_NAME}/${CURRENT_VERSION}`
      }
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const pkg = JSON.parse(data);
          resolve(pkg['dist-tags']?.latest || null);
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.setTimeout(5000);
  });
}

/**
 * Check for updates (with caching)
 * @param {Object} options - Check options
 * @param {boolean} options.force - Force check even if within cache period
 * @param {boolean} options.silent - Don't print messages
 * @returns {Promise<Object>} Check result { current, latest, updateAvailable }
 */
async function checkUpdate(options = {}) {
  const { force = false, silent = false } = options;
  const now = Date.now();
  const lastCheck = getLastCheckTime();
  const shouldCheck = force || (now - lastCheck > ONE_DAY);

  if (!shouldCheck) {
    return {
      current: CURRENT_VERSION,
      latest: null,
      updateAvailable: false,
      cached: true
    };
  }

  const latest = await fetchLatestVersion();
  saveLastCheckTime(now);

  // Only show update if remote version is NEWER than current
  const updateAvailable = latest && compareVersions(latest, CURRENT_VERSION) > 0;
  const result = {
    current: CURRENT_VERSION,
    latest,
    updateAvailable,
    cached: false
  };

  if (!silent && updateAvailable) {
    console.log('');
    console.log(`💡 新版本 v${latest} 可用 (当前: v${CURRENT_VERSION})`);
    console.log(`   运行: npm update -g ${PACKAGE_NAME}`);
    console.log('');
  }

  return result;
}

/**
 * Get current version
 * @returns {string} Current version
 */
function getCurrentVersion() {
  return CURRENT_VERSION;
}

/**
 * Parse version string to comparable array
 * @param {string} version - Version string (e.g., "1.2.3")
 * @returns {number[]} Comparable array [major, minor, patch]
 */
function parseVersion(version) {
  return version.split('.').map(Number).filter(n => !isNaN(n));
}

/**
 * Compare two versions
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1, v2) {
  const parts1 = parseVersion(v1);
  const parts2 = parseVersion(v2);
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  return 0;
}

exports.checkUpdate = checkUpdate;
exports.getCurrentVersion = getCurrentVersion;
exports.compareVersions = compareVersions;
exports.getLastCheckTime = getLastCheckTime;
exports.saveLastCheckTime = saveLastCheckTime;
exports.CURRENT_VERSION = CURRENT_VERSION;
