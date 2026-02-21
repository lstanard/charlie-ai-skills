#!/usr/bin/env node
/**
 * Install skills for Cursor or Claude Code.
 *
 * Usage:
 *   node scripts/installSkills.js <destination> [source-path] [options]
 *
 * Examples:
 *   # Install all skills for Cursor (copied by default)
 *   node scripts/installSkills.js /path/to/my-app
 *   node scripts/installSkills.js /path/to/my-app skills/testing
 *
 *   # Install all skills for Claude Code globally (copied by default)
 *   node scripts/installSkills.js ~/.claude --target=claude
 *
 *   # Symlink instead of copy
 *   node scripts/installSkills.js ~/.claude --target=claude --link
 *
 * Options:
 *   --target=cursor|claude    Install for Cursor (default) or Claude Code
 *   --link, -l                Symlink instead of copy (default: copy)
 *   --include-claude          Also install CLAUDE.md reference files
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
    const skillJsonPath = path.join(dir, "skill.json");
    const cursorRulePath = path.join(dir, "cursor.rule.md");
    const skillMdPath = path.join(dir, "SKILL.md");

    // A directory is a skill if it has skill.json
    if (fs.existsSync(skillJsonPath)) {
      const slug = path.basename(dir);
      skills.push({
        dir,
        slug,
        skillJsonPath,
        cursorRulePath: fs.existsSync(cursorRulePath) ? cursorRulePath : null,
        skillMdPath: fs.existsSync(skillMdPath) ? skillMdPath : null
      });
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

function copyRecursive(src, dest, link) {
  // Files to skip when copying (not needed by Cursor/Claude)
  const skipFiles = ['skill.json', 'cursor.rule.md'];

  if (link) {
    const target = path.relative(path.dirname(dest), src);
    if (fs.existsSync(dest)) {
      if (fs.lstatSync(dest).isDirectory()) {
        fs.rmSync(dest, { recursive: true });
      } else {
        fs.unlinkSync(dest);
      }
    }
    fs.symlinkSync(target, dest);
  } else {
    if (fs.lstatSync(src).isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        // Skip unnecessary files
        if (skipFiles.includes(entry.name)) {
          continue;
        }
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          copyRecursive(srcPath, destPath, false);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

function installForCursor(skills, destination, link, includeClaude, sourcePath) {
  const copy = !link;
  const destResolved = path.resolve(destination);
  const skillsDir =
    destResolved.endsWith(".cursor/skills") || destResolved.endsWith("skills")
      ? destResolved
      : destResolved.endsWith(".cursor")
      ? path.join(destResolved, "skills")
      : path.join(destResolved, ".cursor", "skills");

  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  console.log(
    `${copy ? "Copying" : "Linking"} ${skills.length} skill(s) to ${skillsDir} (Cursor)`,
  );

  for (const { dir, slug, skillMdPath } of skills) {
    if (!skillMdPath) {
      console.warn(`  ⚠️  ${slug}: missing SKILL.md, skipping`);
      continue;
    }
    const destPath = path.join(skillsDir, slug);
    copyRecursive(dir, destPath, link);
    console.log(`  ✓ ${slug}/ (full skill directory)`);
  }

  if (includeClaude) {
    const sourceResolved = path.isAbsolute(sourcePath)
      ? sourcePath
      : path.resolve(repoRoot, sourcePath);
    const claudePath = findClaudeMd(sourceResolved);
    if (claudePath) {
      const groupName = path.basename(sourceResolved);
      const claudeSkillDir = path.join(skillsDir, `${groupName}-reference`);
      if (!fs.existsSync(claudeSkillDir)) {
        fs.mkdirSync(claudeSkillDir, { recursive: true });
      }
      const claudeDest = path.join(claudeSkillDir, "SKILL.md");
      if (link) {
        const target = path.relative(path.dirname(claudeDest), claudePath);
        if (fs.existsSync(claudeDest)) fs.unlinkSync(claudeDest);
        fs.symlinkSync(target, claudeDest);
      } else {
        fs.copyFileSync(claudePath, claudeDest);
      }
      console.log(`  ✓ ${groupName}-reference/SKILL.md (CLAUDE.md as reference)`);
    }
  }
}

function installForClaude(skills, destination, link, includeClaude, sourcePath) {
  const copy = !link;
  const destResolved = path.resolve(destination);
  const skillsDir =
    destResolved.endsWith(".claude/skills") || destResolved.endsWith("skills")
      ? destResolved
      : destResolved.endsWith(".claude")
      ? path.join(destResolved, "skills")
      : path.join(destResolved, ".claude", "skills");

  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  console.log(
    `${copy ? "Copying" : "Linking"} ${skills.length} skill(s) to ${skillsDir} (Claude Code)`,
  );

  for (const { dir, slug, skillMdPath } of skills) {
    if (!skillMdPath) {
      console.warn(`  ⚠️  ${slug}: missing SKILL.md, skipping`);
      continue;
    }
    const destPath = path.join(skillsDir, slug);
    copyRecursive(dir, destPath, link);
    console.log(`  ✓ ${slug}/ (full skill directory)`);
  }

  if (includeClaude) {
    const sourceResolved = path.isAbsolute(sourcePath)
      ? sourcePath
      : path.resolve(repoRoot, sourcePath);
    const claudePath = findClaudeMd(sourceResolved);
    if (claudePath) {
      const groupName = path.basename(sourceResolved);
      const claudeSkillDir = path.join(skillsDir, `${groupName}-reference`);
      if (!fs.existsSync(claudeSkillDir)) {
        fs.mkdirSync(claudeSkillDir, { recursive: true });
      }
      const claudeDest = path.join(claudeSkillDir, "SKILL.md");
      if (link) {
        const target = path.relative(path.dirname(claudeDest), claudePath);
        if (fs.existsSync(claudeDest)) fs.unlinkSync(claudeDest);
        fs.symlinkSync(target, claudeDest);
      } else {
        fs.copyFileSync(claudePath, claudeDest);
      }
      console.log(`  ✓ ${groupName}-reference/SKILL.md (CLAUDE.md as reference)`);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const link = args.includes("--link") || args.includes("-l");
  const copy = !link; // Copy by default, unless --link is specified
  const includeClaude = args.includes("--include-claude");

  // Parse --target=cursor or --target=claude
  const targetArg = args.find((a) => a.startsWith("--target="));
  const target = targetArg ? targetArg.split("=")[1] : "cursor";

  if (!["cursor", "claude"].includes(target)) {
    console.error("Error: --target must be 'cursor' or 'claude'");
    process.exit(1);
  }

  const positional = args.filter(
    (a) => !a.startsWith("--") && a !== "-l"
  );
  const destination = positional[0];
  const sourcePath = positional[1] || "skills";

  if (!destination) {
    console.error(
      "Usage: node scripts/installSkills.js <destination> [source-path] [options]",
    );
    console.error("  destination:  Project root or skills directory path");
    console.error(
      "  source-path:  e.g. skills/testing (default: skills)",
    );
    console.error("");
    console.error("Options:");
    console.error("  --target=cursor|claude  Install for Cursor (default) or Claude Code");
    console.error("  --link, -l              Symlink instead of copy (default: copy)");
    console.error("  --include-claude        Also install CLAUDE.md reference files");
    console.error("");
    console.error("Examples:");
    console.error("  # Install testing skills for Cursor (copied)");
    console.error("  node scripts/installSkills.js /path/to/app skills/testing");
    console.error("");
    console.error("  # Install all skills for Claude Code globally (copied)");
    console.error("  node scripts/installSkills.js ~/.claude --target=claude");
    console.error("");
    console.error("  # Symlink instead of copy");
    console.error("  node scripts/installSkills.js ~/.claude --target=claude --link");
    process.exit(1);
  }

  const skills = findSkills(sourcePath);
  if (skills.length === 0) {
    console.error("No skills found under", sourcePath);
    process.exit(1);
  }

  if (target === "cursor") {
    installForCursor(skills, destination, link, includeClaude, sourcePath);
  } else {
    installForClaude(skills, destination, link, includeClaude, sourcePath);
  }

  console.log("Done.");
}

main();
