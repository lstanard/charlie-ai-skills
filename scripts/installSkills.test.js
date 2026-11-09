import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const installer = path.join(repoRoot, "scripts/installSkills.js");

function temporaryDirectory(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "skill-install-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function install(destination, source = "skills", options = []) {
  const result = spawnSync(process.execPath, [installer, destination, source, ...options], {
    cwd: os.tmpdir(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

for (const suffix of ["", ".agents", ".agents/skills"]) {
  test(`Codex installs at the canonical path from destination '${suffix || "project root"}'`, (t) => {
    const root = temporaryDirectory(t);
    install(path.join(root, suffix), "skills/natural-writing", ["--target=codex"]);
    const skillDir = path.join(root, ".agents/skills/natural-writing");
    const sourceDir = path.join(repoRoot, "skills/natural-writing");
    const manifest = fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
    const sourceManifest = fs.readFileSync(path.join(sourceDir, "SKILL.md"), "utf8");
    assert.ok(manifest.startsWith(sourceManifest));
    for (const resource of ["CLAUDE.md", "avoid-list.md"]) {
      assert.equal(fs.readFileSync(path.join(skillDir, resource), "utf8"), fs.readFileSync(path.join(sourceDir, resource), "utf8"));
    }
    assert.ok(!fs.existsSync(path.join(skillDir, "skill.json")));
    assert.ok(!fs.existsSync(path.join(skillDir, "cursor.rule.md")));
    install(path.join(root, suffix), "skills/natural-writing", ["--target=codex"]);
    assert.equal(fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf8"), manifest);
    assert.equal(fs.readFileSync(path.join(sourceDir, "SKILL.md"), "utf8"), sourceManifest);
  });
}

test("Codex includes a selected group's shared reference and examples", (t) => {
  const root = temporaryDirectory(t);
  install(root, "skills/frontend-architecture/react-layering", ["--target=codex"]);
  const groupDir = path.join(root, ".agents/skills/react-layering/references/group");
  assert.equal(fs.readFileSync(path.join(groupDir, "CLAUDE.md"), "utf8"), fs.readFileSync(path.join(repoRoot, "skills/frontend-architecture/CLAUDE.md"), "utf8"));
  assert.equal(fs.readFileSync(path.join(groupDir, "examples/03-domain-models/payment-method.ts"), "utf8"), fs.readFileSync(path.join(repoRoot, "skills/frontend-architecture/examples/03-domain-models/payment-method.ts"), "utf8"));
});

test("Codex filters by scope and tags and packages all selected skills' group references", (t) => {
  const root = temporaryDirectory(t);
  install(root, "skills", ["--target=codex", "--scope=project", "--tags=graphql"]);
  const skillsDir = path.join(root, ".agents/skills");
  assert.ok(fs.existsSync(path.join(skillsDir, "graphql-testing/SKILL.md")));
  assert.ok(fs.existsSync(path.join(skillsDir, "graphql-testing/references/group/CLAUDE.md")));
  assert.ok(!fs.existsSync(path.join(skillsDir, "css-architecture")));
  assert.ok(!fs.existsSync(path.join(skillsDir, "general-coding-rules")));
});

test("Codex installs dependencies outside the selected source and reports plugin requirements", (t) => {
  const root = temporaryDirectory(t);
  const output = install(root, "skills/sdlc", ["--target=codex"]);
  const skill = JSON.parse(fs.readFileSync(path.join(repoRoot, "skills/sdlc/skill.json"), "utf8"));
  for (const slug of skill.dependencies) {
    assert.ok(fs.existsSync(path.join(root, ".agents/skills", slug, "SKILL.md")));
  }
  for (const plugin of skill.plugin_dependencies) assert.ok(output.includes(plugin));
});

test("Codex installs the entire catalog with unchanged discovery metadata", (t) => {
  const root = temporaryDirectory(t);
  install(root, "skills", ["--target=codex"]);
  let count = 0;
  function checkDirectory(dir) {
    const source = path.join(dir, "skill.json");
    if (fs.existsSync(source)) {
      const skill = JSON.parse(fs.readFileSync(source, "utf8"));
      const slug = path.basename(dir);
      const manifest = fs.readFileSync(path.join(root, ".agents/skills", slug, "SKILL.md"), "utf8");
      const metadata = manifest.match(/^---\nname: (.+)\ndescription: (.+)\n---/);
      assert.ok(metadata, slug);
      assert.equal(JSON.parse(metadata[1]), skill.id.split(".").pop());
      assert.equal(JSON.parse(metadata[2]), skill.description);
      const sourceManifest = fs.readFileSync(path.join(dir, "SKILL.md"), "utf8");
      const installedGuidance = manifest.slice(sourceManifest.length);
      for (const match of installedGuidance.matchAll(/\]\(([^)]+)\)/g)) {
        if (!match[1].includes(":") && !match[1].startsWith("#")) {
          assert.ok(fs.existsSync(path.join(root, ".agents/skills", slug, match[1])), `${slug}: ${match[1]}`);
        }
      }
      count++;
      return;
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) checkDirectory(path.join(dir, entry.name));
    }
  }
  checkDirectory(path.join(repoRoot, "skills"));
  assert.equal(fs.readdirSync(path.join(root, ".agents/skills")).length, count);
});

test("Codex repeat install preserves a resource symlink to its source", (t) => {
  const root = temporaryDirectory(t);
  install(root, "skills/natural-writing", ["--target=codex"]);
  const dest = path.join(root, ".agents/skills/natural-writing/avoid-list.md");
  const source = path.join(repoRoot, "skills/natural-writing/avoid-list.md");
  const original = fs.readFileSync(source, "utf8");
  fs.unlinkSync(dest);
  fs.symlinkSync(source, dest);
  install(root, "skills/natural-writing", ["--target=codex"]);
  assert.ok(fs.lstatSync(dest).isSymbolicLink());
  assert.equal(fs.readFileSync(source, "utf8"), original);
});

test("Codex rejects a source-linked manifest before modifying source files", (t) => {
  const root = temporaryDirectory(t);
  const dest = path.join(root, ".agents/skills/natural-writing");
  const source = path.join(repoRoot, "skills/natural-writing/SKILL.md");
  const original = fs.readFileSync(source, "utf8");
  fs.mkdirSync(dest, { recursive: true });
  fs.symlinkSync(source, path.join(dest, "SKILL.md"));
  const result = spawnSync(process.execPath, [installer, root, "skills/natural-writing", "--target=codex"], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /destination SKILL.md resolves to the repository source/);
  assert.equal(fs.readFileSync(source, "utf8"), original);
});

for (const target of ["cursor", "claude"]) {
  test(`${target} installation still copies the unmodified generated manifest`, (t) => {
    const root = temporaryDirectory(t);
    install(root, "skills/natural-writing", [`--target=${target}`]);
    assert.equal(fs.readFileSync(path.join(root, `.${target}/skills/natural-writing/SKILL.md`), "utf8"), fs.readFileSync(path.join(repoRoot, "skills/natural-writing/SKILL.md"), "utf8"));
    assert.ok(!fs.existsSync(path.join(root, ".agents")));
  });
}
