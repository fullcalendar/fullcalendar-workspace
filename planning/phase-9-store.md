# Phase 9: store slices, actions, API facade

Status: plan, revision 2, for spec review round 2 (2026-10-20). Nothing implemented yet.

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
| `now` | `options` (`now`), `DateEnv` | `UPDATE_NOW` (timer) |
| `currentDate`, `dateProfile` | `options`, view data, `now` | navigation actions, generator changes |
| `eventSources` | `options`, `dateProfile`, context | source actions, navigation (dirty fetches), `RECEIVE_*` |
| `eventStore`, `renderableEventStore` | `eventSources`, `dateProfile`, context | event actions, `RECEIVE_EVENTS`, navigation (recurring expansion) |
| `selection` (`dateSelection`, `eventSelection`, `eventDrag`, `eventResize`) | — | selection/drag/resize actions |
| plugin slices (`resourceSource`, then `resourceStore`, `resourceEntityExpansions`) | core state, context | resource actions |

- The order of today's `reduce()` becomes the declared dependency order. A slice gets the *new*
  values of what it depends on, as today (the event store gets the reduced sources).
- `eventUiBases`, `selectionConfig` and `businessHours` move from state to derived data (they're pure
  functions of options and the stores), memoized exactly as today, so identities don't change.

### 2. Slice reducers and effects

```ts
interface SliceReducer<S> {
  name: string
  deps: string[]                 // slices whose new values it reads
  reduce(prev: S | undefined, action: Action, input: SliceInput): S | { state: S, effects: Effect[] }
}
```

Effect descriptions, and where the store runs them:

| Effect | Today | Phase 9 |
|---|---|---|
| `fetchEventSource(sourceId, range, isRefetch)` | `sourceDef.fetch()` inside `reduceEventSources` | the reducer marks the source fetching (with its `latestFetchId`) and returns the effect; the store runs it **right after this reduction, before the next queued action**, so a synchronous callback's `RECEIVE_EVENTS` lands in the queue exactly where it does today |
| `fetchResourceSource(…)` | inside `reduceResourceSource` | same |
| option change follow-ups | handlers at the end of `reduce()` | the handlers become effects run right after the reduction, at the same point (they dispatch or call `addEventSource`, as today) |
| time zone change | the hack at the end of `reduce()` | rezoning is reduction; the refetches are fetch effects |
| `loading` | phase 8's effect queue | unchanged (an effect, held while gated) |

Wiring (`emitter.setThisContext`/`setOptions`) moves out of the reducer into the drain, right after
each reduction (same timing). `currentDataManager` goes away (the facade holds the store, §4).

A test asserts the contract: while a reducer runs, `fetch`, the emitter and `dispatch` are never called.

### 3. The store

`createCalendarStore(config)` (`reducers/store.ts`, replacing `CalendarDataManager`):

- **`dispatch(action)`:** queue; if not draining, drain. The drain is today's loop: reduce an action
  (slices in dependency order), run that reduction's immediate effects (fetches, option follow-ups,
  wiring), queue its deferred effects (`loading`), repeat until both queues are empty, then publish.
- **`getState()`** (raw slices) and **`getData()`** (`CalendarData`, derived and memoized, the same
  shape `CalendarInner` and the views get today).
- **`subscribe(listener)`**, called **once per drain, after it settles**, with
  `{ completedActions, isUrgent, isInCommit }`. `isUrgent` is today's drag/resize/`MERGE_EVENTS` rule,
  computed once, so the vanilla `DelayedRunner` and the React `flushSync` keep their scheduling.
- **`update(optionOverrides, isRendering)`** stays for React's render (a `RESET_OPTIONS` replace with the
  new props, effects held, no publication), as phase 8 left it.
- **`mount()`/`unmount()`** and mount gating, unchanged from phase 8.

### 4. Options

- The incremental refiner becomes an explicit `OptionsRefinerCache` object owned by the store, with
  today's comparisons (`COMPLEX_OPTION_COMPARATORS`, `isMergedPropsEqual`), so refined identities
  don't change.
- **`resetOptions(options, changedNames?)`** dispatches `RESET_OPTIONS { optionOverrides, changedNames,
  mode }` (`replace` without names, `merge` with them, as today) and bumps an invalidation generation.
  Named options are refined again and their change handlers run even when the raw object is the same
  one (Vue's nested mutation), as `optionsForRefining`/`optionsForHandling` do today.

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
4. **Derived data.** `eventUiBases`, `selectionConfig`, `businessHours`, title, toolbar props and
   loading as memoized derivations of the slices (`CalendarData` unchanged).

## Tests

- **Effect contract (new, unit):** reducers call no `fetch`, emit nothing, dispatch nothing; each dirty
  I/O source yields exactly one fetch effect; synchronous sources resolve within the same `dispatch`.
- **Behavior locks (new, before step 1):** `renderToString` with array `events`, array `resources` and a
  synchronous function source (events present); the initial `eventsSet` argument for a synchronous
  source; `loading` transitions for static and async sources; Vue-style repeated
  `resetOptions(sameObject, ['events'])` after a nested mutation; `rerenderDelay` and `batchRendering`.
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

## Behavior changes (anticipated)

None intended. Any found during implementation get listed here and in the changelog.
