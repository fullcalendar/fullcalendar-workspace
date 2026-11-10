# event-render agent notes

Package: standard/packages/vanilla-tests

## Library quirks / possible bugs

- **`eventOrder: undefined` throws.** `initCalendar({ eventOrder: undefined, events: [...] })` (dayGridMonth, events
  with equal start times) throws `TypeError: Cannot read properties of undefined (reading 'length')` during render,
  instead of falling back to the default order. Omitting the key works. Tests omit it.
- **Hidden measuring more-links carry `data-fc-part="moreLink"`.** dayGrid views (seen in multiMonth) render an
  offscreen, `visibility:hidden` more-link (at left ≈ -9841px) for measurement, with the part attribute.
  `moreLinkText` functions are also called for it (last call gets `0`). Tests filter more-links by visibility
  (`getMoreLinkEls` in tests/lib/models/event-content.ts). Maybe the measurer shouldn't carry the part.
- **A `moreLinkClick` function that returns nothing still opens the popover.** Probably intended (falls back to
  the default action); the tests don't assert either way.
- **`moreLinkClick: 'week'` keeps the current date** (2014-08-01) when the target week already contains the
  clicked day, while `'day'` moves to the clicked day. Tests assert the view's `currentStart` instead.

## Legacy specs changed in meaning

- `event-render/event-render-hooks.ts` `xit('can render multiple appearance changes in eventDidMount')`
  (#5916, "KNOWN BUG most likely not-yet-fixed"): the bug is fixed. Ported as a normal test
  (content-hooks.ts), using v7's `setProp('color')` (`backgroundColor` is no longer a settable prop: it warns
  "Cannot set event property `backgroundColor`").
- `legacy/background-events.ts` "is affected by global eventColor": in v7 background events take
  `backgroundEventColor`, not `eventColor` (bg-fill.tsx). The legacy assertion (`/oklab/`) passed either way,
  since the default bg color is also an oklab mix. coloring.ts now tests `backgroundEventColor` and that
  `eventColor` does NOT reach background events.
- `legacy/event-coloring.ts`: the old regex `/red|rgb\(255,0,0\)|oklab/` matched the default background-event
  color too. coloring.ts compares each case to a reference event whose own color is red, with a
  no-color row as the anchor.
- `legacy/more-link-popover.ts` #4331 ("displays events that were collapsed in previous days") had no assertions
  and opened the second more-link. With the current placement, e4's second day is visible on Oct 19, so there's
  no second more-link. Ported as: e4/e5 visible on the 19th, and the 18th's popover lists e1-e4.
- `legacy/more-link-popover.ts` "orders events correctly regardless of ID" etc. ran in month view only; kept.
  The legacy "closes when user clicks outside" used a synthetic body mousedown; now a real click at (5,5), the
  page margin.
- `legacy/eventMouseEnter.ts` used synthetic mouseover; now real hover via `pointer.move`, and each test also
  checks `eventMouseLeave` fires on leaving (anchor for "doesn't fire leave on update").
- `event-click-hover/eventClick.ts` "works via touch" used a mouse `simulate('click')`; now a real CDP touch tap.
- `legacy/displayEventEnd.ts`: the dayGridMonth × timeGridWeek matrix collapsed to all cases on dayGridMonth
  plus the timed-with-end case on timeGridWeek (where the default differs).
- `legacy/ListView.ts`: the second "truncates an out-of-range start" was really the out-of-range end case; named so.
  "makes scrollbars"/"no scrollbars with height:auto" now check geometry (last event below the scroller /
  within the view), since with height:auto there's no scroller at all.

## Placement of ported specs outside the obvious folder

- businessHours specs from `legacy/background-events.ts` are in tests/event-render/background-events.ts
  (`describe('businessHours')`). Move them to business-hours/ if that folder's owner prefers.
- slotMinTime "can be changed dynamically" (from event-render/minTime.ts) is in event-render/timegrid.ts, reworked
  to check that events reposition after `setOption('slotMinTime')` (plus the first slot label).
- eventMaxStack (from legacy/more-link-timegrid.ts) is in more-link/timegrid.ts; dayPopoverFormat in
  more-link/popover.ts (`describe('title')`); more-link-popover-destroy in popover.ts's closing tests.

## Coverage gaps filled

- `listDay` / `listYear` views (event-render/list.ts).
- `eventWillUnmount` on event removal (content-hooks.ts) and on popover close (more-link/popover.ts).

## Leftovers for the coordinator

- Legacy helpers only my specs used may now be dead: `src/lib/DayGridEventRenderUtils.ts`, parts of
  `src/lib/wrappers/*` (more-popover getters, `checkEventRendering`, etc.). Not removed, since other areas may
  still use the wrappers.
- `tests/lib/intl.ts` (another agent's file) exports `enUsSep` only; time-text.ts computes the en-GB separator
  inline.
