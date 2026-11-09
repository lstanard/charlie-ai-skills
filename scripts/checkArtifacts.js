#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: repoRoot, encoding: "utf8" }).split("\0").filter(Boolean);
const forbidden = tracked.filter((file) => {
  // Deleted files can still appear in the index while preparing a cleanup commit.
  if (!fs.existsSync(path.join(repoRoot, file))) return false;
  return /(^|\/)(\.?superpowers|plans|planning)\//i.test(file)
    || /(^|\/)plans\.md$/i.test(file)
    || /[.-]plan\.md$/i.test(file);
});

if (forbidden.length > 0) {
  console.error("Planning artifacts must stay out of version control:\n" + forbidden.join("\n"));
  process.exitCode = 1;
} else {
  console.log("OK: no tracked planning artifacts in the working tree");
}
