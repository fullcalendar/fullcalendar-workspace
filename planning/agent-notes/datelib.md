# datelib area: agent notes

## Where things went

| Legacy | New |
|---|---|
| src/datelib/main.ts | tests/datelib/date-env.unit.ts (Node; imports `standard/packages/headless-calendar/src`, where DateEnv lives) |
| src/datelib/formatting-api.ts | tests/datelib/formatting-api.unit.ts (Node; imports `standard/packages/preact/src/formatting-api`) |
| src/datelib/luxon.ts | tests/datelib/luxon-formatting.ts (browser: needs a Calendar for `calendar.formatRange` and an event render) |
| src/datelib/moment.ts | tests/datelib/moment-formatting.ts (browser, same reason) |
| src/datelib/named-tz.ts | tests/time-zones/named-time-zones.ts |
| src/legacy/timeZone.ts | tests/time-zones/time-zone.ts |
| src/datelib/rrule.ts | tests/event-api/recurrence-rrule.ts |
| src/legacy/locale.ts | tests/localization/locale.ts |
| src/legacy/dir.ts | tests/localization/direction.ts |

New shared helper: tests/lib/intl.ts (`enUsSep`, `normalizeIntlWhitespace`, `getLeafTexts` for finding unmarked eventTime/eventTitle text).

## Changes from the legacy specs

- DST-gap parsing (main.ts) no longer searches for "the next DST transition from today" (`getDSTDeadZone`). TZ is pinned to America/New_York, so it uses the known gap 2018-03-11 02:30 and asserts the gap is real first.
- timeZone.ts: Chicago expectations are hard-coded offsets instead of computed with temporal-polyfill. Added a rendering check: the offset-bearing event lands on the right day cell with the right time text in UTC / local / Chicago, and the time text after switching timeZone.
- rrule "can generate local dates, including EXDATE": the legacy EXDATE (09-05) wasn't an occurrence of the weekly rule, so it excluded nothing. Now it excludes 09-11 and asserts the exact remaining dates.
- rrule "expands a range that starts exactly at the view's start" asserted `length >= 1`. Now asserts the first start is exactly 2019-04-02. (The plugin's expansion range extends a day past the dayGridDay view's end, so 04-03 is also present. Not asserted on.)
- rrule #5273: the legacy counted `eventContent` calls (render counts, with `strictModeFactor`) and its third check re-read index 1 (a legacy typo). Now it asserts the rendered time text and the instant after each step.
- direction: for ltr the calendar element has no `dir` attribute (null), only `dir="rtl"` for rtl. The legacy asserted "not rtl"; the new test asserts null exactly.
- locale: the day header check uses the `dayHeaderInner` part, because `dayHeader`'s textContent also includes the hidden a11y date label ("December 21, 2014Sun 21").
- moment-formatting keeps the legacy `import 'moment/locale/es'`; it makes Spanish moment's global locale, so the English assertions also prove the calendar's locale wins.

Nothing dropped.

## Open questions / observations

- First run of the luxon/moment/rrule browser files prints "Vite unexpectedly reloaded a test ... add mentioned dependencies to optimizeDeps.include" (luxon, moment, moment/locale/es, rrule). Tests still passed, and later runs use the cache. Consider adding these to `optimizeDeps.include` in vitest.config.base.ts so a cold CI run doesn't reload mid-test. I didn't edit the shared config.
- `@fullcalendar/rrule`'s dist imports `@fullcalendar/core/protected-api` (only `identity`), so a second copy of core's protected-api loads beside `fullcalendar`. It works today; just noting it.
