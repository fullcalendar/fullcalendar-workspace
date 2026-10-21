# Questions and judgment calls for Adam

Logged during autonomous work (from 2026-10-21), for review at the end. Each says what was decided, why,
and how to undo it. Newest last.


## Order: 10, then 7b, then 11, then loose ends

Asked for 7b's implementation too (pending its plan). Placed between 10 and 11: its column model reads
hidden days and the date profile (phase 10 rewrites them), and phase 11's context split and render-time
purity are simpler with one pure pipeline. If the reviewed plan needs something from phase 11, 7b moves
after it, noted here.

## Phase 10 re-scoped after its spec review: the profile stays stored

Sol's round 1 found that deriving the date profile from an anchor (the roadmap's sketch) can't keep
today's behavior without a special cache: a rejected prev/next must keep the exact profile object, and
user `validRange`/`visibleRange` functions are called on every build today, including builds whose
results are thrown away. So phase 10 keeps the profile as stored state, built where it's built today, and
records an anchor beside it only for the sanctioned midnight rebuild. Deriving it moved to phase 11's
requirements. Same call as phase 9's re-scope: the conservative one.

Also: a custom `dateProfileGeneratorClass` keeps every override working (one implementation over an
operations table the class itself implements), though the option is marked internal. Only a plugin's view
can set it anyway: the `views` option's value is ignored today (locked by a spec).

## A pre-existing crash, not fixed in phase 10

Phase 10's randomized oracle found that switching to a dayGrid view whose week-aligned range is entirely
hidden days throws (`Cannot destructure property 'start' of 'currentRange' as it is null`, in
`buildDayTableRenderRange`), e.g. `dateAlignment: 'week'` with `dayGridDay` and weekends hidden. Phase 10
is behavior-identical, so it's locked as-is and scheduled with the loose ends. It's an odd configuration;
no issue filed that I know of.

## Phase 10's midnight change moved to the loose ends

The roadmap's one sanctioned behavior change for phase 10 (a now-dependent `validRange` recomputing at
midnight) turned out to need more than a rebuild: Sol's round 2 showed it would fire `datesSet` even when
nothing changed, leave the new day without its events (no fetch or recurring expansion on a timer tick),
and couldn't replay a custom generator's navigation. So phase 10 is purely behavior-identical, and the
fix is on the loose-ends list with a design that answers those (compare first, then dispatch a real
navigation-like action). It's a small, rare bug; nothing regresses by waiting.

## Phase 10: a custom generator class on a dayGrid view stops crashing

A plugin view of type `dayGrid` (or `multiMonth`) that sets its own `dateProfileGeneratorClass` crashes
today ("not a constructor": the view configs' merge combines its class with the table one into a function
wrapper). Phase 10 replaces the table class with a render-range function, so the combination stops
happening and the custom class just works (without the table's week-snapped range). It's an internal
option (typed public), so no changelog entry. Locked first as a crash; flipped in step 1.

## Phase 11: `useSyncExternalStore` and render-time purity become a feasibility study first

Sol's spec review showed that switching the React driver to `useSyncExternalStore` while keeping today's
render-time reduction has two real problems (urgent drag updates must still flush synchronously; mount
ordering) and buys little on its own: the reduction would still mutate the store during render. So phase
11 does the granular contexts (11a) and a React 17 smoke-test package now, and writes a feasibility study
for render-time purity (with `useSyncExternalStore` as part of it) before implementing anything there. If
purity can't be made behavior-identical, that's your call: keep today's render-time reduction as the end
state, or accept named behavior changes.

## Phase 7b: one planned characterization couldn't be written as specified

The plan wanted a state-level comparison of today's resource splitter/joiner against the new
projection (the exact `affectedInstances` during a drag mixing resource and resourceless events, and
during the all-filtered fallback). The scheduler package has no `protected-api` entry, so the tests
can't reach those internals. The DOM-level halves are written and pass. The new projection gets unit
specs over hand-built models checked against the plan's rules table instead. If you'd rather the
scheduler grow a `protected-api` for tests, that's a small follow-up.

Smaller things the step-0 specs found (no action needed; all locked as today's behavior):

- Selecting an event needs a touch long-press: a mouse interaction unselects.
- Dragging into DayGrid or the all-day row shows a highlight, never a mirror. So an event's source
  colour can't visibly change on a timed → all-day drag, but it does change on the reverse.
- An all-day event dragged into the timed columns gets a mirror whose `isDragging` is false.
- TimeGrid's selection mirror remounts on `addEvent` and on any unrelated `setOption`. That's a count
  quirk, not visible.
- An event input with `resourceId: undefined` becomes the resource id `'undefined'`.

Step 2a's mutation checks confirmed the cost of that gap: three deliberate breakages go uncaught
because nothing in the DOM shows them (the keying built from the view's resources instead of the
model's participants, the resourceless interaction metadata merged in, and resource membership for
the timed lane's event selection). Each only affects things that render nowhere, so there's no
user-visible risk today, but nothing would flag a regression if a later change made them visible.
A scheduler `protected-api` for tests would close it.

## Phase 11: the React 17/18 smoke run's findings

- **CI doesn't run the new smoke packages.** `@fullcalendar-tests/react17` and `react18` run with
  `standard-scripts test --other` or `pnpm --filter @fullcalendar-tests/react17 test`, but CI installs with
  `--filter '!@fullcalendar-tests/*'` and tests only `@fullcalendar/react`. Adding them is two filters in
  `.github/workflows/ci.yaml` (install and test); I left CI alone for you to decide.
- **React 17 and 18 log a server-rendering warning per `useLayoutEffect`** ("useLayoutEffect does nothing
  on the server", hundreds per `renderToString`). Pre-existing; React 19 dropped the warning. The usual fix
  is an isomorphic layout effect (`useEffect` on the server). The smoke specs tolerate exactly that
  warning, and fail on any other `console.error`. Worth fixing? It's dev-only console noise for SSR users
  on 17/18.
- **Caught and fixed:** phase 11a's `static contextType = undefined` made React 17 and 18 warn of an
  invalid contextType in development. It's `null` now.
- **Tooling note:** in this worktree, `pnpm install` without `--store-dir` wants to delete and rebuild
  `node_modules`: it was installed against the main checkout's store
  (`/Users/adam/Code/fullcalendar-workspace/.pnpm-store/v10`), and no `store-dir` is configured here. I
  passed that store explicitly, offline. The committed lockfile change is only the two new importers
  (a filtered install also reshuffled some Angular peer variants; I didn't keep that).

## Loose ends: a top-level option quirk found while fixing per-button options

`setOption('eventClass', 'b')` on a calendar created with `eventClass: 'a'` gives events both classes:
the user's own option layers (initial options, `setOption`, a view type's and its super type's
`views` options) are merged with the same rules as theme-vs-user layers, so class options join and
content options fall back to the earlier layer's, instead of the later one replacing it. Pre-existing,
and it applies to every class, content and lifecycle option. The per-button fix deliberately keeps the
user's layers replacing per button (the old behavior), so buttons don't gain this quirk. Fixing it for
top-level options would be a behavior change (a separate merge for the user's layers, as buttons now
have); your call.

## Phase 11: render-time purity (11c) needs your decision

`planning/phase-11b-feasibility.md` (reviewed by Sol): strict render-time purity can't preserve every
behavior of today's. A render that never commits (Suspense, transitions, `<Activity>`) advances the store
today, so later API reads see its state; a pure store can't keep that. Other differences (refetching,
reparsing, held callbacks) are avoidable only with cross-transaction caches, and the outlined design
would raise render counts. My recommendation is **option A**: keep today's render-time reduction as the
end state, document its guarantees in the store and the roadmap, and close §11's purity item. Options
B (a transactional store, accepting named changes) and C (`useSyncExternalStore` without purity) are
costed in its §5-6. Until you decide, 11b/11c stays unimplemented.

Tied to it: the loose end "render-time side effects" (the emitter's option binding, the now timer
re-arming during render). Moving them to the commit is §3 (c) and (d) of the study: small behavior and
timing changes. Under option A I'd leave them as they are (documented); say if you want them moved anyway.

## Loose ends: a pre-existing crash when no date of the visible range is valid

Creating a calendar whose visible range has no valid date throws a TypeError (reading `start` of a null
`activeRange`, first in the title builder): for example `initialView: 'timeGrid'`, `visibleRange` ending
yesterday, `validRange: (now) => ({ start: now })`. Pre-existing; Sol found it reviewing the midnight change,
which now avoids it (a midnight rebuild with no active range keeps the old profile). Supporting a null
active range everywhere (title, views, event slicing) is a separate fix; not done.
