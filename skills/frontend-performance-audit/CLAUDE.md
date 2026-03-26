# Frontend Performance Audit — Reference

## When to invoke

After completing any frontend feature, invoke the `frontend-performance-audit` skill before marking work done.

---

## Config options

Per-project config lives in `lighthouse.config.json` at the project root. If absent, defaults apply.

| Field | Default | Description |
|---|---|---|
| `urls` | `["http://localhost:3000"]` | URLs to audit — Lighthouse runs against each in sequence |
| `buildCommand` | `npm run build` | Production build command |
| `startCommand` | `npm run start` | Server start command |
| `port` | `3000` | Port to poll for readiness |
| `categories` | `["performance", "accessibility", "best-practices"]` | Lighthouse categories to audit |
| `thresholds` | `{ "performance": 100, "accessibility": 100, "best-practices": 90 }` | Minimum passing score (0–100) |

---

## Execution steps

### 1. Read configuration

Check for `lighthouse.config.json` at the project root. Load it; fall back to defaults for any missing fields.

Resolve the URL list: if `urls` is present use it; otherwise default to `["http://localhost:3000"]`. All subsequent steps operate on this list.

### 2. Ensure Lighthouse CLI

```bash
lighthouse --version
```

If not found:

```bash
npm install -g lighthouse
```

### 3. Build for production

```bash
<buildCommand>
```

If the build fails, stop immediately and report the error. Do not proceed to audit.

### 4. Start production server

Run `<startCommand>` in the background. Poll the port until it responds (max 60 seconds):

```bash
npm run start > /tmp/lighthouse-server.log 2>&1 &
echo $! > /tmp/lighthouse-server.pid

for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/ | grep -q "200" && break
  sleep 2
done

curl -sf http://localhost:<port>/ > /dev/null || { echo "Server failed to start. Check /tmp/lighthouse-server.log"; kill $(cat /tmp/lighthouse-server.pid) 2>/dev/null; exit 1; }
```

### 5. Run Lighthouse

For each URL in the `urls` list:

```bash
mkdir -p lighthouse-reports
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SLUG=$(echo "<url>" | sed 's|https\?://||; s|[^a-zA-Z0-9._-]|-|g')
lighthouse <url> \
  --output=json \
  --output=html \
  --output-path=lighthouse-reports/report-${TIMESTAMP}-${SLUG} \
  --only-categories=<categories-comma-separated> \
  --chrome-flags="--headless --no-sandbox" \
  --quiet
```

`<categories-comma-separated>` is the `categories` array values joined with commas (e.g. `performance,accessibility`).

This produces per-URL reports:
- `lighthouse-reports/report-<timestamp>-<slug>.report.json`
- `lighthouse-reports/report-<timestamp>-<slug>.report.html`

### 6. Stop the server

Always stop the server after Lighthouse finishes, whether passing or failing:

```bash
kill $(cat /tmp/lighthouse-server.pid) 2>/dev/null && rm -f /tmp/lighthouse-server.pid
```

### 7. Verify Lighthouse output

Before parsing, confirm each report file exists:

```bash
ls lighthouse-reports/report-${TIMESTAMP}-<slug>.report.json
```

If any file does not exist, Lighthouse failed for that URL. Report the error and stop.

### 8. Parse scores and handle results

For each URL, read its `report-<timestamp>-<slug>.report.json`. For each category in `thresholds`, check `categories.<id>.score * 100` against the threshold.

Compute the **worst-case score per category** across all URLs — this is what goes in the top-level `scores` field of `scores.json`.

**If all thresholds pass for all URLs:**

Write `lighthouse-reports/scores.json` (see format below), then commit:

```bash
git add lighthouse-reports/scores.json
git commit -m "perf: lighthouse scores - perf:<score> a11y:<score> (<N> pages)"
```

For a single URL, the commit message can omit the page count. Note: if fix attempts were applied during iteration, commit or stash them separately before committing `scores.json`.

Report the passing scores to the user and stop.

**If any threshold fails on any URL:**

1. For each failing URL, collect audit IDs from `categories.<id>.auditRefs` and filter to those where `score !== null && score < 1`
2. Surface the failing audit `title` and `description`, grouped by URL, to guide fixes
3. Make targeted fixes (see Common Fixes below)
4. Return to Step 3 (rebuild and re-run all URLs)

Maximum 3 iterations. After 3 failures, write `lighthouse-reports/scores.json` with `passed: false` and `failingAudits` populated (so git history always has a record), then stop and present the human with:
- Current scores vs thresholds, per URL
- Remaining failing audit titles
- Recommended next steps

---

## scores.json format

```json
{
  "timestamp": "2026-03-24T16:30:00Z",
  "urls": ["http://localhost:3000", "http://localhost:3000/dashboard"],
  "scores": {
    "performance": 95,
    "accessibility": 100,
    "best-practices": 92
  },
  "thresholds": {
    "performance": 100,
    "accessibility": 100,
    "best-practices": 90
  },
  "passed": false,
  "failingAudits": [],
  "perUrl": {
    "http://localhost:3000": {
      "performance": 100,
      "accessibility": 100,
      "best-practices": 95
    },
    "http://localhost:3000/dashboard": {
      "performance": 95,
      "accessibility": 100,
      "best-practices": 92
    }
  }
}
```

- `scores` contains the **worst-case** score per category across all URLs
- `perUrl` maps each URL to its individual scores
- `passed` is `true` only if every URL meets every threshold
- `failingAudits` is always present: an empty array when `passed: true`, populated when `passed: false`

Failing audit entry shape:

```json
{
  "url": "http://localhost:3000/dashboard",
  "category": "performance",
  "id": "unused-javascript",
  "title": "Remove unused JavaScript",
  "score": 0.5
}
```

---

## Reading the JSON output

Key paths in the Lighthouse JSON report:
- Category scores: `categories.<id>.score` — multiply by 100 for percentage
- All audit results: `audits` — object keyed by audit ID
- Failing audits in a category: collect IDs from `categories.<id>.auditRefs`, then check `audits.<id>.score !== null && audits.<id>.score < 1`
- Audit text: `audits.<id>.title` and `audits.<id>.description`

---

## Common fixes

### Performance

| Failing Audit | Likely Fix |
|---|---|
| `render-blocking-resources` | Add `async` or `defer` to scripts; use `next/script` with `strategy="afterInteractive"` |
| `uses-optimized-images` | Replace `<img>` with `next/image` |
| `unused-javascript` | Remove unused imports; check for unintentional full-library imports |
| `largest-contentful-paint` | Preload LCP element; don't lazy-load above-the-fold images |
| `total-blocking-time` | Code-split heavy components with `next/dynamic` |
| `cumulative-layout-shift` | Set explicit `width`/`height` on images and embeds; avoid inserting content above existing content after load |

### Accessibility

| Failing Audit | Likely Fix |
|---|---|
| `color-contrast` | Ensure text contrast ratio ≥ 4.5:1 (normal) or 3:1 (large text) |
| `image-alt` | Add descriptive `alt` attributes to all `<img>` tags |
| `label` | Associate inputs with `<label>` or `aria-label` |
| `button-name` | Add text or `aria-label` to icon-only buttons |
| `link-name` | Add descriptive text or `aria-label` to links |
| `html-has-lang` | Add `lang="en"` to `<html>` element |
| `meta-viewport` | Remove `user-scalable=no` from viewport meta tag |
| `heading-order` | Ensure headings follow sequential order (h1 → h2 → h3, no skipping) |
| `target-size` | Add CSS `min-height: 48px` to interactive elements; for icon-only links use `display: inline-flex; align-items: center; justify-content: center; min-width: 48px; min-height: 48px; padding: 12px` |

---

## Future extension: CI gate

To enforce scores in CI (requires a deployed preview URL — localhost does not work in CI):

1. Install `@lhci/cli`: `npm install --save-dev @lhci/cli`
2. Add `.lighthouserc.json` pointing to your preview deploy URL with threshold config
3. Add a GitHub Actions workflow: wait for preview deploy → `lhci autorun` → fail PR on regression
4. Optionally configure a `lhci` storage backend to track history across CI runs

Key constraint: preview deployments must be in place before this is viable.
