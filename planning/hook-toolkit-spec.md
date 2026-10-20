# Hook toolkit spec

The deliverable of phase 3 (`phase-3-hook-toolkit-spec.md`). It defines the shared hooks and
primitives that phases 4–7 build on, as **behaviour contracts**. Signatures are illustrative; an
implementation may split, merge, or reshape them as long as the contracts hold.

Status: reviewed (GPT-6.1-Sol round 1, 7 findings accepted).

## 1. Ground truth: commit timing

Everything below depends on when code runs during a commit. Verified from source:

- Preact 10.29.8: `preact/src/diff/index.js` `commitRoot`; `preact/hooks/src/index.js` `options._commit`.
- React 19.2: documented behaviour.

| Step | React 18/19 | Preact 10.29 |
|---|---|---|
| Callback refs on host elements | Attached during the layout phase, per fiber, children first | **All** refs in the commit are applied first, before anything else |
| `useLayoutEffect` | Layout phase, per fiber, children first, interleaved with class lifecycles | **All** layout effects of the commit run (children first) **before any** `componentDidMount`/`componentDidUpdate` |
| `componentDidMount` / `componentDidUpdate` | Layout phase, interleaved with layout effects | After all layout effects |
| `useEffect` | After paint, or synchronously at the end of a sync/`flushSync` render | After paint (`requestAnimationFrame` plus `setTimeout`). **Not** flushed by `flushSync` |
| `flushSync(fn)` | Commits synchronously, including layout effects | Sets `options.debounceRendering` to capture the queued render, then runs it synchronously. Layout effects run inside, `useEffect` does not |
| `StrictMode` | Dev builds replay mount: effects cleanup and re-run, refs detach and re-attach, `useState`/`useMemo` initialisers run twice | `preact/compat` exports `Fragment` as `StrictMode`, so no replay |
| `<Activity mode="hidden">` | Runs layout/passive effect cleanups and `componentWillUnmount`, and **detaches host refs** (callback refs get `null`). Keeps state and `useRef` objects. Keeps re-rendering at low priority. When shown, re-attaches host refs and re-runs effects and `componentDidMount` (React 19.2: `disappearLayoutEffects`/`reappearLayoutEffects`) | Not supported |

**Consequences:**

1. **Measurement attaches in a callback ref or `useLayoutEffect`, never `useEffect`.** Print relies
   on `flushSyncWithSizeBatching` (`component-util/resize-observer.ts`). Every watcher registered
   during that commit measures immediately (`isAcquiringImmediately`). A watcher registered in
   `useEffect` misses the bracket in Preact, and print renders with stale sizes.
2. **User mount hooks (`*DidMount`) run in `useLayoutEffect`, not in a callback ref.** In Preact a
   ref fires before any child has run its layout effects, so `{ domNodes }` content and Vue/Angular
   custom rendering wouldn't be in place yet. A layout effect in the owning component runs after its
   children's layout effects in both runtimes.
3. **Mixed trees during migration (Preact only).** A hook component's layout effect runs before its
   class children's `componentDidMount`. So during migration, a hook parent must not depend in its
   layout effect on something a class child sets up in `componentDidMount`.
   - Example: a class child registering a `watchSize` and reporting up synchronously.
   - Mitigation: convert bottom-up (leaves first). Where a hook parent has class children that
     report up, the report arrives through the reported-value path (section 4), which already
     tolerates arriving later.
4. **Strict Mode and `<Activity>` replays** mean every effect must be idempotent across
   cleanup → re-run, and refs (`useRef`) are the place for "once per instance" memory.
   - **React 18's Strict Mode replays effects but does not re-attach callback refs.** React 19
     replays both. `DayGridRow`'s height watcher is deliberately left unguarded for this reason
     (`DayGridRow.tsx:649`).
   - **Rule:** a subscription's setup and teardown live in the *same* mechanism, both in the
     callback ref or both in one effect. Registering in a ref and disconnecting in an effect cleanup
     would leave a React 18 Strict Mode tree permanently unsubscribed.
5. **Hidden `<Activity>` subtrees are `display: none`, and their host refs are detached.** From a
   component's point of view, hiding looks like unmounting, except that `useState`/`useRef` survive.
   So measurement hooks keep their last values in persistent memory, and re-publish them as soon as
   the element is re-attached (section 4). They also ignore any ResizeObserver report from an element
   that isn't rendered.
6. **Commit-time callbacks see the previous render's published values.** Host refs, and children's
   layout effects, run before a parent's layout effects. So a stable handler that a parent passes down
   (published through `useLatest`, section 3.4) still holds the parent's *previous* props when a child
   calls it during the commit. That includes an immediate print measurement. Rule: handlers called
   during the commit only record values and schedule work through `afterSize`. Anything that reads
   props or options runs in the `afterSize` flush, which comes after all of the commit's layout
   effects, including inside `flushSyncWithSizeBatching`.

## 2. Conventions

- **Location:** hooks live in `standard/packages/preact/src/hooks/`, one file per hook or small
  family, exported through `protected-api.ts` for scheduler. Plain helpers (no React) stay plain
  functions.
- **Naming:** `useX` only for functions that call hooks. Pure computations (e.g. `computeCellDensity`)
  are plain functions.
- **No `_isUnmounting`.** Effect cleanups replace it: a hook that subscribes returns its
  unsubscribe. Any callback that can fire after cleanup checks a local `isActive` flag set to false
  in the cleanup, scoped to that one subscription.
- **Latest-value refs.** Callbacks that outlive a render (watcher callbacks, emitter handlers, timer
  handlers) read props and options through a ref updated every render (`useLatest`). This fixes the
  seven stale-props watchers listed in the pre-pass doc.
- **Coexistence:** class and function components can render each other, and both read the same
  context objects. `BaseComponent`'s `this.context` and `useViewContext()` return the same value.
- **Render-hook call counts must not go up** (roadmap ground rules). Any new component boundary that
  calls a user hook (`*Class`, `*Content`) is memoised with comparators at least as strong as the
  ones it replaces.

## 3. Base-class replacements

### 3.1 `memo` with per-prop equality

**Replaces:** `PureComponent` / `BaseComponent` `shouldComponentUpdate`, with `addPropsEquality` /
`addStateEquality` maps. There are only 5 maps:

- 3 props maps: `ContentInjector`, `ResourceSubrow`, `ResourceGroupHeaderCell`;
- 2 state maps: `TimeGridLayoutPannable.headerTierHeights`, `ResourceTimelineView.colWidthOverrides`.

Every other class relies on the shallow default.

**Contract:**

- `memoWithEquality(Component, { propName: equalityFunc })` behaves like `memo` with a comparator.
  The comparator is `isPropsEqualWithMap(prev, next, map)`, the same function `PureComponent` uses
  today.
- State equality has no hook equivalent. Its two uses (`headerTierHeights`, `colWidthOverrides`, both
  `isArraysEqual`) become a setter that skips equal values: `setIfChanged(next, isEqual)`, a tiny
  helper over `useState`.
- `memo` doesn't block context changes in either runtime. That matters for `RenderId` (section 6.3).

### 3.2 `useViewContext()`

- Returns the `ViewContext` object from `ViewContextType`, exactly what `this.context` returns
  today.
- Phase 11 splits the context behind it. Converted code can already use narrow accessors
  (`useDateEnv()`, `useOptions()`), which read the same object for now.

### 3.3 Memoised computations

**Inventory:**

- 136 `memoize`/`memoizeObjArg` calls, about 100 of them component fields.
- **No call site passes a teardown, and only 2 pass `resEquality`.** Both are outside components:
  `CalendarDataManager.buildEventUiBySource` and `ResourceEventConfigAdder`. So `useMemo`'s
  semantics are close enough almost everywhere.

**Contract:**

- **Default:** a `memoize(fn)` field called once per render with props/context args becomes
  `useMemo(() => fn(...), [args])`. The deps are the same values `memoize` compared with `===`.
- **Keep the `memoize` instance** (`const [buildX] = useState(() => memoize(fn))`) where `useMemo`
  doesn't fit:
  - called several times or conditionally in one render;
  - wrapping a bound method that recurses through `this`;
  - the per-key memoize map at `event-splitting.ts:44`.
  - Identical semantics, no new helper needed.
- **`useMemo` may drop its cache** (React reserves the right). For these pure computations that
  costs time, not correctness, unless the result's identity feeds a memo comparator downstream. A
  dropped cache would then show up as a call-count increase, which the count gate catches.

### 3.4 `useLatest(value)` and `useStableCallback(fn)`

- `useLatest` returns a ref whose `.current` is the value from the latest committed render.
- `useStableCallback` returns a function with a stable identity that calls the latest `fn`.
- **Contract:** the ref is updated in a layout effect, not during render, so a discarded render
  (Suspense, concurrent) never leaks into callbacks.
- **Limit:** the guarantee holds only for callbacks that run *after* the owner's layout effect, such
  as watcher deliveries, emitter events, timers and `afterSize` flushes. Callbacks a child invokes
  during the same commit see the previous values (section 1, consequence 6).

## 4. Measurement

All measurement goes through the existing `watchSize`/`watchWidth`/`watchHeight` and `afterSize`
in `component-util/resize-observer.ts`. That module keeps its single shared ResizeObserver, the
`afterSize` batching and the `flushSyncWithSizeBatching` immediate-acquire bracket. The hooks only
change who registers and when.

**Precondition carried over:** one watcher per element (`configMap` is keyed by element). Two hooks
must never watch the same element. If two consumers need the same element's size, one hook measures
both dimensions and shares the result.

**Today's sites (28):**

- 11 attach in ref callbacks;
- 17 attach in `componentDidMount`. Those never re-attach if the element changes, and five of them
  (`TimeGridSlatHeader`, `TimeGridAllDayHeader`, `Ruler`, `TimeGridWeekNumber`,
  `TimelineHeaderCell`) report to the mount-time `props.xRef` (stale props).
- The hooks attach in callback refs, which fixes both problems.

**Existing quirk to fix in the hooks:** `watchWidth` calls `watchSize(el, cb, true)`, and
`watchHeight` defaults to `true`, so a width watcher also fires on height-only changes with an
unchanged width. The hooks fire only when a requested dimension changes. Consumers dedupe today, so
this changes no output.

**`afterSize` dedupes by function identity,** so every handler passed to it must be stable (a
`useStableCallback` or a ref-held function), or a batch would run the same aggregation repeatedly.

**State publication goes through `afterSize`.** The observer calls watcher callbacks in its entry
loop, *outside* `flushSync`; only the following `flushAfterSize()` is inside it. So a hook's watcher
callback stores the new value in a ref and schedules one stable `afterSize` handler, and that handler
calls the state setter. All size-driven updates from one observer delivery then land in one
synchronous batch, which matters for React 17's lack of automatic batching. In a
`flushSyncWithSizeBatching` commit the immediate acquisition still happens at registration, and the
handler runs in the bracket's single drain.

**Persistent cache across detach.** Every measurement hook keeps its last value in a `useRef` that
survives `<Activity>` hide/show and Strict Mode replay. On ref detach it disconnects the watcher but
keeps the cached value. On re-attach it re-publishes the cached value immediately, before the new
observation arrives, then lets the watcher correct it.

**Exception to preserve:** `TimeGridLayoutNormal` deliberately defers its total-width state update by
a `requestAnimationFrame` (`TimeGridLayoutNormal.tsx:508`), because changing all-day event widths
during observer delivery causes ResizeObserver loop warnings. Its consumer keeps that deferral, and
cancels it on cleanup; the hook doesn't hide it.

### 4.1 `useElementSize(options)`

**Replaces:** `Ruler`'s internals, `MeasuredHeightHarness`, and direct `watch*` sites. Counts are
in the inventory (section 9).

```ts
const [ref, size] = useElementSize({ width: true, height: false })
// ref: callback ref for the element. size: { width?: number, height?: number }
```

**Contract:**

- **Measures the element it's given, and never decides which element.** The DOM stays as it is
  (roadmap ground rule).
- **Registers in the callback ref,** so registration happens during the commit. In a
  `flushSyncWithSizeBatching` commit that gives an immediate measurement.
- When the element detaches, the watcher disconnects, but the size keeps its cached value. This is
  what keeps measurements through an `<Activity>` hide. When it's replaced by a different element, the
  new element's first measurement replaces the value.
- Updates state only when the watched dimension changes (`isDimsEqual`, as today), through the
  `afterSize` path described above.
- **Hidden elements:** if a report arrives while the element isn't rendered
  (`el.getClientRects().length === 0`, true for `display: none` subtrees such as a hidden
  `<Activity>`), the report is ignored and the last value kept. When the element is shown again,
  ResizeObserver reports the real size.

### 4.2 `useReportedSize(ref, which)`

**Replaces:** "measure and report up" sites, i.e. `watchHeight(el, h => setRef(props.heightRef,
h))` and Scroller's ruler handlers.

```ts
const elRef = useReportedSize(props.innerHeightRef, 'height')
```

**Contract:**

- Like 4.1, but instead of local state it calls `setRef(targetRef, value)`. The target is read
  through `useLatest`, so a new ref prop is honoured without re-registering.
- Reports only on change. Reports `null` in its layout-effect cleanup, as `Ruler` and `Scroller` do
  today, so parents can drop the entry.
- **Re-attach:** when re-attached (an `<Activity>` show, or a Strict Mode replay), it re-reports the
  cached value in the layout-effect setup. Parents therefore see the entry again in the same commit,
  before the new observation arrives.
- **Ref swap:** when the target ref prop changes, it first releases the old target (`setRef(prev,
  null)`), then reports the cached value to the new one, as `MeasuredHeightHarness.componentDidUpdate`
  does today. That includes changes to or from an absent target.
- **Scale:** there are 85 report-up sites: 51 heights, 17 widths, 6 scroller instances, 6 element
  refs, 5 other. The size ones become this hook. Scroller instances come from 4.4. Element refs stay
  plain `setRef`.
- The same hidden-element rule as 4.1.

### 4.3 `useMeasuredMap(combine)`

**Replaces:** `RefMap` plus `afterSize` plus combine plus `setState`. There are 33 RefMaps, combined
in five ways:

1. **Max over values:** TimeGrid axis/slat labels, header rows, `TimelineHeaderRow`.
2. **Per-key combination of two maps:** TimeGrid pannable header tiers.
3. **Min/max across cells:** `DayGridRow`.
4. **The whole map, consumed by layout:** `DayGridLayout` row tops, the ResourceTimeline entities,
   `TimelineFg`, print.
5. **Single-key lookup:** the last header tier's slot width.

Two more are special: an element map whose entries create and destroy `ElementDragging`
(`HeaderCells` resizers), and a map forwarded straight into a parent's map (`DayGridRows`).

```ts
const tiers = useMeasuredMap<string, number>(maxOf)
// tiers.ref(key) -> a ref callback (or Ref<number>) for a child to report into
// tiers.value -> the combined value (e.g. the max), or undefined until every key reported
```

**Contract:**

- **Batching:** children report into a mutable map. The map schedules one `afterSize` flush per
  batch, which combines and calls `setState` once. That's the same batching as today, so a commit
  mounting N children costs one recomputation.
- **Stable refs:** `ref(key)` returns the same function for the same key across renders. React
  calls a new callback ref with `null` then the element, which would cause churn.
- **Two retention modes:**
  - **Live** (default): a key whose reporter reports `null` is removed.
  - **Retained**: a `null` report keeps the last value, as `ignoreDeletes` does today. That's for the
    ResourceTimeline entity-height maps, where virtualized rows keep their measured heights while
    unmounted, and for timeline print event wrappers. Retained entries are cleared only by explicit
    invalidation, from the consumer, on the events that invalidate them today.
- **Reporter identity:** each `ref(key)` reporter has a token. A `null` from a reporter that no longer
  owns the key (a departing wrapper whose replacement has already reported) is ignored in both modes,
  so it can't erase its replacement's value.
- **Comparator:** the combined value is compared with a supplied comparator (`isArraysEqual` for
  tier arrays) before `setState`, as the pre-pass fixed for `headerTierHeights`.
- **Whole-map consumers** (pattern 4) use `combine = identity` plus a revision number, and read the
  map itself. This is today's `TimelineFg` `{ xRev: refMap.rev }` pattern.
- **Out of scope:** the element-map-with-side-effects case stays a bespoke effect, since it isn't
  measurement. So does the map forwarding, which disappears when `DayGridRows` and its parent
  convert together.

### 4.4 `useScrollerSyncer(axis, scrollerRefs, outRef)`

**Replaces:** the hand-wired `ScrollerSyncer` sites: 7 instances in 4 files (TimeGrid pannable ×2,
DayGrid pannable, Timeline, ResourceTimeline ×3).

- Two get their class from `getScrollerSyncerClass(pluginHooks)`; the scheduler imports it directly.
- Only some expose the syncer to a parent.
- Listener removal is partial in ResourceTimeline and after `destroy()` in Timeline.

The hook unifies these.

**Contract:**

- **Lifecycle:** creates the syncer in a layout effect, and calls `handleChildren(scrollers)`
  whenever the set of mounted scrollers changes. Destroys it on cleanup; the pre-pass fixed one site
  that didn't.
- **Exposure:** exposes the syncer through `outRef`, set to `null` on cleanup.
- **Replay-safe:** idempotent across Strict Mode and `<Activity>` replay. The cleanup destroys the
  syncer, and the re-run creates a fresh one and restores the scroll position from the scrollers'
  current `scrollLeft`/`scrollTop`, which `<Activity>` preserves in the DOM.

### 4.5 `useScrollbarGutter(totalWidth, clientWidth)` and `computeCellDensity(cellWidth, options)`

- **`useScrollbarGutter`:** `endScrollbarWidth = totalWidth - clientWidth`, `undefined` until both
  are known. It's a plain derivation; the hook form only exists so `<Ruler>` and Scroller's
  `clientWidthRef` wiring live in one place.
  - The 6 layouts differ only around the subtraction: `undefined` in print, minus
    `axisWidth + 1`, values under 3 clamped to 0, and `clientWidth` lifted to `TimelineView`.
    Those stay at the call sites.
- **`computeCellDensity(cellWidth, options)`:** a plain function. 5 identical copies today, all in
  standard.
  - `cellIsMicro = w != null && w <= dayMicroWidth`.
  - `cellIsNarrow = cellIsMicro || (w != null && w <= options.dayNarrowWidth)`.
  - Only how the cell width is derived differs between sites, and that stays at the call site.

### 4.6 Compound layout hooks (built in phase 7, specified here only by shape)

- `useDayGridLayout`, `useTimeGridLayout`, `useTimelineLayout` return the measurements and derived
  values their screen, pannable and print variants share.
- The print variant reads the **shell's** measurements rather than measuring itself, because print
  uses the screen-measured `visibleWidth` (the catch noted in the roadmap).

## 5. Events, timers and scroll

### 5.1 `useEmitterListener(name, handler)`

- **Lifecycle:** subscribes in a layout effect and unsubscribes on cleanup.
- **Handler:** read through `useLatest`, so changing it doesn't resubscribe.
- **Why a layout effect:** listeners like `_beforeprint` must be attached before any user code can
  trigger them after mount.

### 5.2 `useNow(unit, unitValue?)` (requirement: #8112)

**Replaces:** `NowTimer`/`NowTimerRunner` in components, and the calendar-level runner that
`CalendarDataManager` starts during render.

- 8 `<NowTimer>` usages: `day` in DayGrid, List, MultiMonth and ResourceDayGrid; `minute` or `day` in
  the TimeGrids; a slot-derived unit in the Timelines.
- One calendar-level runner (`day`).

**Contract:**

- **Render is pure.** The first render computes now from `nowManager` and arms nothing.
- **Arming:** a `useEffect` arms one timer to the next unit boundary, plus the `nowManager` reset
  listener and the `visibilitychange` listener. Cleanup clears all three.
  - `useEffect`, not `useLayoutEffect`, because no measurement depends on it.
  - In Preact it arms after paint, and the first render already showed the correct now.
- **On every setup, including the first,** the effect recomputes now before arming. If the unit
  value changed since render (a boundary crossed between render and arming, or time passed while
  hidden or replayed), it updates state right away, then arms. Passive arming can lag a frame or more
  in Preact (rAF plus timeout, with a 35ms fallback). The recompute makes that harmless.
- **Hidden `<Activity>`:** hidden means cleaned up, so no timers. A re-render while hidden arms
  nothing, because render is pure. Removing a hidden subtree leaves nothing behind.
- **Discarded renders** (Suspense, concurrent) arm nothing.
- **The React suite's pending cases become passing:**
  - `keeps its long timers after Strict Mode replays the mount`;
  - `#8112: …leaves no long timers`;
  - `#8092: …leaves no long timers`, together with phase 8 for the data layer.

### 5.3 `useInitialScroll(…)` (requirement: #8112 bug 2)

**Replaces:** the initial-scroll and scroll-request handling in five layouts.

| Layout | Axis | Scroll target | Re-applies on |
|---|---|---|---|
| TimeGrid | y | time | date range, leaving print |
| Timeline | x | time | date range, slot width, client width |
| ResourceTimeline | x, plus a y entity | time, plus resource | as Timeline, plus canvas width |
| DayGrid | y | date | date range, leaving print |
| MultiMonth | y | date | inner width |

- The first three handle `_timeScrollRequest`; ResourceTimeline also handles
  `_resourceScrollRequest`.
- MultiMonth applies its scroll in a `setTimeout(0)`.

The hook owns the *when*. Each layout supplies the *where*: a function from the target to a
coordinate, or `undefined` while the needed measurements are missing.

**Contract.** The hook maintains a **scroll target**, either a time/date (plus a resource for
ResourceTimeline) or a pixel position.

- **Initialised once per instance** from `scrollTime` / today's date, as today. The target lives in
  a `useRef`, so Strict Mode replay and `<Activity>` hide/show don't re-initialise it.
- **On date-range change** it's reset to the initial target only when today's rules say so
  (`scrollTimeReset`). With `scrollTimeReset: false` navigation keeps the target.
- **Projected whenever geometry changes** (slat heights, slot/client/canvas widths, row heights),
  while the target is a time/date. That's today's behaviour: Timeline re-applies on slot/client width
  changes, ResourceTimeline also on canvas width, TimeGrid after slat-height reports.
- **User scrolling** replaces a time/date target with the pixel position, recorded on scroll end as
  each layout does today (TimeGrid only on touch devices and not in print; Timeline and
  ResourceTimeline always; ResourceTimeline also clears the time on scroll).
- **Explicit requests** (`_timeScrollRequest`, `_resourceScrollRequest`) set a new target.
- **Leaving print** re-applies the current target, where a layout does so today.
- **Re-show after `<Activity>`:** the layout-effect setup re-applies the current target or recorded
  position once measurements are available again. They're re-published from the measurement caches
  in the same commit (section 4). It doesn't rely on the browser keeping `scrollTop` through
  `display: none`.
- **MultiMonth's `setTimeout(0)`** becomes "apply on the first render where the coordinate is
  defined", like the others.

### 5.4 `useHitTarget(elRef, source)` (specified now, implemented in phase 6)

**Replaces:** `registerInteractiveComponent(this, settings)` and interactions reading
`component.props` / `component.queryHit()`.

**Contract:**

- **A stable registration:** an object whose identity never changes for the component's lifetime.
  It has `el`, `useEventCenter`, and `isHitComboAllowed`, `queryHit`, `prepareHits`, and getters
  for the event selection, drag and resize, all reading the latest values through a ref.
- **Lifecycle:** registers in a layout effect, keyed by a stable uid, and unregisters on cleanup.
  `interactionSettingsStore` is keyed by that uid as today.
- **Class components** register the same shape through an adapter, so interactions can switch to
  the new shape before the last class component converts. Interactions stop reading
  `component.props`.
- **What interactions read from the component instance today:**
  - `uid` (`CalendarInner` keys the stores by it) and `context`;
  - `props.eventSelection` (`EventDragging`, `EventResizing`), and `props.eventDrag` /
    `props.eventResize` (inside `isValidSegDownEl`);
  - `isValidSegDownEl` (hovering, clicking, dragging, resizing) and `isValidDateDownEl` (date
    clicking, selecting);
  - `prepareHits()`, which only ResourceTimeline overrides;
  - `queryHit()`, which every registrant except ListView implements.
  - Settings: `el`, `useEventCenter` (false for `MorePopover`), `disableHits` (`ListView`), and
    `isHitComboAllowed`.
- **The handle exposes all of these.**
- **Stale props today:** `isHitComboAllowed` is captured at registration in `TimeGridCols` and
  `DayGridRows`, so it goes stale if the prop changes. The handle reads it live.
- **Possible bug:** `TimeGridAllDayLane` never passes `isHitComboAllowed`, though it declares the
  prop.

## 6. Render hooks

These replace `ContentContainer` (32 files after phase 4) and the render-prop `InnerContent`
pattern. The contract they must keep is pinned by the phase-2 specs (`render hooks: *` and
`event class cascade`).

### 6.1 Class: `generateClassName(generator, renderProps)`

- Stays a plain function, called during render.
- It runs on every render of its owner, so the owner's memoisation is what keeps `*Class` call counts
  down.

### 6.2 Mount hooks: `useMountHooks(didMount, willUnmount, renderProps)`

```ts
const elRef = useRef<HTMLElement>(null)
useMountHooks(elRef, options.dayCellDidMount, options.dayCellWillUnmount, renderProps)
```

**Contract:**

- `didMount({ ...renderProps, el })` runs in a `useLayoutEffect` of the area's owner, once per
  mount. It runs after the owner's children (including `<CustomContent>`) have run their layout
  effects, so built-in custom content is inside `el`.
  - This doesn't cover Vue/Angular, which render asynchronously (phase-2 doc).
- `willUnmount({ ...latestRenderProps, el })` runs in that effect's cleanup.
  - The render props are read through `useLatest`.
  - `el` is the element captured at mount, because React may have detached the ref (set it to `null`)
    before the cleanup runs.
- The effect depends only on mount, not on `renderProps`. Re-renders don't re-fire `didMount`,
  matching today.
- **Strict Mode / `<Activity>`:** the replay runs `willUnmount` then `didMount` again on the same
  element. That's the same as today's class behaviour under Strict Mode, and now consistent
  under `<Activity>`.
- **Removes the `didMountMisfire` workaround:** the element is known before the layout effect, from
  the ref.
- **Mount hooks are not measurement.** They don't take part in the immediate-acquire print bracket.

### 6.3 `<CustomContent>`

```tsx
<CustomContent
  tag="div" className={innerClass}
  name="eventContent" // generatorName, for Vue/Angular customRenderingMetaMap
  generator={options.eventContent}
  fallback={renderEventInner}
  renderProps={renderProps}
/>
```

**Contract:**

- **Owns exactly one slot element.**
- **Resolves the generator result**, in one place, into one discriminated union:
  - a React node or primitive, rendered in the vdom;
  - `{ html }`, via `dangerouslySetInnerHTML`;
  - `{ domNodes }`, appended in a layout effect;
  - `true`, meaning use `fallback`;
  - a Vue/Angular custom-rendering object, through `handleCustomRendering`.
- **Empty generators:** a missing generator uses `fallback`, unless
  `hasCustomRenderingHandler(name, options)`, which keeps today's `ContentInjector` behaviour.
- **`{ domNodes }` replacement:** when the generator returns different nodes, the old ones are
  removed and the new ones appended, as `applyQueueudDomNodes` does today.
- **Vue/Angular contract kept:**
  - a stable id per instance;
  - `handleCustomRendering({ id, isActive: true, containerEl, generatorMeta, renderProps })`
    after every commit (layout effect);
  - `isActive: false` on cleanup.
- **Memoised** with today's `ContentInjector` comparators: shallow `renderProps`, `attrs` ignoring
  handlers (`isNonHandlerPropsEqual`), shallow `style`. This is the only thing keeping `*Content`
  call counts down.
- **Reads `RenderId` with `useContext`,** so a bump (vanilla `calendar.render()` while rendering,
  used by the Vue/Angular wrappers) re-runs the generator despite the memo.

### 6.4 `useRenderHookEl` (outer element of an area)

```ts
const { className, ref } = useRenderHookEl({
  classGenerator: options.dayCellClass,
  didMount: options.dayCellDidMount,
  willUnmount: options.dayCellWillUnmount,
  renderProps,
})
return <td ref={mergeRefs(ref, elRef)} className={joinClassNames(className, viewClasses)}>…</td>
```

- It's `generateClassName` plus `useMountHooks`, returned as props to spread onto whatever tag the
  caller renders. No `tag` prop and no polymorphic component.
- **The rule:** the area owns all structural markup (resizers, hit expanders, before/after
  elements). Custom content only fills its `<CustomContent>` slot.

## 7. Migration order and coexistence rules

1. **Leaves first**, so no hook parent waits on a class child's `componentDidMount` (section 1,
   consequence 3).
   - 32 classes have no lifecycle methods, state or side-effect refs, and convert mechanically.
   - Standard (19): MoreLinkTrigger, ViewContainer, ButtonIcon, Toolbar, ToolbarSection,
     DayGridHeader, DayGridHeaderRows, DayGridLayoutPrint, DayGridMoreLink, DayGridView, ListDay,
     ListDayHeader, ListDayHeaderInner, ListEvent, TimeGridCol, TimeGridEvent, TimeGridMoreLink,
     TimeGridSlatLane, TimeGridView.
   - Premium (13): BodySection, ResourceExpander, ResourceGroupSubrow, ResourceIndent, TimelineBg,
     TimelineEvent, TimelineLaneMoreLink, TimelineNowIndicatorArrow, TimelineNowIndicatorLine,
     TimelineSlatCell, TimelineSlats, ResourceDayGridView, ResourceTimeGridView.
   - Several of these render `ContentContainer`, so they convert after the render-hook primitives
     exist.
2. **One component per commit** where practical. Run the targeted specs, `dom-snapshot compare`
   (DOM plus call counts, both runtimes), and the React suite.
3. **`ContentContainer` stays** until its last user converts, and is deleted in phase 5.
4. **`DateComponent` subclasses** keep working through the hit-target adapter until phase 7
   converts them.

## 8. Open questions for review

1. *(Resolved by the inventory: no teardowns, `resEquality` only outside components. `useMemo` by
   default, `memoize` instances where 3.3 says.)*
2. *(Resolved in review: use `getClientRects().length === 0`, because legitimate zero sizes must
   propagate. `<Activity>`'s detached refs are handled separately by the persistent cache.)*
3. *(Resolved in review: passive arming is fine, given the recompute on every setup in 5.2.)*

## 9. Call-site inventory (2026-10-20)

Counts are folded into the sections above. Totals:

| Item | Count |
|---|---|
| Class components | standard 51 (36 Base, 10 Date, 4 Component, 1 Pure); premium 23, plus an abstract print renderer |
| Pure-render classes | 32 (section 7) |
| `addPropsEquality`/`addStateEquality` | 5 |
| `memoize`/`memoizeObjArg` | 136 (about 100 component fields; 2 with `resEquality`; 0 with teardown) |
| `watchSize`/`Width`/`Height` | 28 (11 in refs, 17 in `componentDidMount`; 5 with stale props) |
| `afterSize` | 36 |
| `RefMap` | 33 |
| `setRef(props.xRef)` report-up | 85 |
| `ScrollerSyncer` | 7 instances in 4 files |
| Initial-scroll implementations | 5 |
| `endScrollbarWidth` | 6 layouts |
| `cellIsNarrow`/`cellIsMicro` | 5 copies |
| `registerInteractiveComponent` | 7 |
| `<NowTimer>` / `NowTimerRunner` | 8 / 2 |
| `_isUnmounting` | 201 occurrences in 40 files |
| Component emitter subscriptions | `_timeScrollRequest` ×3, `_resourceScrollRequest`, `_beforeprint`/`_afterprint` |

**Possible bugs found by the inventory.** Not fixed; candidates for a pre-pass, or fixed naturally
by the conversion:

- `TimeGridLayoutNormal.tsx:201` passes the week number's `innerHeightRef` into
  `headerLabelInnerWidthRefMap`, so a height enters the axis-width max. It's usually hidden because
  the axis is wider than a row is tall.
- `TimeGridAllDayLane` registers for hits without `isHitComboAllowed` (section 5.4).
- `watchWidth` also fires on height-only changes (section 4).
- `DayGridLayoutPannable` never reports `setRef(scrollerRef, null)` on unmount.
- `ResourceTimelineLayoutNormal` removes some syncer listeners after `destroy()`, and never removes
  the time-scroller ones (already known from the pre-pass).
