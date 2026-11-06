# Manual Testing (Cursor rule)
scope: project
version: 0.1.0

Apply this rule when the user asks to:
- manual testing
- let's test this in dev
- walk me through testing
- test this in staging
- help me test the deploy
- ready for the first test case

When generating or editing output:
- Before the first step, writes a results file to a durable location: the active plan folder when one exists (for example `<plan>/context/manual-testing.md`), otherwise a path the user confirms. Never the session scratchpad, which is cleared between sessions.
- The results file has a header naming the environment and the change under test (linked PRs and tickets), a case table with columns #, Case, Expected, Result, Notes, then one log section per case and a Follow-ups section at the end.
- Shows the case outline as a one-line-per-case table, then stops. Detailed instructions come one step at a time.
- Gives exactly one step per message and waits for the user's result before giving the next.
- Each step names the operation and the exact values to use (ids, codes, payload content). Does not paste request bodies the user already has saved (for example in Postman); pastes a full query only for ad hoc checks such as SQL or a metrics query the user has no saved version of.
- Before stating an expected result, checks it against the code: which state, version, tag, event or error the code actually produces. When a setup step needs valid input, checks the validation rules first so the step does not fail on setup.
- Orders the cases to reuse state the earlier cases create, and runs rejection cases along the way when the state for them already exists, rather than building fresh setup for each case.
- When a case cannot be reached through the system's own operations (for example, a state the API never produces), says so, offers a reachable version of the case and a forced version (direct DB edit), recommends one, and lets the user pick.
- After each result, records it in the results file before replying: the step and its outcome in that case's log section, and Pass, Fail or Blocked with a short note in the case table once the case is finished. Inserts each log line into the right section; never appends blindly to the end of the file.
- When an expected result turns out wrong because the expectation was wrong, says so plainly, corrects the Expected column, and records the actual behavior. Does not count it as a failure of the change.
- When a result does not match and the cause is unclear, investigates before moving on: reads the relevant code, or asks for one narrowing check (for example, splitting a metric by time).
- Marks a case Blocked, with the reason, when the environment does not allow the check (no logs, no access to a bucket or account), and moves on.
- Records anything worth acting on later (a code change, a product question) in the Follow-ups section as soon as it comes up, and mentions it in the reply.
- At the end, presents the case table with results and lists the follow-ups.

See CLAUDE.md for the results file template, step format, and lessons from past runs.

Avoid:
- Does not run the test steps itself against the deployed environment; the user drives and reports results.
- Does not deploy, run migrations, or change environment data, except by giving the user a setup step to run.
- Does not fix code during testing; fixes become follow-ups unless the user asks for one.
- Does not post results anywhere (PR, Jira, Slack) unless the user asks.

# metadata
id: charlie.manual-testing