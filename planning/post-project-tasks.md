# Post-Project Tasks

To do after the test revamp lands.

## Fix the known bugs marked `it.fails`

Each known library bug found during the revamp is an `it.fails` test, with a `KNOWN BUG` comment above it that explains it. The test passes while the bug exists and fails once it's fixed: then change `it.fails` to `it`. Find them all with:

```sh
grep -rn "it\.fails" standard/packages/vanilla-tests/src premium/packages/vanilla-scheduler-tests/src
```

Some are conditional, e.g. `const itNotUnderReact = isForceReact ? it.fails : it` in `more-link/click.ts`; the grep finds those too.

As of 2026-10-20 they cover:
- #4937: timelineYear with `slotHeaderInterval: { months: 1 }` and `slotDuration: { days: 1 }` (`visible-range/timeline.ts`)
- `ResourceApi.toPlainObject()` never outputs `eventColor`, and `ResourceApi.setProp()` drops event-styling props (`resource-data/crud.ts`)
- timeline `next()` moves backwards when `dateIncrement` is smaller than the duration (`visible-range/scheduler-views.ts`)
- dayGrid doesn't shade a Sunday after a Saturday in the same range (`business-hours/daygrid.ts`)
- multiMonth selection and resizing can't cross months (`date-select/multimonth.ts`, `event-resize/multimonth.ts`). If that's intended, make them plain tests asserting no callback.
- a lone view button is `role=tab` with no `tablist`, and timeGrid's `aria-colcount` is one short (`accessibility/aria.ts`)
- under React, `moreLinkClick`'s `jsEvent` is a SyntheticEvent (`more-link/click.ts`)
- a timeline whose slots or header intervals are whole weeks given in days (`{ days: 7 }`, `{ days: 14 }`) doesn't align to `firstDay`, though `{ weeks: 1 }` does: only a slotDuration whose greatest unit is week/month/year sets `largeUnit`, and slotHeaderInterval is never considered (`visible-range/timeline.ts`)
- in resource views, an event source's `color` beats a resource's `eventColor`, though the docs (and views without resources) rank the resource higher (`resource-data/event-styling.ts`)
- a Google Calendar ID or Calendar API URL given as a plain string source is fetched as a JSON feed, because global plugins (the built-in JSON feed source) are added after the calendar's plugins and win (`event-sources/google-calendar.ts`). The same was true in v6. No GitHub issue found.

## Verify: a week-aligned timeline's `activeStart` is after its first slot

Adam (2026-10-20): sounds like a real bug; verify it, and leave it untested for now.

```js
{ initialView: 'timeline', initialDate: '2018-01-24' /* Wed */, duration: { days: 183 },
  slotDuration: { weeks: 1 }, firstDay: 1 /* Mon */ }
```

The slots start on Monday Jan 22 (week-aligned), but `view.activeStart` is Wednesday Jan 24, so the first slot starts before the active range. The same happens with `slotHeaderInterval: { weeks: 1 }`. In dayGridMonth, `activeStart` is the first rendered cell. Expected: the range starts on the first slot (Jan 22 – Jul 24). Likely related: `normalizeRange` in `timeline-date-profile.ts` aligns the slots' range to `largeUnit`, while the date profile's active range isn't. Fix it together with the whole-weeks-in-days `firstDay` bug above.

## Accessibility: ordinary toolbar buttons are announced as toggles

Prev, next and today (any button not in a group of only view buttons) get `aria-pressed="false"`, so screen readers announce them as toggle buttons. Checked in both renderers (2026-10-20). `ToolbarSection.tsx` gives every non-tab button `'aria-pressed': isSelected`. Only view buttons should carry a pressed or selected state: as tabs when the group is all view buttons, or `aria-pressed` when a view button is grouped with others. Prev, next and today should get no `aria-pressed` at all. Adam: fix this at the end of the project.

## Accessibility: keyboard focus after activating a nav link

Activating a nav link (e.g. a day number) with the keyboard changes the view, which removes the link, so focus falls to `<body>`. The right place for focus afterwards isn't obvious (the new view's heading? its first cell? the matching day?), so it needs some design. Details in `agent-notes/gaps-a11y-sticky.md`.

## Apply the postponed fixes

Once the test revamp is merged to main, apply the fixes in `postponed-fixes/`. Each file has the diagnosis, the full patch, its tests, and how to apply it:
- `virtualized-timeline-loop.md`: a virtualized resource timeline re-renders every frame (ready to apply).
- `all-day-drop-gap.md`: the bottom strip of a timeGrid all-day cell isn't a drop target (needs a decision first: generalize the rule, and/or build the leeway design for the divider blink).

## Close #2955

https://github.com/fullcalendar/fullcalendar/issues/2955 (open): `drop` reported an external event's `startTime` instead of just the day. It's fixed: `drop` reports the day (`dateStr` with no time, `allDay: true`) in dayGrid and resource dayGrid. The tests that show it are in `standard/.../src/event-drag/external.ts` ("applies the event data's startTime on the dropped day") and `premium/.../src/event-drag/external.ts`. The issue's other complaint, a non-zoned time, doesn't apply once no time is reported. Close it with a note naming the release.

## Triage #5916, probably close it

https://github.com/fullcalendar/fullcalendar/issues/5916 (open): two `setProp` calls in `eventDidMount` (title and color) only applied the last to events outside the initial view. The Karma test for it was an `xit` marked "KNOWN BUG". It passes in v7 with `setProp('color')` (`backgroundColor` is no longer settable and warns), after navigating too, so it's a normal test in `standard/.../src/event-render/content-hooks.ts`. Check the original CodePen against v7, then probably close it.

## Other follow-ups

- Bugs with no test yet: `needed-test-coverage.md`.
- Breaking changes for v8: `postpone-till-next-major.md`.
