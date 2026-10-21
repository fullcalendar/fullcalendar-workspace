# Open issues the hooks / data-architecture refactor should fix

Check each one once the refactor lands, then close it with a changelog entry. None are fixed by the
pre-pass (see `pre-pass-changelog.md`).

**Status after phase 8 (2026-10-20):** #8092 and #7070 are fixed; close them with the changelog
entries. #8112 bug 1 is fixed. Bug 2 is fixed in phase 7, so #8112 can close too. Each fix has a spec in
`standard/packages/react/tests/lifecycle.tsx`.

The shared root cause is side effects during render: `CalendarDataManager` runs its reducer from
render, and the reducer starts fetches, dispatches from option change handlers, and arms timers
through `NowTimerRunner.update()`. A render that React discards or re-runs (Suspense, concurrent
rendering, `<Activity>`) leaves those effects behind with nothing to clean them up.

## #8112: now-timer keeps a destroyed calendar alive under React 19 `<Activity>`

Opened 2026-09-28. Two bugs in one report.

- **Bug 1, should be fixed by the refactor.** Hiding runs `destroy()`, a re-render while hidden calls
  `NowTimerRunner.update()` and arms the timer again, and removing the hidden subtree runs no cleanup.
  The timer re-arms forever and keeps the whole calendar in memory. Fixed when timers start in an
  effect instead of during render. The pre-pass server-side fix (no timers without a `document`)
  does not help here.
- **Bug 2, fixed for DayGrid and TimeGrid in phase 7 (`useInitialScroll`).** MultiMonth (on
  the hook too) and the timelines (their view-held scroll) never had it; guard specs cover them. So
  #8112 can close with the changelog entries. Specs: `vanilla-tests/src/view-render/activity-scroll.ts`
  and the premium `misc/activity-scroll-timeline.ts` (React runtime). Before: `TimeGridLayout` and `DayGridLayout` call `resetScroll()` in
  `componentDidMount`, and `<Activity>` re-runs mount effects each time the calendar is shown, so a
  scrolled grid jumps back to `scrollTime` / today's row. A mount effect has the same problem. Needs
  the initial scroll to run once per instance (or per date range), not per mount. Worth designing into
  `useInitialScroll`.

The report includes a full reproduction (`main.jsx` with a timer counter and Hide / Re-render / Show /
Unmount buttons). Reuse it to verify.

## #8092: function `eventSources` warn under a suspending `<Suspense>`

Opened 2026-08-04. "Can't perform a React state update on a component that hasn't mounted yet". The
render that suspends is thrown away, but it has already started the event fetch, whose callback
dispatches into a component that never mounted. Fixed when fetching moves out of the reducer into an
effect.

## #7070: "state update on an unmounted component" when an events fetch resolves after unmount

Opened 2020-09-03, labeled Confirmed / React Only. An async `events` function (or Google Calendar)
resolves after the calendar unmounts and dispatches into `CalendarDataProvider`. Fixed when fetches
are started from effects and their results are ignored (or the request aborted) after cleanup. React
18+ no longer prints this warning, so also confirm the fetch result is actually dropped, not just that
the warning is gone.
