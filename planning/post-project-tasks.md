# Post-Project Tasks

The backlog for after the test revamp lands: decisions first, then bugs to fix, then GitHub housekeeping. Every known bug has an `it.fails` test, except the all-day drop gap, whose patch brings its own tests.

## Decisions

### All-day drop gap: how to fix it

In `timeGridWeek`, dragging a timed event into the bottom ~10px of the all-day row drops it into the timed slot below, or not at all. The cause is the subject-center adjustment in `HitDragging`: hit queries run at `pointer + coordAdjust`, so near the cell's bottom edge they land in the timed area or on the divider. (It isn't a divider-extension hack; v7 has none.) Same in `timeGridDay`, RTL and resource timeGrid.

A patch is ready in `postponed-fixes/all-day-drop-gap.md`: when the centered query misses, or disagrees about `allDay`, use the raw pointer's hit. It has sweep tests that fail before it and pass after. The decision there: generalize that rule, and/or build the "leeway between drop targets" design so the mirror doesn't blink over the 4px divider. No test covers the gap yet; the test models aim at the cell's center.

### multiMonth: should selection and resizing cross months?

Each month is its own component and only hit-tests itself, so a selection or resize can't go from one month's grid into another's. Tested as `it.fails` in `date-select/multimonth.ts` and `event-resize/multimonth.ts`. If that's intended, turn them into plain tests asserting no callback.

### Keyboard focus after activating a nav link

Activating a nav link (e.g. a day number) with the keyboard changes the view, which removes the link, so focus falls to `<body>` and a screen-reader user loses their place. Where should focus go: the new view's heading, its first cell, the matching day? Details in `archive/agent-notes/gaps-a11y-sticky.md`.

## Bugs with an `it.fails` test

Each is an `it.fails` test with a `KNOWN BUG` comment explaining it. It passes while the bug exists and fails once it's fixed: then change `it.fails` to `it`. Find them all (including conditional ones like `itNotUnderReact` in `more-link/click.ts`) with:

```sh
grep -rn "it\.fails" standard/packages/vanilla-tests/src premium/packages/vanilla-scheduler-tests/src
```

- **A week-aligned timeline's active range isn't its slots' range.** With `duration: { days: 183 }`, `slotDuration` or `slotHeaderInterval` of `{ weeks: 1 }`, `firstDay: 1` and a Wednesday initial date (Jan 24), the slots cover Jan 22 – Jul 23, but `activeStart`/`activeEnd` stay Jan 24 – Jul 26. Events are fetched for the active range only, so an event on Jan 22 doesn't render though its slot does, and Jul 23–25 has no slot. Likely cause: `normalizeRange` in `timeline-date-profile.ts` aligns the slots' range to `largeUnit`, but not the date profile's. Open detail for the fix: extend the end to whole weeks (Jul 30, as dayGrid does) or keep 26 slots. The test asserts only that the active range is the slots' range (`visible-range/timeline.ts`). Fix with the next one.
- **Timeline weeks given in days don't align to `firstDay`.** `{ days: 7 }` or `{ days: 14 }` as slots or header intervals isn't week-aligned, though `{ weeks: 1 }` is: only a slotDuration whose greatest unit is week/month/year sets `largeUnit`, and slotHeaderInterval is never considered (`visible-range/timeline.ts`).
- **#4937:** timelineYear with `slotHeaderInterval: { months: 1 }` and `slotDuration: { days: 1 }` warns and renders 12 month slots (`visible-range/timeline.ts`).
- **Timeline `next()` moves backwards** when `dateIncrement` is smaller than the duration (`visible-range/scheduler-views.ts`).
- **`ResourceApi`:** `toPlainObject()` never outputs `eventColor`, and `setProp()` drops event-styling props (`resource-data/crud.ts`).
- **#7300: `EventApi.getResources()` returns `null` entries** for an unknown resource id, or before async `resources` arrive, though the type is `ResourceApi[]` (it maps ids through `getResourceById` without filtering). The test expects them left out; #7300 also suggests typing it `(ResourceApi | null)[]` instead (`resource-data/event-association.ts`).
- **`startStr`/`endStr` of a nonexistent (spring-forward) time name a different instant than `start`/`end`.** `'2024-03-10T02:30:00'` in America/New_York resolves to 03:30 EDT (07:30Z) for `start` and the rendering, but `startStr` is `'2024-03-10T02:30:00-04:00'` (06:30Z), and fed back into `addEvent` it moves the event an hour earlier. Same for `endStr` and `toPlainObject()`. Not a breaking fix: it only changes output for wall-clock times that don't exist. In `buildRangeEdgeOutput` (`standard/packages/preact/src/structs/event-instance.ts`, since v7.1.0), the no-instant branch takes `date` from `dateEnv.toDate(marker)`, which resolves the gap, but formats `dateStr` from the unresolved marker; derive both from `dateEnv.toDate(marker).valueOf()`, as the instant branch does (`event-render/timeline.ts`). No GitHub issue; #3887 (closed) is the closest.
- **Resource views rank a source's `color` above a resource's `eventColor`,** against the docs and views without resources (`resource-data/event-styling.ts`). The fix changes colors for apps that set both, so it could wait for v8; see the precedence section of `postpone-till-next-major.md`.
- **dayGrid business hours:** a range crossing a week boundary leaves the Sunday unshaded (`business-hours/daygrid.ts`).
- **A lone view button is `role=tab` with no `tablist`** (`accessibility/aria.ts`).
- **Prev, next and today are announced as toggle buttons:** they get `aria-pressed="false"`, because `ToolbarSection.tsx` gives every non-tab button `'aria-pressed': isSelected`. Only view buttons should have a pressed or selected state (`accessibility/aria.ts`). Adam: fix this at the end of the project.
- **Under React, `moreLinkClick`'s `jsEvent` is a SyntheticEvent,** not the native event (`more-link/click.ts`).
- **A Google Calendar ID or API URL given as a plain string source is fetched as a JSON feed,** because global plugins (the built-in JSON feed source) are added after the calendar's plugins and win (`event-sources/google-calendar.ts`). Same in v6; no GitHub issue found.

## GitHub housekeeping

- **Close #2955** (open): `drop` reported an external event's `startTime` instead of just the day. Fixed: `drop` reports the day (`dateStr` with no time, `allDay: true`) in dayGrid and resource dayGrid, tested in `event-drag/external.ts` of both packages ("applies the event data's startTime on the dropped day"). The non-zoned-time complaint doesn't apply once no time is reported. Close with a note naming the release.
- **Triage #5916, probably close it** (open): two `setProp` calls in `eventDidMount` (title and color) only applied the last to events outside the initial view. It passes in v7 with `setProp('color')`, after navigating too (`event-render/content-hooks.ts`). Check the original CodePen against v7, then close.
