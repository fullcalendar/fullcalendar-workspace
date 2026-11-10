# Planning: Start Here

What the test revamp (Karma → Vitest, branch `t3/revamp-test-infrastructure`) still needs from Adam. Everything else is history, in `archive/`.

## Before merging

1. **Decide: the today button's accessible name.** It shows "Today", but its `aria-label` is the `todayHint`, "This Month" / "This Week". WCAG 2.5.3 Label in Name (level A) wants the visible text inside the name, so speech-input users can say "click Today". Options:
   - Make the name start with the visible text, e.g. "Today, this week". This changes `todayHint`'s output or how the label is built, in every locale.
   - Use the visible text as the name, and move the hint to `aria-description` or `title`.
   - Leave it as it is.

   Not tested either way. More context: `archive/agent-notes/gaps-a11y-sticky.md`.
2. **Decide: does `planning/` go to `main`?** It's committed on the branch. Three test comments point into `planning/archive/agent-notes/scheduler-misc.md`, so if it's dropped, move those notes into the comments first.
3. **Go-ahead for Claude:**
   - Run both full suites, in Preact and React, after the merge of `origin/main`.
   - Push the branch and open a draft PR. That gives the CI workflow (`.github/workflows/ci.yaml`) its first real run, on Linux.

## After merging

- [`post-project-tasks.md`](post-project-tasks.md): the backlog. Decisions first, then the bugs to fix and the GitHub issues to close.
- [`postponed-fixes/all-day-drop-gap.md`](postponed-fixes/all-day-drop-gap.md): a ready patch, waiting on one of those decisions.

## Next major version (v8)

- [`postpone-till-next-major.md`](postpone-till-next-major.md): breaking changes and API audits. Each ends with the decision to make.

## Archive

Done and kept for reference only. Git history has it too, so it can be deleted.
- `test-revamp.md`: the agreed plan, its decisions and phase notes. For day-to-day use of the test suites, `AGENTS.md` is the guide.
- `port-brief.md`: the brief given to the porting agents.
- `agent-notes/`: each porting agent's raw findings. Every finding was triaged into the docs above, or marked in the tests (`it.fails` / `KNOWN BUG`).
- `sol-findings-round2.md`, `sol-regression-audit.md`: two review rounds, all applied (`6fcaed30f`, `b1d4e7d3b`, `71ba1c4f5`, `1facfe3f7`).
