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
- At each step boundary (from phase 9 on, Adam's call): both packages' full suites, unfiltered, in both
  runtimes, two Karma processes in parallel (`FC_TEST_BUNDLE`, `FC_KARMA_PORT` in `scripts/bin/`), about
  6 minutes.
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
| 7 | Layout families | `phase-7-layout-families.md` (done) | 5, 6 |
| 8 | Reducer purity | `phase-8-reducer-purity.md` (done) | — |
| 9 | Store slices, actions, API facade | `phase-9-store.md` (done) | 8 |
| 10 | Date profile | `phase-10-date-profile.md` (done) | 9 |
| 11 | Granular contexts | sketched below | 9 |
| 12 | Grid abstraction, hooks-first React API | tabled (medium-term future) | 7, 9 |

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

### 7. Layout families (done, see `phase-7-layout-families.md`)

As built: every layout family converted (DayGrid, TimeGrid, MultiMonth and List, Timeline,
ResourceTimeline, with `phase-7-resource-timeline-plan.md` for its layout). The views stay class
shells around function bodies (`parseViewConfig`). `useInitialScroll` fixes #8112 bug 2 for DayGrid
and TimeGrid; the timelines keep their view-held scroll, which already survived remounts. Originally
sketched as follows.

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

### 7b. Day-table pipeline (plan in progress: `phase-7b-day-table-plan.md`, background in `day-table-pipeline.md`)

Scheduled (Adam, 2026-10-21): implemented after phase 10 and before phase 11, pending its reviewed
plan. After 10, because its column model consumes hidden days and the date profile, which phase 10
makes pure; before 11, so phase 11 converts one pure column model and slicing pass instead of the
splitter, slicer and joiner chain.

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

### 9. Store slices, actions, API facade (done, see `phase-9-store.md`)

As built, a behavior-identical restructuring, re-scoped after its spec review:

- **Effects:** reducers describe fetches and option change handlers as effects, which runners
  (`effectRunners`, core defaults) perform at today's points.
- **Pipeline:** `reduce()` is a staged pipeline in today's order, with the options refiner as an
  explicit cache (`OptionsRefinerCache`).
- **Store:** `createCalendarStore` replaces `CalendarDataManager`, and the drivers subscribe with
  `{ completedActions, isUrgent, isInCommit }`.
- **Actions:** `store.actions`, which `CalendarApiImpl`, the event and source wrappers and premium's
  resource API delegate to. Plugins add theirs (`calendarActions`).
- **Derived data:** UI bases, selection config and business hours are derived data, not state.
- **Extra re-render found:** the first update after the initial render re-rendered the view (PERF
  changelog entry).

`useSyncExternalStore` with render-time purity moved to phase 11, and the API wrapper cache to phase 12,
with the reviews' findings as their requirements. Originally sketched as follows.

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

### 10. Date profile (done, see `phase-10-date-profile.md`)

As built, behavior-identical: the profile's steps are module functions with open recursion through the
generator (custom `dateProfileGeneratorClass` overrides keep working), `TableDateProfileGenerator` became
a view-supplied render-range function, the generator exposes `hiddenDays`. The profile stays stored
state (deriving it from an anchor moved to phase 11); the midnight change moved to the loose ends; an
oracle checks every navigation against the frozen old generator. Originally sketched as follows.


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
- **From phase 9 (moved here):** components read the store through `useSyncExternalStore`, and the
  reduction becomes replayable during render. Requirements, from phase 9's spec review round 1:
  - **Replay:** user code runs during normalization (`eventSourceSuccess`, `success`,
    `eventDataTransform`, refiners, `validRange`/`visibleRange` functions), parsing allocates ids, the
    clock is read, rrule mutates its cache. Decide what may replay during a render and what runs once
    per committed transaction; frozen clock and id inputs for a render.
  - **Isolation:** two renders may preview different inputs. Single-entry memoizers can't hold both;
    commit the exact transaction a render used (base revision, inputs, state, derived data, effects).
  - **Publication order:** `CalendarInner`'s children fire `datesSet`/`eventsSet` in their commit,
    before a parent layout effect. Publish before child callbacks, in both runtimes.
  - **Render-time readers** (`ViewImpl` getters, premium `transformIsDraggable`, validation) must read
    the render's snapshot, not the committed one.
  - **Server rendering:** `getServerSnapshot` and hydration consistency, React 17 (shim), 18, 19.
  - **Synchronous sources** must still render on the server and in the first client render.
  - **Invalidation generations** (deferred from phase 9 §4): `resetOptions`' invalidation is still the
    refiner's mutable name lists, consumed by the next refinement, which is right only while reductions
    are sequential. A speculative reduction must retain or consume its own.
  - **The date profile derived from the anchor** (moved from phase 10, its review round 1): phase 10
    keeps the profile as stored state, with `dateAnchor` beside it. Deriving it needs a committed
    profile cache with candidate promotion (rejected `PREV`/`NEXT` keep the exact object without
    rebuilding) and today's build schedule, including discarded builds (user `validRange`/`visibleRange`
    call counts).
  - **Transaction isolation of phase 9's caches** (phase 9's last review): the refiner's
    `currentPluginHooks`, `store.actions`' construction (memoized per plugin set) and the refiner and
    invalidation caches. Define what replays when a creator (`calendarActions`) runs again.


### After 10, 7b and 11: loose ends (scheduled)

Adam's call (2026-10-21): right after phases 10, 7b and 11 (in that order), before merging.

- **React 17 smoke run** (deferred from phase 2; needs phase 11's `useSyncExternalStore` shim).
- **The remaining class components:** the eight view shells (`parseViewConfig`), `CalendarInner`,
  `CalendarMediaRoot`, `Scroller`.
- **Render-time side effects** left in React's render-time update, if phase 11 doesn't remove them:
  the emitter's option binding (stage 2 checkpoint) and the now timer re-arming.
- **Per-button options don't combine with the theme's** (found by phase 2, never scheduled): `buttons`
  merges each button's options shallowly (`mergeMaybePropsDepth1`), so a user's `iconContent`
  returning `true` renders no icon instead of the theme's, and a user's per-button `class`/`didMount`
  likely drop the theme's. Top-level content options combine (`.parts`); per-button ones should too.
  The contract spec works around it (`render-hooks/render-hook-contract.ts`).
- **Test harness:** `vanilla-w-react`'s `Calendar` creates its React root once, so `render()` after
  `destroy()` fails ("CalendarController is not taken back…"); the React-runtime "destroy … leaves no
  handlers attached / unbinds all handlers" failures; the flaky "addICalEventSource with day view";
  TimeGrid's "ResizeObserver loop" when leaving print. Fixing these shrinks the known-failure list.
- **The midnight date-profile change** (moved from phase 10, its review round 2; the roadmap's one
  intended behavior change for phase 10): a now-dependent `validRange` stays as of the old day until the
  next navigation. Design in `phase-10-date-profile.md` §4: at a new civil day, evaluate only
  `validRange`, compare by value, and if it changed dispatch an action that stage 4, the event sources
  and the event store treat as navigation. Changelog FIX entry.
- **A crash found by phase 10's oracle:** switching to a dayGrid view whose week-aligned range is all
  hidden days throws in `buildDayTableRenderRange` (`currentRange` is `null`), e.g. `dateAlignment:
  'week'` with `dayGridDay` and weekends hidden. Locked as-is by the oracle; fix it here (the oracle's
  `EXPECTED_CRASH` then goes).
- **Issues:** verify #8112, #8092 and #7070 with their reproductions (closing them on GitHub is Adam's).
- **Landing:** decide how the branch merges (per phase or whole).

### 12. Grid abstraction, hooks-first React API (tabled)

Tabled by Adam (2026-10-21): out of scope for this refactor, for the medium-term future. Its
requirements stay recorded here.


- **From phase 9 (moved here): stable API wrappers.** `EventApi`, `EventSourceApi` and `ResourceApi`
  objects with stable identity, reading the calendar's context lazily, for a hooks API whose users
  memoize on them. Requirements, from phase 9's spec review round 1:
  - **Live vs snapshot:** `eventChange`'s `oldEvent`, `resourceChange`'s old resource, drag previews and
    validation build historical or hypothetical wrappers. They must not come from the live cache.
  - **Content invalidation:** render hooks get a new `event` object when the event changes today, and
    `CustomContent` shallow-compares render props. A stable wrapper needs record versions in the memo
    keys, so a title-only change still regenerates content.
  - **Context versions:** a wrapper reading the current zone must not reinterpret markers stored under
    the old one.
  - **Keys:** internal `instanceId`/`defId` (and resource ids), with pruning, removal, revert and
    re-adding defined; recurring definitions vs occurrences; the raw vs renderable store while loading.
  - **Actions vs wrapper context** (phase 9): a wrapper's mutations resolve the calendar's *current*
    actions, while refining with the wrapper's own (historical) context. Keep that distinction.
