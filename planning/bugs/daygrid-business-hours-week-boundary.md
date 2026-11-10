# dayGrid business hours leave the Sunday unshaded across a week boundary

**Status:** confirmed
**Release:** next
**Test:** `standard/.../src/business-hours/daygrid.ts`
**Issues:** none found

Found during the test revamp. Pre-existing.

With `businessHours: true`, a two-day dayGrid view starting on a Saturday (`duration: { days: 2 }`) shades the Saturday as non-business, but not the Sunday. When the range crosses a week boundary, the day after it is missed. dayGridWeek (Sunday to Saturday) shades both weekend days.
