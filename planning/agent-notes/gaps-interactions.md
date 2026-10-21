# gaps-interactions notes (coverage gaps, not a port)

Package: standard/packages/vanilla-tests. New tests only; no legacy files touched.
All pass, 2 runs (6 files, ~6s).

## Files

- tests/lib/models/multi-month.ts (new helper): `MultiMonthModel` finds a month's grid by its
  `singleMonth` part (`data-date="YYYY-MM"`) and resolves each date in ITS month's grid, as a
  `DayGridModel` rooted at that month's element. drag/resize/select/click can start in one month
  and end in another. DayGridModel itself is unchanged. (With multiMonthYear's default
  showNonCurrentDates:false, data-dates are unique anyway. With showNonCurrentDates:true, an
  unscoped DayGridModel would throw "Expected one day cell" for dates shown in two grids.)
- tests/event-drag/multimonth.ts (7): within a month; into another month's grid, side by side
  and stacked (multiMonthMaxColumns:1); a two-month event grabbed by its later-month segment;
  timed event keeps its time; drop on a disabled other-month cell reverts (anchored by a dated-cell row).
- tests/event-resize/multimonth.ts (4, 3 of them it.fails): within a month; across months (see bug).
- tests/date-select/multimonth.ts (4, 3 of them it.fails): within a month; across months (see bug).
- tests/date-click/multimonth.ts (5): side by side and stacked (Nov, scrolled into view); disabled
  other-month cell doesn't fire (anchored); showNonCurrentDates:true other-month cell reports its
  date and its own cell as dayEl.
- tests/event-drag/auto-scroll.ts (2): timeGridWeek, height 400, scrollTime 00:00. Hold the
  pointer 5px above the scroller's bottom. dragScroll:true: polls (`expect.poll`, 5s bound) for
  scrollTop > 200, then the drop lands below the initially visible slots (observed: last visible
  slot 05:00, dropped 09:30). dragScroll:false: after 30 animation frames scrollTop is still 0 and the
  event drops exactly in the held slot (05:00). Waiting on rAF frames is the mechanism AutoScroller
  uses (one scroll step per frame), not a wall-clock sleep.
- tests/event-drag/timegrid.ts (+1, in "from timed to all-day"): overnight event 06-10T22:00 to
  06-11T03:00, grabbed on its 06-11 segment, dropped on the 06-13 all-day cell.

## Library behavior

- **KNOWN BUG / limitation: multiMonth selection and resizing can't cross months.** Each month
  (SingleMonth) is its own DateComponent. DateSelecting and EventResizing build their HitDragging
  from only their own component (`interactionSettingsToStore(settings)`), while EventDragging uses
  the whole interactionSettingsStore. So dragging an event from January to February works, but
  selecting Jan 30 to Feb 2, or resizing an event's end (or start, with eventResizableFromStart) into
  the next month's grid, gets no hit once the pointer enters the other grid. The selection/resize
  is dropped and `select`/`eventResize` don't fire. Repro: multiMonthYear, initialDate
  2023-01-01, selectable:true; drag from Jan 30 to Feb 2. Written as it.fails for the cross-month
  behavior. **Question for the maintainer:** bug or by design? If by design, flip these to plain
  tests asserting no select/eventResize.
- Timed -> all-day drag of an overnight event grabbed by its later-day segment: the delta is
  measured from the start of the event's start day (computeEventMutation uses
  `startOfDay(eventInstanceStart)`), not from the grabbed day. So the event's START lands on the
  drop day: delta {day: 3}, start 2014-06-13, end null (allDayMaintainDuration default), allDay true.
  revert() restores the timed dates. That's sane, and it mirrors the existing all-day -> timed test
  ("whichever of its days was grabbed"). The useSubjectCenter rounding doesn't apply here, because
  the drop is on a whole-day cell.
- Dropping (or clicking) on a disabled other-month cell in multiMonthYear does nothing (no hit):
  the event reverts and dateClick doesn't fire. Seems right.
