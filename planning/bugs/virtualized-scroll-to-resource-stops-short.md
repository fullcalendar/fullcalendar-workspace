# Scrolling to a re-added resource stops short in a virtualized timeline, under React

**Status:** confirmed
**Test:** `premium/.../src/resource-data/timeline.ts` ("renders the rows in view after re-adding them with scrollTo"), failing under `FORCE_REACT=1`
**Issues:** none found

Found 2026-11-10 in the full suites after merging main. A regression from main's `6376c8d91` (the virtualized slot-label render loop fix, released in 7.1.4): the test passes under React just before that commit and fails from it on (bisected). Preact passes.

## What happens

A virtualized `resourceTimelineDay` (`height: 400`, rows of varying heights) replaces all its resources with 90, through `calendar.addResource(resource, true)` (scroll to it), twice, scrolling back to the top in between:

| | React | Preact |
|---|---|---|
| after the 2nd replace | `scrollTop` 5103 of 5238 max, rows r083–r087 | 5236 of 5304, r084–r089 |
| after a forced rerender | unchanged | unchanged |

Under React the scroll lands exactly on the previous maximum (5103), then the re-added rows are measured and the scroll height grows, but the scroll isn't reapplied, so `r089` stays out of view.

## Cause (from the code and the probe, not instrumented)

`addResource(…, true)` emits `_resourceScrollRequest`; `ResourceTimelineLayoutNormal.handleResourceScrollRequest` applies it, or queues it (`queuedEntityScroll`) for `componentDidUpdate` if the row isn't laid out yet. `computeEntityScroll` clamps the requested top to `this.maxVScroll`, computed at render from the row heights known then (unmeasured rows use the estimate). When the request is applied before the new rows are measured, it's clamped short, and the request is used up. Before `6376c8d91`, slot-label widths reported again as labels remounted, which rerendered after the rows were measured and so applied the queued scroll later, with the right max. React's render timing exposes the gap; Preact's happens to order the measurement first.

## Fix idea

When the requested top is clamped by `maxVScroll`, keep the request queued, so it's reapplied after the next layout, until it reaches the resource or the user scrolls (`handleEntityScrollStart` already clears the entity anchor on a user scroll).

The test is a plain `it`, so the React suite fails until this is fixed. If the fix waits, mark the case `it.fails` under React (as `itNotUnderReact` does in `more-link/click.ts`) with a `KNOWN BUG` comment.
