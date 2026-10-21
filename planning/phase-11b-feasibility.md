# Phase 11b + 11c: feasibility of store reads through `useSyncExternalStore` and render-time purity

Status: study, 2026-10-21. No implementation. Asked for by `phase-11-contexts-and-store-reads.md`
(revision 2) after Sol's spec review round 1. Paths are under `standard/packages/preact/src/` unless
noted.

**Conclusion:** render-time purity **can't be made behavior-identical**. Today's behavior in the
scenarios purity exists for (a render that never commits) *is* the mutation: such a render advances the
store, and later reads, fetch bookkeeping and held callbacks depend on that. A pure design changes
them by construction. In the scenarios where every render commits, it could match today, but only by
threading a per-render snapshot through every render-time reader, which changes context identities on
every render, so render-hook counts would go up. `useSyncExternalStore` on its own, keeping the
render-time reduction, either renders the driver twice per props change (counts up) or only re-plumbs
data the props already deliver. **Recommendation:** keep today's render-time reduction as the end
state (option A below). This is Adam's decision (§6).

## 1. What a render-time `store.update(props, true)` does today

`Calendar.tsx:71` calls it on every render of the driver. It pushes an `IDLE` action and drains the
queue (`reducers/store.ts:216`, `:303`); each action goes through `reduce` (`:376`). Along the way,
during render:

| What | Where | Observable by |
|---|---|---|
| `this.optionOverrides = props` | `store.ts:217` | the next reduction, `resetOptions` |
| `this.state` / `this.data` replaced after each action | `store.ts:322-323` | every API read (`getCurrentData`, `calendar.getEvents()`, `view.activeStart`, `EventImpl` getters), immediately |
| The options refiner's caches: `current*`/`stable*` fields, single-entry memoizers, and `optionsForRefining`/`optionsForHandling` (consumed by `takeOptionsForHandling`, `store.ts:671`) | `reducers/options-refiner.ts:30-66` | the next refinement; `resetOptions`' invalidation is consumed once |
| The store's single-entry memoizers (`computeCurrentViewData`, `buildDateProfileGenerator`, `buildViewApi`, `buildViewUiProps`, `buildEventUiBases`, `buildToolbarProps`, `buildTitle`, `store.actions`' `buildActions`) | `store.ts:77-85`, `:116` | object identities in later reductions (memo hits) |
| `emitter.setThisContext` / `setOptions` (the view's handlers) | `store.ts:396-397`, `common/Emitter.ts:12-18` | every callback fired afterwards, including ones fired before the render commits |
| `nowManager.handleInput` (a `now` option change fires reset listeners) | `store.ts:719`, `reducers/CalendarNowManager.ts:15-42` | mounted `useNow` runners, re-armed during render |
| The store's day timer re-arms | `store.ts:481-489` | timer callbacks |
| New ids: `defId`, `instanceId`, `sourceId`, `fetchId` (`guid()`) | `structs/event-parse.ts:145`, `structs/event-instance.ts:233`, `structs/event-source-parse.ts:76`, `reducers/eventSources.ts:189` | `event.id`-less defs' identities, `RECEIVE_EVENTS` matching |
| Fetches run inline: `effects.run` calls the runner, which calls `sourceDef.fetch` right then | `reducers/effects.ts:22-33`, `reducers/event-source-fetch.ts:17` | user fetch functions, `eventSourceSuccess`/`success`, network requests |
| A synchronous source's results dispatch `RECEIVE_EVENTS` into the same drain | `reducers/event-source-fetch.ts:42`, `store.ts:296-301` | the first render and the server's HTML have the events |
| User code in parsing and the date profile: `eventDataTransform`, refiners, `validRange`/`visibleRange` functions, plugin reducers | stage 4-8 of `reduce` | call counts |
| Callbacks queued (`loading`), held until `flushEffects` after a commit | `store.ts:253`, `:314`, `:617` | the callback, at the next commit, whichever render queued it |

What this gives today:

- **Exact replays are idempotent.** A Strict Mode double render, or React re-rendering with the same
  props, reduces `IDLE` against the advanced store: memo hits, no re-parse, no new ids, no refetch.
- **Effects that users see are mount-gated** (phase 9): callbacks wait for a commit (`flushEffects`),
  subscribers are told only while mounted, and the controller binds from committed data only.
- **A render that never commits still advanced the store.** Its state is what API reads see, its
  fetches stay in flight and are adopted (their `fetchId`s are in the state), and its held callbacks fire
  at the next commit. The next render reduces from there.

## 2. What purity would mean

The roadmap's §11 asks for a reduction that can run during render without mutating the store: a
speculative transaction (base revision, inputs, resulting state and derived data, cache deltas, effects),
which the commit adopts and a discarded render drops. Its requirements (roadmap §11, from phase 9's
spec review, phases 9 and 10): replay of user code and ids, isolation of speculative reductions
(including the options refiner's caches and invalidation generations), publication before child
callbacks, render-time readers bound to the render's snapshot, server snapshots and hydration on React
17-19, synchronous sources in the first render, the date profile derived from an anchor with a
committed-profile cache.

A design that meets them, in outline:

1. `reduce` becomes a function of (base snapshot, inputs) returning a transaction: every cache above
   becomes a copy-on-write overlay recorded in the transaction; ids come from a per-transaction allocator
   seeded from the base; the clock is read once per transaction.
2. The driver memoizes transactions on (base revision, props), so an exact replay reuses one.
3. A commit marker, the driver's first child, adopts the transaction in its layout effect, which runs
   before `CalendarInner`'s `componentDidMount`/`componentDidUpdate`, where `datesSet` and the other
   `propSetHandlers` fire (`CalendarInner.tsx:220-253`).
4. Fetches: synchronous results are needed during render (first render, the server), so the fetch still
   has to run there. A render-scoped fetch cache keyed by (source, range, generation) keeps a replay
   from calling again; adoption keeps the in-flight fetches the committed transaction started.
5. Render-time readers (`ViewImpl` getters, `EventImpl`, premium's `transformIsDraggable`, validation:
   `getCurrentData()` in `api/ViewImpl.ts`, `api/EventImpl.ts`, `validation.ts`, the interaction plugin)
   read the render's transaction during render, and the committed one elsewhere.

## 3. Where it can't match today

**(a) Discarded renders.** Suspense, `startTransition`, an interrupted concurrent render, `<Activity>`
pre-rendering. Each of today's outcomes changes:

- API reads between the discarded render and the next commit return the committed state, not the
  discarded render's. (Arguably a fix, but a change, observable in event handlers and timers.)
- A fetch the discarded render started: today its `fetchId` is in the store, so its result is adopted and
  nothing refetches. Pure: the committed state doesn't know that id. Either the next committed
  transaction fetches again (a second call to the user's fetch function, a second request), or a
  cross-transaction in-flight registry hands the result over. That registry is shared mutable state
  again, with its own edge cases (the discarded range differs from the committed one; the user's function
  already ran with the discarded range).
- Held callbacks: a `loading` queued by a discarded render fires today at the next commit. Pure: only if
  the committed transaction produces its own.
- Ids: a discarded render's parsed defs and instances are adopted today. Pure: re-parsing gives new
  ids, and `eventDataTransform` and the refiners are called again.

**(b) Render-time readers need a per-render snapshot, which raises render counts.** A component can't
tell which transaction its render belongs to except through context (React can interrupt a transition
render for an urgent one and restart it, so a module-level "current snapshot" pointer is wrong there).
So `getCurrentData`, and everything that hands it on (`CalendarCoreContext`, `EventImpl`s,
`ViewImpl`), would carry the transaction: a new value per transaction. Every consumer of the core
context, and every memo keyed on an `EventImpl`'s context (`common/events.tsx`'s `eventApi` memo),
would re-render or rebuild on every reduction, including `IDLE` ones from unrelated parent renders.
Counts go up: against this phase's constraint. Keeping identities stable needs a mutable indirection
read at call time, which is the render-time mutation again.

**(c) Callbacks fired between render and commit.** `emitter.setOptions` during render means a callback
fired before the commit (a pointer event dispatched mid-render in concurrent mode, a timer) uses the
render's handlers today. Pure: the committed handlers. Small, but a change.

**(d) Timers.** A `now` option change re-arms `useNow` runners during render today
(`CalendarNowManager.ts:36-40`). Pure: at adoption, a commit later. A timing change.

**(e) Strict Mode is fine, the rest isn't.** Exact replays can match (point 2 above). The changes are in
(a)-(d), which only concurrent rendering reaches, but React 18 and 19 users get there through
`startTransition`, Suspense boundaries above the calendar, and `<Activity>`.

## 4. `useSyncExternalStore` on its own (11b), keeping the render-time reduction

- **In the driver:** `getSnapshot = store.getData` read at render start, then `store.update(props)` during
  the same render replaces the snapshot. React's consistency check sees the store change during render
  and renders again synchronously: two driver renders per props change. Counts up, and the second
  render is an `IDLE` reduction.
- **In children** (granular selectors, e.g. a future `useOption('dayMaxEvents')`): the driver's
  render-time update has already run when they read, so they're consistent. But they'd read what
  `CalendarInner`'s props already deliver, memoized. The gain is the selector API itself, not
  correctness or speed, and the urgency adapter (urgent changes must still `flushSync` before
  `dispatch` returns, round 1 #1) plus the subscription-vs-`mount()` ordering (round 1 #4) come with it.
- **React 17** needs the published shim (`use-sync-external-store/shim`), now testable with
  `@fullcalendar-tests/react17`.

So 11b alone doesn't remove the render-time reduction, which is what the roadmap's §11 is about, and its
one concrete use (selectors) works with today's prop flow too, through a context of the refined options
(phase 11a's `ViewOptionsContext`).

## 5. Cost, if Adam chooses purity anyway

A transactional store: `reducers/store.ts` (all of it), `reducers/options-refiner.ts` (overlays,
invalidation generations), `reducers/eventSources.ts` and `event-source-fetch.ts` (the fetch registry),
`CalendarNowManager`, `Emitter`, the id allocators in `structs/`, every `getCurrentData` reader (the API
objects, validation, interactions, premium's transforms), the driver (transaction memo, commit marker),
and phase 10's deferred date profile from an anchor. Several phases of the size of 9, each needing the
acceptance tests below, in both runtimes.

Acceptance tests it would need: committed A → transition to B → suspend or discard → a source
completing or an API dispatch → resume or cancel, comparing render-hook counts, user-function calls,
callbacks, controllers and DOM against named expectations (not today's, by §3); driver locks for a
child's mount callback dispatching, `loading` held across a discarded render, async results before
subscription, Strict Mode, `<Activity>`; real server-to-client hydration on React 17, 18 and 19.

## 6. The decision for Adam

- **A. Keep today's render-time reduction as the end state (recommended).** Document its guarantees
  (exact replays idempotent; user-visible effects mount-gated; a render that never commits still
  advances the store, and what that means for API reads, fetches and held callbacks) in the store's
  header and the roadmap, and close §11's purity item. The selector API, when wanted, builds on 11a's
  contexts without `useSyncExternalStore`. Cost: a doc change.
- **B. A transactional store, accepting named behavior changes:** §3 (a)-(d) as listed, plus the count
  increases of §3 (b) unless a later design avoids them. Cost: §5.
- **C. `useSyncExternalStore` for children only (11b), keeping the reduction:** the selector API with
  subscription semantics. Low value now (§4); revisit if a selector user appears.
