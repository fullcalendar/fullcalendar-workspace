# Phase 11: granular contexts and store reads

Status: 11a done (2026-10-21, see its Done note). Plan revision 2, after Sol's spec review round 1: 11a ready with corrections; 11b
and 11c merged into a feasibility study before any implementation; the React 17 smoke run its own step. The consumer inventory it relies on is
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

## Revision 2: what changed (review round 1)

Sol found 11a sound (the five contexts' identities are subsets of the facade's when each provider memoizes
on the exact existing inputs) and 11b not ready: two P1s (an urgent change must still flush before the
listener returns, which a `useSyncExternalStore` update doesn't guarantee, and drag queries the DOM right
after dispatching; the store's `subscribe`/`getData` are unbound methods), and P2s on the subscription vs
`store.mount()` order, the concurrency argument (React's consistency check restarts a render but can't undo
the render-time reduction's mutations, consumed invalidations, user calls or queued effects), the shim and
hydration contract, and the React 17 harness. It also recommended assessing render-time purity's
feasibility before landing 11b.

So: **11a proceeds** (corrections below). **11b and 11c merge into one feasibility study** (below), with
no implementation until it concludes; if render-time purity isn't achievable behavior-identically,
adopting `useSyncExternalStore` alone (keeping the render-time reduction) buys little for its risks, and
the decision goes to Adam. **The React 17 smoke run** becomes its own step on a separate workspace test
package with ordinary React 17 dependencies (it tests today's driver on React 17, useful regardless).

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

Exceptions (round 1 #8): `ForegroundEvent`'s and `TimeGridCols`' own reads convert, but they keep a
facade subscription through `useEventDisplay` and `useHitTarget`; `TimelineFg`'s `renderMirrorSegs` takes
`options` and `dateEnv` instead of the context (it reads only those), an explicit exception to the rule
below.

Everything that passes `context` onward (to `EventImpl`, `ResourceApi`, `Slicer.sliceProps`, header-tier
builders, `buildNavLinkAttrs`, interactions through `useHitTarget`) stays on the facade in this phase:
those utilities' signatures take a `ViewContext`/`CalendarContext`, and the interactions compare context
identities. Their conversion is later work (and partly phase 12's: `EventImpl`/`ResourceApi` hold a
context).

The eight built-in view shells (`DayGridView`, `TimeGridView`, `ListView`, `MultiMonthView`,
`ResourceDayGridView`, `ResourceTimeGridView`, `TimelineView`, `ResourceTimelineView`) and `Scroller` opt
out explicitly (`static contextType = null` on each; `undefined` makes React 17 and 18 warn of an invalid
contextType in development, which the React 17 smoke run caught), because the declarations are inherited from
`PureComponent`/`BaseComponent`, which keep them: `DateComponent`'s hit-target methods and other
subclasses read `this.context` (round 1 #3). `CalendarInner` (the provider, which doesn't read it) opts out
too. Protected-API note: a third-party subclass of an opted-out built-in can declare it again.

### Behavior

Same DOM and callbacks. Render-hook counts can only go down: a converted consumer re-renders on a
subset of the changes it re-rendered on before (a narrow value changes only when the facade's does, and
not always then); the class views stop re-rendering on context changes their props don't reflect. The
snapshot counts compare; decreases are expected and listed.

### Risks

- **Memo keys:** each narrow value is a direct input (`options`, `dateEnv`, `pluginHooks`) or memoized on
  all of its constituent references, including the practically constant ones (round 1).
- **A narrow value changing when the facade doesn't** would add renders. Each narrow value is memoized
  on a subset of the facade's inputs, so it can't (the facade's inputs are a superset). A spec asserts
  each context's identity across navigation, now ticks, an unrelated option change and a view switch.
- **Preact and React context propagation:** both re-render consumers of a changed context value
  regardless of `memo`. Same behavior as the facade.
- **`contextType` removal** changes nothing a class reads; a spec asserts the views still update on an
  option change (their bodies subscribe).
- **Identity spec cases (round 1):** navigation, a now tick, an unrelated option change, a view switch, a
  simultaneous `options`+`dateEnv` change (a locale change), and a memoized descendant consumer.

### Done (2026-10-21): steps 1 and 2

Commits: step 1 (contexts, providers, hooks, identity spec) and step 2 (conversions, opt-outs).
Verified together (`p11a2` vs `p7b2b`, the end of 7b): 176 fixtures unchanged, counts 0 up and 0 down
(no count scenario changes an option or a view, so the opt-outs' savings don't show there), suites
green apart from the known React failures. Step 1's own run (`p11a1`) was green except the React
standard lane, which a test-only gap stopped (the React test entry didn't export `Component`; now it
does).

- **Converted:** 30 options/dateEnv-only destructures (the inventory's list: the `events.tsx` parts
  `ForegroundEvent`, the row variant's body, `EventEl`, `EventInner`, `EventEdge`; the toolbars;
  `CustomContent`; the DayGrid layouts, rows, header row and cell element; `useDayHeaderFormatter`;
  `ListEvent`; TimeGrid's column lane, columns and slat label; the premium spreadsheet parts, lane
  and print-lane cells, `TimelineBg`, `TimelineHeaderRow`, `useTimelinePrintBands`), plus by hand
  `DayGridHeaderCellLabel`, `TimelineNowIndicatorArrow`/`Line` (dateEnv), `TimeGridLayoutNormal`/
  `Pannable` (options), `TimelineFg` (its `renderMirrorSegs` takes `eventMinWidth` and `dateEnv`),
  `NowIndicatorDot` (`ViewOptionsContext.Consumer`) and `useNow` (core's `nowManager`, dateEnv,
  options). Everything that reads more, or passes the context on, stays on the facade.
- **Opted out of `contextType`:** the eight view shells, `Scroller` and `CalendarInner` (`null`; first
  `undefined`, which React 17 and 18 warn about in development, fixed after the smoke run). Specs: each
  built-in view (standard and premium) still updates on an option change.
- **Mutation checks:** un-memoizing the view-spec value or the core, or giving a narrow context the
  facade, each fail the identity spec. (Note for later mutation runs: rebuild with the
  `@fullcalendar-tests/standard...` filter; building `@fullcalendar/preact` alone leaves the vanilla
  bundle the tests consume stale.)

## 11b + 11c: feasibility study (store reads and render-time purity)

No implementation. A document (`phase-11b-feasibility.md`) answering, with evidence and prototypes on a
branch if useful:

- Can the reduction run during render without mutating the store (a speculative transaction the commit
  adopts), meeting the roadmap's §11 requirements (replay of user code and ids, isolation of speculative
  reductions including the options refiner's caches and invalidation generations, publication before child
  callbacks, render-time readers bound to the render's snapshot, server snapshots and hydration,
  synchronous sources, the date profile from an anchor with a committed-profile cache)?
- If so, how `useSyncExternalStore` fits: a stable receiver-safe snapshot getter (`getCurrentData`) and
  one urgency-aware subscription adapter per store (urgent changes still `flushSync` when not in a commit,
  round 1 #1, #2), the subscription vs `store.mount()` order (native subscription is passive; mount is a
  layout effect), React 17 (the published shim preferred, round 1), hydration (a server snapshot equal to
  the server's initial data).
- Acceptance tests it would need: committed A → transition to B → suspend/discard → a source completing
  or an API dispatch → resume/cancel, comparing render-hook counts, user-function calls, callbacks,
  controllers and DOM with today; driver-level locks for a child's mount callback dispatching, held
  `loading`, async results before subscription, Strict Mode, `<Activity>`; real server-to-client
  hydration.
- **The decision for Adam** if purity isn't achievable behavior-identically: keep today's render-time
  reduction (idempotent in practice, mount-gated effects) as the end state, or accept named behavior
  changes.

## Steps

1. **11a step 1:** the five contexts, their hooks, `CalendarInner` providing them; identity spec. No
   consumer converted.
2. **11a step 2:** convert the narrow consumers (with the exceptions above), opt the view shells,
   `Scroller` and `CalendarInner` out of `contextType`; counts compared (decreases listed).
3. **React 17 smoke run:** a separate workspace test package (`@fullcalendar-tests/react17`) with React 17
   dependencies and a legacy-render harness (`react-dom/test-utils`, one React instance shared with the
   built calendar), covering mount, update, unmount, Strict Mode, async data after mount, server rendering
   and hydration; React 18 alongside for the effect-remount behavior React 17's Strict Mode lacks.
4. **11b + 11c feasibility study** (documents only), then Adam's decision if needed.

Each implementation step: full suites in both runtimes, snapshots and counts, the React suite, a Sol
review.

## Open questions (my recommendation)

1. Convert the options-only consumers to `useViewOptions()` even though their re-render set barely
   shrinks (options change whenever the facade does, except on a `viewSpec`-only change)? Recommend yes:
   it's the narrow dependency the later `useOption` selectors build on, at no risk.
2. Vendor the `useSyncExternalStore` shim (recommended) or depend on `use-sync-external-store`?
3. Accept non-urgent changes rendering synchronously (recommended), or keep the default lane by
   scheduling the store's notifications (`startTransition`-like) to preserve today's timing exactly?

## Review round 1 (Sol, spec, high effort)

| # | Finding | Response |
|---|---|---|
| 1 | P1: a `useSyncExternalStore` update doesn't flush before dispatch returns; urgent changes need today's `flushSync` (drag queries the DOM right after) | 11b deferred into the feasibility study, which must keep an urgency-aware adapter |
| 2 | P1: `store.subscribe`/`getData` are unbound | same; the study specifies receiver-safe functions |
| 3 | P2: `contextType` is inherited; opt the built-ins out explicitly, keep the bases | 11a's opt-out paragraph |
| 4 | P2: subscription vs `store.mount()` order unresolved | the study |
| 5 | P2: the consistency check doesn't make render-time mutation safe | the study; acceptance tests listed |
| 6 | P2: shim and hydration contract underspecified | the study (published shim preferred); real hydration tests |
| 7 | P2: React 17 needs its own harness, in the step that needs it | step 3: a separate React 17 test package, now independent of the hook |
| 8 | P3: `ForegroundEvent`, `TimeGridCols`, `TimelineFg` exceptions | 11a's exceptions paragraph |

Open questions answered: 1 yes (direct reads; indirect facade subscriptions stay); 2 the published shim
(if 11b happens); 3 accept native blocking priority while keeping urgent `flushSync` (if 11b happens).
