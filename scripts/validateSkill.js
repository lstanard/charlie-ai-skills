#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function findSkillJsonPaths(singlePath) {
  if (singlePath) {
    const resolved = path.isAbsolute(singlePath) ? singlePath : path.resolve(repoRoot, singlePath);
    if (!fs.existsSync(resolved)) {
      console.error('Not found:', resolved);
      process.exit(1);
    }
    return [resolved];
  }
  const skillsDir = path.join(repoRoot, 'skills');
  if (!fs.existsSync(skillsDir)) return [];
  const paths = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const here = path.join(dir, 'skill.json');
    if (fs.existsSync(here)) paths.push(here);
    for (const e of entries) {
      if (e.isDirectory()) walk(path.join(dir, e.name));
    }
  }
  walk(skillsDir);
  return paths.sort();
}

/**
 * Validates a single skill.json: required fields, semver, and (if present)
 * the shape and referential integrity of its dependency fields.
 * @param {string} skillJsonPath - absolute path to the skill.json file
 * @param {Set<string>} validSlugs - every known skill directory slug in the repo
 * @returns {boolean} true if the file passes validation
 */
function validateOne(skillJsonPath, validSlugs) {
  const s = JSON.parse(fs.readFileSync(skillJsonPath, 'utf8'));
  const required = ['id', 'title', 'version', 'description'];
  const missing = required.filter((k) => !(k in s));
  if (missing.length) {
    console.error(skillJsonPath, ': missing required fields:', missing.join(', '));
    return false;
  }
  if (!/^\d+\.\d+\.\d+/.test(s.version)) {
    console.error(skillJsonPath, ': version must be semver x.y.z');
    return false;
  }

  if ('dependencies' in s) {
    if (!Array.isArray(s.dependencies) || !s.dependencies.every((d) => typeof d === 'string')) {
      console.error(skillJsonPath, ': dependencies must be an array of strings');
      return false;
    }
    const unknown = s.dependencies.filter((d) => !validSlugs.has(d));
    if (unknown.length) {
      console.error(skillJsonPath, ': unknown local dependency slug(s):', unknown.join(', '));
      return false;
    }
  }

  if ('plugin_dependencies' in s) {
    if (!Array.isArray(s.plugin_dependencies) || !s.plugin_dependencies.every((d) => typeof d === 'string')) {
      console.error(skillJsonPath, ': plugin_dependencies must be an array of strings');
      return false;
    }
  }

  console.log('OK', s.id);
  return true;
}

const single = process.argv[2];
const validSlugs = new Set(findSkillJsonPaths().map((p) => path.basename(path.dirname(p))));
const paths = findSkillJsonPaths(single);
if (paths.length === 0) {
  console.error('Usage: validateSkill.js [path/to/skill.json]');
  console.error('  No path: validate all skills under skills/*/skill.json');
  process.exit(1);
}

let failed = false;
for (const p of paths) {
  if (!validateOne(p, validSlugs)) failed = true;
}
process.exit(failed ? 2 : 0);