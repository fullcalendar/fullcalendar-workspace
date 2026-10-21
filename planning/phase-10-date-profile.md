# Phase 10: date profile

Status: plan, revision 2 (2026-10-21), after Sol's spec review round 1 (re-scoped: the profile stays
stored state; see "Review round 1").

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
3. The store records the navigation anchor beside the stored profile, enough to rebuild it at midnight
   (deriving the profile from the anchor moved to phase 11, review round 1).
4. Behavior-identical except the sanctioned change. Same DOM, render-hook counts never up, same callback
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

### 2. The config, the operations and the pure functions (`structs/date-profile.ts`)

```ts
export interface DateProfileConfig {
  dateEnv: DateEnv
  calendarApi: CalendarApiImpl // `this` for validRange/visibleRange functions, as today
  hiddenDays: HiddenDays
  duration: Duration | null
  durationUnit: string | null
  dayCount?: number
  dateAlignment?: string
  dateIncrement?: Duration
  slotMinTime: Duration
  slotMaxTime: Duration
  usesMinMaxTime: boolean
  showNonCurrentDates?: boolean
  fixedWeekCount?: boolean
  validRangeInput?: DateRangeInput | ((this: CalendarApiImpl, nowDate: Date) => DateRangeInput)
  visibleRangeInput?: DateRangeInput | ((this: CalendarApiImpl, nowDate: Date) => DateRangeInput)
  buildRenderRange?: RenderRangeBuilder // view-supplied (the daygrid/multimonth table range)
}
```

Today's class decomposes `build` into overridable steps (`buildValidRange`, `buildCurrentRangeInfo`,
`buildRangeFromDuration`, `buildRangeFromDayCount`, `buildCustomVisibleRange`, `getFallbackDuration`,
`buildRenderRange`, `adjustActiveRange`, `buildDateIncrement`, `refineRange`, the hidden-day methods), and a
custom subclass may override any of them (review round 1 #1). So the pure functions are written against
an **operations table** with those steps, not against the config directly:

```ts
export interface DateProfileOps { // each step of today's class, same names and signatures
  buildValidRange(nowDate): OpenDateRange
  buildCurrentRangeInfo(date, direction): { duration, unit, range }
  buildRangeFromDuration(date, direction, duration, unit): DateRange
  // ... every method of today's class
  isHiddenDay(day): boolean
  skipHiddenDays(date, inc?, isExclusive?): DateMarker
  trimHiddenDays(range): DateRange | null
}
export function buildDateProfile(ops: DateProfileOps, config, date, nowDate, direction?, forceToValid = true): DateProfile
export function buildPrevDateProfile(ops, config, profile, currentDate, nowDate, forceToValid?): DateProfile
export function buildNextDateProfile(ops, config, profile, currentDate, nowDate, forceToValid?): DateProfile
export function createDateProfileOps(config): DateProfileOps // the built-in steps, as plain functions
```

Each step's default is a module function of `(ops, config, ...)` (today's method body, with `this.x(...)`
becoming `ops.x(...)`), so one implementation serves both:

- **Built-in views:** `createDateProfileOps(config)`, a plain object of those functions closed over the
  config. The daygrid and multimonth plugins supply the table range as the internal view option
  `dateProfileRenderRange` instead of `dateProfileGeneratorClass`.
- **A custom `dateProfileGeneratorClass`** (from a plugin's view; the `views` option never reached it,
  see step 0's lock): `DateProfileGenerator` stays a class whose methods call the same module functions
  with `this` as the ops, so any override, of any step, applies everywhere the store, the toolbar and
  the hidden-day consumers use it, as today. **Precedence:** a custom class wins; a view with a custom
  class doesn't get the inherited `dateProfileRenderRange` (a custom class that replaced the table range
  keeps having replaced it).

The store holds a `DateProfileOps` (either kind) where it holds the generator today, memoized by the same
props. `DateProfileGenerator` and `ViewContext.dateProfileGenerator` stay, typed as the ops (the class
implements it), so plugins and the protected API keep working.

### 3. Hidden-day consumers stay put in this phase

`DaySeriesModel`, `day-cols`, `buildDayTableModel`, `useDayGridViewData`, `useTimeGridViewData`,
`SingleMonth`/`MultiMonthView`, and premium's `buildTimelineDateProfile`, `TimelineLaneSlicer`/
`sliceInstantSpan`, `isValidDate` and the timeline's lanes and print rows keep calling
`dateProfileGenerator.isHiddenDay`/`skipHiddenDays` through the ops, unchanged (review round 1 #7: a
signature change there needs that whole chain in one step). The ops also expose `hiddenDays`
(`HiddenDays`, built from the ops' own methods for a custom class, so overrides apply), for 7b and phase
11 to migrate those consumers to.

### 4. State: the profile stays stored; an anchor beside it

Revision 1 derived the profile from an anchor. Review round 1 (#2, #3) showed that can't keep today's
build schedule: a rejected `PREV`/`NEXT` candidate, a config change plus an action (two builds, the first
discarded), would change `validRange`/`visibleRange` callback counts and profile identity unless the
cache special-cased each. So the profile stays in state, built at exactly today's points by stage 4
(unchanged control flow, now through the ops). Beside it, a new slice records what the stored profile was
built from:

```ts
dateAnchor: { date: DateMarker, direction?: 1 | -1, nowDay: number } // nowDay: the day-snapped now's value
```

set wherever stage 4 builds the profile that's kept: initially and on a config change `{ date:
currentDate }` (direction reset, as today's rebuild, review round 1 #6), `CHANGE_VIEW_TYPE` `{ date:
action.dateMarker || currentDate }`, `CHANGE_DATE` `{ date: action.dateMarker }`, an accepted `PREV`/`NEXT`
`{ date: the prev/next date, direction: ∓1 }`; a rejected one leaves it.

**The sanctioned change:** when no build happened this reduction, the view's `validRangeInput` is a
function, and `nowDate.valueOf()` (the day-snapped now, a civil-day value, review round 1 #4) differs from
`dateAnchor.nowDay`, stage 4 rebuilds `buildDateProfile(ops, config, anchor.date, nowDate,
anchor.direction)` and records the new `nowDay`. A DST wake or a same-day timer wake has the same
`nowDate` value, so nothing happens. Effects: the profile, `validRange` and the toolbar's buttons follow
the new day; the function is called once more, at midnight only. (The toolbar's three builds already
run at every timer wake today, midnight and DST wakes included: the timer's new `nowDate` object misses
its memo. Locked; unchanged.) Changelog FIX entry. Applies to custom classes too (same rule, through
their ops).

`getState()` gains `dateAnchor` (protected API). Nothing else about the profile's identity changes.
"Keep only an anchor and derive the profile" (the roadmap's sketch) moves to phase 11's requirements,
where render-time derivation is the subject.

### 5. The pre-pass's hidden-day question

The removed block ("if the view displays a single day or smaller, skip hidden days") read `start`
before assigning it, in v6 too (`git show f662a1968`), so it never ran. Single-day views on a hidden day
are still handled: `buildRangeFromDuration`'s "range completely enveloped by hidden days" fallback skips
in the navigation direction. No change; a spec locks it (day views landing on hidden days, forward and
back, `dayCount` with hidden days).

## Steps

0. **Behavior locks and the oracle** (done, below), extended per review round 1 #5 before step 1:
   - **Callback traces:** every oracle case records the `validRange`/`visibleRange` calls (count, order,
     arguments by value) as a digest, compared with digests recorded from today's code, so counts and
     orders can't drift, including builds whose results are discarded.
   - **More operations in the random sequences:** option changes mid-sequence (`hiddenDays`, `weekends`,
     `dateIncrement`, `timeZone`), so config changes combine with later actions, and `changeView` with a
     date.
   - **Deterministic cases:** rejected `PREV`/`NEXT` keeps the profile object (identity) and builds as
     today; a no-op action keeps it; same-date navigation; `changeView` with a date, a range and none; the
     direction reset (day view, weekends hidden, `prev` from Monday to Friday, then hide Fridays: today it
     goes forward to Monday); initial dates with times; initialization without `initialDate` (the
     now-manager's precise marker vs the day-snapped now given to `validRange`); a time zone change
     mid-sequence (the civil `currentDate` kept); DST: timer wakes at both 2024 New York transitions don't
     rebuild; toolbar builds (`forceToValid: false`) only on its memo misses.
   - Pure-function comparisons run once (they're runtime-independent); the real-calendar oracle and locks
     run in both runtimes.
1. **Hidden days, the ops and the pure functions.** `structs/hidden-days.ts`, `structs/date-profile.ts`;
   `DateProfileGenerator` becomes the class over the module functions; built-in views get
   `createDateProfileOps`, daygrid/multimonth `dateProfileRenderRange`; the store and toolbar call the ops.
   Consumers unchanged (§3). Specs: a custom class from a plugin's view overriding `build`,
   `buildCurrentRangeInfo`, `buildValidRange` and `isHiddenDay` (each override observed in the initial
   profile, navigation, the toolbar and a hidden-day consumer); a custom class on a table view doesn't get
   the table range. The oracle compares the pure functions directly too.
2. **The anchor and the midnight rebuild.** `dateAnchor`; the rebuild rule; the step-0 midnight lock
   flipped; DST and same-day wakes locked as no-ops; changelog entry.
3. **Sol review rounds** per step; verification per step: full suites in both runtimes, snapshots and
   counts.

## Risks

- **Every override path of a custom class** must stay virtual: the module functions call `ops.x`, never
  a sibling module function directly. A spec overrides several steps.
- **The ops' identity** follows today's generator memo (same props), so contexts and memos keyed on it
  keep their identity.
- **Midnight:** only where `validRange` is a function, only on a civil-day change, never on a reduction
  that already built.
- **Phase 7b** consumes `hiddenDays` and the table render range; both stay pure and explicit-input.

## Open questions (answered, review round 1)

1. Keep `dateProfileGeneratorClass` working: yes, with every override (the ops design).
2. Keep `DateProfileGenerator` in `protected-api` and `ViewContext`: yes, through phase 10.
3. Midnight key: the day-snapped now's value, only for a function `validRange`.

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
