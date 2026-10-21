# Phase 10: date profile

Status: plan, revision 1 (2026-10-21), for Sol's spec review.

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
3. The store keeps the navigation anchor, and derives the profile.
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

### 2. The config and the pure functions (`structs/date-profile.ts`)

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

export type RenderRangeBuilder = (currentRange: DateRange, currentRangeUnit: string, isRangeAllDay: boolean, config: DateProfileConfig) => DateRange

export function buildDateProfile(config, date, nowDate, direction?: 1 | -1, forceToValid = true): DateProfile
export function prevAnchor(config, profile: DateProfile, currentDate: DateMarker): DateMarker
export function nextAnchor(config, profile: DateProfile, currentDate: DateMarker): DateMarker
```

`buildDateProfile` is today's `build`, with the helpers as module functions taking the config;
`prevAnchor`/`nextAnchor` are today's `buildPrev`/`buildNext` date math (`startOf(currentDate, unit) ∓
dateIncrement`), so `buildPrev(...)` ≡ `buildDateProfile(config, prevAnchor(...), now, -1, force)`.
`buildDayTableRenderRange` stays as it is, and the daygrid and multimonth plugins set a new internal view
option `dateProfileRenderRange: tableRenderRange` (a `RenderRangeBuilder` wrapping it) instead of
`dateProfileGeneratorClass`.

### 3. The compatibility facade

`DateProfileGenerator` stays, in `protected-api` and in `ViewContext`/`CalendarData`, as a thin class
over a config: `build`, `buildPrev`, `buildNext`, `isHiddenDay`, `skipHiddenDays`, `trimHiddenDays`
delegate to the pure functions, and it exposes `config` and `hiddenDays`. Its own `buildRenderRange`
calls `config.buildRenderRange` or returns the range, and the pure build calls the facade's method when a
facade is involved, so a subclass from a custom `dateProfileGeneratorClass` still overrides it. The
store keeps accepting `dateProfileGeneratorClass`: with one, the store builds that class (today's path);
the core views don't set it anymore. (Decision logged in `questions-for-adam.md`: kept because it's typed
public, though marked internal.)

Internal callers move off the facade: `DaySeriesModel`, `MultiMonthView` and the timeline's
`isValidDate` take `HiddenDays` (`context.dateProfileGenerator.hiddenDays` until phase 11's contexts);
`buildToolbarProps` and the store use the pure functions.

### 4. State: the anchor

Today's state keeps the profile itself. Replace `dateProfile` with an anchor slice:

```ts
dateAnchor: { date: DateMarker, direction?: 1 | -1 } // what the profile is built from
```

and derive `dateProfile = buildDateProfile(config, anchor.date, nowKey, anchor.direction)`, memoized by
`(config, anchor, nowKey)`, where `nowKey` is `nowDate` only when `validRangeInput` is a function (the
only use of now in a build), else a constant. Stage 4 becomes:

- initially: anchor `{ date: currentDate }`;
- generator config changed: anchor `{ date: currentDate }` (today's rebuild);
- `CHANGE_VIEW_TYPE`: `{ date: action.dateMarker || currentDate }`; `CHANGE_DATE`:
  `{ date: action.dateMarker }`;
- `PREV`/`NEXT`: `{ date: prevAnchor/nextAnchor(...), direction: ∓1 }` if that profile is valid, else
  unchanged;
- then the `currentDate` adjustment, unchanged.

The derived profile goes into `CalendarData` as `dateProfile` (unchanged shape), and to plugin reducers
in their snapshot, as phase 9's derived data. `getState()` gets `dateAnchor` instead of `dateProfile`
(protected API).

**Identity:** a reduction that doesn't move the anchor, change the config or (for a now-dependent
`validRange`) the day returns the same profile object, as the previous-state profile did. The memo must
hold the final profile of each reduction (the base profile computed for `PREV`/`NEXT` on a config change
goes through the same memo first, so the final call is last). Counts and snapshots verify.

**The sanctioned change:** with a function `validRange`, crossing midnight (`UPDATE_NOW` with a new
day) rebuilds the profile with the new now. Today the profile keeps the old day's `validRange` until the
next navigation. Changelog FIX entry. Nothing else uses now in a build.

### 5. The pre-pass's hidden-day question

The removed block ("if the view displays a single day or smaller, skip hidden days") read `start`
before assigning it, in v6 too (`git show f662a1968`), so it never ran. Single-day views on a hidden day
are still handled: `buildRangeFromDuration`'s "range completely enveloped by hidden days" fallback skips
in the navigation direction. No change; a spec locks it (day views landing on hidden days, forward and
back, `dayCount` with hidden days).

## Steps

0. **Behavior locks and the oracle (before any change).**
   - Copy today's `DateProfileGenerator`/`TableDateProfileGenerator` into
     `vanilla-tests/src/lib/legacy-date-profile.ts` (test-only), with `buildDayTableRenderRange`.
   - Oracle spec: seeded random sequences (`PREV`, `NEXT`, `gotoDate`, `changeView`, `incrementDate`,
     `today`) over option mixes (`hiddenDays`, `weekends`, `dateIncrement`, `dateAlignment`, `dayCount`,
     `duration`, `validRange` value and function, `visibleRange`, `showNonCurrentDates`, `fixedWeekCount`,
     `slotMinTime`/`slotMaxTime` with `usesMinMaxTime` views, time zones), driving a real calendar and
     replaying the same sequence on the legacy generator with today's stage-4 rules, comparing every
     profile field by value and the toolbar's enabled states. Runs in both runtimes.
   - Locks: the hidden-day cases of §5; `validRange`/`visibleRange` functions' `this` and argument and
     call counts per navigation; `datesSet` arguments; the midnight behavior today (to be flipped in
     step 3).
1. **Hidden days and pure functions.** `structs/hidden-days.ts`, `structs/date-profile.ts`; the class
   becomes the facade; `dateProfileRenderRange` for daygrid/multimonth; internal callers take
   `HiddenDays`. The oracle now also compares the pure functions directly.
2. **Toolbar and store on the pure functions,** still with `dateProfile` in state.
3. **The anchor:** `dateAnchor` replaces `dateProfile` in state, the profile derived and memoized; the
   midnight change with its changelog entry.
4. **Sol review rounds** per step; verification per step: full suites in both runtimes, DOM snapshots
   and counts.

## Risks

- **Identity of the derived profile** (step 3): a miss re-renders every view. Single-entry memo with the
  final call last; counts catch it.
- **`validRange`/`visibleRange` call counts**: user functions are called on every build today, including
  the toolbar's three builds per reduction. The derived profile must not call them more often (memo hits
  don't call them; the toolbar's builds stay as today).
- **Direction:** the anchor must keep the navigation direction, or a re-derivation (now change, config
  change) would skip hidden days the other way.
- **Custom `dateProfileGeneratorClass`:** kept through the facade; a spec with a subclass overriding
  `buildRenderRange`.
- **Phase 7b** consumes `HiddenDays` and the table render range afterwards; keep both pure and
  explicit-input.

## Open questions (my recommendation)

1. Keep `dateProfileGeneratorClass` working? Recommend yes (typed public), via the facade.
2. Keep `DateProfileGenerator` in `protected-api` and `ViewContext`? Recommend yes until phase 11 splits
   the contexts; then `ViewContext` can carry `hiddenDays` and the config instead.
3. Memo key for now: only for a function `validRange` (recommended), or always (simpler, but the profile
   object would change daily for everyone, re-rendering views at midnight).
