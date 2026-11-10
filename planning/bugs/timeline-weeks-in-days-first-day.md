# Timeline weeks given in days don't align to `firstDay`

**Status:** confirmed
**Test:** `premium/.../src/visible-range/timeline.ts`
**Issues:** [#7026](https://github.com/fullcalendar/fullcalendar/issues/7026) (closed, not fixed, likely the same bug)

Found during the test revamp. Pre-existing.

A slot duration or header interval of whole weeks aligns to `firstDay` when given in weeks (`{ weeks: 1 }`), but not when given in days (`{ days: 7 }`, `{ days: 14 }`): those start on the initial date.

Adam's rule (2026-10-20): slots or header intervals that are a whole number of weeks align to `firstDay`; others don't.

#7026 (2022): with `slotDuration: { days: 7 }` and `firstDay: 1`, an event shows in the wrong week. acerix confirmed it (workaround: `firstDay: 0`). Its reporter closed it in 2025-11 without a comment or fix; Odoo commits reference it, so they likely patched their copy. Not checked against #7026's own repro.

## Cause

Only a `slotDuration` whose greatest unit is week, month or year sets `largeUnit` (`timeline-date-profile.ts`), and `slotHeaderInterval` is never considered.

Fix together with `timeline-week-aligned-active-range.md`.
