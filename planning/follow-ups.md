# Follow-ups after the refactor (phases 1-11 and the loose ends)

Started 2026-10-21. What's left for later: pre-existing problems found along the way and not fixed,
and the steps that are Adam's. Details of each are in `questions-for-adam.md` where noted.

## Pre-existing problems, not fixed

Found during the work, present before it, left alone because fixing them would change behavior nobody
sanctioned yet.

1. **React 17/18 warn on every `useLayoutEffect` during server rendering** ("useLayoutEffect does nothing
   on the server", hundreds per `renderToString`). React 19 dropped the warning. The usual fix is an
   isomorphic layout effect (`useEffect` on the server); `hooks/useIsomorphicLayoutEffect.ts` exists now
   and the driver, `CalendarInner`, `CalendarMediaRoot` and `Scroller` use it, but the rest of the
   components still call `useLayoutEffect`. Dev-only console noise for SSR users on 17/18. The React
   17/18 smoke specs tolerate exactly this warning (`KNOWN_ERRORS` in
   `standard/packages/react17-tests/tests/smoke.tsx`).
2. **The user's own option layers join instead of replacing.** `setOption('eventClass', 'b')` on a
   calendar created with `eventClass: 'a'` gives events both classes: the initial options, `setOption`
   and a view type's and its super type's `views` options are merged with the same rules as theme-vs-user
   layers, so class options join, content options fall back to the earlier layer's, and lifecycle
   callbacks both run. Applies to every class, content and lifecycle option. Buttons are the exception
   since the per-button fix (`mergeUserOptions` in `options-manip.ts` keeps them replacing); the same
   split for the top-level options would be the fix.
3. **A calendar whose visible range has no valid date throws when created** (reading `start` of a null
   `activeRange`, first in `buildTitle`), e.g. `initialView: 'timeGrid'`, a `visibleRange` ending
   yesterday, `validRange: (now) => ({ start: now })`. Supporting a null active range everywhere (the
   title, the views, event slicing) is the fix. The midnight `validRange` refresh avoids it (a rebuilt
   profile with no active range isn't installed).

Behavior locked as-is by the step-0 specs of phase 7b, odd but not clearly bugs (see
`questions-for-adam.md`, "Phase 7b"): selecting an event needs a touch long-press; drags into DayGrid
or the all-day row show a highlight, never a mirror; an event input with `resourceId: undefined` becomes
the resource id `'undefined'`.

## For later (Adam's)

- **Merging:** decide how `t3/component-data-architecture-review` lands (per phase or whole). Nothing
  is pushed.
- **Closing issues on GitHub:** #8112, #8092 and #7070, verified by specs that reproduce them:
  - #8112: `standard/packages/react/tests/lifecycle.tsx` ("#8112: hiding in <Activity>, re-rendering,
    then unmounting leaves no long timers"), and the scroll half by
    `standard/packages/vanilla-tests/src/view-render/activity-scroll.ts` and premium's
    `misc/activity-scroll-timeline.ts`.
  - #8092: `lifecycle.tsx`, "#8092: a render discarded by Suspense leaves no long timers" and "…an async
    fetch from a render discarded by Suspense updates nothing".
  - #7070: `standard/packages/react17-tests/tests/smoke.tsx`, "#7070: an event fetch that settles after
    unmount updates nothing" (React 17 and 18).
- **CI and the React 17/18 smoke packages:** CI installs with `--filter '!@fullcalendar-tests/*'` and
  tests only `@fullcalendar/react`, so `@fullcalendar-tests/react17` and `react18` run locally only
  (`standard-scripts test --other`). Adding them is two filters in `.github/workflows/ci.yaml`. Left as is
  for now.
- **Tooling note:** in the `t3-8fb0493f` worktree, `pnpm install` needs
  `--store-dir /Users/adam/Code/fullcalendar-workspace/.pnpm-store/v10`, or it wants to delete and rebuild
  `node_modules` (installed against the main checkout's store, with no `store-dir` configured here).
