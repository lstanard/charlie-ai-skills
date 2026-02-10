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

function validateOne(skillJsonPath) {
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
  console.log('OK', s.id);
  return true;
}

const single = process.argv[2];
const paths = findSkillJsonPaths(single);
if (paths.length === 0) {
  console.error('Usage: validateSkill.js [path/to/skill.json]');
  console.error('  No path: validate all skills under skills/*/skill.json');
  process.exit(1);
}

let failed = false;
for (const p of paths) {
  if (!validateOne(p)) failed = true;
}
process.exit(failed ? 2 : 0);