#!/usr/bin/env node
/**
 * Copy or symlink Cursor rule files from skills to a project's .cursor/rules.
 * Output filenames use the skill directory name (e.g. react-data-layer.mdc).
 *
 * Usage:
 *   node scripts/installSkills.js <destination> [source-path]
 *   node scripts/installSkills.js /path/to/my-app
 *   node scripts/installSkills.js /path/to/my-app skills/frontend-architecture
 *   node scripts/installSkills.js . skills/frontend-architecture
 *
 * Options:
 *   --link, -l    Symlink instead of copy
 *   --include-claude  Also copy CLAUDE.md from a group dir (e.g. frontend-architecture)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function findSkills(sourcePath) {
  const resolved = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(repoRoot, sourcePath);
  if (!fs.existsSync(resolved)) {
    console.error("Source not found:", resolved);
    process.exit(1);
  }
  const skills = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const cursorRulePath = path.join(dir, "cursor.rule.md");
    if (fs.existsSync(cursorRulePath)) {
      const slug = path.basename(dir);
      skills.push({ dir, cursorRulePath, slug });
      return;
    }
    for (const e of entries) {
      if (e.isDirectory()) walk(path.join(dir, e.name));
    }
  }
  walk(resolved);
  return skills;
}

function findClaudeMd(sourcePath) {
  const resolved = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(repoRoot, sourcePath);
  const claudePath = path.join(resolved, "CLAUDE.md");
  return fs.existsSync(claudePath) ? claudePath : null;
}

function main() {
  const args = process.argv.slice(2);
  const link = args.includes("--link") || args.includes("-l");
  const includeClaude = args.includes("--include-claude");
  const positional = args.filter((a) => !a.startsWith("--") && a !== "-l");
  const destination = positional[0];
  const sourcePath = positional[1] || "skills";

  if (!destination) {
    console.error(
      "Usage: node scripts/installSkills.js <destination> [source-path] [--link] [--include-claude]",
    );
    console.error("  destination:  Project root or .cursor/rules path");
    console.error(
      "  source-path:  e.g. skills/frontend-architecture (default: skills)",
    );
    process.exit(1);
  }

  const destResolved = path.resolve(destination);
  const rulesDir =
    destResolved.endsWith(".cursor/rules") || destResolved.endsWith("rules")
      ? destResolved
      : path.join(destResolved, ".cursor", "rules");

  if (!fs.existsSync(path.dirname(rulesDir))) {
    fs.mkdirSync(path.dirname(rulesDir), { recursive: true });
  }
  if (!fs.existsSync(rulesDir)) {
    fs.mkdirSync(rulesDir, { recursive: true });
  }

  const skills = findSkills(sourcePath);
  if (skills.length === 0) {
    console.error("No skills found under", sourcePath);
    process.exit(1);
  }

  const sourceResolved = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(repoRoot, sourcePath);
  const claudePath = includeClaude ? findClaudeMd(sourceResolved) : null;

  console.log(
    `${link ? "Linking" : "Copying"} ${skills.length} skill(s) to ${rulesDir}`,
  );
  for (const { cursorRulePath, slug } of skills) {
    const destPath = path.join(rulesDir, `${slug}.mdc`);
    if (link) {
      const target = path.relative(path.dirname(destPath), cursorRulePath);
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      fs.symlinkSync(target, destPath);
    } else {
      fs.copyFileSync(cursorRulePath, destPath);
    }
    console.log(`  ${slug}.mdc`);
  }

  if (claudePath) {
    const groupName = path.basename(sourceResolved);
    const claudeDest = path.join(rulesDir, `${groupName}-claude.mdc`);
    if (link) {
      const target = path.relative(path.dirname(claudeDest), claudePath);
      if (fs.existsSync(claudeDest)) fs.unlinkSync(claudeDest);
      fs.symlinkSync(target, claudeDest);
    } else {
      fs.copyFileSync(claudePath, claudeDest);
    }
    console.log(`  frontend-architecture-claude.mdc (CLAUDE.md)`);
  }

  console.log("Done.");
}

main();
