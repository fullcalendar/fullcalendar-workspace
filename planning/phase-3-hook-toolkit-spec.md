# Phase 3: hook toolkit spec and review

## Purpose

Write the spec for the shared hooks and primitives before implementing any of them. Get it reviewed
by GPT-6.1-Sol and settle its objections with the developer.

- **Deliverable:** `planning/hook-toolkit-spec.md`.
- **No code** in this phase.

The spec defines **behavior contracts**. Signatures in it are illustrative; implementation may pass
individual values instead of config objects, split or merge hooks, and so on, as long as the contracts
hold.

## What the spec covers, per hook

- **Contract:** what it measures, reports, or does, and when it updates.
- **Timing:**
  - callback ref vs `useLayoutEffect` vs `useEffect`, and why;
  - behavior under `flushSync` / `flushSyncWithSizeBatching` (print);
  - behavior under React Strict Mode replays and `<Activity>` hide/show.
- **Preact vs React differences:** `useLayoutEffect` timing, ref callbacks, `useSyncExternalStore`.
- **React 17 notes:** the shim; no `useId`.
- **Call sites it replaces:** file list and counts. Also what each replaced site does today that the
  hook must preserve.

## Hooks and primitives

### Base-class replacements

- **`memo` with per-prop equality:** replaces `PureComponent` with `addPropsEquality`/`addStateEquality`.
- **`useViewContext()`:** a facade over today's single context. Phase 11 splits the context behind it.
- **`useMemo` in place of `memoize` fields:** list the few uses that depend on `memoize`'s teardown or
  result-equality options, and how each is handled.
- **`useLatest` / `useStableCallback`:** for user callbacks and options read at call time.

### Measurement

- **`useElementSize`:** measures the element it's given; never decides which element. Replaces
  `Ruler`'s internals, `MeasuredHeightHarness` and the direct `watchSize`/`watchWidth`/`watchHeight`
  sites.
- **`useReportedHeight(ref)`:** measures and reports up to the parent. 6 copies in scheduler, 7 in
  standard.
- **`useMeasuredMap(reduce)`:** replaces RefMap + `afterSize` + combine (max of children) +
  `setState`. Used by TimeGrid axis/slat/header tiers and `TimelineHeaderRow`.
- **`useScrollerSyncer(axis, refs, outRef)`:** the 4 hand-wired sites. Must destroy on unmount (the
  pre-pass fixed one site by hand).
- **`useScrollbarGutter`:** the `Ruler` total width minus the Scroller client width, i.e. the
  end-scrollbar width. 6 layouts.
- **`computeCellDensity(width, count)`:** a plain function returning `cellIsNarrow`/`cellIsMicro`.
  Copied in 4+ layouts today.

### Events, timers and scroll

- **`useEmitterListener(name, handler)`.**
- **`useNow(unit, value)`:** the timer starts in an effect, not during render. Must stop when hidden
  under `<Activity>` and restart when shown again (#8112 bug 1).
- **`useTimeScroll`:** 3 near-copies today. Must not reset scroll when an `<Activity>` subtree is shown
  again (#8112 bug 2): the initial scroll runs once per instance or date range, not on every mount.

### Render hooks

These replace `ContentContainer`. The details come from phase 4's needs.

- **Class:** `generateClassName(generator, renderProps)` stays a plain function.
- **Mount hooks:** `*DidMount`/`*WillUnmount` run from a `useLayoutEffect` in the area component.
  The callback ref only stores the element.
  - **Why not a callback ref:** Preact's `commitRoot` applies every ref before running any layout
    effect or `componentDidMount` (`preact/src/diff/index.js`, `commitRoot`). A ref-based `didMount`
    would therefore fire before a child `<CustomContent>` appends `{ domNodes }` or calls
    `handleCustomRendering`. Children's layout effects run before their parent's in both runtimes,
    so a layout effect in the area sees the content. That's the same order as today:
    `ContentContainer.componentDidMount` runs after the child `ContentInjector.componentDidMount`.
  - `willUnmount` gets the latest render props.
  - This removes the `didMountMisfire` workaround.
  - This is an exception to "measure in callback refs": mount hooks aren't measurement.
- **`useRenderHookEl`** (or similar): combines class and mount hooks for an area's outer element.
  Returns `{ className, ref }` to spread onto whatever tag the caller renders.
- **`<CustomContent>`:** owns exactly one slot element.
  - **Memoised.** It must skip re-rendering with the same comparators `ContentInjector` uses today:
    shallow `renderProps`, `attrs` ignoring handlers, shallow `style`. That's the only thing keeping
    `*Content` call counts down. A plain function component would re-call `eventContent` on every
    parent render and break the count rule.
  - Resolves a `*Content` result: React node, string, `{ html }`, `{ domNodes }`, `true` for the
    default content, or the Vue/Angular custom-rendering object.
  - Keeps `handleCustomRendering`'s contract: a stable id and a real container element per slot.
  - Normalise the result into one discriminated union in one place.
- **The rule to write down:** areas own all structural markup (resizers, hit expanders, before/after
  elements). Custom content only fills its slot.

### Interactions (spec now, implement in phase 6)

- **`useHitTarget(elRef, hitSource)`:** returns a stable object with `queryHit`, `prepareHits`,
  `isHitComboAllowed`, the event selection, drag and resize, all read from the latest props.
  Interactions stop reading `component.props`.

### Conventions

- File layout and naming for hooks.
- How class and function components coexist during migration: each can render the other, and both
  share the same context.
- `_isUnmounting` guards are not carried over. Cleanup in effects replaces them.

## Review loop

1. Send the spec to GPT-6.1-Sol (high effort) via `delegate_task`, with the roadmap and the relevant
   code paths.
2. Each further round is a new `delegate_task`. Its prompt includes the previous findings, my
   responses, and any unresolved objections.
3. Bring the remaining disagreements to the developer before phase 4 starts.

## Done when

The spec is reviewed, objections are resolved or explicitly deferred, and the developer approves.
