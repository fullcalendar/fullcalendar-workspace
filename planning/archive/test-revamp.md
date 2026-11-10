# Test Revamp

Revamp `standard/packages/vanilla-tests` and `premium/packages/vanilla-scheduler-tests`. The split stays, and the premium package keeps reusing the standard one.

**End goal:** CI runs every automated test. Today it runs none of them (`.github/workflows/ci.yaml` excludes `@fullcalendar-tests/*`) because they are slow and flaky.

## Decisions

### Runner

- Vitest browser mode with the Playwright provider, in headless Chromium. Each test file gets its own browser context, and files run in parallel.
- A second Vitest project runs `*.unit.ts` files in plain Node, with no DOM, for pure logic: datelib, duration parsing, option merging, recurrence expansion, seg placement.
  - `.unit.ts` files import library source directly, internals included. Browser tests import the built `dist/`.
  - The existing Node Vitest tests move into this structure as `.unit.ts` files:
    - `standard/packages/preact/tests/seg-placement/*` → standard `event-render/`
    - `premium/packages/preact-scheduler/tests/seg-placement/*` → premium `event-render/`

    The library packages then drop their own Vitest configs and `test` scripts. Connector tests (`vue3`) and `headless-calendar`'s tests stay where they are.
- No jsdom tier. Everything else runs in the real browser, so nobody has to pick a tier up front.
- **Tests import the built `dist/`**, like Karma does today and like the existing Vitest browser setup in `standard/packages/vue3`. Aliasing to source would mean re-creating the build's react→preact remaps, CSS-module class names, extracted CSS and version tokens. Locally, `pnpm dev` keeps `dist/` current.
- **Premium reuses standard's test helpers** through a Vite alias to `standard/packages/vanilla-tests/<root>/lib`. Today it imports them via `@fullcalendar-tests/standard/lib/*`, which points at tsc output.
- **Browser environment is pinned in config:**
  - Playwright context viewport 1280×1696, matching Karma's `--window-size`; some tests need the tall window.
  - Vitest `browser.viewport` set to the same size.
  - `timezoneId: 'America/New_York'`, matching CI's `TZ`.
  - The Node project sets `process.env.TZ` the same way.
- Later and optional: a small Playwright Test suite for page-loading behavior only. That means the IIFE bundle and locale files loaded with `<script>` tags, CSS and theme loading, and maybe connector packages inside real built apps.

### Waiting

- **No sleeps.** `waitTimeout` and `setTimeout` chains go away.
- **`waitForSettle(calendar)`.**
  - The library sends its short async sources through one tracker, which counts pending timers and frames plus recent activity. Tracked sources:
    - ResizeObserver deliveries (`component-util/resize-observer.ts`)
    - `afterSize` rAF batching
    - the `TimeGridLayoutNormal` rAF
    - the `MultiMonthView` `setTimeout(0)`
    - `util/debounce.ts`, used by `ResourceTimelineLayoutNormal` for virtualized rows after scrolling
    - `ElementMirror`'s `setTimeout(done, 0)` and revert transition. `eventDrop` and `dragStop` fire only after this, so it must be tracked.
    - the `AutoScroller` rAF loop
    - the `DelayedRunner` class itself, hooked at the class rather than at call sites. `rerenderDelay` lives in vanilla's `Calendar.renderRunner`, not in preact.
  - **Long timers are not tracked**, or `waitForSettle` would never resolve or would pay their full delay:
    - now-indicator timers (1 min to 24 h)
    - the 500ms `ScrollListener` scroll-end debounce, which also fires after the programmatic `scrollTime` scroll at init
    - the `FeaturefulElementDragging` long-press `startDelay`

    These are driven by test-settable config or options instead (see the next point). A test that needs one awaits it explicitly.
  - **Frame semantics.** ResizeObserver callbacks run after rAF callbacks within the same frame. So the check counts activity since the previous frame, including Preact commits and ResizeObserver callbacks, and resolves only after a full frame with none. Otherwise a commit → resize → commit chain could look idle for one frame.
  - `waitForSettle` resolves once that holds and nothing tracked is pending. It is exposed through the protected API.
- **Definite events use promises.** A test awaits a callback, or a fetch it controls through a deferred, instead of waiting a fixed time.
- **Intentional delays become configurable or faked:**
  - `rerenderDelay`
  - the scroll-end debounce
  - `dragRevertDuration`: test default 0
  - `eventLongPressDelay`/`longPressDelay`
  - the now-indicator timers
  - `touchMouseIgnoreWait`. It is module-level `config`; its global `ignoreMouseDepth` counter leaks across tests, so a mouse test run within 500ms of a touch test has its `mousedown` ignored. Reset it per test.

### Querying the DOM

- **`data-fc-part`.** Render-hook parts can carry a `data-fc-part="<partName>"` attribute. "Part" matches the web components term.
  - **It comes from a development-only plugin, not an option.** Developers (and AI agents) should style through the class-name options, never against these attributes, so the attributes must not be something you casually switch on. The plugin is for debugging themes and for tests.
  - The plugin has its own clearly labeled entry point, never included in the default bundles. It logs a console warning on init saying it's development-only and not for styling.
  - The tests' plugin includes it. Tests therefore run against the normal production build; no dev build is needed in CI.
- **Keyed helper.** Components call a helper like `partAttrs(options, 'dayCellInner', props)` at every part and spread the result by hand. It returns `className`, plus `data-fc-part` only when the dev plugin is registered.
  - Adding it inside `ContentContainer` first covers about a third of the parts for free.
  - A generic render-hook component that adds this automatically can come later.
- **View models.** Tests query through models that select on `data-fc-part`, not on theme classes. That removes the dependence on `theme-for-tests.ts`'s legacy `fc-*` class mapping.
- **A smaller test plugin replaces `theme-for-tests.ts`.** The old plugin also supplies `className: 'fc'`, which `global.css` uses to size the calendar (`max-width: 900px`), plus a default `headerToolbar`.
  - The new plugin bundles the dev parts plugin and keeps the default `headerToolbar`. It drops the `fc-*` class mapping.
  - The sizing rule targets the root part (`[data-fc-part="root"]`, or whatever the root part ends up being called) instead of `.fc`, so geometry doesn't change by accident.

### Input

- **Real browser input only, no synthetic events.** FullCalendar listens to `mousedown`/`touchstart` and document-level `mousemove`/`mouseup` (`PointerDragging.ts`), and checks drop targets with `elementFromPoint` (`HitDragging.ts`). Real input also catches covered targets, browser-generated `click` events and scroll interaction.
- **Element clicks and keys** use Vitest's built-in `userEvent`: `click`, `keyboard` and `tab`. Playwright scrolls the target into view and fails if something covers it, such as the license banner.
- **Point input** uses custom Vitest commands (`mouseDown`, `mouseMove`, `mouseUp`) that run in Node and call `page.mouse`.
  - The commands add the test iframe's offset to coordinates. They also assert that the iframe's scale is 1.
  - Vitest CSS-scales the tester iframe whenever the Playwright viewport is smaller than `browser.viewport`. In headless mode, the provider doesn't apply `browser.viewport` to the Playwright context itself. Hence both viewports are pinned (see Runner).
  - A `pointer` helper in the page wraps them: `down`, `move` (with intermediate steps) and `up`. These are separate calls so a test can stop mid-drag and check the state.
- **Touch** uses a command that sends Chrome DevTools Protocol touch events (`Input.dispatchTouchEvent`), because Playwright's touchscreen can only tap.
  - It applies the same iframe offset.
  - If Chromium needs `hasTouch: true` for this, that changes the whole context (`pointer: coarse`). Touch files then get their own Vitest browser instance.
- **View models turn dates into points.**
  - `pointForDate(date, { resourceId })` handles orientation, RTL and slot geometry.
  - On top of it: `dragEvent(el, { grab, drop })`, `resizeEvent`, `selectRange` and `clickDate`.
  - Every point helper scrolls its target into view, then checks with `elementFromPoint` that the point lands on the intended element: the event element for `grab`, the model's grid otherwise. Raw `page.mouse` input has no covered-target check of its own.
- **License banner.** Premium's global test options set a valid preset license key `AGPL-My-Frontend-And-Backend-Are-Open-Source` (v7's presets are the AGPL and CC keys; `GPL-My-Project-Is-Open-Source` is no longer one), so the banner never covers cells. `misc/license.ts` overrides it to test the banner itself.
- **Test files never contain Playwright code.**

### Organization

- **By feature, with one file per view inside each feature folder.** For example: `event-drag/daygrid.ts`, `event-drag/timegrid.ts`, and in premium `event-drag/resource-timeline.ts`.
- **View behavior differs too much for one shared test body.** Mirror rendering, orientation, grab-point semantics and all-day↔timed crossing all vary by view. Code is shared at the helper level instead: view models, `pointer`, and outcome assertions like `expectEventAt(event, start, end, resourceId?)`.
- **Behavior with no geometry** (callback order, `eventDrop` arguments, revert, constraint results) is tested once, on one representative view.
- **Premium reuses the standard folder names** for shared features, and adds resource-only folders.
- **Temporary quirk: the Vitest tests live in `tests/`, not `src/`,** in both test packages.
  - Karma's `scripts/generate-index.js` bundles every `.ts` under `src/` at depth 2 or more, so Vitest files there would break the Karma build while both runners exist.
  - Once Karma is removed (Phase 3), rename `tests/` → `src/`.
  - Vitest's browser `include` excludes `lib/`.
- The folder tree is below.

### Option combinations

- Each test varies only the setting it is testing. No nested `describeOptions` loops.
- Where combinations really matter (RTL × time zone × resources), use pairwise selection: every pair of values appears in at least one test, rather than every full combination.
- Use `it.each` tables.

### Regression tests

- Keep them mostly as they are. The preconditions are often very specific, so folding them into a general rule would lose what they test.
- Move each one into the same file as the general test it relates to, labeled with its issue number.
- Delete #5549, which the v7 note in `timeline-event-rendering.ts` already marks as dead.
- #4937 (`timeline-date-range.ts`) is an `xit` labeled "KNOWN BUG". It becomes a quarantined test with the linked issue, unless the bug turns out to be fixed.

### `legacy/`

- Port it one feature area at a time during the migration, then delete the folder.
- Some files are removed right away (Phase 0) instead of being ported:
  - empty `xit` placeholder tests in `event-source/getEventSources.ts` and `event-source/getEventSourceById.ts`. Their `legacy/` namesakes have real tests and stay.
- `legacy/footer-navigation.ts` is not a clone of `header-navigation.ts`. It is the only footer-toolbar navigation coverage, and becomes the footer variant in `toolbar/`.
- `legacy/events-gcal.ts` calls the live Google API with a hard-coded key. It gets rewritten against a mock.

### Flakiness and CI

- No automatic retries.
- A test that fails intermittently is quarantined with a linked issue, never skipped quietly.
- Split the suite across CI machines if total runtime needs it.
- CI wiring:
  - stop excluding `@fullcalendar-tests/*` from install and build in `ci.yaml`
  - `playwright install chromium --with-deps`
  - per-package `test` scripts that run both Karma and Vitest while both exist

### Deferred

- **Screenshot tests** (`toMatchScreenshot`): hold off.
- **`FORCE_REACT` CI run:** tackle at the end, once the main suite is fast. The suite is never run against the React build today.
- **A check that flags views with no test file for a supported feature:** not now.

## Phases

### Phase 0: on Karma

1. **Destroy calendars between tests.**
   - Since 43911bacc, the global `afterEach` (`standard/packages/vanilla-tests/src/lib/global-utils.ts:22`) only removes calendar elements; it never calls `calendar.destroy()`.
   - Leaked calendars keep running:
     - document listeners (`UnselectAuto`'s document `PointerDragging`)
     - now-indicator timers
     - ResizeObserver registrations
   - Their detached elements report 0×0 sizes into the next test's first frames.
   - Track every calendar `initCalendar` creates and destroy it in `afterEach`, before removing its element. `destroy()` is safe to call twice.
   - Measure suite runtime and failures before and after.
2. **Frame-count experiment.** After `initCalendar`, count DOM mutations and animation frames until it goes quiet, across dayGrid, timeGrid, multiMonth and resourceTimeline. This tells us how many layout passes `waitForSettle` has to wait through. It runs after step 1, so leaked calendars don't inflate the counts, and needs a current `dist/index.js` (`pnpm dev`).
3. **Timeline dateClick never tests RTL.**
   - `premium/packages/vanilla-scheduler-tests/src/timeline/timeline-dateClick.ts:15` uses `describeOptions('direction', { LTR: false, RTL: true })`.
   - `direction` is parsed with `String` (`standard/packages/preact/src/options.ts:202`), so `true` becomes `'true'`, not `'rtl'`. The "RTL" half just re-runs LTR.
   - Change the values to `'ltr'`/`'rtl'` and confirm the RTL specs pass, so this baseline exists before the revamp touches it.
4. **Mock the Google Calendar test, and delete the empty `xit` placeholders.**
5. **Record a baseline.** For each package: total runtime, failures, and flaky tests over several full runs.

**Review checkpoint:** stop and review before Phase 1.

#### Phase 0 results (2026-10-19)

Commits: `b8de40eaf` destroy calendars, `a8e286dfd` RTL dateClick, `606bbf0c4` gcal mock and empty specs removed.

**Setup in a fresh worktree:**

```sh
pnpm --filter '!./examples/**' --filter '!./theming/**' --filter '!@fullcalendar/angular' --filter '!@fullcalendar/angular-scheduler' install
pnpm --filter '@fullcalendar-tests/standard...' --filter '@fullcalendar-tests/premium...' run build   # ~26s
node scripts/bin/karma-test.js standard/packages/vanilla-tests
node scripts/bin/karma-test.js premium/packages/vanilla-scheduler-tests
```

Notes on the setup:
- Agent-only quirk: Claude's sandbox blocks writes to `.idea` dirs, and `iconv-lite@0.6.3` ships one, so the install has to run unsandboxed. A normal install is unaffected.
- The filtered install rewrites `pnpm-lock.yaml`. Revert the lockfile afterwards.

**Baseline before the changes** (3 full runs each, all green, no flakes):

| Package | Specs | Runtime |
|---|---|---|
| standard | 1544 pass, 8 skipped | ~2:00 |
| premium | 1195 pass, 2 skipped | ~2:10 |

The `global:locale` and `global:locales-all` suites (1 spec each) also pass.

**After the changes** (2 full runs each, all green):

| Package | Specs | Runtime |
|---|---|---|
| standard | 1544 pass, 2 skipped (the 6 empty `xit`s are gone) | ~1:51 (−7%) |
| premium | 1195 pass, 2 skipped | ~2:07 |

- The gcal specs went from network-bound to 0.2s.
- All 10 RTL timeline dateClick specs pass.

**Frame-count experiment.** A MutationObserver counted mutations on the calendar element per animation frame, for 90 frames after each action (init, `next()`, `setOption`, container resize).

- **dayGridMonth:** async mutations in exactly one frame (frame 2 after init, frame 1 after next/setOption), then quiet.
- **timeGridWeek:** frames 2 and 3 after init (128, then 2 mutations). After a resize, 2 frames.
- **multiMonthYear:** a single async frame, but frames take 60–105ms because the re-render is large (~2,000+ mutations).
- **listWeek, and all scheduler views measured** (resourceTimelineDay/Week, timelineDay, resourceTimeGridDay): no async mutations after the action.
- **Nothing ever mutated after frame 3.** The init `scrollTime` scroll and its 500ms scroll-end debounce produced no DOM changes.

Implications for `waitForSettle`:
- Two consecutive quiet frames after the last activity is enough for every measured case.
- The 100ms `waitTimeout` is usually several frames too long. For multiMonth it is borderline, because a single frame can exceed 100ms, which explains the 0–200ms variance.

**ResizeObserver loop warning:** resizing a resourceTimeGridDay container to 600px raises "ResizeObserver loop completed with undelivered notifications".
- This is expected. These warnings cause no visible problems, and fixing them would mean a deep refactor of how size reporting is coordinated.
- Tests sidestep them with `ignoreResizeObserverLoops(f)` (`lib/misc.ts`), which 15 spec files already use. Wrapping more code in it where needed is fine.
- The Vitest harness needs an equivalent helper.


### Phase 1: infrastructure and pilot

- **`data-fc-part` first, as its own library-only commit.** It contains the `partAttrs` helper, the call sites, and the dev parts plugin and its entry point. No test changes.
- Set up Vitest browser mode alongside Karma in `tests/`, plus the Node unit project, with the pinned environment from Runner. Move the existing seg-placement Vitest tests in as `.unit.ts`.
- Port the shared `lib/`:
  - the custom matchers in `lib/date-matchers.ts`, via `expect.extend`
  - Jasmine's `spyOn`/`jasmine.*` → `vi`
  - `(done)` callbacks → async
  - drop jQuery (`$.extend` in `global-utils.ts`, `dom-geom.ts`, the wrappers)
  - choose a harness for third-party external drag: today `legacy/external-dnd.ts` uses jQuery UI `.draggable()`/`.sortable()`. Either import jQuery UI there, or write a tiny stand-in draggable.
- Build `waitForSettle`, `data-fc-part`/`partAttrs`, the input commands and `pointer`, and the first view models (dayGrid, timeGrid).
- Pilot: port `event-drag` for dayGrid and timeGrid.
- Check:
  - iframe coordinates are correct and not scaled
  - the cost of each input command's round trip to Node
  - the speed and stability of the result

#### Phase 1 progress notes

- **`data-fc-part` (commit `05949f690`).**
  - Delivered via a `devParts` option that only the `dev-parts` plugin registers. Without the plugin, the option is filtered out as unknown.
  - The plugin warns once per page. The Vitest config hides that line.
  - Not marked: `eventTime`/`eventTitle` and `backgroundEventTitle`. Their classes reach the default content renderer only through public render props (`timeClass`/`titleClass`), so marking them would mean adding to the public render props.
  - The license banner borrows `popoverClass` but is deliberately not marked `popover`.
  - Conditional parts follow the element's role, not whether the class was applied. Ex: the `table` part stays in print mode, where `tableClass` isn't applied.
- **Vitest setup (commit `f42dedb2d`).**
  - The 9 seg-placement test files moved in as `.unit.ts`.
  - `fullcalendar/protected-styles` exposes `internalEventMirror`, which models use to tell mirrors apart.
- **Real input cost.**
  - Each `page.mouse` command costs ~17ms, one frame: Playwright waits for the browser to process the input. Caching the iframe offset didn't change it.
  - An idle `waitForSettle()` costs ~33ms (two frames).
  - A full drag test is ~250ms.
  - The standard Vitest suite (98 tests at the time) ran 10 of 10 green, ~5s each.
- **Possible library quirk, for the user to judge.** In a timeGrid all-day row, the bottom ~12px of a day cell doesn't resolve to an all-day hit when dragging a timed event up:
  - 1–5px above the bottom drops into the timed slot below.
  - 8–10px above the bottom drops nothing.

  Models use the cell's vertical center instead.
- **Model lessons.**
  - Computing the drop point can scroll, so models compute it after pressing on the grab point.
  - Event drags use `HitDragging`'s `useSubjectCenter`: the press is treated as if it were at the center of the grabbed slot or cell. So an event moves by the pointer's travel rounded to the nearest slot. With slot-aligned grab and drop times, that's exactly their difference.
- **Karma flake observed (Phase 2).** One full standard Karma run had 15 selection specs (`selectAllow` etc.) fail with "Timed out waiting for drag outcome". That run took 1:57 instead of ~1:22, presumably because the machine was under load. An immediate rerun passed. These are the legacy synthetic-drag specs, which the selection migration will replace.
- **Pilot reviews.** Fable (medium effort) and GPT-Sol-6.1 (high effort) reviewed the pilot. Applied:
  - validRange tests now exercise the event-range rule, and include an exact-boundary drop
  - grab-rounding, multi-week-segment, snapDuration and RTL drags
  - a different-day all-day -> timed conversion grabbed by a later day, with revert
  - "moved away and back" and "released outside the calendar"
  - redundant drags trimmed
  - mouse released in `finally` and in teardown
  - slot math hardened
  - drag auto-scrolling untracked by `whenSettled`

### Phase 2: migration

- Migrate one feature folder at a time, deleting the Karma versions as each lands. Karma and Vitest run side by side until the end.
- Fill that folder's coverage gaps (below) as part of the same migration.
- Turn on CI for each migrated folder as it lands.

#### Phase 2 progress notes (2026-10-20)

- Every legacy Karma spec in both packages is ported and deleted. Only the global-locale IIFE entry points (`src/global-locale*.js`) and the legacy `src/lib/` helpers remain, for Phase 3.
- Area commits:
  - standard: event-drag, constraints (`9920bec6e`), resize/dateClick/select, datelib (`e5acde4e8`), view-render (`eb57e948c`), event data/sources (`620278ed8`), event rendering (`ad10d7409`), calendar/navigation/toolbar/sizing (`37de9df2d`)
  - premium: resource/column (`9ed38b371`), timeline (`8ca7dd7f9`)
- Vitest totals on 2026-10-20: standard 1336 tests (~25s), premium 666 tests (~14s).
- Known library bugs are `it.fails` tests, so they turn red once fixed. Details and repros are in `planning/review-at-end.md`.
- Sol reviews: pilot, drag, resize/click/select, constraints/datelib/view-render (fixes in `411670902`). Reviews of event data, event rendering, calendar, scheduler resource and timeline are running.
- Remaining gaps (unchecked below) are being filled by three agents.
- The `*WillUnmount` gap is covered for day cells, events and popovers, not every part.

### Phase 3: wrap-up

- Remove Karma, then rename each test package's `tests/` → `src/`.
- Run with `FORCE_REACT` in CI. Karma does this with a rollup import remap. Under Vitest it becomes `resolve.alias` entries (`fullcalendar` → `fullcalendar-w-react`, `fullcalendar-scheduler` → `fullcalendar-scheduler-w-react`).
- Optionally, add the Playwright Test page-loading suite.

#### Phase 3 progress notes (2026-10-20)

- Gap tests landed (`0704eaabe`); every gap TODO is checked.
- Karma is removed (`e6034d7ff`): test packages' legacy `src/`, build and Karma configs, `standard-scripts pkg:test`, the Karma/jQuery/Jasmine deps and the jasmine-jquery patch. AGENTS.md and READMEs now describe Vitest.
- The global-locale IIFE checks are Vitest tests that load the global builds with script tags (`src/global-builds/`), plus a scheduler global-build smoke test. That covers "the IIFE runs", so the optional Playwright Test suite isn't needed for now.
- `FORCE_REACT=1` aliases to the `-w-react` builds; CI runs both suites in both modes. That surfaced a missing root part in `vanilla-w-react` (`7e4fefb88`) and a SyntheticEvent `jsEvent` under React (logged).
- `tests/` → `src/` (`df0ea168e`).
- The test packages type-check (`2a6a48a3a`), with a CI "Typecheck tests" step.
- Sol round 2 (event data, calendar, event rendering, scheduler resources, timeline): 32 findings, all applied (`6fcaed30f`, `b1d4e7d3b`, `71ba1c4f5`).
- Final totals: standard 1469 tests, premium 688; green twice in each of Preact and React mode (~40s and ~50s for both packages), and from a cold Vite cache.
- Phase 3 is done. Remaining for Adam: `planning/review-at-end.md`.

## Coverage Gap TODOs

Fill each of these while migrating its folder. Check off as done.

- [x] Keyboard navigation and ARIA: no tests today (`accessibility/`)
- [x] `setOption` after init, for most options (`options/`)
- [x] `eventAdd` / `eventRemove` callbacks (`event-api/`)
- [x] `calendar.off` (`calendar-lifecycle/`)
- [x] `*WillUnmount` hooks (alongside each part's render tests)
- [x] Container resize and responsive behavior (`sizing/`)
- [x] Sticky headers and footers (`sizing/`)
- [x] multiMonth interactions: drag, resize, select, dateClick (in each interaction folder)
- [x] `listDay` / `listYear` views (`event-render/list.ts`, `visible-range/`)
- [x] Non-classic themes, at least a smoke render of each
- [x] Scheduler: resource callbacks (`resourceAdd`/`Change`/`Remove`, `resourcesSet`) (`resource-data/`)
- [x] Scheduler: `ResourceApi.setProp` (`resource-data/`)
- [x] Scheduler: resource-level `eventConstraint` / `eventOverlap` / `eventAllow` (`constraints/`)
- [x] Scheduler: RTL drag, resize and select in resource views (`event-drag/`, `event-resize/`, `date-select/`)
- [x] Drag auto-scroll (`dragScroll`) with real input. `waitForSettle` doesn't track auto-scrolling, so the test waits on a specific scroll or hit condition (`event-drag/`)
- [x] Touch drags, once a CDP touch command exists (`event-drag/touch.ts`; the legacy specs ran mouse and touch variants)
- [x] Timed -> all-day drag grabbed by a later-day segment of an overnight event (`event-drag/timegrid.ts`)

## Folder Tree

Folders are named after what the user sees or does. View-specific behavior goes in per-view files inside each folder; behavior that doesn't depend on the view goes in topic files. The hierarchy is flat, and the same layout applies to standard and premium. Premium uses the same folder names wherever the feature is shared.

**Node-only tests** sit in the same feature folders with a `.unit.ts` suffix. The browser project picks up `*.ts` minus `*.unit.ts`; the Node project picks up `*.unit.ts`.

**DST** cases don't get their own folder. They go in `describe('across DST')` blocks inside the matching feature's per-view file; for example, `timeline-dst-event-dnd.ts` becomes a block in `event-drag/timeline.ts`.

```
datelib/               the internal date library: math, formatting, durations, named-tz plugin math (all .unit.ts)
options/               option parsing and merging (.unit.ts); setOption after init, views-specific options,
                       custom view definitions
calendar-lifecycle/    constructor, render, destroy, on/off, rerender counts (was performance/)
sizing/                height, contentHeight, aspectRatio, updateSize, container resize, sticky
toolbar/               header/footer rendering, buttons, customButtons, title, titleFormat, buttonText
navigation/            next/prev/today/gotoDate, changeView, navLinks, datesSet
visible-range/         which dates a view shows: duration, dayCount, dateAlignment, dateIncrement,
                       validRange, visibleRange, hiddenDays, weekends, firstDay, fixedWeekCount,
                       showNonCurrentDates
day-headers/           column header formats, content hooks, a11y text
day-cells/             day numbers, day cell hooks, other-month cells
time-slots/            slotDuration, slotMinTime/slotMaxTime, slot labels, allDaySlot, scrollTime/scrollToTime,
                       timeline slot grouping and eventMinWidth
week-numbers/
now-indicator/
business-hours/
event-render/          per view (daygrid, timegrid, list, multimonth, timeline) plus topics: content hooks,
                       eventOrder, time text, coloring, background events, print
more-link/             dayMaxEvents, more-link text, popover
event-click-hover/     eventClick, eventMouseEnter/Leave
event-drag/            per view, plus callbacks, external (Draggable), between-calendars, touch
event-resize/          per view, plus resizableFromStart and mirror hooks
date-click/            per view
date-select/           per view, plus select/unselect methods, unselectAuto, selectMirror
constraints/           eventConstraint/Overlap/Allow, selectConstraint/Overlap/Allow, across drag/resize/select
event-api/             EventApi methods, Calendar.addEvent/getEvents, event parsing, duration defaults,
                       eventAdd/Change/Remove, recurrence (expansion as .unit.ts)
event-sources/         array, function, JSON feed, Google Calendar (mocked), iCalendar,
                       add/remove/refetch sources, lazyFetching, eventDataTransform, loading
time-zones/            the timeZone option, switching it, named-tz plugin rendering
localization/          locale, direction
accessibility/         keyboard navigation, ARIA roles and semantics

premium only:
resource-data/         fetching (function/JSON), refetchResourcesOnNavigate, CRUD, ResourceApi,
                       getResources, event↔resource association, resourceOrder, filterResourcesWithEvents
resource-render/       resource area, cell content hooks, grouping, columns, expanding, resourceAreaWidth,
                       column resizing
license/

lib/
  models/              one model per view (DayGrid, TimeGrid, List, MultiMonth, Timeline, ResourceTimeGrid…)
  pointer.ts           input helper wrapping the Vitest commands
  settle.ts            waitForSettle
```
