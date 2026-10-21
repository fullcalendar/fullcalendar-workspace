# view-render port notes

Package: standard/packages/vanilla-tests. 22 Vitest files, 152 tests, all passing (2 runs, ~5s).

## New files

- tests/day-headers/: rendering.ts (dayHeaders on/off, Sun->Sat order, aria-current today), format.ts (dayHeaderFormat defaults/per-view/locales/custom views, dayGridDay day names), content.ts (dayHeaderContent html/text/date), a11y.ts (hidden header text, nav-link labels)
- tests/day-cells/: daygrid.ts (locale numerals, dayCellDidMount/WillUnmount, month-start labels + monthStartFormat + #7197, multi-week overflow, dayGridYear range + initial scroll, dateClick after container resize), timegrid.ts (dayLaneDidMount), a11y.ts, show-non-current-dates.ts, valid-range.ts, multimonth.ts (all multimonth rendering incl. #7287)
- tests/time-slots/: slot-duration.ts (incl. #5952, label alignment), slot-min-max-time.ts (incl. fullcalendar-vue#88), labels.ts (slotHeaderFormat, axis side LTR/RTL, "Timed" row header hidden text), all-day-slot.ts (allDaySlot, allDayText), scroll.ts (scrollTime, scrollTimeReset, scrollToTime, scroll state kept on render())
- tests/week-numbers/: daygrid.ts (incl. #5708), timegrid.ts (incl. weekTextShort, header a11y), calculation.ts
- tests/now-indicator/timegrid.ts (fixed `now`, no timers; incl. #6394)
- tests/business-hours/: timegrid.ts, daygrid.ts
- tests/accessibility/background-fills.ts (aria-hidden on bg events / non-business fills)
- Helpers (new files only): tests/lib/text.ts (screen-reader text via protected-styles `srOnly`, getVisibleText, expectScreenReaderText), tests/lib/dated-days.ts, tests/lib/models/slots.ts (slot labels, slot tops, vertical scroller lookup)

A11y decision: a11y *text* tests sit next to their feature (day-headers/a11y.ts, day-cells/a11y.ts, week-number header in week-numbers/timegrid.ts, "Timed" row header in time-slots/labels.ts), per the folder tree. Pure ARIA semantics (aria-hidden fills) went to accessibility/.

## Legacy files deleted

- src/view-render/: columnHeader, columnHeaderHtml, columnHeaderText, day-cell-a11y-text, daygrid-dirty-hit, daygrid-multi, fill-a11y, header-a11y-text, multimonth, scrollToTime, showNonCurrentDates, slotDuration, timegrid-slots, validRange (height/updateSize/rerender left for their owner)
- src/date-render/: dayNumbers, slotMinTime (folder removed, now empty)
- src/legacy/: TimeGrid-render, timegrid-view, weekViewRender, allDaySlot, allDayText, businessHours, columnHeaderFormat, dayNames, dayRender, maxTime, slotDuration, slotHeaderFormat, nowIndicator, scroll-state, scrollTime, weekLabel, weekNumberCalculation, weekNumbers

## Collapsed / dropped

- maxTime: 13 hours x {week, day} x {whole, :20} -> 6 rows on timeGridWeek. Its "default settings" describeOptions block ignored its view (always used timeGridWeek).
- legacy slotDuration: "slotMinutes is set to 30" didn't set any option (dup of default); 12-value x 2-view matrix -> 5 rows on timeGridDay.
- dayNames: 6 locales x 7 days -> all 7 days in en + one day per locale. Expected strings are hardcoded instead of computed from toLocaleString.
- allDaySlot/allDayText: week/day duplicates collapsed to timeGridWeek.
- columnHeaderFormat: commented-out dayGridDay/timeGridDay rows not ported. fr/en-gb weeks start Monday, so the first header is Monday (legacy picked the Sunday cell by fc-day-sun class).
- columnHeader*/dayHeaderContent: 3-view matrix -> dayGridMonth + timeGridDay; describeTimeZones -> UTC + local rows.
- nowIndicator: LTR/RTL matrix -> RTL kept only for the geometry case.
- weekLabel: "customized and LTR" dup of default direction.
- TimeGrid-render: the header-axis cell check dropped (no part for an empty corner cell); slot-label and all-day-header sides kept.
- timegrid-view: the `fc-day-*` class checks became data-date + header text checks; "axis el exists" dropped (internal).
- dayNumbers / weekNumberCalculation with `ar`: current Chromium formats `ar` with Latin digits, so the legacy regexes `/1|١/` and `/٤٨|48/` couldn't tell. Numerals now tested with `bn` (`১`); the ar week-number test now checks ar's Saturday-start week rule (`48 أسبوع`).
- dayCellDidMount counts: strictModeFactor dropped; counts are exact after waitForSettle.
- Added (gap TODO "*WillUnmount hooks"): dayCellWillUnmount counted on navigation.

## Possible library quirks

- **Explicitly `undefined` options aren't treated as unset.** `initCalendar({ slotDuration: undefined })` (same for slotMinTime/slotMaxTime) throws `TypeError: Cannot read properties of undefined (reading 'years')`. `allDaySlot: undefined` renders no all-day row, though the default is true. Repro: `new Calendar(el, { initialView: 'timeGridDay', slotDuration: undefined }).render()`. Tests omit the key instead.
- In dayGridMonth, a timed background event (`2023-01-18T10:00`–`12:00`) renders no fill. In timeGridWeek, an all-day background event fills both the all-day cell and the day's lane. Both look intentional. Tests assert the current counts.

## Open questions

- Minor vs major slots aren't distinguishable by part (a minor slotHeader just has no text and no data-time). Tests check the label texts ('' for minor) instead of the legacy `fc-timegrid-slot-minor` class.
