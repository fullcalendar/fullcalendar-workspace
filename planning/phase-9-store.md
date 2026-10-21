# Phase 9: store slices, actions, API facade

Status: plan, revision 3 (after spec review round 2), 2026-10-20. Nothing implemented yet.

**Re-scoped after review round 1** (below): phase 9 is a behavior-identical restructuring of the data
layer. Render-time purity with `useSyncExternalStore` moves to phase 11, and stable API wrapper
identity to phase 12, each carrying round 1's findings as requirements (`refactor-roadmap.md`).

## What's there today

All in `standard/packages/preact/src/reducers/CalendarDataManager.ts` (883 lines), one class per
calendar.

- **One reducer for everything.** `reduce(prevState, prevData, action)` recomputes, in order: dynamic
  option overrides, options data (refined options, plugin hooks, `DateEnv`, view specs, toolbar
  config), view type, view data (view spec, view options, `DateProfileGenerator`, `ViewImpl`), the
  calendar-level now, current date, date profile, event sources, event store, renderable event store,
  UI bases, business hours, selection, drag, resize, then each plugin reducer (premium resources:
  `resourceSource` before `resourceStore`, then `resourceEntityExpansions`). Then title, toolbar props,
  and `CalendarData`: the state, everything derived, and stable functions.
- **Side effects inside the reduction:**
  - **Fetching:** `fetchSource` calls `sourceDef.fetch()` (events: `reducers/eventSources.ts:158`;
    resources: `resource/reducers/resourceSource.ts`). Results come back by `dispatch`, queued and
    reduced later in the same drain when the callback is synchronous (array sources, synchronous
    function sources). Their success callbacks run `eventSourceSuccess`/`success`, and the receiving
    reduction runs `eventDataTransform`.
  - **Option change handlers** (`events`, `eventSources`, premium `resources`) run at the end of the
    reduction and dispatch or call `addEventSource`.
  - **The time zone hack:** refetch sources, rezone both event stores.
  - **Wiring:** `calendarApi.currentDataManager = this`, `emitter.setThisContext`/`setOptions`.
  - **`loading`** goes through phase 8's effect queue.
  - **Not effects, but impure:** parsing allocates ids (defs, instances, sources, resources), reads the
    clock (`CalendarNowManager`), runs refiners and user functions (`validRange`, `visibleRange`,
    transforms), and rrule mutates its own cache.
- **Stateful memoization:** the incremental option refiners (`currentCalendarOptionsInput`/`Refined`,
  the view equivalents, `optionsForRefining`/`optionsForHandling` for `resetOptions(…, names)`), plus a
  dozen single-entry `memoize`s on the instance.
- **The drain** (`drainActionQueue`): reduce each queued action, run queued effects (which may dispatch
  more), repeat until both queues are empty, then deliver one `onDataChange(data, completedActions,
  isInCommit)`. Mount gating (phase 8) holds effects and delivery while a React calendar isn't
  mounted.
- **Drivers:**
  - React/Preact `Calendar.tsx`: `update(props, isRendering = true)` during every render (effects and
    delivery wait for the commit), `onDataChange` bumps a revision state, with `flushSync` for drag,
    resize and `MERGE_EVENTS`.
  - Vanilla `Calendar` (and `vanilla-w-react`): extends `CalendarApiImpl`, creates the manager in the
    constructor, renders through a `DelayedRunner` (`rerenderDelay`, `batchRendering`,
    `pauseRendering`), immediately for drag/resize/`MERGE_EVENTS` (`vanilla/src/Calendar.tsx:55`).
  - Vue 3, Angular, the web component and LWC wrap the vanilla `Calendar` and call `resetOptions`
    (Vue and Angular with changed names; Vue passes the same raw object after nested mutation,
    `vue3/src/FullCalendar.ts:88`).
- **The API:** `CalendarApiImpl` dispatches and reads `getCurrentData()`, through
  `currentDataManager`. Premium patches its prototype (`addResource`, `getResources`, …) and
  `EventImpl`'s. `CalendarController` binds to a `CalendarApi`.

## Goals

1. **Raw state in typed slices, with explicit dependencies,** instead of one reducer that knows
   everything. Plugins register slices through the same contract (premium resources converted in the
   same step).
2. **Reducers describe effects instead of performing them.** A slice reducer returns its next state
   and a list of effect descriptions. It performs no I/O, emits nothing, dispatches nothing, and doesn't
   touch the store or other slices. The store runs the effects **at the same points the current code
   performs them**, inside the same drain, so nothing observable moves: synchronous sources still
   resolve in the same drain (server rendering, same-render results, the initial `eventsSet`, render
   counts), and React's render-time drains stay as phase 8 left them.
   - "Pure" is deliberately narrower than "replayable": reducers still parse (allocating ids), read the
     clock through `CalendarNowManager`, and run refiners and user transforms, as today. Making the
     reduction replayable during render is phase 11's job.
3. **One store per calendar** with `getState`, `getData`, `dispatch` and `subscribe`, replacing
   `CalendarDataManager`'s `onDataChange` and `currentDataManager`.
4. **One `actions` object** per calendar. `CalendarApiImpl`, `CalendarController` and the premium
   prototype patches delegate to it.
5. **`resetOptions` is an action** with explicit semantics (merge or replace, changed names, a fresh
   invalidation generation).
6. Nothing observable changes: public options and APIs, the DOM, render-hook counts (never up), callback
   order and arguments, server rendering, the vanilla/Vue/Angular drivers.

Out of scope: render-time purity, previews and `useSyncExternalStore` (phase 11); stable wrapper
identity and lazy context (phase 12); the date profile (phase 10); the day-table pipeline (7b).

## Design

### 1. Slices

| Slice | Reads (dependencies) | Reduced by |
|---|---|---|
| `options` (`optionOverrides`, `dynamicOptionOverrides`, invalidation generation) | — | `RESET_OPTIONS`, `SET_OPTION` |
| `viewType` | `options` (initial view) | `CHANGE_VIEW_TYPE` |
| `now` | view-refined options (`now`), `DateEnv` | `UPDATE_NOW` (timer) |
| `currentDate`, `dateProfile` | `options`, view data, `now` | navigation actions, generator changes |
| `eventSources` | `options`, `dateProfile`, context | source actions, navigation (dirty fetches), `RECEIVE_*` |
| `eventStore`, `renderableEventStore` | `eventSources`, `dateProfile`, context; the renderable one also view-refined `progressiveEventRendering` and its own previous value | event actions, `RECEIVE_EVENTS`, navigation (recurring expansion) |
| `selection` (`dateSelection`, `eventSelection`, `eventDrag`, `eventResize`) | — | selection/drag/resize actions |
| plugin slices (`resourceSource`, then `resourceStore`, `resourceEntityExpansions`) | core state, context | resource actions |

- The order of today's `reduce()` becomes the declared dependency order. A slice gets the *new*
  values of what it depends on, as today (the event store gets the reduced sources).
- `eventUiBases`, `selectionConfig` and `businessHours` move from state to derived data (they're pure
  functions of options and the stores), memoized exactly as today, so identities don't change.

### 2. The staged pipeline (revision 3)

Behavior identity needs more than "effects in the same drain": today's `reduce()` performs side effects
at specific points *inside* the reduction, and the data the API reads stays the previous data until the
reduction returns (`CalendarDataManager.ts:263`). So the store runs one action through a fixed
pipeline of **stages**, each a slice reducer, with **checkpoints** between stages where the effects
that today's code performs at that point run. The order is today's `reduce()`, written down:

| # | Stage | Checkpoint after it (today's line) |
|---|---|---|
| 1 | dynamic option overrides, options data (refiner cache) | — |
| 2 | view type, view data | `nowManager.handleInput(view now)` (`:633`, may fire reset listeners, which may dispatch `UPDATE_NOW` and re-arm timers); `emitter.setThisContext`/`setOptions(view options)` (`:334`) |
| 3 | calendar now (`nowTimer.update`) | the runner's own re-arming when inputs changed (`NowTimerRunner.update`) |
| 4 | current date, date profile (rebuilt on a generator change, then the action, then clamping) | — |
| 5 | event sources | **fetch effects** for the sources this stage marked fetching, in source order (`eventSources.ts:158`); synchronous callbacks queue `RECEIVE_*` here, as today |
| 6 | event store, renderable event store | — |
| 7 | UI bases, business hours, selection, drag, resize | — |
| 8 | plugin slices, each given one `{ ...context, ...newState }` snapshot taken before the first (`:428`); premium: resource source (**its fetch effects** at a checkpoint right after it), resource store, expansions | — |
| 9 | loading transition, captured for this action (was vs is, `:434`) | queue the deferred `loading` effect |
| 10 | title, toolbar props, `CalendarData` | — |
| 11 | late stage: time zone change (refetch marking with **fetch effects**, rezoning both stores) and option change handlers (`:472`), in today's order, with today's mix of the passed new data and `getCurrentData()` reads of the previous data | the handlers run here, as effects at this checkpoint |

Then the reduction returns, and the store installs the new state and data (only now do API reads see
it). Stage reducers return `{ state, effects }` and do none of the reducer-owned side effects
themselves (fetching, emitting, dispatching, timer arming); the checkpoints run them. **User callbacks
are the exception:** refiners, transforms, `validRange` functions and the like run inside stages as
today, and can call the API.

Each stage keeps today's **action guards**: a stage only fetches, expands recurring events, or rebuilds
for the actions it does today, even when an input changed (§1's dependencies don't trigger work by
themselves).

### 3. The store

`createCalendarStore(config)` (`reducers/store.ts`, replacing `CalendarDataManager`):

- **`dispatch(action)`:** queue; if not draining, drain. **The drain is today's loop, priorities
  included:** while actions are queued, run the next through the pipeline; only when the action queue
  is empty, run all queued deferred effects as one batch (`:259`), which may queue more actions; repeat;
  then publish once. So static sources can queue both of their loading transitions before either
  callback runs, as today.
- **`getState()`** (raw slices) and **`getData()`** (`CalendarData`, the shape `CalendarInner` and the
  views get), both the last installed values.
- **`subscribe(listener)`**, called once per drain, after it settles, with
  `{ completedActions, isUrgent, isInCommit }`. `isUrgent` is today's drag/resize/`MERGE_EVENTS` rule.
  Today's suppressions stay: nothing on initialization, `IDLE`-only drains and render-time drains, and
  mount-held actions are delivered on `mount()`. Drivers subscribe before they `mount()`.
- **`update(optionOverrides, isRendering)`** stays for React's render, as phase 8 left it, and must keep
  refined identities (no refinement of unchanged options).
- **`mount()`/`unmount()`**, mount gating, `flushEffects()` and `syncController` placement
  (`CalendarInner` before callbacks, Preact's parent layout effect), unchanged.

### 4. Options

- The incremental refiner becomes an explicit `OptionsRefinerCache` object owned by the store, with
  today's comparisons (`COMPLEX_OPTION_COMPARATORS`, `isMergedPropsEqual`), so refined identities
  don't change.
- **`resetOptions(options, changedNames?)`** updates the overrides and the invalidation (the names to
  refine and handle again) **when it's called**, as today (`:220`), then dispatches `RESET_OPTIONS`. So
  a reset made inside a drain (a synchronous source's callback calling `resetOptions`) affects the
  actions already queued, as today. Named options are refined again and their handlers run even when the
  raw object is the same one (Vue's nested mutation). The invalidation is a generation the options stage
  consumes, replacing `optionsForRefining`/`optionsForHandling`.

### 5. Actions and the facade

- **`actions`**, built once per store: navigation (`prev`, `next`, `prevYear`, `nextYear`, `today`,
  `gotoDate`, `incrementDate`, `changeView`, `zoomTo`), options (`setOption`, `resetOptions`),
  selection, events and event sources (today's `CalendarApiImpl` bodies), `scrollToTime`. Event and
  source wrappers' mutations (`EventImpl.mutate`, `remove`, `EventSourceImpl.refetch`, …) call it.
  Plugins register theirs (premium: `addResource`, `refetchResources`, resource mutations).
- **`CalendarApiImpl`** keeps its public surface and delegates. It holds the store from construction
  (no `currentDataManager`). Wrapper construction stays where it is (new wrappers per call, snapshot
  context, as today; see phase 12).
- **`CalendarController`** unchanged in behavior: still bound through `syncController` from committed
  data, before `datesSet`.
- **`dispatch`** stays for interactions and plugins (`protected-api`); `getCurrentData()` stays as
  `store.getData()`.

### 6. Drivers

- **React/Preact `Calendar.tsx`:** creates the store, `update(props, true)` during render, subscribes
  to bump its revision (with `flushSync` when `isUrgent` and not in a commit), `mount`/`unmount` and
  `flushEffects`/`syncController` in layout effects. Same as today, through the store.
- **Vanilla `Calendar`:** creates the store in its constructor (usable before `render()`), subscribes
  its `DelayedRunner`. `resetOptions` dispatches the action.
- **Vue 3, Angular, web component, LWC:** unchanged (they call the vanilla API).

### 7. Things to check

- **The extra data-layer re-render** from phase 7: a plain React re-render with unchanged props
  re-rendered the standard views once. Find its cause during step 2 (likely a new derived object on an
  `IDLE` reduction). Fix it if it's a plain memoization miss; otherwise note it for phase 11.
- **icalendar** caches its fetch promise on mutable `meta.internalState`; the source object must
  survive reductions (it does today; keep it).
- **`loading(true/false)` transitions** for static sources (which flip within one drain) stay as they
  are today.

## Steps

Each ships on its own, verified like phase 7 (both runtimes' suites, DOM snapshots and counts, the React
suite), with a Sol review per step.

1. **Slices and effect descriptions, on the existing manager.** Split `reduce()` into slice reducers
   in dependency order; fetching, option change handlers and the time zone refetch become effects the
   manager runs at today's points; wiring leaves the reducer; the options refiner becomes an explicit
   cache. **Premium resources in the same step**, through the same contract. Behavior-identical.
2. **The store.** `createCalendarStore` replaces `CalendarDataManager` (`getState`, `getData`,
   `subscribe` with metadata, the drain, mount gating); the drivers subscribe; `CalendarApiImpl` holds
   it; `resetOptions` becomes the action. Hunt the extra re-render.
3. **Actions and facades.** The `actions` object; `CalendarApiImpl`, the wrappers' mutations,
   `CalendarController` and the premium patches delegate; plugins register actions.
4. **Derived data.** `eventUiBases`, `selectionConfig`, `businessHours`, title and toolbar props as
   memoized derivations of the slices (`CalendarData` unchanged). `loading` stays a per-action
   transition captured in the pipeline (stage 9), not a comparison of settled snapshots.

## Tests

- **Effect contract (new, unit):** stage reducers perform no reducer-owned side effects (no `fetch`, no
  emitting, no dispatching, no timer arming of their own), with user callbacks excluded (a test
  callback that calls the API is allowed); each dirty source yields exactly one fetch effect at its
  checkpoint; synchronous sources resolve within the same `dispatch`.
- **Behavior locks (new, before step 1):** `renderToString` with array `events`, array `resources` and a
  synchronous function source (events present); the initial `eventsSet` argument for a synchronous
  source; `loading` transitions for static and async sources; Vue-style repeated
  `resetOptions(sameObject, ['events'])` after a nested mutation; `rerenderDelay` and `batchRendering`;
  a reentrant `resetOptions` from a synchronous source's callback (round 2 #3); a synchronous source's
  callback reading `calendar.getDate()` during navigation (sees the previous date); a `timeZone` change
  with a settled async source (`loading` transitions); `now`/time zone changes re-arming the timer.
- The existing suites in both runtimes, DOM snapshots and counts, and the React suite, after each step.

## Review round 1 (Sol, spec, high effort)

The first revision planned a pure render-time preview for React (`preview`/`commitPreview` with
`useSyncExternalStore`), fetching after commit, and stable lazy-context wrappers. Sol found 10 P1s and 2
P2s; the response was to re-scope (Adam's call), keeping phase 9 behavior-identical.

| # | Finding | Response |
|---|---|---|
| 1 | Static sources aren't pure: `eventSourceSuccess`/`success`/`eventDataTransform` run on them | fetches stay in the same drain; render-time purity moves to phase 11 |
| 2 | Ids, the clock, user range functions and rrule's cache are impure | "pure" narrowed to no I/O, emitting or dispatching (goal 2); replayability is phase 11 |
| 3 | Single-entry memoizers don't isolate speculative previews | no previews in phase 9; phase 11 requirement (retained transactions) |
| 4 | A parent layout-effect commit is too late for child callbacks (`datesSet`) | no commit-time publication change in phase 9; phase 11 requirement |
| 5 | Render-time readers (`ViewImpl`, premium `transformIsDraggable`) would read committed data during a preview | phase 11 requirement (snapshot-bound render context) |
| 6 | Native `useSyncExternalStore` needs `getServerSnapshot` | phase 11 requirement |
| 7 | Deferring synchronous function sources regresses clients too (empty first commit, `eventsSet`, counts) | fetches stay in the drain; locked by a new test |
| 8 | Notification order and the urgency metadata were underspecified | §3: one publication per settled drain, with `isUrgent` |
| 9 | Cached live wrappers can't replace historical/hypothetical ones (`oldEvent`, drag previews, validation) | wrappers unchanged in phase 9; phase 12 requirement |
| 10 | Stable wrapper identity removes content invalidation (`CustomContent` shallow-compares) | phase 12 requirement (record versions in memo keys) |
| 11 | `changedNames` needs invalidation generations (Vue's same-object mutation) | §4 |
| 12 | Premium resources can't wait until step 5 | step 1 converts them through the same contract |

Open questions round 1 answered: keep driver-specific `syncController` placement (publication ordering
unchanged); plugin slices as ordered reducers returning effects, with typed action creators later and
raw `dispatch` internally; `CalendarDataManager` replaced in step 2 (verify actual importers first:
rrule, google-calendar and vue3 don't import it).

## Review round 2 (Sol, spec, high effort)

3 P1s and 2 P2s on revision 2, all about ordering; revision 3 answers them:

| # | Finding | Response |
|---|---|---|
| 1 | "After this reduction" doesn't keep today's checkpoints: fetching is mid-reduction, API-readable data advances only when the reduction returns, wiring is early | §2: the staged pipeline with checkpoints at today's points; data installed after the reduction |
| 2 | Loading capture and the time-zone hack need intermediate-state semantics; deferred effects run in batches only when the action queue is empty | §2 stages 9 and 11; §3's drain keeps action-first priority and batched effects; step 4 keeps loading per action |
| 3 | `resetOptions` updates overrides at call time; FIFO would change reentrant resets | §4: call-time update kept; behavior lock added |
| 4 | Timer effects (`nowManager.handleInput`, `nowTimer.update`) and user callbacks that call the API | §2 checkpoints 2 and 3; the contract test scoped to reducer-owned effects |
| 5 | Missing dependencies (`now` from view options, `renderableEventStore`'s inputs) and action guards | §1 table; §2 keeps action guards |

## Behavior changes (anticipated)

None intended. Any found during implementation get listed here and in the changelog.
