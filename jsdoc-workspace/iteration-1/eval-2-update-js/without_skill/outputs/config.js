const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// src/config.js
function parseConfig(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.yaml' || ext === '.yml') {
    return yaml.load(content);
  }

  return JSON.parse(content);
}

module.exports = { parseConfig };
