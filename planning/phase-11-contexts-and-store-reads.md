# Phase 11: granular contexts and store reads

Status: plan, revision 1 (2026-10-21), for Sol's spec review. The consumer inventory it relies on is
`phase-11-context-inventory.md` (an Explore agent's read-only survey, 2026-10-21).

Roadmap §11: five narrow contexts with `useViewContext()` as a facade; components reading the store
through `useSyncExternalStore`; the reduction replayable during render, with the requirements phase 9's
spec review recorded; plus what phases 9 and 10 deferred here (invalidation generations, isolating the
store's caches, deriving the date profile from an anchor). The React 17 smoke run (deferred from phase
2) needs the `useSyncExternalStore` shim, so it lands here too.

This plan splits the phase in three, because the parts differ in risk by an order of magnitude:

- **11a, granular contexts:** mechanical, behavior-identical, render-hook counts can only go down.
- **11b, store reads through `useSyncExternalStore`:** the subscription and the snapshot, not render-time
  purity. A small change with a timing consequence (below).
- **11c, render-time purity:** the replayable reduction and everything it needs. Planned in its own
  document after 11a and 11b land, with its own spec review; if that review shows it can't be done
  behavior-identically, it stops there for Adam's decision.

## What's there today

From the inventory (`phase-11-context-inventory.md`):

- **One provider:** `CalendarInner` provides `ViewContextType`, built by `memoize(buildViewContext)` over
  14 inputs. It changes only on a view switch or an option change (any calendar option gives a new
  `viewSpec`), never on navigation, events, selection, drag/resize or now ticks, which arrive as props.
- **89 consumer sites** (56 standard, 32 premium, 1 `.Consumer`), plus utilities that take the whole
  context. By reads: 30 only `options` (27 with no other context access), 3 only `dateEnv`, 4
  `options`+`dateEnv`, 14 that add `viewApi`, 13 that touch `pluginHooks` (mostly through
  `Slicer.sliceProps`), 8 `dateProfileGenerator`, about 32 `viewApi`, 7 `useHitTarget` users.
- **Identity dependencies:** 15 `useMemo`s keyed on the whole `context`, `Slicer`'s memoized
  `sliceBusinessHours`/`sliceDateSelection` taking it as an argument, effects keyed on or capturing
  `emitter`/`pluginHooks`, and interactions comparing context objects as "same calendar" checks
  (`EventDragging`, `ExternalElementDragging`).
- **The class views** (`DayGridView`, `TimeGridView`, `ListView`, `MultiMonthView`, the four premium
  views) and `Scroller` have `static contextType` through `BaseComponent`/`DateComponent` but never read
  `this.context`; it makes them re-render on every context change regardless of `shouldComponentUpdate`.
- **The React driver** (`standard/packages/preact/src/Calendar.tsx`): the store and API are created in a
  `useState` initializer; `store.update(props, true)` runs during render (a reduction, mutating the
  store's state, with effects held for `flushEffects`); a `subscribe` listener bumps a revision state
  (with `flushSync` when urgent and not in a commit).

## 11a: granular contexts

### Design

Five contexts, each with a memoized value and a hook, provided by `CalendarInner` alongside today's
`ViewContextType`:

| Context | Value | Changes when |
|---|---|---|
| `CalendarCoreContext` | `{ calendarApi, dispatch, emitter, getCurrentData, nowManager, baseId, registerHitTarget, unregisterHitTarget }` | `baseId` changes (practically never) |
| `PluginHooksContext` | `pluginHooks` | the plugins change |
| `DateEnvContext` | `dateEnv` | time zone, locale, week numbering, first day, week text |
| `ViewSpecContext` | `{ viewSpec, viewApi, dateProfileGenerator }` | the view, or an option the view spec or generator depends on |
| `ViewOptionsContext` | the view's refined `options` | an option change, a view switch |

Hooks: `useCalendarCore()`, `usePluginHooks()`, `useDateEnv()`, `useViewSpec()`, `useViewOptions()`.
`useViewContext()` and `ViewContextType` stay, their value still `memoize(buildViewContext)` with the
same 14 inputs, so its identity, and every unconverted consumer, behave exactly as today.

### What converts

Only consumers whose reads (their own and their utilities') fit inside narrow contexts entirely, from the
inventory:

- the 27 options-only consumers → `useViewOptions()`;
- the 3 dateEnv-only → `useDateEnv()`;
- the 4 options+dateEnv → both hooks;
- `useNow` → `useCalendarCore().nowManager`, `useDateEnv()`, `useViewOptions()`.

Everything that passes `context` onward (to `EventImpl`, `ResourceApi`, `Slicer.sliceProps`, header-tier
builders, `buildNavLinkAttrs`, interactions through `useHitTarget`) stays on the facade in this phase:
those utilities' signatures take a `ViewContext`/`CalendarContext`, and the interactions compare context
identities. Their conversion is later work (and partly phase 12's: `EventImpl`/`ResourceApi` hold a
context).

The class views and `Scroller` drop `static contextType` (they never read it); their function bodies
already subscribe themselves.

### Behavior

Same DOM and callbacks. Render-hook counts can only go down: a converted consumer re-renders on a
subset of the changes it re-rendered on before (a narrow value changes only when the facade's does, and
not always then); the class views stop re-rendering on context changes their props don't reflect. The
snapshot counts compare; decreases are expected and listed.

### Risks

- **A narrow value changing when the facade doesn't** would add renders. Each narrow value is memoized
  on a subset of the facade's inputs, so it can't (the facade's inputs are a superset). A spec asserts
  each context's identity across navigation, now ticks, an unrelated option change and a view switch.
- **Preact and React context propagation:** both re-render consumers of a changed context value
  regardless of `memo`. Same behavior as the facade.
- **`contextType` removal** changes nothing a class reads; a spec asserts the views still update on an
  option change (their bodies subscribe).

## 11b: store reads through `useSyncExternalStore`

### Design

- The React driver reads the store with `useSyncExternalStore(store.subscribe, store.getData,
  store.getData)` (the third is `getServerSnapshot`: on the server the data is what the render-time
  update produced, the same as today) instead of the revision state. `store.subscribe` keeps its change
  metadata for vanilla; the hook's listener ignores it.
- **Urgency:** `useSyncExternalStore` updates always render synchronously (blocking lane), which covers
  today's `flushSync` for urgent changes; non-urgent changes, today's default-lane revision bump, also
  become synchronous. That's a timing change (non-urgent data changes render sooner, in the same task
  or the next microtask rather than a later scheduler task): tolerated by the ground rules ("subtle
  lifecycle/timing"), listed, and checked against the specs that wait for renders.
- **The render-time update stays** (`store.update(props, true)` during render): 11b is about how async
  changes reach React, not render-time purity (11c). The snapshot read after the update is the update's
  data; React's consistency check compares `getData()` at render and at commit, which differ only when an
  async change landed in between, and then React re-renders synchronously, which is correct.
- **React 17:** `useSyncExternalStore` arrived in React 18. A small internal shim (the same algorithm as
  `use-sync-external-store/shim`: `useState` + `useLayoutEffect` + `useEffect`, checking the snapshot
  after subscribing) used when `React.useSyncExternalStore` is absent, in
  `standard/packages/preact/src/hooks/useSyncExternalStoreCompat.ts`. No new dependency (decision logged:
  the published shim would be a new runtime dependency of `@fullcalendar/react`). Preact uses
  `preact/compat`'s.
- **The React 17 smoke run:** the React package's vitest suite gains a React 17 project (react-dom's
  legacy `render`), covering mount, update, unmount, Strict Mode, async data arriving after mount, and
  server rendering. It needs `react@17`/`react-dom@17` as dev dependencies under aliases (lockfile change;
  logged).

### Risks

- **Timing:** specs that rely on a non-urgent change rendering a task later. The full suites in both
  runtimes and the React suite decide; any timing-dependent spec gets a note, not a weakened assertion.
- **Tearing checks in development:** React warns if `getSnapshot` returns a new value on each call;
  `getData()` returns the stored object.
- **Mount gating** (phase 8): subscriptions made in the `useSyncExternalStore` hook happen at commit,
  after `store.mount()`? Both run in layout/passive effects; the order must keep "subscribe before
  mount() delivers held changes", or held changes must be visible through `getData()` at subscription
  time (React's post-subscribe snapshot check re-renders if they differ). To verify against
  `store-subscribe.ts` and the React suite.

## 11c: render-time purity (separate plan, later)

The requirements recorded in the roadmap (phase 9's spec review round 1, phase 9's last review, phase 10's
reviews): replay of user code during normalization and id allocation; isolation of speculative
reductions (single-entry memoizers, the refiner's `currentPluginHooks`, `store.actions`' construction,
invalidation generations); publication order before child callbacks; render-time readers bound to the
render's snapshot; server snapshots and hydration; synchronous sources rendering on the server and in the
first client render; the date profile derived from an anchor with a committed-profile cache and candidate
promotion. Its own plan document once 11a and 11b land. The question it must answer first: whether a
behavior-identical render-time-pure reduction is achievable at all, or whether the remaining render-time
mutation (an idempotent reduction of the render's props, mount-gated effects) is the end state, to be
decided by Adam.

## Steps

1. **11a step 1:** the five contexts, their hooks, `CalendarInner` providing them; identity spec. No
   consumer converted.
2. **11a step 2:** convert the narrow consumers (list above) and drop `contextType` from the class views;
   counts compared (decreases listed).
3. **11b step 1:** the compat hook, the driver on `useSyncExternalStore`; timing notes.
4. **11b step 2:** the React 17 smoke project.
5. **11c:** planning only.

Each step: full suites in both runtimes, snapshots and counts, the React suite, a Sol review.

## Open questions (my recommendation)

1. Convert the options-only consumers to `useViewOptions()` even though their re-render set barely
   shrinks (options change whenever the facade does, except on a `viewSpec`-only change)? Recommend yes:
   it's the narrow dependency the later `useOption` selectors build on, at no risk.
2. Vendor the `useSyncExternalStore` shim (recommended) or depend on `use-sync-external-store`?
3. Accept non-urgent changes rendering synchronously (recommended), or keep the default lane by
   scheduling the store's notifications (`startTransition`-like) to preserve today's timing exactly?
