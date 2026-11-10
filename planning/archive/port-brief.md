# Brief: porting Karma specs to Vitest (FullCalendar test revamp, Phase 2)

Repo root: /Users/adam/.t3/worktrees/fullcalendar-workspace/t3-3b5c764b. Read planning/test-revamp.md for the agreed plan.

You are one of several agents porting legacy Karma/Jasmine specs to Vitest browser mode, in parallel, in this SAME checkout. You own a specific set of legacy files and target folders (given separately). Stay inside them.

## Hard rules
- Do NOT commit, do NOT run `git add`/`git rm`/`git stash` or anything that touches the git index. Delete ported legacy files with plain `rm`. The coordinator commits.
- Do NOT run Karma (`scripts/bin/karma-test.js`, `pkg:test`), `pnpm install`, or any `pnpm ... build`. The library dist is already built and current.
- Do NOT edit library source (standard/packages/preact, vanilla, premium/packages/preact-scheduler, ...). If you find a library bug or quirk, log it (see Notes). Write the test for the correct behavior as `it.fails`, with a `// KNOWN BUG (it.fails until fixed): ...` comment, so it turns red once fixed. Confirm it really fails as a plain `it` first.
- Run only YOUR test files: from the package dir, `timeout 600 /Users/adam/Library/pnpm/pnpm exec vitest run --project browser <your files or folders>` (or `--project unit` for `*.unit.ts`). Concurrent Vitest runs by other agents are fine. These commands need to run outside the sandbox (dangerouslyDisableSandbox: true) because the browser binds local ports.
- Shared helpers in `tests/lib/` are used by everyone. Prefer adding NEW helper files (e.g. tests/lib/models/list.ts, tests/lib/date-utils.ts) over editing shared ones. If you must change a shared file, make small additive changes only (new methods/exports), re-read it right before editing, and never change existing behavior.
- Code style: always use curly braces for `if` statements and loops, with the body on a separate line. Match existing test style (see tests/event-drag/*.ts, tests/date-select/*.ts, tests/constraints/*.ts).

## Infrastructure (read these files first)
- Packages: standard tests in standard/packages/vanilla-tests/tests/, premium in premium/packages/vanilla-scheduler-tests/tests/. Legacy Karma specs are in each package's src/.
- `tests/lib/calendar.ts`: `initCalendar(options, el?)` (defaults: timeZone 'UTC', eventDisplay 'auto', dragRevertDuration 0, classic theme, all standard view plugins + interaction, a test plugin with dev-parts; premium setup adds scheduler plugins and a valid license key). `options.plugins` are ADDED to defaults. `createCalendarElement()`, `appendTestElement(el)` (removed at teardown). Teardown destroys every rendered calendar.
- `tests/lib/settle.ts`: `waitForSettle()` — await it after init and after anything that re-renders. NEVER use setTimeout sleeps or waitTimeout. For async things with a definite end (fetch, callbacks), await a promise/spy.
- `data-fc-part` attributes: every render-hook part's element has `data-fc-part="<partName>"` (the *Class option name without "Class", space-separated when several), e.g. root, view, toolbar, headerToolbar, toolbarTitle, button, buttonGroup, dayHeader, dayHeaderInner, dayCell, dayCellTop, dayCellTopInner, dayCellInner, dayRow, dayLane, slotLane, slotHeader, slotHeaderInner, allDayHeader, event, blockEvent, rowEvent, columnEvent, listItemEvent, eventInner, eventBefore, eventAfter, backgroundEvent, nonBusinessHours, highlight, moreLink, popover, popoverClose, navLink, weekNumberHeader, inlineWeekNumber, nowIndicatorLine, nowIndicatorHeader, listDay, listDayHeader, singleMonth, table, tableHeader, tableBody, resourceLane, resourceCell, resourceColumnHeader, resourceGroupHeader, ... NOT marked: eventTime/eventTitle (find them by text). Query with `queryParts(root, 'dayCell')` / `queryPart(...)` from tests/lib/models/events.ts. Never query legacy `fc-*` classes or CSS-module class names (exception: `classNames.internalEventMirror` etc. via 'fullcalendar/protected-styles' as the models do).
- Models: tests/lib/models/{day-grid,time-grid,events,spot,resize,scroll}.ts and premium tests/lib/models/timeline.ts: date/time -> points, event lookup by id (`getEventEls(root, id)`), `dragEvent`, `resizeEvent`, `clickDate`, `selectDates`/`selectRange`, `openMorePopover`, etc. `getElEventRange(el)` from 'fullcalendar/protected-api' maps an event element to its event.
- Input: real input only, via `pointer` / `touchPointer` (tests/lib/pointer.ts). Never dispatch synthetic events. `userEvent` from 'vitest/browser' is fine for keyboard.
- Vitest: `import { describe, expect, it, vi } from 'vitest'`; spies via `vi.fn()`; `it.each` for tables; `onTestFinished` for cleanup; fake timers only if a test truly needs them (avoid).
- TZ is America/New_York for the browser and Node. Calendar default timeZone is 'UTC'.

## Porting rules (agreed with the maintainer)
- Feature-first folders (see the tree in planning/test-revamp.md); one file per view where behavior is view-specific, topic files otherwise.
- Vary only the setting under test. Drop legacy combinatorial matrices (describeOptions over direction/timeZone/views, describeTimeZones) unless that dimension IS the subject. Keep one explicit RTL case where RTL affects geometry.
- Regression tests keep their issue number (comment with the URL) and sit in the same file as the general case.
- Every negative assertion must be anchored: prove the action happened (a spy, or a positive row with identical mechanics in the same it.each table).
- Assertions must discriminate (exact values, not `typeof x === 'object'`).
- Port behavior, not implementation details. Tests that only checked internal DOM structure/classnames that no longer exist should be rewritten against parts/behavior, or dropped if meaningless (log why).
- Empty, skipped (xit) or commented-out legacy specs: don't port; log them.
- ResizeObserver loop warnings are expected (filtered); not bugs.
- When a ported legacy file is fully covered, delete it with `rm`. If only part is ported, delete just the ported specs from it so Karma no longer runs them.

## Notes
Append findings to planning/agent-notes/<your-area>.md (create it): potential library quirks/bugs (with repro), legacy specs dropped and why, open questions for the maintainer.

## When done
Make sure all your Vitest files pass (run twice to check stability). Then report: files created, legacy files deleted/partially edited, test counts, anything dropped, and notes. Be concise.
