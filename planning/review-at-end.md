# Review at End

Open questions found during the test revamp, for Adam to review.

Triaged on 2026-10-20. Library bugs moved out of this file:
- Bugs with an `it.fails` test are found with the grep in `post-project-tasks.md`.
- Bugs without test coverage are in `needed-test-coverage.md`.
- Long-standing behavior to change only in a major version is in `postpone-till-next-major.md`.
- `setDates()` without `allDay` is fixed (`0c6f6a343`).
- Answered and resolved in the second pass: the w-react mirror note (AGENTS.md), event time/title parts (`c7fcfba64`), conditional parts (the only case was dayGrid's print table, `b4ec1d4c4`), the root part name, the license banner (code comment), lockfile churn, the GCal key, and #2955 (see `post-project-tasks.md`).
- `ThirdPartyDraggable` is now tested with jQuery UI and SortableJS (`c08187ff4`). An API audit is queued for v8 in `postpone-till-next-major.md`.
- Third pass: `select()` checks nothing (pinned in tests, `8fa4201fe`; queued for v8). Minor slot headers now have `data-time` (`de4d06dfc`). Recurring events after a `timeZone` change behave as #5273 intended (fixed in v6.1.17; the test is labeled). Plain-string Google Calendar sources are a real bug, now an `it.fails` test.
- Fourth pass: `moreLinkClick` returning nothing opens the popover (tested, `5c1916b28`); `'week'` keeping the date is intended. #5916 moved to `post-project-tasks.md`. A static `now` ticks on purpose (`bbf4827c3`, since v6.1.17).
- Fifth pass: the sizing tests also run with scrollbars hidden (`browser-no-scrollbars` project, `b38d2263e`). Timeline `firstDay` alignment follows Adam's rule (whole weeks align, others don't); whole weeks given in days are `it.fails` (`739031a35`).
- Sixth pass: the week-aligned `activeStart` bug went to `post-project-tasks.md` (untested for now). The `resourceOrder`/`eventOrder` function contract is in `postpone-till-next-major.md`. The scroll-end debounce is now `config.scrollEndWait` (`d5afc5f85`; name agreed with an Opus subagent).
- Seventh pass: resource settings precedence is in the v8 doc; the resource-view color bug is an `it.fails` test (`fd6677e54`). `aria-pressed` on prev/next/today (confirmed) and nav-link focus are post-project tasks. `off()`'s handler is optional (`5792b30b9`) and event source functions' success takes any response (`345e54ec1`), both in the changelog. `EventSourceFuncArg` was a name a porting subagent assumed from v6; it never existed in v7, so no alias.
- Eighth pass: resource-less columns after removing every resource are intended.

## Open Questions

### Accessibility questions from the keyboard/ARIA tests

- The today button shows "Today", but its accessible name is "This Month" or "This Week". WCAG 2.5.3 (Label in Name) expects the visible text to be part of the name.

Details are in `planning/agent-notes/gaps-a11y-sticky.md`.
