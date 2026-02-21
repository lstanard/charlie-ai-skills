#!/usr/bin/env node
/**
 * Reads skill.json(s) and emits SKILL.md and cursor.rule.md per skill.
 * Usage:
 *   node scripts/generateSkillFiles.js [path/to/skill.json]
 *   node scripts/generateSkillFiles.js   (no args: discover all skill.json under skills/)
 */
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

function generateSkillMd(skill) {
  const lines = [];

  // Extract skill name from id (e.g., "charlie.react-component-testing" → "react-component-testing")
  const skillName = skill.id.includes('.') ? skill.id.split('.').pop() : skill.id;

  // Add YAML frontmatter for Cursor compatibility
  lines.push('---');
  lines.push(`name: ${skillName}`);
  lines.push(`description: ${skill.description}`);
  lines.push('---');
  lines.push('');

  lines.push(`# ${skill.title}`);
  lines.push(`version: ${skill.version}`);
  lines.push('');
  lines.push('## Purpose');
  lines.push(skill.description);
  lines.push('');
  lines.push('## Triggers');
  for (const t of skill.triggers || []) lines.push(`- ${t}`);
  lines.push('\n## Inputs');
  for (const [k, v] of Object.entries(skill.inputs || {})) lines.push(`- ${k}: ${v}`);
  lines.push('\n## Guarantees');
  for (const g of skill.guarantees || []) lines.push(`- ${g}`);
  lines.push('\n## Non-goals');
  for (const n of skill.non_goals || []) lines.push(`- ${n}`);
  lines.push('\n## Notes');
  if (skill.notes) lines.push(skill.notes);
  return lines.join('\n');
}

function generateCursorRuleMd(skill) {
  const lines = [];
  lines.push(`# ${skill.title} (Cursor rule)`);
  lines.push('scope: project');
  lines.push(`version: ${skill.version}`);
  lines.push('');
  lines.push('Apply this rule when the user asks to:');
  for (const t of skill.triggers || []) lines.push(`- ${t}`);
  lines.push('');
  lines.push('When generating or editing output:');
  for (const g of skill.guarantees || []) lines.push(`- ${g}`);
  if (skill.notes) {
    lines.push('');
    lines.push(skill.notes);
  }
  if (skill.non_goals && skill.non_goals.length > 0) {
    lines.push('');
    lines.push('Avoid:');
    for (const n of skill.non_goals) lines.push(`- ${n}`);
  }
  lines.push('');
  lines.push('# metadata');
  lines.push(`id: ${skill.id}`);
  return lines.join('\n');
}

function processOne(skillJsonPath) {
  const skill = JSON.parse(fs.readFileSync(skillJsonPath, 'utf8'));
  const dir = path.dirname(skillJsonPath);

  fs.writeFileSync(path.join(dir, 'SKILL.md'), generateSkillMd(skill));
  fs.writeFileSync(path.join(dir, 'cursor.rule.md'), generateCursorRuleMd(skill));

  const rel = path.relative(repoRoot, dir);
  console.log(`  ${rel}: SKILL.md, cursor.rule.md`);
}

const single = process.argv[2];
const paths = findSkillJsonPaths(single);
if (paths.length === 0) {
  console.error('No skill.json found. Use: script [path/to/skill.json] or add skills/*/skill.json');
  process.exit(1);
}

console.log(`Generating files for ${paths.length} skill(s):`);
for (const p of paths) processOne(p);
console.log('Done.');
