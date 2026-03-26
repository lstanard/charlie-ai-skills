---
name: frontend-performance-audit
description: Use when frontend feature work is complete and before marking work done — runs Lighthouse against a production build, iterates on fixes until score thresholds are met, and commits a score summary to git.
---

# Frontend Performance Audit
version: 0.1.0

## Purpose
Use when frontend feature work is complete and before marking work done — runs Lighthouse against a production build, iterates on fixes until score thresholds are met, and commits a score summary to git.

## Triggers
- frontend feature complete
- before marking work done
- run lighthouse
- lighthouse audit
- performance audit
- check performance scores
- audit performance
- run performance audit

## Inputs

## Guarantees
- Reads lighthouse.config.json from the project root if present; falls back to defaults: url=http://localhost:3000, buildCommand=npm run build, startCommand=npm run start, port=3000, categories=[performance, accessibility, best-practices], thresholds={performance: 100, accessibility: 100, best-practices: 90}.
- Builds for production before auditing. Stops immediately and reports the error if the build fails — does not proceed to audit.
- Starts a production server in the background and polls the configured port for readiness (max 60 seconds). Always stops the server after Lighthouse finishes, whether passing or failing.
- Installs Lighthouse CLI globally if not already installed, then runs it with --headless Chrome against the configured URL and categories. Stores timestamped JSON and HTML reports under lighthouse-reports/.
- Parses category scores from the Lighthouse JSON output and compares each to its configured threshold.
- If all thresholds pass: writes lighthouse-reports/scores.json and commits it with message 'perf: lighthouse scores - perf:<score> a11y:<score>'. Reports passing scores and stops.
- If any threshold fails: identifies failing audits (score !== null && score < 1), applies targeted fixes, rebuilds, and reruns. Repeats up to 3 iterations.
- After 3 failed iterations: writes lighthouse-reports/scores.json with passed: false and failingAudits populated. Presents current scores vs thresholds, remaining failing audit titles, and recommended next steps. Does not make further fix attempts.
- lighthouse-reports/scores.json is always committed (pass or fail) so git history serves as a performance tracking log.

## Non-goals
- SSR, hydration, or streaming optimization — this skill targets client-rendered apps
- CI pipeline setup — see the Future Extension section in CLAUDE.md for Lighthouse CI guidance
- Proactive performance optimization before a Lighthouse run — fixes are only applied in response to failing audits

## Notes
Requires Chrome or Chromium installed on the machine. Do not run this skill while a dev server is already running on the configured port — the skill starts its own production server. Per-project config lives in lighthouse.config.json at the project root; any field can be omitted to use the default.