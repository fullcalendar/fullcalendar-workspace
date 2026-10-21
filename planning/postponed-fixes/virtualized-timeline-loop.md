# Postponed Fix: Virtualized Resource Timeline Re-renders Every Frame

Status: diagnosed and patched by a Sol subagent (GPT-Sol-6.1, high effort) on 2026-10-20. **Not applied:** it waits until the test revamp is merged to main.

## Symptom

```js
new Calendar(el, { initialView: 'resourceTimelineDay', initialDate: '2015-08-07', virtualization: true,
  scrollTime: '00:00', resources: [] }).render()
```

The calendar re-renders every animation frame, forever: about 2,640 DOM mutations per 500ms, measured a second after render. That burns CPU for real users, and the test helper `waitForSettle()` never resolves. It also happens with 1 resource, and with resources fetched late. With `scrollTime: '01:00'`, or the default `scrollTime`, it's quiet.

## Root cause

Slot-header measurement feeds back into horizontal virtualization. Measured at a 624.6px timeline viewport:

1. The slot width is 28px. The header's overscan window includes the `12pm` label, whose measured inner width is 55.59px.
2. `TimelineHeaderRow.handleInnerWidths()` reports the widest *mounted* label through `ResourceTimelineLayoutNormal.handleSlotInnerWidths()` to `ResourceTimelineView.handleSlotInnerWidth()`.
3. `computeSlotWidth()` computes `ceil((55.59 + 1) / 2) = 29px`.
4. At 29px, virtualization excludes `12pm`. Unmounting it clears its width ref, so the widest label is now 54.52px.
5. `ceil((54.52 + 1) / 2) = 28px`, so `12pm` mounts again, and the cycle repeats.

`scrollTime` and the resource count matter only because they decide whether `12pm` sits at the edge of the virtualized window. The reported quiet case with 26 overflowing static resources didn't reproduce in headless Chromium (which hides scrollbars): it kept looping. Presumably, in a real browser, a vertical scrollbar narrows the viewport enough that `12pm` stays out at both widths (below about 616px).

## Fix

`TimelineHeaderRow` remembers the last measured width of headers that virtualization has unmounted, while they're still in the full row (`props.cells`, which the component slices for virtualization). Fresh measurements take precedence, so widths can still grow or shrink. Headers that leave the full row are dropped from the cache. Non-virtualized rows behave as before.

Caveat: a remembered width can be stale if a label's content changes while it's unmounted (e.g. a `locale` change), leaving slots too wide until that header is scrolled back into view.

## Tests

- New: "settles with N resources at midnight in DIR" (0/1 resources × LTR/RTL), in `premium/packages/vanilla-scheduler-tests/src/resource-data/timeline.ts`. It renders with `scrollTime: '00:00'` and `virtualization: true`, awaits `waitForSettle()`, then requires zero mutations over 5 frames.
- Changed: "keeps the scroll position when virtualized" drops its `scrollTime: '01:00'` workaround.
- Before the fix, both time out. After: 47 files and 676 scheduler tests pass, under both the default build and `FORCE_REACT=1` (as Sol reported; not re-run by me).

## Applying

The patch was made against `71ba1c4f5` (the revamp branch before its last few commits). Save the block below to a file and run `git apply` from the repo root. Then rebuild and run `src/resource-data/timeline.ts`. Also add a changelog line, and close out the entry in `../needed-test-coverage.md`.

```diff
diff --git a/premium/packages/preact-scheduler/src/timeline/components/TimelineHeaderRow.tsx b/premium/packages/preact-scheduler/src/timeline/components/TimelineHeaderRow.tsx
index 5be7a92f2..fb0c655cc 100644
--- a/premium/packages/preact-scheduler/src/timeline/components/TimelineHeaderRow.tsx
+++ b/premium/packages/preact-scheduler/src/timeline/components/TimelineHeaderRow.tsx
@@ -48,6 +48,7 @@ export class TimelineHeaderRow extends BaseComponent<TimelineHeaderRowProps, Tim
 
   // internal
   private _isUnmounting: boolean
+  private cachedInnerWidths = new Map<string, number>()
 
   render() {
     const { props, innerWidthRefMap, innerHeightRefMap, state, context } = this
@@ -115,14 +116,24 @@ export class TimelineHeaderRow extends BaseComponent<TimelineHeaderRowProps, Tim
     this._isUnmounting = false
   }
 
+  // Retain widths of virtualized-away cells so resizing slots cannot unmount the widest label
+  // and shrink them again. Only retain cells still in the full row, and prefer fresh measurements.
   handleInnerWidths = () => {
-    if (this._isUnmounting) return
+    if (this._isUnmounting) {
+      return
+    }
     const innerWidthMap = this.innerWidthRefMap.current
+    const cachedInnerWidths = new Map<string, number>()
     let max: number | null = null
 
-    for (const innerWidth of innerWidthMap.values()) {
-      max = Math.max(max || 0, innerWidth)
+    for (const cell of this.props.cells) {
+      const innerWidth = innerWidthMap.get(cell.key) ?? this.cachedInnerWidths.get(cell.key)
+      if (innerWidth != null) {
+        cachedInnerWidths.set(cell.key, innerWidth)
+        max = Math.max(max || 0, innerWidth)
+      }
     }
+    this.cachedInnerWidths = cachedInnerWidths
 
     // TODO: ensure not equal?
     setRef(this.props.innerWidthRef, max)
diff --git a/premium/packages/vanilla-scheduler-tests/src/resource-data/timeline.ts b/premium/packages/vanilla-scheduler-tests/src/resource-data/timeline.ts
index 40bf0a1aa..7f8176013 100644
--- a/premium/packages/vanilla-scheduler-tests/src/resource-data/timeline.ts
+++ b/premium/packages/vanilla-scheduler-tests/src/resource-data/timeline.ts
@@ -30,7 +30,40 @@ function buildResources(count: number, titleSuffix = '') {
   return Array.from({ length: count }, (_, i) => ({ id: `r${i}`, title: `resource ${i}${titleSuffix}` }))
 }
 
+function nextFrame(): Promise<void> {
+  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
+}
+
 describe('resource data in resource timeline', () => {
+  it.each([
+    [0, 'ltr'],
+    [1, 'ltr'],
+    [0, 'rtl'],
+    [1, 'rtl'],
+  ] as const)('settles with %s resources at midnight in %s', async (resourceCount, direction) => {
+    const calendar = initCalendar({
+      initialView: 'resourceTimelineDay',
+      initialDate: '2015-08-07',
+      virtualization: true,
+      scrollTime: '00:00',
+      direction,
+      resources: buildResources(resourceCount),
+    })
+    await waitForSettle()
+
+    const mutations: MutationRecord[] = []
+    const observer = new MutationObserver((records) => mutations.push(...records))
+    observer.observe(calendar.el, { attributes: true, childList: true, characterData: true, subtree: true })
+    try {
+      for (let i = 0; i < 5; i++) {
+        await nextFrame()
+      }
+      expect([...mutations, ...observer.takeRecords()]).toEqual([])
+    } finally {
+      observer.disconnect()
+    }
+  })
+
   describe('adding and removing resources', () => {
     const options: CalendarOptions = {
       initialView: 'resourceTimelineDay',
@@ -181,10 +214,6 @@ describe('resource data in resource timeline', () => {
       return { resources, events }
     }
 
-    function nextFrame(): Promise<void> {
-      return new Promise((resolve) => requestAnimationFrame(() => resolve()))
-    }
-
     function fakeTimeouts(): void {
       vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
       onTestFinished(() => {
@@ -345,9 +374,7 @@ describe('resource data in resource timeline', () => {
 
     it.each([
       ['', {}],
-      // LIBRARY QUIRK: virtualized with scrollTime 00:00, it re-renders every frame and never settles.
-      // See planning/agent-notes/timeline.md
-      [' when virtualized', { virtualization: true, scrollTime: '01:00' }],
+      [' when virtualized', { virtualization: true }],
     ])('keeps the scroll position%s', async (_desc, moreOptions) => {
       const resourceFetch = createHeldFetch(() => buildResources(26))
       const calendar = initCalendar({ ...options, ...moreOptions, resources: resourceFetch.fetch, events })
```
