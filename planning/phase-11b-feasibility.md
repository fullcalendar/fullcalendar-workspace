# Phase 11b + 11c: feasibility of store reads through `useSyncExternalStore` and render-time purity

Status: **decided, option A** (Adam, 2026-10-21): today's render-time reduction is the end state; §6's
guarantees are documented in `reducers/store.ts`'s header; 11b and 11c are closed, not implemented.
Study revision 2 (2026-10-21, after Sol's review round 1, §7). Asked for by
`phase-11-contexts-and-store-reads.md` (revision 2) after Sol's spec review round 1. Paths are under
`standard/packages/preact/src/` unless noted.

**Conclusion:** strict render-time purity **can't preserve every behavior of today's**. The one
unavoidable difference: today a render that never commits still advances the store, so API reads made
after it (in an event handler, a timer, a user callback) see its state; a pure design, which drops a
discarded render, can't. Other differences (refetching, reparsing, held callbacks) are conditional:
avoidable with cross-transaction caches whose purity boundary would have to be defined. And the design
outlined here (§2) would raise render counts; whether a better one can avoid that is open (§3 (b)).
`useSyncExternalStore` on its own, keeping the render-time reduction, mostly re-plumbs what props already
deliver, and its shims need their own hydration strategy (§4). **Recommendation:** keep today's
render-time reduction as the end state (option A, §6). This is Adam's decision.

## 1. What a render-time `store.update(props, true)` does today

`Calendar.tsx:71` calls it on every render of the driver. It pushes an `IDLE` action and drains the
queue (`reducers/store.ts:216`, `:303`); each action goes through `reduce` (`:376`). Along the way,
during render:

| What | Where | Observable by |
|---|---|---|
| `this.optionOverrides = props` | `store.ts:217` | the next reduction, `resetOptions` |
| `this.state` / `this.data` replaced after each action (`buildData` always makes a new object) | `store.ts:322-323`, `:641-654` | live API reads: `calendar.getEvents()` and the like, `ViewImpl` getters, `EventImpl.source`. (A retained `EventImpl`'s other getters read the def, instance and context it captured, not the store) |
| The options refiner's caches: `current*`/`stable*` fields, single-entry memoizers, and `optionsForRefining`/`optionsForHandling` (consumed by `takeOptionsForHandling`, `store.ts:671`) | `reducers/options-refiner.ts:30-66` | the next refinement; `resetOptions`' invalidation is consumed once |
| The store's single-entry memoizers (`computeCurrentViewData`, `buildDateProfileGenerator`, `buildViewApi`, `buildViewUiProps`, `buildEventUiBases`, `buildToolbarProps`, `buildTitle`, `store.actions`' `buildActions`) | `store.ts:77-85`, `:116` | object identities in later reductions (memo hits) |
| `emitter.setThisContext` / `setOptions` (the view's handlers) | `store.ts:396-397`, `common/Emitter.ts:12-18` | every callback fired afterwards, including ones fired before the render commits |
| `nowManager.handleInput`: on a new date environment (a time zone change, say), the manager adopts it (and a `now` function), and reset listeners fire; a literal `now` is kept from the first environment. A `now` change alone, with the same date environment, does nothing | `store.ts:719`, `reducers/CalendarNowManager.ts:15-42` | mounted, started `useNow` runners, re-armed during render |
| The store's day timer re-arms | `store.ts:481-489` | timer callbacks |
| New ids: `defId`, `instanceId`, `sourceId`, `fetchId` (`guid()`) | `structs/event-parse.ts:145`, `structs/event-instance.ts:233`, `structs/event-source-parse.ts:76`, `reducers/eventSources.ts:189` | identities of defs without `id`, `RECEIVE_EVENTS` matching |
| Fetches run inline, during render and before the first mount too: `effects.run` calls the runner, which calls `sourceDef.fetch` right then; a result calls `eventSourceSuccess`/`success` | `reducers/effects.ts:22-33`, `reducers/event-source-fetch.ts:17-40` | user fetch functions and success callbacks, network requests |
| A synchronous source's results dispatch `RECEIVE_EVENTS` into the same drain | `reducers/event-source-fetch.ts:42`, `store.ts:296-301` | the first render and the server's HTML have the events |
| User code in parsing and the date profile: `eventDataTransform`, refiners, `validRange`/`visibleRange` functions, plugin reducers | stages 4-8 of `reduce` | call counts |
| Callbacks queued (`loading`), held by a render-time drain | `store.ts:253`, `:314`, `:617` | the callback, at the next drain that may run effects: a `flushEffects` after a commit, or an API dispatch or fetch completion while mounted, whichever comes first |

What this gives today, precisely:

- **Replays on a surviving store are idempotent.** A re-render with the same props (Strict Mode's update
  replays, a parent re-rendering) reduces `IDLE` against the advanced store: memo hits, no reparse, no
  new ids, no refetch. **Not** a discarded *initial* mount: React 18's Strict Mode invokes the component
  twice on mount with fresh hook state, so each invocation creates its own store (the `useState`
  initializer, `Calendar.tsx:34`) and parses and fetches again (user fetch functions called twice in
  development). React 19 reuses the hook state for its second invocation.
- **Notifications and the controller are mount-gated** (phase 9): subscribers hear about changes only
  while mounted, and the controller binds from committed props only.
- **Held callbacks aren't commit-gated.** A render-time drain holds them; the next drain allowed to run
  effects runs them, which can be an API dispatch or a fetch completing after mount, before any commit.
- **User code runs during render**: fetch functions, success callbacks, transforms, range functions.
- **A render that never commits still advanced the store.** Later API reads see its state; its fetches
  stay in flight and are adopted if their source still exists and the fetch is still its latest
  (`eventSources.ts:207-224`, `eventStore.ts:100-103`); its held callbacks run at the next eligible
  drain; the next render reduces from there.

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
2. The driver memoizes transactions on (base revision, props), so an exact replay reuses one, and an
   unchanged `IDLE` transaction reuses its base snapshot outright.
3. A commit marker, the driver's first child, adopts the transaction in its layout effect, which runs
   before `CalendarInner`'s `componentDidMount`/`componentDidUpdate`, where `datesSet` and the other
   `propSetHandlers` fire (`CalendarInner.tsx:220-253`).
4. Fetches: synchronous results are needed during render (first render, the server), so the fetch still
   has to run there. A fetch registry keyed by (source, range, generation) keeps a replay from calling
   again, and can hand a speculative fetch's id and result to a later transaction.
5. Render-time readers (`ViewImpl` getters, `EventImpl.source`, premium's `transformIsDraggable`,
   validation, the interaction plugin's reads through `getCurrentData()`) read the render's transaction
   during render, and the committed one elsewhere.

## 3. Where it can't, or might not, match today

**(a) Discarded renders.** Suspense, `startTransition`, an interrupted concurrent render, `<Activity>`
pre-rendering.

- **Unavoidable:** API reads between the discarded render and the next commit return the committed
  state, not the discarded render's. (Arguably a fix, but a change, observable in event handlers, timers
  and user callbacks.)
- **Conditional:** a fetch the discarded render started is adopted today. Pure, it's refetched (a second
  call to the user's fetch function, a second request), unless the registry of §2 point 4 hands the
  speculative id and result over. That registry is state shared across transactions, so purity needs an
  explicit boundary that allows it (as it must for the render-time fetch cache anyway).
- **Conditional:** a discarded render's parsed defs and instances are adopted today; pure, they're
  parsed again (new ids, `eventDataTransform` and the refiners called again) unless normalized results
  are cached across transactions, under the same boundary.
- **Conditional:** a `loading` held by a discarded render fires today at the next eligible drain. Pure,
  only if the adopted transaction produces its own.

**(b) Render-time readers and render counts.** A component can't tell which transaction its render
belongs to except through context (React can interrupt a transition render for an urgent one and
restart it, so a module-level "current snapshot" pointer set during render is wrong there). In the design
of §2, `getCurrentData` and what hands it on (`CalendarCoreContext`, `EventImpl` contexts, `ViewImpl`)
would carry the transaction, a new value per changing transaction: core-context consumers and memos keyed
on an `EventImpl`'s context (`common/events.tsx`'s `eventApi`) would re-render or rebuild on every
reduction that changes data, where today they don't. That's a cost of this design, not a proven lower
bound: an unchanged `IDLE` transaction can keep its base snapshot (so unrelated parent renders cost
nothing), and a separate snapshot context, read only by the few render-time readers, would leave
consumers of the stable services alone. Whether such a design keeps every count at today's level is
open.

**(c) Callbacks fired between render and commit.** `emitter.setOptions` during render means a callback
fired before the commit (a pointer event dispatched mid-render in concurrent mode, a timer) uses the
render's handlers today. Pure: the committed handlers. Small, but a change.

**(d) Timers.** A new date environment re-arms started `useNow` runners during render today
(`CalendarNowManager.ts:21-42`). Pure: at adoption, a commit later. A timing change.

**(e) Initial mounts.** React 18's Strict Mode initial double invocation already builds two stores today
(§1); a pure design could share one transaction memo across them only through state outside the
component, which the driver doesn't have. Equal to today either way.

## 4. `useSyncExternalStore` on its own (11b), keeping the render-time reduction

- **In the driver:** reading the snapshot *before* `store.update(props)` in the same render would loop:
  `update` always drains `IDLE` and `buildData` makes a new object, so each retry reads snapshot N and
  leaves N+1, and React 18/19's post-render check (and Preact compat's, in a layout effect) schedules
  another render, forever. Calling `update` first and reading the snapshot after avoids it, at no extra
  render. So the driver can adopt it; it gains a subscription in place of today's revision state, and
  keeps the urgency adapter (urgent changes must still `flushSync` before `dispatch` returns, spec review
  round 1 #1) and the subscription-vs-`mount()` ordering (round 1 #4).
- **In children** (granular selectors, e.g. a future `useOption('dayMaxEvents')`): the driver's
  render-time update has already run when they read, so they're consistent, but they'd read what
  `CalendarInner`'s props already deliver, memoized. The gain is the selector API, not correctness or
  speed.
- **Hydration through the shims:** React 17's published shim (`use-sync-external-store/shim`) ignores
  `getServerSnapshot`, and Preact 10.29.8's compat `useSyncExternalStore` takes only `subscribe` and
  `getSnapshot`. On those, hydration has to come from `getSnapshot` itself returning data equal to the
  server's during the hydrating render (the store would have to know it's hydrating). React 18/19's
  native hook uses `getServerSnapshot`. Untested here; `@fullcalendar-tests/react17` could host the test.
- **Preact's `startTransition` is synchronous**, so the concurrent cases above don't arise there; they're
  React 18/19's.

So 11b alone doesn't remove the render-time reduction, which is what the roadmap's §11 is about, and its
one concrete use (selectors) works with today's prop flow too, through phase 11a's `ViewOptionsContext`.

## 5. Cost, if Adam chooses purity anyway

A transactional store: `reducers/store.ts` (all of it), `reducers/options-refiner.ts` (overlays,
invalidation generations), `reducers/eventSources.ts` and `event-source-fetch.ts` (the fetch registry and
its purity boundary), `CalendarNowManager`, `Emitter`, the id allocators in `structs/`, the render-time
readers (the API objects, validation, interactions, premium's transforms), the driver (transaction memo,
commit marker, snapshot context), the shims' hydration strategy, and phase 10's deferred date profile from
an anchor. Several phases of the size of 9, each needing the acceptance tests below, in both runtimes.

Acceptance tests it would need: committed A → transition to B → suspend or discard → a source
completing or an API dispatch → resume or cancel, comparing render-hook counts, user-function calls,
callbacks, controllers and DOM against named expectations (not today's, by §3 (a)); driver locks for a
child's mount callback dispatching, `loading` held across a discarded render, async results before
subscription, Strict Mode (React 18's initial double invocation separately), `<Activity>`; real
server-to-client hydration on React 17 (shim), 18 and 19, and Preact.

## 6. The decision for Adam

- **A. Keep today's render-time reduction as the end state (recommended).** Document what it guarantees
  (§1's list, as corrected: replays on a surviving store are idempotent; notifications and the controller
  are mount-gated; held callbacks run at the next eligible drain, not necessarily a commit; user code
  runs during render; a render that never commits still advances the store) in the store's header and
  the roadmap, and close §11's purity item. The selector API, when wanted, builds on 11a's contexts.
  Cost: a doc change.
- **B. A transactional store, accepting the named changes:** §3 (a)'s unavoidable one, the conditional
  ones unless the registries are built, (c), (d), and whatever render-count cost the final design has.
  Cost: §5.
- **C. `useSyncExternalStore` in the driver and for selectors (11b), keeping the reduction:** possible
  without extra renders (§4), with the urgency adapter and the shims' hydration strategy to build. Low
  value now; revisit if a selector user appears.

## 7. Review round 1 (Sol, high effort)

| # | Finding | Response |
|---|---|---|
| 1 | P2: the driver example loops forever, not twice; reading after `update` avoids it | §4 corrected; option C updated |
| 2 | P2: React 18 Strict Mode's initial double invocation isn't idempotent (fresh hook state, a second store) | §1's guarantee qualified to surviving stores; §3 (e) |
| 3 | P2: option A claimed commit gating the store doesn't give (fetches run before mount; held callbacks run at the next eligible drain) | §1's table and guarantees rewritten; option A's list follows them |
| 4 | P2: the render-count penalty is the outlined design's, not a lower bound | §3 (b) rewritten: a cost of the design, open whether avoidable; conclusion updated |
| 5 | P2: fetch adoption and reparsing are conditional, not impossibility proofs; adoption today is conditional too | §3 (a) split into unavoidable and conditional; §2 point 4 and §1 updated |
| 6 | P2: hydration through React 17's shim and Preact compat (no `getServerSnapshot`) unanswered; Preact's synchronous `startTransition` | §4's hydration and Preact paragraphs; §5 |
| 7 | P3: a `now` change alone doesn't fire reset listeners (the date environment gates it) | §1's table, §3 (d) |
| 8 | P3: most retained `EventImpl` getters read captured data; only `source` reads the store | §1's table, §2 point 5 |

Round 2: 11a's fix confirmed; the study's responses adequate; one P3 (a new date environment doesn't re-read a literal `now`), fixed in §1's table.
