# Phase 9: store slices, actions, API facade

Status: plan, for spec review (2026-10-20). Nothing implemented yet.

Roadmap sketch (`refactor-roadmap.md`, phase 9): raw state in typed slices read through
`useSyncExternalStore`; derived data as pure memoized functions; one stable `actions` object per
calendar under `CalendarApiImpl` and `CalendarController`; a cache for the API wrappers; vanilla
creates the store in its constructor. Depends on phase 8 (done). Phases 10 (date profile), 11
(granular contexts) and 12 (grid abstraction, hooks-first API) build on it.

## What's there today

All in `standard/packages/preact/src/reducers/CalendarDataManager.ts` (883 lines), one class per
calendar.

- **One reducer for everything.** `reduce(prevState, prevData, action)` recomputes, in order: dynamic
  option overrides (`SET_OPTION`), options data (refined options, plugin hooks, `DateEnv`, view specs,
  toolbar config), view type, view data (view spec, view options, `DateProfileGenerator`, `ViewImpl`),
  the calendar-level now, current date, date profile, event sources, event store, renderable event
  store, UI bases, business hours, selection, drag, resize, then each plugin reducer (resources:
  `resourceSource`, `resourceStore`, `resourceEntityExpansions`). Then title and toolbar props, and
  `CalendarData`, the state plus everything derived, plus stable functions (`dispatch`,
  `getCurrentData`, `emitter`, `syncController`).
- **Side effects inside the reduction:**
  - **Fetching.** `fetchSource` calls `sourceDef.fetch()` during the reduction, for event sources
    (`reducers/eventSources.ts`) and the resource source (`resource/reducers/resourceSource.ts`). Results
    come back by `dispatch` (`RECEIVE_EVENTS`, `RECEIVE_RESOURCES`, `latestFetchId` checks). Array
    sources call back synchronously, so their results are queued and reduced in the same drain, which is
    why server-rendered HTML has events (phase 8 kept this on purpose).
  - **Option change handlers** (`events`, `eventSources`, premium `resources`) run at the end of the
    reduction and dispatch (`RESET_RAW_EVENTS`, `REMOVE_EVENT_SOURCE`, `addEventSource`,
    `RESET_RESOURCE_SOURCE`).
  - **The time zone hack:** a `timeZone` change refetches sources and rezones both event stores.
  - **Wiring:** each reduction sets `calendarApi.currentDataManager = this` and
    `emitter.setOptions(viewOptions)` (phase 8 follow-up: render-time mutation of shared wiring).
  - **The `loading` callback** goes through phase 8's effect queue.
- **Stateful memoization.** The option refiners keep the last raw and refined options
  (`currentCalendarOptionsInput`/`Refined`, the view equivalents) and refine only what changed, with
  `optionsForRefining`/`optionsForHandling` for `resetOptions(…, changedNames)`. A dozen `memoize`s
  hang off the instance.
- **Drivers** (from phase 8):
  - React/Preact `Calendar.tsx`: `update(props, isRendering = true)` during every render (mount-gated:
    effects and `onDataChange` wait for `mount()`/`flushEffects()` after commit), `onDataChange` bumps
    a revision state (`flushSync` for drag, resize and `MERGE_EVENTS`).
  - Vanilla `Calendar` (and `vanilla-w-react`): extends `CalendarApiImpl`, creates the manager in the
    constructor (usable before `render()`), `onDataChange` requests a render through a `DelayedRunner`
    (`rerenderDelay`, `batchRendering`, `pauseRendering`). Vue 3, Angular, the web component and LWC
    all wrap the vanilla `Calendar` and call `resetOptions` (Vue and Angular with changed option names).
- **The API:** `CalendarApiImpl` (602 lines) dispatches actions and reads `getCurrentData()`. Premium
  patches its prototype (`addResource`, `getResources`, …) and `EventImpl`'s. `EventImpl`,
  `EventSourceImpl` and `ResourceApi` are created per call (`getEvents`, `getEventById`, `eventsSet`,
  `relatedEvents`, …) and capture a `CalendarData` snapshot as their context. `EventImpl.mutate`
  updates the held wrapper in place. `ViewImpl` is memoized and reads live data.
- **Consumers of `getCurrentData()`** outside the API: validation, interactions (dragging, resizing,
  `UnselectAuto`), option change handlers, premium validation, resource drag, `View.ts`, `ResourceApi`.
- **After-commit callbacks** live in `CalendarInner`: `propSetHandlers` (`datesSet`, `eventsSet`
  (which follows the *renderable* store), premium `resourcesSet`), `contextInit`, calendar
  interactions, `syncController` before them.

## Goals

1. **The reduction is pure.** Given the previous raw state, an action and the environment, it returns
   the next raw state and a list of effects, and touches nothing. It can run during a React render, run
   twice, or be thrown away.
2. **Raw state is small and typed, in slices.** Everything else is derived, memoized, and shared by
   components and API getters.
3. **One store per calendar**, with synchronous `getState`, `dispatch`, `subscribe`, read by the
   renderers through `useSyncExternalStore` (React, through the shim; Preact, through `preact/compat`).
4. **Effects run after the state they come from is committed**: fetches, user callbacks
   (`loading`, the CRUD callbacks stay where they are), option-change follow-ups, controller binding.
5. **One `actions` object** per calendar. `CalendarApiImpl` and `CalendarController` become thin
   facades over it, and the future hooks API reuses it.
6. **Stable API wrappers** that read the calendar's current context lazily.
7. **Nothing user-visible breaks:** public options, `CalendarApi`/`EventApi`/`ResourceApi`, the DOM,
   render-hook counts (never up), server-rendered events, the Vue/Angular contracts.

Non-goals: granular contexts and per-slice component subscriptions (phase 11; phase 9 keeps one
`CalendarData`-shaped snapshot for `CalendarInner`), the date profile rewrite (phase 10), the day-table
pipeline (7b), a public hooks API (12).

## Design

### 1. The store

`createCalendarStore(config)` in `reducers/store.ts` (name open), one per calendar:

```ts
interface CalendarStore {
  getState(): CalendarState          // committed raw state
  getData(): CalendarData            // derived from it, memoized
  subscribe(listener: () => void): () => void
  dispatch(action: Action): void     // reduce, commit, notify once, then run effects
  preview(optionOverrides): CalendarData  // pure. React render, see §5
  commitPreview(optionOverrides): void    // React layout effect, see §5
  mount(): void; unmount(): void          // phase 8's gating, timers, controller
}
```

- **Dispatch:** reduce (pure), commit the raw state, notify subscribers once, then run the effects.
  Effects may dispatch; those dispatches queue and drain in the same loop, as today, so ordering and
  synchronous read-after-write (`addEvent` then `getEvents`, `ResourceApi.setProp` then `sync()`) are
  unchanged.
- **Batching:** one notification per drain, not per action. The vanilla `DelayedRunner` stays the
  vanilla render scheduler.
- **Mount gating** carries over from phase 8 unchanged: a mount-gated store (React) holds effects and
  notifications while not mounted, and delivers them on `mount()`.

### 2. Raw state slices

| Slice | Today | Notes |
|---|---|---|
| `optionOverrides` | `this.optionOverrides` (not state today) | props, constructor options, `resetOptions` |
| `dynamicOptionOverrides` | state | `setOption` |
| `currentViewType` | state | |
| `currentDate` | state | phase 10 turns this into the anchor date |
| `dateProfile` | state | stays state in phase 9 (reduced by actions with the generator). Phase 10 derives it |
| `nowDate` | state | calendar-level now, from the timer effect (`UPDATE_NOW`) |
| `eventSources` | state | fetch bookkeeping (`isFetching`, `latestFetchId`, `fetchRange`) included |
| `eventStore` | state | |
| `renderableEventStore` | state | keeps the previous store while loading, so it's history, not derivable |
| `dateSelection`, `eventSelection`, `eventDrag`, `eventResize` | state | |
| plugin slices | merged into state | registered by plugins: `resourceSource`, `resourceStore`, `resourceEntityExpansions` |

Moved out of state into derived data: `eventUiBases`, `selectionConfig`, `businessHours` (all pure
functions of options and the stores today).

### 3. Derived data

`CalendarData` stays the snapshot shape `CalendarInner` and the views get, now built by
`deriveCalendarData(state, env)`, a chain of memoized pure functions:

- **Options data** (refined calendar options, plugin hooks, `DateEnv`, view specs, toolbar config,
  locales) from `optionOverrides` + `dynamicOptionOverrides`.
  - The incremental refiner (only re-refine options whose raw value changed, `COMPLEX_OPTION_COMPARATORS`,
    `isMergedPropsEqual`) becomes an explicit memo object owned by the store, `OptionsRefinerCache`,
    with a pure contract: same inputs, same refined objects (identity included, which the render-hook
    counts depend on). The "refine these names even if equal" input (`resetOptions(…, changedNames)`,
    used by Vue and Angular) becomes part of the input, not instance state.
- **View data** (view spec, view options, `DateProfileGenerator`, `ViewImpl`) from options data and
  `currentViewType`.
- **UI data:** `eventUiBases`, `selectionConfig`, `businessHours`.
- **Presentation:** `viewTitle`, `toolbarProps`, `isLoading` (plugin `isLoadingFuncs`).
- **Stable members:** `dispatch`, `getCurrentData`, `emitter`, `calendarApi`, `nowManager`, `actions`.

Identity contract: a derived value is a new object only when an input changed. The memoization is
per store (not module-level), so two calendars don't evict each other.

### 4. The pure reducer and its effects

```ts
function reduceCalendar(prev: CalendarState | undefined, action: Action, env: ReduceEnv):
  { state: CalendarState, effects: Effect[] }
```

`ReduceEnv` carries the store's memo caches and stable functions, nothing mutable that the reducer
writes. Each slice reducer gets what it reads, explicitly (the order of today's `reduce()` becomes the
dependency order).

What becomes an effect:

| Today, inside `reduce()` | Phase 9 |
|---|---|
| `sourceDef.fetch()` (events, resources) | `fetchEventSource`/`fetchResourceSource` effects. The reducer marks the source `isFetching` with a new `latestFetchId` (pure: the id comes from `env.nextId()`), the effect calls `fetch`, results dispatch as today |
| option change handlers | split: pure follow-ups (`events` as an array becomes `RESET_RAW_EVENTS` reduced in the same transaction) and effectful ones (adding a non-array source, which fetches) |
| the time zone hack | pure: rezoning both stores is a reduction; refetching is fetch effects |
| `loading` | an effect, as phase 8 made it |
| `currentDataManager = this`, `emitter.setOptions` | gone from the reduction. The facade holds the store from construction; the emitter reads the committed view options when it triggers |
| controller binding | stays after commit (`syncController` in `CalendarInner`, and the vanilla path) |

**Static sources are reduced inline, so server rendering keeps its events.** An array event source
(and the array resource source) is data, not I/O: its "fetch" is a pure parse. The reducer resolves
static sources in the same transaction (what today's synchronous callback achieves through the queue),
so `renderToString` still renders their events and resources. Only sources that do I/O (function,
JSON feed, Google, iCalendar) become effects.

- **Behavior change to decide (open question 1):** a function source that calls `successCallback`
  synchronously also renders on the server today, because its fetch runs during the render. As an
  effect, it would render empty on the server and fill in after hydration/mount. Options: accept it
  (changelog), or let source defs opt into a synchronous, side-effect-free resolve (`resolveSync`)
  and keep functions as effects.

### 5. React: render without mutating, commit in a layout effect

Today `Calendar.tsx` calls `update(props, true)` during render, which mutates the manager (phase 8
made it effect-free, not mutation-free). Phase 9 replaces it:

- **Render:** `data = store.preview(props)` runs the pure reducer on the committed state with the new
  `optionOverrides` and derives data from the result, without committing. Memoized on
  `(committed state, props)`, so a re-render with the same inputs returns the same `CalendarData`
  (the "plain re-render re-renders the views" follow-up from phase 7 should disappear here, see §9).
- **Subscribe:** `useSyncExternalStore(store.subscribe, store.getState)` re-renders on dispatches.
  Tearing-safe in concurrent React; through the shim in React 17.
- **Commit:** a layout effect calls `store.commitPreview(props)`: if the committed state hasn't changed
  since the render, it adopts the previewed state as is (no second reduction, same identities) and runs
  its effects; otherwise it reduces again. `mount()`/`unmount()` stay as phase 8 left them.
- **No extra renders.** Option changes that today apply in the same render (an `events` array prop)
  still do, because their follow-up is pure and part of the previewed transaction. Only I/O waits for
  the commit, as it effectively does today (results arrive asynchronously).
- **Preact** uses the same component (it's the same source). `useSyncExternalStore` comes from
  `preact/compat`; add the `use-sync-external-store/shim` remap (roadmap ground rules).

### 6. Actions and the API facade

- **`actions`**, built once per store: `prev`, `next`, `today`, `gotoDate`, `changeView`, `zoomTo`,
  `setOption`, `select`/`unselect`, `addEvent`, `removeAllEvents`, `addEventSource`,
  `removeAllEventSources`, `refetchEvents`, `scrollToTime`, plus what `EventImpl`/`EventSourceImpl` do.
  Each is today's `CalendarApiImpl` method body, minus the wrapper construction. Plugins register their
  own (premium: `addResource`, `refetchResources`, …) instead of patching prototypes, and the
  prototype patches become one-line delegations.
- **`CalendarApiImpl`** keeps its public surface and delegates. `currentDataManager` goes away
  (`resetOptions` in the vanilla `Calendar` calls the store). `dispatch` stays as the low-level path
  for interactions and plugins (`protected-api`).
- **`CalendarController`** binds to the actions instead of the `CalendarApi` (same public methods,
  same `datesSet` subscription).
- **`getCurrentData()`** stays for its internal callers (validation, interactions, premium), now
  `store.getData()`.

### 7. Stable API wrappers

- **Per-store caches**, so the same underlying event, source or resource gives the same wrapper object
  across `getEvents()`, `getEventById()`, `eventsSet`, `event.source`, `resource.getEvents()`, …
  - `EventImpl`: keyed by instance (or def, for non-instanced recurring defs). `mutate` already updates
    the held wrapper in place; the cache re-keys it to the new def/instance, so the wrapper the user
    holds stays the one the calendar hands out.
  - `EventSourceImpl` and `ResourceApi`: keyed by id (`sourceId`, resource id), because the source
    object changes on every fetch. Pruned when the source or resource is removed.
  - `ViewImpl` is already stable.
- **Lazy context:** wrappers hold the store and read `dateEnv`/options from the current data when a
  getter runs, instead of the snapshot they were created with. **Behavior change:** a wrapper held
  across a `timeZone` or `locale` change reports the new zone's dates. Arguably a fix; changelog it.
- WeakMaps where the key is an object, Maps with pruning where it's an id.

### 8. Vanilla and the wrappers

- The vanilla `Calendar` creates the store in its constructor (as it creates the manager today), so API
  calls before `render()` keep working, and subscribes its `DelayedRunner` to it.
- Vue 3, Angular, the web component and LWC keep calling `resetOptions` (with changed names); nothing
  changes for them.

### 9. Things to check along the way

- **The extra data-layer re-render** found in phase 7: a plain React re-render with unchanged props
  re-rendered the standard views once (new event segs from upstream). Find it during §5; the
  `activity-rerender.ts` specs' budget should drop to 0.
- **`getCurrentData()` during an interaction** must see committed data (it does, interactions run after
  commit), never a preview.
- **icalendar** caches its fetch promise on mutable `meta.internalState`. Fine as an effect, but the
  parsed source object must not be recreated on every reduction (or the cache is lost).
- **`eventsSet` follows the renderable store** (`CalendarInner` passes `renderableEventStore`). Keep.

## Steps

Each ships on its own and is verified like phase 7 (both runtimes' suites, DOM snapshots and counts,
the React suite), with a Sol review per step.

1. **Pure reducer, same driver.** Extract `reduceCalendar` (state + effects) and `deriveCalendarData`
   from `CalendarDataManager.reduce()`, with the options refiner as an explicit cache. The manager
   executes the effects. Fetching becomes effects; static sources reduce inline. Option change handlers
   split. The time zone hack becomes reductions plus fetch effects. The shared-wiring mutations move out.
   Biggest step; the existing suites are the net, plus new unit tests (below).
2. **The store.** `CalendarDataManager` becomes the store (or a shim over it): `getState`, `getData`,
   `subscribe`, `dispatch`, effect runner, mount gating. `CalendarApiImpl` holds it from construction.
3. **React integration.** `preview`/`commitPreview` and `useSyncExternalStore` (shim, Preact remap).
   Remove render-time `update()`. Hunt the extra re-render.
4. **Actions and facades.** The `actions` object; `CalendarApiImpl`, `CalendarController`, the vanilla
   `Calendar` and the premium prototype patches delegate to it.
5. **Plugin slices.** Resources as a registered slice: reducer, effects (resource fetch), derived data,
   actions. The `reducers` plugin hook becomes slice registration (`protected-api` can break).
6. **Stable wrappers.** The caches and lazy context for `EventImpl`, `EventSourceImpl`, `ResourceApi`.

Then the day-table pipeline (7b), now that derived data has a home.

## Tests

- **Purity (new, unit):** for a set of action sequences, `reduceCalendar` run twice from the same state
  gives equal results, calls no `fetch`, triggers no emitter, dispatches nothing. Static sources resolve
  inline; I/O sources produce exactly one fetch effect per dirty source.
- **Server rendering (new or extended):** `renderToString` with array `events`, array `resources`, and
  (per open question 1) a synchronous function source.
- **React suite:** Strict Mode double render (no duplicate fetches, no lost options), a Suspense-discarded
  render (no fetch, no callbacks), `<Activity>` hide/show, React 17 through the shim, an `events` prop
  change rendering in the same render (count check).
- **Identity:** `getEvents()` twice gives the same objects; an `EventImpl` held across `setProp` is the
  one `getEventById` returns after; across a `timeZone` change it reports the new zone.
- The existing Karma suites (both runtimes), DOM snapshots and render-hook counts after each step.

## Open questions (for review)

1. **Synchronous function sources on the server** (§4): accept the change, or add an opt-in
   synchronous resolve for source defs?
2. **Keep `CalendarDataManager` as a name/shim** for one step, or replace it outright? (`protected-api`
   can break, but the rrule/google-calendar/vue3 packages import from it.)
3. **Where `syncController` lives** once the store exists: keep it in `CalendarInner` (committed data,
   before `datesSet`) or move it into the store's commit for every driver.
4. **Plugin slice registration API** (step 5): shape of `{ name, init, reduce, effects, derive }`, and
   whether plugins keep raw `dispatch` or get typed action creators.
5. **Wrapper identity keys** (§7): instance-keyed `EventImpl`s change identity when a drag replaces the
   instance object; acceptable, or key by `instanceId` with pruning?

## Behavior changes (anticipated, for the changelog)

- Held `EventApi`/`EventSourceApi`/`ResourceApi` objects read the calendar's current time zone and locale.
- `getEvents()` and friends return the same objects for the same events.
- Possibly: synchronous function event sources no longer render on the server (open question 1).
