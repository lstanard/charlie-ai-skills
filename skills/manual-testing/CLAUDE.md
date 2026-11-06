# Manual Testing: Reference

## When to invoke

When the user wants to test a deployed change by hand, with the user running each step and the agent planning, checking and recording. Typical phrasing: "I deployed to dev, let's test", "walk me through testing this", "ready for the first test case".

---

## Execution steps

### 1. Build the outline

Read the change under test (the PR diffs, the plan, the schema docs for any new operations). List the cases that cover:

- the main success path for each new operation
- each rejection the code makes on purpose (wrong state, missing prerequisite, invalid input)
- side effects the user can observe: rows written, events emitted, metrics, files written to storage
- anything that passed locally but can only fail in a deployed environment, such as database permissions, secrets, IAM access, or network access

Put the case that carries the most deployment risk first, and say why in one sentence.

### 2. Write the results file

Location: the active plan folder if there is one (`<plan>/context/manual-testing.md`). Otherwise ask the user once where it should go. Never the session scratchpad.

Template:

```markdown
# <TICKET> manual testing (<environment>)

Environment: <environment>. Deployed: [#123](link), [#124](link).

| # | Case | Expected | Result | Notes |
|---|------|----------|--------|-------|
| 1 | <case> | <expected behavior> | | |

## Case 1 log

- <ids created: program, draft, partner>
- Step 1, `<operation>`: <status>. <what came back>.

## Follow-ups

- <item>
```

Keep `## Follow-ups` as the last section. Insert new log sections and log lines above it.

### 3. Present the outline

Show a one-line-per-case table and stop. Ask whether to add or drop cases. Don't give detailed steps yet.

### 4. Run each step

One step per message:

- **Name the step and the case it belongs to:** "Next step (case 2): ..."
- **Give the operation and the values:** for example, "run `submitProgramDraft` with `programId` set to `ec071af0-...`". If the user keeps saved requests, don't paste the request body. Give payload content when the step needs specific data.
- **Give full SQL or metric queries for checks**, since the user has no saved version of these. Filter by the ids and a time window so only this test's rows come back.
- **State the expected result in concrete terms:** status code, state, version number, row count, event name.

Before writing the expected result, read the code that produces it. Past runs got these wrong by guessing:

| Guessed | Actual |
|---|---|
| Promoting an edit draft starts a new draft version | It stores the approved version; no new draft |
| A metric tag carried the program's state | It carried the draft's state before the operation |
| An archived program could reach the archived-state rejection | Archiving deletes the in-progress draft, so the request fails earlier with "no draft in progress" |
| A failed transaction left no trace | A Postgres sequence draw is not rolled back, so the number is used up |

For setup steps that create data, check the validation rules first (for example, by parsing the proposed payload with the same parser the operation uses in a throwaway test), so the setup does not fail.

### 5. Record each result

Before replying, update the results file:

1. Add the step and its outcome to the case's log section.
2. When the case is finished, fill in Result (Pass, Fail, Blocked) and a short note in the case table.
3. If the expectation was wrong, correct the Expected column and say so in the reply.

Then reply with a one-line confirmation of the result and the next step.

### 6. Handle surprises

- **Result does not match and the cause is unclear:** investigate before the next step. Read the code, or ask for one narrowing check. For example, a failure metric summed to 4 when 3 were expected; a timeseries split showed the extra one was a request the user sent by accident.
- **The user questions something you said:** answer directly and correct the wording if it was misleading.
- **The environment blocks a check** (dev keeps no logs, the storage bucket lives in another account): mark the case Blocked with the reason and move on.
- **Something needs action later:** add it to Follow-ups right away.

### 7. Finish

Present the case table with results, list the follow-ups, and point to the results file.

---

## Ordering cases

Reuse state instead of building fresh setup for each case. Example from a promote-draft run:

1. Create a new program and its draft.
2. Promote while the draft is still `started` (rejection case: not promotable yet).
3. Submit the draft.
4. Promote before a lead code exists (rejection case: no lead code).
5. Link a code, then promote (success case).
6. Reuse the now-published program for the edit cases.
7. Run destructive or hard-to-undo cases (archive) last.

## Environment checks that tend to need care

- **Logs:** some environments don't keep logs. Ask before relying on a log search.
- **Metrics:** often present even where logs are not. Use `sum` as a count, not `avg`, and filter by `env`.
- **Object storage:** names ending in `--xa-s3` are access points on S3 directory buckets, not bucket names. They may live in another account.
- **Outbox or event tables:** filter by the entity id inside the payload and by a time window.
- **History tables:** check the row's `performed_by` (or equivalent) to confirm the actor was recorded.
