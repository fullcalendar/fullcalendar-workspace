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
