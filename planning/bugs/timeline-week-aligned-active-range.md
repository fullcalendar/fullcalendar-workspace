# A week-aligned timeline's active range isn't its slots' range

**Status:** confirmed
**Release:** next
**Test:** `premium/.../src/visible-range/timeline.ts`
**Issues:** [#7026](https://github.com/fullcalendar/fullcalendar/issues/7026) (closed, related: 7-day slots with `firstDay: 1` put an event in the wrong week)

Found during the test revamp. Pre-existing.

## What happens

```js
{ initialView: 'timeline', initialDate: '2018-01-24' /* Wed */, duration: { days: 183 },
  slotDuration: { weeks: 1 } /* or slotHeaderInterval: { weeks: 1 } */, firstDay: 1 /* Mon */ }
```

The slots are week-aligned and cover Jan 22 – Jul 23, but `activeStart`/`activeEnd` stay at Jan 24 – Jul 26. Events are fetched for the active range only, so:

- an event on Jan 22 doesn't render, though its slot does;
- Jul 23–25 are in the active range but have no slot.

In dayGridMonth, by contrast, `activeStart` is the first rendered cell.

## Cause

Likely `normalizeRange` in `timeline-date-profile.ts`: it aligns the slots' range to `largeUnit`, but not the date profile's active range.

## Open detail for the fix

Extend the end to whole weeks (Jul 30, as dayGrid does), or keep 26 slots and end on Jul 23. The test asserts only that the active range is the slots' range, and that the Jan 22 event renders.

Fix together with `timeline-weeks-in-days-first-day.md`.
