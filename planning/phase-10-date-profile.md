# Phase 10: date profile

Status: plan, revision 3 (2026-10-21), after Sol's spec review rounds 1 and 2. Re-scoped twice: the
profile stays stored state (round 1), and the midnight change moved to the loose ends (round 2), so
phase 10 is behavior-identical.

Roadmap §10: hidden days as a small value object, a plain config plus a view-supplied render-range
function instead of `TableDateProfileGenerator`, pure `buildDateProfile` / prev / next, the store keeping
an anchor and deriving the profile, oracle tests against the old generator, one intended behavior change
(the profile recomputes at midnight when `validRange` depends on now), and the pre-pass's hidden-day
question.

## What's there today

- **`DateProfileGenerator`** (`standard/packages/preact/src/DateProfileGenerator.ts`, 496 lines): a
  class built per view from `DateProfileGeneratorProps` (duration, `dayCount`, `dateAlignment`,
  `dateIncrement`, hidden days, `slotMinTime`/`slotMaxTime`, `usesMinMaxTime`, `showNonCurrentDates`,
  `validRangeInput`/`visibleRangeInput` (values or functions called with `calendarApi` as `this`),
  `fixedWeekCount`, `dateEnv`, `calendarApi`). Methods: `build(date, now, direction?, forceToValid =
  true)`, `buildPrev`/`buildNext(profile, currentDate, now, forceToValid?)`, `buildValidRange(now)`,
  `buildCurrentRangeInfo(date, direction)`, `buildRangeFromDuration`, `buildRangeFromDayCount`,
  `buildCustomVisibleRange`, `buildRenderRange` (identity; overridden), `adjustActiveRange`,
  `buildDateIncrement`, `refineRange`, and the hidden days: `initHiddenDays`, `isHiddenDay`,
  `skipHiddenDays`, `trimHiddenDays`.
- **`TableDateProfileGenerator`** (`daygrid/TableDateProfileGenerator.ts`) overrides only
  `buildRenderRange` with `buildDayTableRenderRange` (snap year/month to weeks, `fixedWeekCount`). Set as
  the internal view option `dateProfileGeneratorClass` by the daygrid and multimonth plugins.
- **Built by the store** (`reducers/store.ts`, `_computeCurrentViewData`): `buildDateProfileGenerator`
  memoized by its props object (`memoizeObjArg`), so a new generator only when an input changes. It's in
  `CalendarCurrentViewData.dateProfileGenerator` (so in `CalendarData`) and in `ViewContext`.
- **State** (`CalendarDataManagerState`): `currentDate` and `dateProfile`. Stage 4 of the pipeline:
  initially `build(currentDate, now)`; otherwise the previous profile, rebuilt from `currentDate` if the
  generator changed, then `reduceDateProfile` (`reducers/date-profile.ts`: `CHANGE_VIEW_TYPE` and
  `CHANGE_DATE` build; `PREV`/`NEXT` take `buildPrev`/`buildNext` only if valid; else unchanged), then
  `currentDate` becomes `currentRange.start` after `PREV`/`NEXT` or when outside `activeRange`.
- **Other callers:**
  - `buildToolbarProps` (store): `build(now, now, undefined, false)`, `buildPrev`/`buildNext(…, false)`
    for the buttons' enabled state.
  - `common/DaySeriesModel.ts:35`, premium `timeline/timeline-date-profile.ts:307` (`isValidDate`):
    `isHiddenDay`.
  - `multimonth/components/MultiMonthView.tsx:183-195`: `skipHiddenDays` around
    `buildDayTableRenderRange`, per month.
  - `protected-api`: `DateProfileGenerator`, `DateProfile`, `computeMajorUnit`, `isMajorUnit`.
- **`dateProfileGeneratorClass`** is under `VIEW_ONLY_OPTION_REFINERS`' "internal only" group, but typed
  into `ViewOptions`, so a custom view config could set it.

## Goals

1. Pure functions of explicit inputs for the profile and hidden days, testable without a calendar.
2. No class hierarchy for the render range: a view supplies a function.
3. Behavior-identical, without exception (the midnight change moved out, review round 2; deriving the
   profile from an anchor moved to phase 11, review round 1).
4. Same DOM, render-hook counts never up, same callbacks. Same DOM, render-hook counts never up, same callback
   arguments (`datesSet`, `validRange`/`visibleRange` functions' `this` and argument).

## Design

### 1. Hidden days (`structs/hidden-days.ts`)

```ts
export interface HiddenDays {
  isHidden(dayOrDate: number | DateMarker): boolean // day-of-week index, or a marker (UTC day)
  skip(date: DateMarker, inc?: number, isExclusive?: boolean): DateMarker // today's skipHiddenDays
  trim(range: DateRange): DateRange | null // today's trimHiddenDays (open ends allowed)
}
export function buildHiddenDays(hiddenDays: number[] | undefined, weekends: boolean | undefined): HiddenDays
```

Same semantics and errors as today (`invalid hiddenDays` when all are hidden; a copy, never mutating
the user's array, #7069). Memoized by its two inputs where the store builds it, so identity follows
them.

### 2. One class over module functions (`structs/date-profile.ts`)

Today's class decomposes `build` into overridable steps (`buildValidRange`, `buildCurrentRangeInfo`,
`buildRangeFromDuration`, `buildRangeFromDayCount`, `buildCustomVisibleRange`, `getFallbackDuration`,
`buildRenderRange`, `adjustActiveRange`, `buildDateIncrement`, `refineRange`, `initHiddenDays`,
`isHiddenDay`, `skipHiddenDays`, `trimHiddenDays`), and a custom subclass from a plugin's view may override
any of them (round 1 #1). So:

- **Module functions, one per step,** taking the generator as their first argument (`gen`), with every
  call to a sibling step going through it (`gen.buildCurrentRangeInfo(...)`, never the module function
  directly): open recursion, so any override applies wherever the step is reached.
  `buildDateProfile(gen, date, now, direction?, forceToValid?)`, `buildPrevDateProfile`,
  `buildNextDateProfile` and the rest are testable with a plain generator object.
- **`DateProfileGenerator` stays the one class,** its methods one-line delegations to those functions
  with `this`. It keeps today's shape exactly (round 2): the `props` it was constructed with, the
  constructor calling `this.initHiddenDays()` virtually, `isHiddenDayHash`, and today's distinction that
  `skipHiddenDays` reads the hash while `isHiddenDay` is a method (overriding `isHiddenDay` doesn't
  change skipping, today or after).
- **`TableDateProfileGenerator` goes:** the base class's `buildRenderRange` returns
  `props.renderRange?.(range, unit, isRangeAllDay, props) ?? range`, and the daygrid and multimonth plugins
  supply that function as the internal view option `dateProfileRenderRange` (`buildDayTableRenderRange`
  stays a pure function, also used by `MultiMonthView`). A custom `dateProfileGeneratorClass` wins, and
  doesn't receive the inherited `dateProfileRenderRange` (a custom class that replaced the table range
  keeps having replaced it).
- **The store** still builds a generator per view (`dateProfileGeneratorClass` or the base class),
  memoized by the same props (`memoizeObjArg`), so its identity, `ViewContext.dateProfileGenerator`'s
  type and every consumer's signature stay as they are (round 2 #4: no type migration needed). The store,
  the toolbar and stage 4 call the same methods as today.

### 3. Hidden days

`structs/hidden-days.ts` (§1) is what the module functions for the hidden-day steps use, built from the
generator's hash; the generator also exposes it as `hiddenDays` for 7b and phase 11 to migrate the
consumers (`DaySeriesModel`, `day-cols`, the daygrid/timegrid view data, `MultiMonthView`, the timeline's
date profile, lane slicer and `isValidDate`), which keep calling `isHiddenDay`/`skipHiddenDays` in phase 10.

### 4. State and now: unchanged

The profile stays stored state, built where it's built today (round 1 #2, #3). No anchor, no midnight
rebuild: the sanctioned change moved to the loose ends (round 2 #1–#3), with a design that answers that
round:

- At a new civil day (the day-snapped now's value changing), for a built-in generator whose
  `validRangeInput` is a function: compute only `buildValidRange` (one user call) and compare it, trimmed,
  by value with the stored profile's. Equal: nothing more (no new profile object, no `datesSet`).
- Different: dispatch an internal action (`REFRESH_DATE_PROFILE`) that stage 4 handles like `CHANGE_DATE`
  to the stored profile's anchor with its direction, and that the event sources (dirty fetches) and the
  event store (recurring expansion) treat as navigation, so the new range has its events; `datesSet` then
  fires because the dates changed.
- Custom generator classes excluded until they define a rebuild protocol.

### 5. The pre-pass's hidden-day question

The removed block ("if the view displays a single day or smaller, skip hidden days") read `start`
before assigning it, in v6 too (`git show f662a1968`), so it never ran. Single-day views on a hidden day
are still handled: `buildRangeFromDuration`'s "range completely enveloped by hidden days" fallback skips
in the navigation direction. No change; a spec locks it (day views landing on hidden days, forward and
back, `dayCount` with hidden days).

## Steps

0. **Behavior locks and the oracle** (done, below), plus per round 2 #5, before step 1:
   - rendered `datesSet` traces (receiver, arguments, counts) over a navigation sequence;
   - a custom class from a plugin's view overriding `initHiddenDays` (constructor-time), `buildPrev` and
     `buildNext` (calling `super`, and not), `buildCurrentRangeInfo`, `buildValidRange` and
     `isHiddenDay`, each observed (initial profile, navigation, the toolbar, a hidden-day consumer),
     with receiver checks;
   - the generator's identity: kept across an irrelevant option change, new on a relevant one.
1. **The module functions and the one class.** `structs/date-profile.ts`, `structs/hidden-days.ts`;
   `DateProfileGenerator` delegates; `TableDateProfileGenerator` replaced by `dateProfileRenderRange`.
   Nothing else changes. The oracle and locks must pass unchanged, in both runtimes, with snapshots and
   counts.
2. **Sol review rounds;** verification: full suites in both runtimes, snapshots and counts.

## Risks

- **Open recursion:** a module function calling a sibling module function directly would silently
  bypass an override. The custom-class spec overrides several steps; a grep in review.
- **Constructor order:** `initHiddenDays` runs in the constructor, virtually, as today.
- **Phase 7b** consumes `hiddenDays` and the table render range; both stay pure and explicit-input.

## Open questions (answered, review rounds 1 and 2)

1. Keep `dateProfileGeneratorClass` working: yes, with every override (open recursion through `gen`).
2. Keep `DateProfileGenerator` in `protected-api` and `ViewContext`: yes, the same class.
3. The midnight change: moved to the loose ends, with the design in §4.

## Review round 1 (Sol, spec, high effort)

Four P1s and three P2s on revision 1; revision 2 answers them:

| # | Finding | Response |
|---|---|---|
| 1 | P1: the render-range-only bridge loses a custom class's other overrides (`build`, `buildPrev`/`Next`, `buildCurrentRangeInfo`, helpers, hidden days) | §2: one implementation over an ops table; the class is its own ops, so every override applies; precedence of a custom class over `dateProfileRenderRange` |
| 2 | P1: a derived profile's memo can't retain the exact object on a rejected `PREV`/`NEXT` without rebuilding | §4: the profile stays stored state, built where it's built today |
| 3 | P1: callback counts include discarded builds (config change + action) | §4: today's build schedule kept; step 0 adds callback-trace digests |
| 4 | P1: a `Date` isn't a civil-day key; DST and timer wakes make new objects | §4: the day-snapped now's value |
| 5 | P2: the oracle needs traces, identity and more deterministic cases | step 0's extension |
| 6 | P2: direction must reset on a config change | §4; a lock |
| 7 | P2: migrating hidden-day consumers needs the whole chain in one step | §3: consumers stay; 7b and 11 migrate them |

## Review round 2 (Sol, spec, high effort)

Three P1s and two P2s on revision 2, the P1s all in the midnight rebuild; revision 3 answers them:

| # | Finding | Response |
|---|---|---|
| 1 | P1: a midnight rebuild makes a new profile even when equal, adding a `datesSet` call (and possibly `visibleRange` calls) | the midnight change moved to the loose ends, designed to compare `validRange` by value first and fire only on a real change (§4) |
| 2 | P1: a midnight range change doesn't fetch or expand events for the new range | same; the loose-ends design dispatches an action the event reducers treat as navigation |
| 3 | P1: replaying a custom class's navigation at midnight bypasses its overrides; `{ date, direction }` can't describe arbitrary overrides | same; custom classes excluded from it |
| 4 | P2: a plain ops type can't replace the class's instance type for the consumers | §2: the store keeps building `DateProfileGenerator` instances; no type changes |
| 5 | P2: rendered `datesSet` traces, custom constructor/navigation overrides, generator identity | step 0's additions |

Round 1's dispositions per Sol: #2, #4, #6 resolved; #1 resolved by open recursion (its midnight part
moved out); #3 resolved for existing build points; #5 completed by round 2's additions; #7 needs no type
work now.

## Step 0: behavior locks and the oracle (done)

- `vanilla-tests/src/lib/legacy-date-profile.ts`: the frozen pre-phase-10 generator (test-only).
  `protected-api` gained `asRoughDays`, `constrainMarkerToRange`, `parseRange`, `addWeeks`, `diffWeeks`
  for it.
- `view-dates/date-profile-oracle.ts`: 18 option mixes × 5 seeds × 60 random navigations, unrendered
  calendars, each transition checked against the frozen generator with stage 4's rules (profile by value,
  current date, the toolbar's three flags), on a frozen clock (`now` otherwise advances between the
  expected and actual reads). About a second. Mutation-checked: ignoring the direction in
  `buildRangeFromDayCount` fails six cases.
- `view-dates/date-profile-locks.ts`: `validRange`/`visibleRange` functions' `this` and argument, and
  their call counts (4 per navigation: the profile's build and the toolbar's three; 5 for a view change,
  which rebuilds first); single-day views on hidden days, forward and back, and `dayCount` backward;
  a new day leaves a now-dependent `validRange` stale (step 3 flips it); `dateProfileGeneratorClass` from
  a plugin's view is used, but from the `views` option it's ignored (the store reads option defaults).
- Found while writing them: in the local time zone, `gotoDate(date)` drops the date's milliseconds
  (`createMarker`), and `today()` uses the advancing now. Neither changes here.

### Step 0, extended per review round 1 #5 (done)

- **Oracle:** random sequences now also change options mid-sequence (`weekends`, `hiddenDays`,
  `dateIncrement`, `timeZone`; an option that compares equal makes no new generator, so no rebuild, as
  the store) and `changeView` with a date; a rejected `PREV`/`NEXT` must keep the very profile object; the
  user range functions' calls (order, `this`, argument) are traced while the calendar acts and checked
  against digests recorded from today's code (90 cases).
- **A pre-existing crash** the random sequences found: switching to a table view (dayGrid) whose
  week-aligned range is all hidden days throws in `buildDayTableRenderRange` (`currentRange` is `null`),
  e.g. `dateAlignment: 'week'` with `dayGridDay` and weekends hidden. Behavior-identical phase, so not
  fixed; the oracle requires the calendar (not only the frozen generator) to crash alike and ends the
  sequence. Logged for Adam; on the loose-ends list.
- **Locks:** rejected `prev` keeps the profile object and builds as before (4 calls: the discarded
  candidate and the toolbar's three); a non-navigating action keeps it; the direction reset (forward to
  Monday after hiding Fridays); `changeView` with a date (`getDate()` keeps June 8, the profile's
  `currentDate` is June 20), a range and neither; an initial date's time; the civil marker across a time
  zone change; initialization from the precise now with `validRange` given the day-snapped now; DST wakes
  (spring and fall 2024, New York) keep the profile object, with the toolbar's three builds.
- Both runtimes: 108 specs, about 1.5 s.
