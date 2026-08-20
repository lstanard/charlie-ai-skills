#!/usr/bin/env node
/**
 * Install skills for Cursor or Claude Code.
 *
 * Usage:
 *   node scripts/installSkills.js <destination> [source-path] [options]
 *
 * Examples:
 *   # Install global skills for Claude Code
 *   node scripts/installSkills.js ~/.claude --target=claude --scope=global
 *
 *   # Install frontend project skills for Cursor
 *   node scripts/installSkills.js /path/to/app --scope=project --tags=frontend,react
 *
 *   # Re-sync a single skill
 *   node scripts/installSkills.js ~/.claude skills/general-coding-rules --target=claude
 *
 * Options:
 *   --target=cursor|claude    Install for Cursor (default) or Claude Code
 *   --scope=global|project    Only install skills with matching scope
 *   --tags=tag1,tag2          Only install skills with at least one matching tag
 *   --include-claude          Also install CLAUDE.md reference files
 *
 * A skill's `dependencies` (other skill.json slugs in this repo) are installed
 * alongside it automatically, regardless of --scope/--tags. Its
 * `plugin_dependencies` (skills from an external plugin, e.g. superpowers:*)
 * are printed as a reminder — this script does not install plugins.
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
      const skillJson = JSON.parse(fs.readFileSync(skillJsonPath, "utf8"));
      skills.push({
        dir,
        slug,
        skillJsonPath,
        cursorRulePath: fs.existsSync(cursorRulePath) ? cursorRulePath : null,
        skillMdPath: fs.existsSync(skillMdPath) ? skillMdPath : null,
        scope: skillJson.scope ?? null,
        tags: skillJson.tags ?? [],
        dependencies: skillJson.dependencies ?? [],
        pluginDependencies: skillJson.plugin_dependencies ?? [],
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

function filterSkills(skills, scopeFilter, tagsFilter) {
  return skills.filter(({ slug, scope, tags }) => {
    if (scopeFilter) {
      if (scope !== null) {
        const scopes = Array.isArray(scope) ? scope : [scope];
        if (!scopes.includes(scopeFilter)) {
          console.log(`  ⏭  ${slug}: skipped (scope: ${scopes.join(",")})`);
          return false;
        }
      }
    }

    if (tagsFilter.length > 0 && tags.length > 0) {
      if (!tagsFilter.some(t => tags.includes(t))) {
        console.log(`  ⏭  ${slug}: skipped (tags: ${tags.join(",")})`);
        return false;
      }
    }

    return true;
  });
}

/**
 * Expands a set of requested skills to include their local `dependencies`,
 * looked up against every skill in the repo (not just sourcePath) since a
 * dependency often lives in a sibling directory. Dependencies bypass the
 * scope/tags filters already applied to the requested skills, because a
 * required skill has to be present regardless of the filter. Also collects
 * every `plugin_dependencies` entry across the expanded set for the caller
 * to report separately, since those can't be installed by this script.
 * @param {Array<object>} skills - requested skills, already scope/tag-filtered
 * @param {Map<string, object>} bySlug - every skill in the repo, keyed by slug
 * @returns {{resolved: Array<object>, pluginDeps: Set<string>}} the expanded
 *   skill list (each entry gains a `pulledInBy` Set of slugs that required it)
 *   and the union of plugin dependency names
 */
function resolveDependencies(skills, bySlug) {
  const resolved = new Map(); // slug -> skill entry with pulledInBy: Set<parentSlug>
  const pluginDeps = new Set();

  /**
   * Adds a skill (and its transitive dependencies) to the resolved map.
   * @param {object} skill - the skill entry to add
   * @param {string|null} pulledInByParent - slug of the skill that required this one, or null if directly requested
   * @returns {void}
   */
  function visit(skill, pulledInByParent) {
    const existing = resolved.get(skill.slug);
    if (existing) {
      if (pulledInByParent) existing.pulledInBy.add(pulledInByParent);
      return;
    }
    const entry = { ...skill, pulledInBy: new Set(pulledInByParent ? [pulledInByParent] : []) };
    resolved.set(skill.slug, entry);

    for (const dep of skill.pluginDependencies) pluginDeps.add(dep);

    for (const depSlug of skill.dependencies) {
      const dep = bySlug.get(depSlug);
      if (!dep) {
        console.warn(`  ⚠️  ${skill.slug}: unknown dependency "${depSlug}", skipping`);
        continue;
      }
      visit(dep, skill.slug);
    }
  }

  for (const skill of skills) visit(skill, null);

  return { resolved: [...resolved.values()], pluginDeps };
}

function findClaudeMd(sourcePath) {
  const resolved = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(repoRoot, sourcePath);
  const claudePath = path.join(resolved, "CLAUDE.md");
  return fs.existsSync(claudePath) ? claudePath : null;
}

function copyRecursive(src, dest) {
  const skipFiles = ['skill.json', 'cursor.rule.md'];

  if (fs.lstatSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      if (skipFiles.includes(entry.name)) continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function installForCursor(skills, destination, includeClaude, sourcePath) {
  const destResolved = path.resolve(destination);
  const skillsDir =
    destResolved.endsWith(".cursor/skills")
      ? destResolved
      : destResolved.endsWith(".cursor")
      ? path.join(destResolved, "skills")
      : path.join(destResolved, ".cursor", "skills");

  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  console.log(`Copying ${skills.length} skill(s) to ${skillsDir} (Cursor)`);

  for (const { dir, slug, skillMdPath, pulledInBy } of skills) {
    if (!skillMdPath) {
      console.warn(`  ⚠️  ${slug}: missing SKILL.md, skipping`);
      continue;
    }
    copyRecursive(dir, path.join(skillsDir, slug));
    const via = pulledInBy && pulledInBy.size > 0 ? ` (dependency of ${[...pulledInBy].join(", ")})` : "";
    console.log(`  ✓ ${slug}/${via}`);
  }

  if (includeClaude) {
    const sourceResolved = path.isAbsolute(sourcePath)
      ? sourcePath
      : path.resolve(repoRoot, sourcePath);
    const claudePath = findClaudeMd(sourceResolved);
    if (claudePath) {
      const groupName = path.basename(sourceResolved);
      const claudeSkillDir = path.join(skillsDir, `${groupName}-reference`);
      fs.mkdirSync(claudeSkillDir, { recursive: true });
      fs.copyFileSync(claudePath, path.join(claudeSkillDir, "SKILL.md"));
      console.log(`  ✓ ${groupName}-reference/SKILL.md (CLAUDE.md as reference)`);
    }
  }
}

function installForClaude(skills, destination, includeClaude, sourcePath) {
  const destResolved = path.resolve(destination);
  const skillsDir =
    destResolved.endsWith(".claude/skills")
      ? destResolved
      : destResolved.endsWith(".claude")
      ? path.join(destResolved, "skills")
      : path.join(destResolved, ".claude", "skills");

  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  console.log(`Copying ${skills.length} skill(s) to ${skillsDir} (Claude Code)`);

  for (const { dir, slug, skillMdPath, pulledInBy } of skills) {
    if (!skillMdPath) {
      console.warn(`  ⚠️  ${slug}: missing SKILL.md, skipping`);
      continue;
    }
    copyRecursive(dir, path.join(skillsDir, slug));
    const via = pulledInBy && pulledInBy.size > 0 ? ` (dependency of ${[...pulledInBy].join(", ")})` : "";
    console.log(`  ✓ ${slug}/${via}`);
  }

  if (includeClaude) {
    const sourceResolved = path.isAbsolute(sourcePath)
      ? sourcePath
      : path.resolve(repoRoot, sourcePath);
    const claudePath = findClaudeMd(sourceResolved);
    if (claudePath) {
      const groupName = path.basename(sourceResolved);
      const claudeSkillDir = path.join(skillsDir, `${groupName}-reference`);
      fs.mkdirSync(claudeSkillDir, { recursive: true });
      fs.copyFileSync(claudePath, path.join(claudeSkillDir, "SKILL.md"));
      console.log(`  ✓ ${groupName}-reference/SKILL.md (CLAUDE.md as reference)`);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const includeClaude = args.includes("--include-claude");

  // Parse --target=cursor|claude
  const targetArg = args.find((a) => a.startsWith("--target="));
  const target = targetArg ? targetArg.split("=")[1] : "cursor";

  // Parse --scope=global|project
  const scopeArg = args.find((a) => a.startsWith("--scope="));
  const scopeFilter = scopeArg ? scopeArg.split("=")[1] : null;

  // Parse --tags=frontend,react (comma-separated, any match)
  const tagsArg = args.find((a) => a.startsWith("--tags="));
  const tagsFilter = tagsArg ? tagsArg.split("=")[1].split(",").map(t => t.trim()) : [];

  if (!["cursor", "claude"].includes(target)) {
    console.error("Error: --target must be 'cursor' or 'claude'");
    process.exit(1);
  }

  if (scopeFilter && !["global", "project"].includes(scopeFilter)) {
    console.error("Error: --scope must be 'global' or 'project'");
    process.exit(1);
  }

  const positional = args.filter((a) => !a.startsWith("--"));
  const destination = positional[0];
  const sourcePath = positional[1] || "skills";

  if (!destination) {
    console.error(
      "Usage: node scripts/installSkills.js <destination> [source-path] [options]",
    );
    console.error("  destination:  Project root or skills directory path");
    console.error("  source-path:  e.g. skills/general-coding-rules (default: skills)");
    console.error("");
    console.error("Options:");
    console.error("  --target=cursor|claude    Install for Cursor (default) or Claude Code");
    console.error("  --scope=global|project    Only install skills with matching scope");
    console.error("  --tags=tag1,tag2          Only install skills with at least one matching tag");
    console.error("                            (skills with no tags are always included)");
    console.error("  --include-claude          Also install CLAUDE.md reference files");
    console.error("");
    console.error("Examples:");
    console.error("  # Install global skills for Claude Code");
    console.error("  node scripts/installSkills.js ~/.claude --target=claude --scope=global");
    console.error("");
    console.error("  # Install frontend project skills for Cursor");
    console.error("  node scripts/installSkills.js /path/to/app --scope=project --tags=frontend,react");
    console.error("");
    console.error("  # Re-sync a single skill");
    console.error("  node scripts/installSkills.js ~/.claude skills/general-coding-rules --target=claude");
    process.exit(1);
  }

  let skills = findSkills(sourcePath);
  if (skills.length === 0) {
    console.error("No skills found under", sourcePath);
    process.exit(1);
  }

  skills = filterSkills(skills, scopeFilter, tagsFilter);
  if (skills.length === 0) {
    console.error("No skills matched the given --scope/--tags filters");
    process.exit(1);
  }

  // Dependency lookups always resolve against the whole repo, not just sourcePath,
  // since a dependency (e.g. sdlc -> grill-me) is usually a sibling directory.
  const bySlug = new Map(findSkills("skills").map((s) => [s.slug, s]));
  const { resolved, pluginDeps } = resolveDependencies(skills, bySlug);
  const pulledIn = resolved.filter((s) => s.pulledInBy.size > 0 && !skills.some((orig) => orig.slug === s.slug));
  if (pulledIn.length > 0) {
    console.log(
      `Pulling in ${pulledIn.length} dependency skill(s): ${pulledIn
        .map((s) => `${s.slug} (required by ${[...s.pulledInBy].join(", ")})`)
        .join(", ")}`,
    );
  }

  if (target === "cursor") {
    installForCursor(resolved, destination, includeClaude, sourcePath);
  } else {
    installForClaude(resolved, destination, includeClaude, sourcePath);
  }

  if (pluginDeps.size > 0) {
    console.log("\nPlugin dependencies (install separately via your plugin marketplace — not managed by this script):");
    for (const dep of [...pluginDeps].sort()) console.log(`  - ${dep}`);
  }

  console.log("Done.");
}

main();
