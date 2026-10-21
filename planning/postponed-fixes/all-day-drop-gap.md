# Postponed Fix: Bottom Strip of a timeGrid All-Day Cell Isn't a Drop Target

Status: diagnosed and patched by a Sol subagent (GPT-Sol-6.1, high effort) on 2026-10-20. **Not applied:** it waits until the test revamp is merged to main, and the approach needs a decision (see "Open decision").

## Symptom

In `timeGridWeek`, dragging a timed event up into the all-day row (day cell at 122–158px):

| Drop point | Result |
|---|---|
| 1–5px above the cell's bottom | dropped into the timed slot below (`2014-06-10T01:00`) |
| 8–10px above the bottom | no drop |
| 12px or more above the bottom | correct all-day drop |

`elementFromPoint` reports the all-day cell at all of these points.

## Root cause

It isn't a divider-extension hack: v7 has none. `TimeGridAllDayLane.queryHit` and `HitDragging.queryHitForOffset` use the lane's exact box.

The cause is the subject-center adjustment. For event drags (`useSubjectCenter`), `HitDragging.processFirstCoord()` sets `coordAdjust` so that the press acts as if it were at the center of the grabbed slot. Every later hit query, including its `elementFromPoint()` obscuration check, runs at `pointer + coordAdjust`. In the repro, `coordAdjust.top = 10.5`:

- 2px above the bottom: pointer 156 → query 166.5, in the timed area → timed hit.
- 9px above the bottom: pointer 149 → query 159.5, on the 4px divider (158–162) → no hit.
- 12px above the bottom: pointer 146 → query 156.5 → all-day hit.

The results are the same in `timeGridDay` and RTL. Resource timeGrid uses the same path (a 6.5px adjustment in its compact week layout, 10.5px in its day view).

## Sol's fix

When centering is on, `handleMove` also queries the hit under the raw pointer, and uses it when the centered query misses, or when the two disagree about `allDay`. The centered query still rounds movement within slots. Both queries keep the clipping, active-range and obscuration checks. The cost is one extra hit query per move during event drags. Selection, resizing and external drags don't use subject centering, so they're unaffected.

## Open decision

My review (Claude):
- **Generalize the rule.** Comparing `allDay` only fixes this one boundary. A more general rule would be "the raw pointer picks the drop target (component), and the centered offset only picks the slot within it, clamped to that component". That also covers other boundaries where the offset can cross into a neighbor, such as between multiMonth months or resource dayGrid sections.
- **The divider "blink" remains.** While the pointer is over the 4px divider, both queries miss, so the in-grid mirror switches to the free-drag clone for those pixels. Sol's mirror-continuity test counts the clone as a visible mirror, so it passes before and after the fix and doesn't test the blink. Fixing it needs Adam's "leeway" idea. Sol sketched it as: separate the actual drop target from the visual preview; keep the previous preview only within an explicitly defined separator region; switch immediately when the pointer enters another valid target; and never let a retained preview authorize a drop outside clipping, under overlays, or beyond valid ranges. Selection endpoints and resize edges must stay precise, and touch must coexist with scrolling and long presses.

## Tests

- New file `standard/packages/vanilla-tests/src/event-drag/timegrid-all-day-boundary.ts`: `timeGridWeek`/`timeGridDay` × LTR/RTL. It sweeps up from below the divider and releases 2, 5, 9 or 12px above the cell's bottom, or at its center, and expects an all-day drop on the right day. It also has the mirror-continuity test (see above: it doesn't catch the blink).
- New in `premium/packages/vanilla-scheduler-tests/src/event-drag/resource-timegrid.ts`: the same sweep for resource timeGrid week/day × LTR/RTL, also checking the dropped resource.
- `DayGridModel.pointForDate`'s comment about the bottom ~12px is removed.
- Before the fix: 12 of 24 standard and 6 of 16 resource tests fail. After: `src/event-drag`, `src/date-select`, `src/event-resize` and `src/date-click` pass (24 files, 186 tests), plus the resource timeGrid drag tests, under both the default build and `FORCE_REACT=1` (as Sol reported; not re-run by me).

## Applying

The patch was made against `71ba1c4f5`. Save the block below to a file and run `git apply` from the repo root (rework it first if the rule is generalized). Then rebuild, run the tests above, add a changelog line, and close out the entry in `../needed-test-coverage.md`.

```diff
diff --git a/premium/packages/vanilla-scheduler-tests/src/event-drag/resource-timegrid.ts b/premium/packages/vanilla-scheduler-tests/src/event-drag/resource-timegrid.ts
index 7a2c05a1c..f776c8200 100644
--- a/premium/packages/vanilla-scheduler-tests/src/event-drag/resource-timegrid.ts
+++ b/premium/packages/vanilla-scheduler-tests/src/event-drag/resource-timegrid.ts
@@ -1,6 +1,8 @@
 import { describe, expect, it, vi } from 'vitest'
 import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
 import { TimeGridModel } from '@fullcalendar-tests/standard/src/lib/models/time-grid'
+import { queryPart } from '@fullcalendar-tests/standard/src/lib/models/events'
+import { pointer } from '@fullcalendar-tests/standard/src/lib/pointer'
 import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'
 
 describe('event dragging in resource timeGrid', () => {
@@ -17,6 +19,52 @@ describe('event dragging in resource timeGrid', () => {
     events: [{ id: '1', start: '2015-11-30T02:00:00', end: '2015-11-30T03:00:00', resourceId: 'b' }],
   }
 
+  describe.each([
+    ['resourceTimeGridWeek', 'ltr', false],
+    ['resourceTimeGridWeek', 'rtl', true],
+    ['resourceTimeGridDay', 'ltr', false],
+    ['resourceTimeGridDay', 'rtl', true],
+  ] as const)('all-day boundary in %s %s (datesAboveResources=%s)', (initialView, direction, datesAboveResources) => {
+    it.each([2, 9, 'center'] as const)('drops on the correct resource at %s px above the cell bottom', async (offset) => {
+      const eventDrop = vi.fn()
+      const calendar = initCalendar({
+        ...options,
+        initialView,
+        direction,
+        datesAboveResources,
+        initialDate: '2015-11-30',
+        eventDrop,
+      })
+      await waitForSettle()
+
+      const grid = new TimeGridModel(calendar.el)
+      const { point } = grid.pointForEventAt('1', { date: '2015-11-30T02:00', resourceId: 'b' })
+      const date = initialView === 'resourceTimeGridDay' ? '2015-11-30' : '2015-12-01'
+      const cell = grid.allDay.getDayCell({ date, resourceId: 'a' })
+      const rect = cell.getBoundingClientRect()
+      const x = rect.left + rect.width / 2
+      const y = offset === 'center' ? rect.top + rect.height / 2 : rect.bottom - offset
+      expect(cell.contains(document.elementFromPoint(x, y))).toBe(true)
+
+      await pointer.press(point, async () => {
+        const divider = queryPart(calendar.el, 'allDayDivider')!.getBoundingClientRect()
+        for (let sweepY = divider.bottom + 4; sweepY > y; sweepY--) {
+          await pointer.move({ x, y: sweepY }, 1)
+          await waitForSettle()
+        }
+        await pointer.move({ x, y }, 1)
+        await waitForSettle()
+      })
+      await waitForSettle()
+
+      expect(eventDrop).toHaveBeenCalledOnce()
+      const event = calendar.getEventById('1')!
+      expect(event.startStr).toBe(date)
+      expect(event.allDay).toBe(true)
+      expect(event.getResources().map((resource) => resource.id)).toEqual(['a'])
+    })
+  })
+
   // the two layouts order the columns differently
   it.each([
     ['resources above dates', false],
diff --git a/standard/packages/preact/src/interaction-plugin/interactions/HitDragging.ts b/standard/packages/preact/src/interaction-plugin/interactions/HitDragging.ts
index 10bf7a5ab..5b862a600 100644
--- a/standard/packages/preact/src/interaction-plugin/interactions/HitDragging.ts
+++ b/standard/packages/preact/src/interaction-plugin/interactions/HitDragging.ts
@@ -130,6 +130,15 @@ export class HitDragging {
       ev.pageY + this.coordAdjust!.top,
     )
 
+    if (this.useSubjectCenter) {
+      let pointerHit = this.queryHitForOffset(ev.pageX, ev.pageY)
+
+      // Centering rounds movement within slots, but must not shift the all-day/timed boundary.
+      if (pointerHit && (!hit || pointerHit.dateSpan.allDay !== hit.dateSpan.allDay)) {
+        hit = pointerHit
+      }
+    }
+
     if (forceHandle || !isHitsEqual(this.movingHit, hit)) {
       this.movingHit = hit
       this.emitter.trigger('hitupdate', hit, false, ev)
diff --git a/standard/packages/vanilla-tests/src/lib/models/day-grid.ts b/standard/packages/vanilla-tests/src/lib/models/day-grid.ts
index 848b918d2..03c14bf89 100644
--- a/standard/packages/vanilla-tests/src/lib/models/day-grid.ts
+++ b/standard/packages/vanilla-tests/src/lib/models/day-grid.ts
@@ -52,8 +52,7 @@ export class DayGridModel {
 
   /*
   The center of the cell. Fine for dropping and selecting, even over events: hits are
-  computed from coordinates. (Not the cell's bottom edge: in a timeGrid all-day row, its bottom
-  ~12px doesn't resolve to an all-day hit.)
+  computed from coordinates.
   */
   pointForDate(spot: Spot): Point {
     const cellEl = this.getDayCell(spot)
diff --git a/standard/packages/vanilla-tests/src/event-drag/timegrid-all-day-boundary.ts b/standard/packages/vanilla-tests/src/event-drag/timegrid-all-day-boundary.ts
new file mode 100644
index 000000000..31972163a
--- /dev/null
+++ b/standard/packages/vanilla-tests/src/event-drag/timegrid-all-day-boundary.ts
@@ -0,0 +1,79 @@
+import { describe, expect, it, vi } from 'vitest'
+import { initCalendar } from '../lib/calendar'
+import { TimeGridModel } from '../lib/models/time-grid'
+import { isElVisible, queryPart, queryParts } from '../lib/models/events'
+import { pointer } from '../lib/pointer'
+import { waitForSettle } from '../lib/settle'
+
+describe.each(['timeGridWeek', 'timeGridDay'])('all-day drop boundary in %s', (initialView) => {
+  describe.each(['ltr', 'rtl'] as const)('%s', (direction) => {
+    const options = {
+      initialView,
+      direction,
+      initialDate: '2014-06-11',
+      scrollTime: '01:00',
+      editable: true,
+      dragScroll: false,
+      events: [{ id: '1', start: '2014-06-11T01:00' }],
+    }
+    const dropDate = initialView === 'timeGridDay' ? '2014-06-11' : '2014-06-10'
+
+    it.each([2, 5, 9, 12, 'center'] as const)('drops as all-day at %s px above the cell bottom', async (offset) => {
+      const eventDrop = vi.fn()
+      const calendar = initCalendar({ ...options, eventDrop })
+      await waitForSettle()
+
+      const grid = new TimeGridModel(calendar.el)
+      const { point } = grid.pointForEventAt('1', '2014-06-11T01:00')
+      const cell = grid.allDay.getDayCell(dropDate)
+      const rect = cell.getBoundingClientRect()
+      const x = rect.left + rect.width / 2
+      const y = offset === 'center' ? rect.top + rect.height / 2 : rect.bottom - offset
+      expect(cell.contains(document.elementFromPoint(x, y))).toBe(true)
+
+      await pointer.press(point, async () => {
+        // Sweep upwards through the timed area and divider before releasing inside the cell.
+        const divider = queryPart(calendar.el, 'allDayDivider')!.getBoundingClientRect()
+        for (let sweepY = divider.bottom + 4; sweepY > y; sweepY--) {
+          await pointer.move({ x, y: sweepY }, 1)
+          await waitForSettle()
+        }
+        await pointer.move({ x, y }, 1)
+        await waitForSettle()
+      })
+      await waitForSettle()
+
+      expect(eventDrop).toHaveBeenCalledOnce()
+      const event = calendar.getEventById('1')!
+      expect(event.startStr).toBe(dropDate)
+      expect(event.allDay).toBe(true)
+    })
+
+    it('keeps a visible mirror while crossing the divider into the all-day cell', async () => {
+      const calendar = initCalendar(options)
+      await waitForSettle()
+
+      const grid = new TimeGridModel(calendar.el)
+      const { point } = grid.pointForEventAt('1', '2014-06-11T01:00')
+      const rect = grid.allDay.getDayCell(dropDate).getBoundingClientRect()
+      const divider = queryPart(calendar.el, 'allDayDivider')!.getBoundingClientRect()
+      const x = rect.left + rect.width / 2
+
+      await pointer.press(point, async () => {
+        for (let y = divider.bottom + 4; y >= rect.top + rect.height / 2; y--) {
+          await pointer.move({ x, y }, 1)
+          await waitForSettle()
+          // A free-drag clone lives outside the calendar; an in-grid mirror replaces it over slots.
+          const mirrors = [
+            ...grid.getMirrorEls(),
+            ...grid.allDay.getMirrorEls(),
+            ...queryParts(document, 'event').filter((el) => el.style.position === 'fixed'),
+          ]
+          expect(mirrors.some(isElVisible), `mirror at y=${y}`).toBe(true)
+        }
+      })
+      await waitForSettle()
+      expect(calendar.getEventById('1')!.allDay).toBe(true)
+    })
+  })
+})
```
