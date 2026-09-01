#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSkillMd } from './generateSkillFiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const maxDescriptionLength = 350;
const maxAggregateDescriptionLength = 6500;

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
  if (typeof s.description !== 'string' || s.description.length > maxDescriptionLength) {
    console.error(
      skillJsonPath,
      `: description must be a string of at most ${maxDescriptionLength} characters (found ${s.description?.length ?? 'non-string'})`,
    );
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

  const generated = generateSkillMd(s);
  const frontmatter = generated.match(/^---\nname: (.+)\ndescription: (.+)\n---(?:\n|$)/);
  if (!frontmatter) {
    console.error(skillJsonPath, ': generated SKILL.md has invalid frontmatter structure');
    return false;
  }

  try {
    const generatedName = JSON.parse(frontmatter[1]);
    const generatedDescription = JSON.parse(frontmatter[2]);
    const expectedName = s.id.includes('.') ? s.id.split('.').pop() : s.id;
    if (generatedName !== expectedName || generatedDescription !== s.description) {
      console.error(skillJsonPath, ': generated SKILL.md frontmatter changed a metadata value');
      return false;
    }
  } catch {
    console.error(skillJsonPath, ': generated SKILL.md frontmatter values are not safely quoted');
    return false;
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

if (!single) {
  const aggregateDescriptionLength = paths.reduce((total, p) => {
    const skill = JSON.parse(fs.readFileSync(p, 'utf8'));
    return total + (typeof skill.description === 'string' ? skill.description.length : 0);
  }, 0);
  if (aggregateDescriptionLength > maxAggregateDescriptionLength) {
    console.error(
      `Skill descriptions total ${aggregateDescriptionLength} characters; maximum is ${maxAggregateDescriptionLength}`,
    );
    failed = true;
  } else {
    console.log(
      `OK description budget (${aggregateDescriptionLength}/${maxAggregateDescriptionLength} characters)`,
    );
  }
}
process.exit(failed ? 2 : 0);
