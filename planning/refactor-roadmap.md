# Hooks and data-architecture refactor: roadmap

Written 2026-10-19 on `t3/component-data-architecture-review`. Phases 1–4 have their own detailed docs.
Later phases are sketched on purpose and get detailed docs once the earlier ones have taught us
something.

Related docs:

- `pre-pass-changelog.md`: phase 0, done.
- `related-issues.md`: open issues the refactor should fix, to close afterwards.

## Goals

- Move React/Preact class components to function components and hooks.
- Replace `CalendarDataManager` with a small raw-state store, pure derivations and effects.
- Keep the imperative API (`Calendar`, `CalendarApi`, `CalendarController`) stable. A hooks- or
  reducer-style API comes later and should reuse the same internal actions.
- Remove boilerplate (measurement, ref maps, `_isUnmounting`, scroller syncing) with small hooks that
  compose into per-layout-family hooks.
- Keep print, screen and horizontal-scroll layouts as separate components, sharing code through those
  hooks.
- Split render hooks (`*Class`, `*Content`, `*DidMount`/`*WillUnmount`) into separate internal
  primitives, and replace components that switch on a mode (`StandardEvent`'s `display`) with
  composition.
- Later: a higher-level grid abstraction, built from the same hooks.

## Ground rules

**Ships in v7.** Each phase merges and could be released on its own. No long-lived branch.

**What counts as breaking:**

- Breaking, not allowed:
  - public options and their meaning, including the event class cascade
    (`event*`/`blockEvent*`/`rowEvent*`/`columnEvent*`/`listItemEvent*`);
  - `CalendarApi`, `EventApi`, `ResourceApi` and the other public objects;
  - rendered DOM and class names that themes depend on;
  - the Vue/Angular `handleCustomRendering` contract.
- Tolerated:
  - subtle lifecycle and callback timing, e.g. the order of `*DidMount` calls across areas, when
    `datesSet`/`eventsSet` fire relative to paint;
  - as long as every callback still fires with correct arguments.
- **Render-hook call counts may go down, never up.** For a given full render of the calendar, or a
  given interaction such as a drag, the number of times each user callback runs (`eventContent`,
  `dayCellClass`, `eventDidMount`, …) must stay the same or drop.
  - These counts stand in for "how often the JSX was rebuilt". A drop is welcome, because it usually
    means unnecessary renders are gone.
  - An increase is a regression and blocks the phase, even when the output is identical.
  - Total component renders are not gated. Splitting a component into smaller composed components is
    fine.
- Each phase doc keeps a "behavior changes" list of what it tolerated, so the changelog can mention
  anything a user might notice.

**`protected-api` can break.** Only our own packages use it, and they all publish together. Update
scheduler, rrule, google-calendar, vue3, the test packages and the rest in the same change.

**Supported runtimes stay React 17, 18 and 19, and Preact 10.29+.**

- `useSyncExternalStore` comes from `use-sync-external-store/shim` in the React build, which makes it
  a runtime dependency of `@fullcalendar/react` (and react-scheduler). The Preact build's
  `buildConfig.importRemaps` (`standard/packages/preact/package.json`) only covers `react`,
  `react/jsx-runtime`, `react-dom` and `react-dom/client`, so add `use-sync-external-store/shim` →
  `preact/compat`, which exports `useSyncExternalStore`.
- No `useId`, which is React 18+. Keep generating ids from `baseId`.
- Never edit `standard/packages/react/src`. It's a build-time copy of `standard/packages/preact/src`.

**Measurement timing.** Measuring code attaches in callback refs or `useLayoutEffect`, never in
`useEffect`. Preact defers `useEffect` until after paint, and print relies on
`flushSyncWithSizeBatching` measuring inside the same commit.

**The DOM stays stable.** Hooks change how elements are measured, never which elements exist. That
includes `<Ruler>` and Scroller's internal ruler divs. The DOM snapshot tool (phase 1) checks this.

**Review.** GPT-6.1-Sol on high effort reviews through T3's orchestrator (`delegate_task`), never
the Codex skill:

- each spec before implementation;
- each phase after implementation.

Its objections are weighed, not followed blindly.

**Tests.**

- Targeted Karma specs during work.
- Ask before running full package suites.
- A DOM snapshot comparison and a call-count comparison at the end of each phase from phase 4 on.
- **Both runtimes.** The Karma bundles use the Preact build unless `FORCE_REACT=1`
  (`vanilla-tests/build.config.js`). Snapshots and count baselines are recorded under both, since
  Preact and React order commits differently.
- **React-only requirements** (`<Activity>`, Strict Mode replays, Suspense discards, React 17) are
  covered by the React-component suite from phase 2, not by the vanilla specs.

## Phases

| # | Phase | Doc | Depends on |
|---|---|---|---|
| 0 | Pre-pass bug fixes | `pre-pass-changelog.md` | done |
| 1 | DOM snapshot tool | `phase-1-dom-snapshot.md` | — |
| 2 | Render-hook contract specs | `phase-2-render-hook-specs.md` | 1 (count baseline only) |
| 3 | Hook toolkit spec and review | `phase-3-hook-toolkit-spec.md` | — |
| 4 | Pilot: composed event components | `phase-4-event-pilot.md` (done) | 1, 2, 3 |
| 5 | Render-hook rollout and leaf conversions | `phase-5-render-hook-rollout.md` (done) | 4 |
| 6 | `useHitTarget` and interactions | `phase-6-hit-target.md` (done) | 3 |
| 7 | Layout families | sketched below | 5, 6 |
| 8 | Reducer purity | `phase-8-reducer-purity.md` (done) | — |
| 9 | Store slices, actions, API facade | sketched below | 8 |
| 10 | Date profile | sketched below | 9 |
| 11 | Granular contexts | sketched below | 9 |
| 12 | Grid abstraction, hooks-first React API | future | 7, 9 |

- Phase 3 is independent of 1 and 2. Phase 2's specs and React suite are too, but its call-count baseline reuses the phase-1 runner.
- Phase 8 doesn't touch components, so it can run alongside 4–7.

### 5. Render-hook rollout and leaf conversions (done, see `phase-5-render-hook-rollout.md`)

As built, the big classes that phase 7 rewrites keep their class and render small hook components for
their render-hook areas. `ListView` stays a class until the List family converts. Originally sketched
as follows.


- Move the remaining 32 files that use `ContentContainer` onto the phase-3 primitives as each
  component converts to hooks.
- Delete `ContentContainer` once it's unused. Keep `ContentInjector`'s result handling inside
  `<CustomContent>`.
- Apply the composition lesson from phase 4 wherever a component switches on a mode:
  - `MoreLinkTrigger` (`display` row/column);
  - header and day cells shared across views;
  - the resource spreadsheet cells.
- Convert the leaves that have no lifecycle methods, and the measure-and-report leaves: background
  fills, slats, now indicators, spreadsheet cells.
- This fixes the seven mount-time watchers that close over stale props: `Ruler`,
  `FooterScrollbar`, `MeasuredHeightHarness`, `TimeGridAllDayHeader`, `TimeGridSlatHeader`,
  `TimeGridWeekNumber`, `TimelineHeaderCell`.

### 6. `useHitTarget` and interactions (done, see `phase-6-hit-target.md`)

As built, the 7 registrants use a class adapter on `DateComponent`, and the hook has no built-in
user yet. Originally sketched as follows.

- Interactions currently hold the component instance (`registerInteractiveComponent(this)`) and
  read `component.props` and `component.queryHit()`.
- Replace that with a stable object whose fields read the latest values through a ref. It carries
  `queryHit`, `prepareHits`, `isHitComboAllowed`, the event selection, drag and resize.
- Rework the interactions against it, with an adapter so class components can still register.
- Don't convert the 7 registering components here. They are `DayGridRows`, `TimeGridCols`,
  `TimeGridAllDayLane`, `ListView`, `MorePopover`, `TimelineLayoutNormal` and
  `ResourceTimelineLayoutNormal`, mostly the layouts phase 7 rewrites, so converting them now would
  convert them twice. Each switches to `useHitTarget` when its family converts (phase 5 or 7).

### 7. Layout families

- Add compound hooks: `useDayGridLayout`, `useTimeGridLayout`, and the Timeline and ResourceTimeline
  equivalents.
- Move the print choice into each layout shell. DayGrid has the same `<DayGridLayoutPrint>` branch
  in both Normal and Pannable.
  - Catch: print uses `visibleWidth` measured on screen, which only survives because the component
    instance survives. The measurement has to move up into the shell's hook.
- Share TimeGrid Normal and Pannable logic through the hook. They overlap by about 415 lines.
- Add view data hooks (`useDayGridViewData`, `useTimeGridViewData`) shared with the resource
  variants.
- Fix the bug where a grid shown again jumps back to its start (#8112 bug 2): the initial scroll runs
  once per instance or date range, not once per mount.

### 7b. Day-table pipeline (not planned in detail, see `day-table-pipeline.md`)

- Replace the split-by-resource, slice, rejoin pipeline (`VResourceSplitter`, the day slicers,
  `ResourceDayTableJoiner` and friends, the two `datesAboveResources` table models) with one pure
  column model and one slicing pass.
- After phase 7, or folded into phase 9's derived data. Must keep segment identity stable, so
  render-hook counts don't go up.

### 8. Reducer purity (done, see `phase-8-reducer-purity.md`)

As built, fetching stays in the reducer, to keep server-rendered events. Mount gating handles its
results instead. Originally sketched as follows.

Inside today's `CalendarDataManager`, before any store split:

- Move fetching, the `loading` emit and dispatching option-change handlers into a post-commit effect
  queue.
- Stop calling `update()` during render, and start timers on mount.
- Expected to fix #8112 bug 1, #8092 and #7070 (see `related-issues.md`).
- The existing specs are the safety net.

### 9. Store slices, actions, API facade

- **Raw state:** typed slices with synchronous `get`/`set` and `subscribe`, read through
  `useSyncExternalStore`. Covers current date, view type, option overrides, event sources, event
  store, selection, drag and resize, and slices registered by plugins (resources).
- **Derived data:** pure memoized functions shared by components and API getters.
- **Actions:** one stable `actions` object per calendar.
  - `CalendarApiImpl` and `CalendarController` become thin facades over it.
  - The future hooks API returns the same functions.
- **API wrapper cache:** cache `EventImpl`, `EventSourceImpl` and `ResourceApi` per calendar, in
  `WeakMap`s keyed by the underlying objects, so their identity stays stable. The wrappers must read
  context lazily from the store: `EventImpl` captures `ViewContext` today, which changes on every
  option change, so a cached wrapper holding it would go stale.
- **Vanilla:** the store is created in the constructor, so API calls before `render()` keep working.

### 10. Date profile

- **Hidden days:** a small value object with `isHidden`, `skip` and `trim`.
- **Config:** a plain config object, plus a view-supplied render-range function in place of
  `TableDateProfileGenerator`.
- **Pure functions:** `buildDateProfile`, `prevAnchor` and `nextAnchor`.
- **State:** the store keeps only an `anchorDate`, and the profile is derived from it.
- **Oracle tests:** verify against the old generator over random PREV/NEXT/`gotoDate` sequences,
  mixing `hiddenDays`, `dateIncrement`, `dateAlignment`, `dayCount` and `validRange`.
- **One intended behavior change:** the profile recomputes at midnight when `validRange` depends on
  now.
- Check here whether the hidden-day skip removed in the pre-pass was meant to happen.

### 11. Granular contexts

- Split into five contexts: `CalendarCore`, `PluginHooks`, `DateEnv`, `ViewSpec` and `ViewOptions`.
- `useViewContext()` stays as a facade that combines them, so unconverted code keeps working.
- Converted code uses the narrow hooks.
- Later, `ViewOptions` may become store selectors, e.g. `useOption('dayMaxEvents')`.
