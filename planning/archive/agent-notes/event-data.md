# event-data agent notes

Area: event data and event sources (standard/packages/vanilla-tests).
Targets: tests/event-api/, tests/event-sources/. Shared helper added: tests/lib/event-sources.ts
(`whenLoaded`, `createDeferred`, `getRenderedEventTitles`).

## Possible library bugs / quirks

- **`EventApi.setDates` without the `allDay` option sets `allDay` to `undefined`.**
  `standard/packages/preact/src/api/EventImpl.ts` `setDates`: `standardProps = { allDay: options.allDay }`
  always includes the key, so the mutation applies `allDay: undefined`. Repro:
  ```js
  calendar = new Calendar(el, { timeZone: 'UTC', events: [{ id: '1', start: '2018-09-03', end: '2018-09-05' }] })
  ev = calendar.getEventById('1'); ev.setDates('2018-09-02', '2018-09-06')
  ev.allDay   // undefined (was true)
  ev.startStr // '2018-09-02T00:00:00Z' (rendered as timed)
  ```
  Also applies to timed events (allDay becomes undefined, though their strings look right).
  The legacy spec only compared instants, so it never noticed. Quarantined as `it.skip` in
  tests/event-api/set-dates.ts ("keeps an all-day event all-day when allDay isn't given").

- **Changing `timeZone` keeps recurring events anchored to the original zone** (not a bug per se,
  but surprising). `{ startTime: '12:00', daysOfWeek: [2] }` with timeZone America/New_York renders
  12:00; after `setOption('timeZone', 'America/Chicago')` it renders 11:00, and still 11:00 for weeks
  navigated to afterwards (re-expanded instances keep the 17:00Z instant). Legacy `recurring.ts` was
  titled "events with unspecified timezone offsets move" yet asserted they don't (11:00). Ported to the
  current behavior in tests/event-api/time-zone-change.ts with a neutral title. Maintainer: confirm
  this is intended; a floating startTime arguably should stay 12:00 in the new zone.

## Legacy behavior that turned out to be non-discriminating

- `legacy/events-gcal.ts` "named timezone, defaults to not editable": the calendar's `editable`
  defaults to false, so no resizers was trivially true. The google-calendar plugin sets no
  editable default of its own. Ported as an it.each (source editable unset -> no resizers,
  editable: true -> resizers).
- `legacy/events-gcal.ts` EventSource::remove "only the Google Calendar ID" and "raw source object"
  passed the identical `{ googleCalendarId }` shape. Merged into one test. (A plain-string
  `eventSources: ['…@group.v.calendar.google.com']` is claimed by the JSON-feed source def and
  fetched as a relative URL; not tested, and probably intended since gcal sources need an object.)

- `toEqualDate` comparisons couldn't tell all-day from timed (that's how the setDates bug hid).
  Ported tests compare `startStr`/`endStr` (and `allDay`), which do.

## Dropped / not ported

- `event-data/EventObject-parsing.ts` `xit('won't accept two events with the same ID')`: skipped
  legacy spec ("BEHAVIOR NOT-YET-IMPLEMENTED"). Not ported.

- Render-count assertions (`strictModeFactor` x eventContent calls) in `timeZoneChange.ts` and
  `recurring.ts` were replaced by checking the rendered time text and the events' instants.
- Recurrence expansion was not split out into `.unit.ts` (the plan mentions it). These specs go
  through `getEvents()` on a real Calendar, so they stay browser tests.

## Coverage gaps filled

- `eventAdd` / `eventRemove` callbacks (with `revert()`), plus `eventsSet`, in
  tests/event-api/add-remove.ts. (Checkbox in planning/test-revamp.md not ticked by me.)

## Infra notes for the maintainer

- First run of a file importing `fetch-mock` or `@fullcalendar/icalendar` (ical.js) prints
  "Vite unexpectedly reloaded a test ... add mentioned dependencies to optimizeDeps.include".
  Consider `optimizeDeps: { include: ['fetch-mock', 'ical.js'] }` in vitest.config.base.ts so a cold
  cache (CI) can't reload mid-run. Not changed (shared config).
- iCalendar fixtures are now real `.ics` files in tests/event-sources/icalendar-data/, imported with
  `?raw`. (They can't be `.ts` there: the browser project would pick them up as test files.)
