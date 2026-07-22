// src/config.js

/**
 * Reads and parses a config file, supporting both JSON and YAML formats.
 * Format is determined by file extension (.yaml or .yml for YAML, otherwise JSON).
 *
 * @param {string} filePath
 * @returns {object}
 */
function parseConfig(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
    return yaml.parse(content);
  }
  return JSON.parse(content);
}
