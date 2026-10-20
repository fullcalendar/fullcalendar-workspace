# Phase 6: `useHitTarget` and interactions

Status: done.

## What changed

Interactions used to hold the registering component instance, and read `component.props`,
`component.context`, `component.queryHit()` and `component.isValidSegDownEl()` from it. They now
hold a `HitTarget` (`standard/packages/preact/src/interactions/hit-target.ts`):

- `uid`, `el`, `useEventCenter` and `disableHits`, fixed at registration;
- `context`, `eventSelection`, `isEventInteracting` and `isHitComboAllowed`, read live;
- `prepareHits()` and `queryHit()`, which call the latest implementation.

Other changes:

- `isValidSegDownEl` and `isValidDateDownEl` moved off `DateComponent` into `hit-target.ts`, as
  functions. Nothing overrode them.
- `ViewContext.registerInteractiveComponent(component, settings)` became
  `registerHitTarget(target)` and `unregisterHitTarget(uid)`. Registering a uid that's already
  registered replaces it.
- `interactionSettingsStore` became `hitTargetStore`, with the same role: every calendar's droppable
  areas, for dragging between calendars.
- `Interaction` and the `componentInteractions` plugin hook take a `HitTarget` in place of
  `InteractionSettings`. This is `protected-api`, which can break.

### Class adapter

`DateComponent.registerHitTarget({ el, useEventCenter?, disableHits? })` and
`unregisterHitTarget()`, called from the existing ref callbacks. The target reads the component's
`props.eventSelection`, `props.eventDrag`, `props.eventResize` and `props.isHitComboAllowed` live,
the same props `isValidSegDownEl` read before. The 7 registrants keep their ref callbacks and switch
to the hook when their family converts (phase 5 or 7).

### `useHitTarget(elRef, source)`

`standard/packages/preact/src/hooks/useHitTarget.ts`, exported from `protected-api`. No built-in
component uses it yet.

- `source` has the same fields as the class adapter's props, plus `queryHit` and `prepareHits`. It's
  read through `useLatest`, so callers can pass new closures every render.
- Registers in a layout effect. Re-registers when `elRef.current` changes (checked every commit),
  and unregisters on cleanup, so a hidden `<Activity>` has no droppable area.
- `useEventCenter` and `disableHits` are read at registration, because interactions read them in
  their constructors. Every caller passes constants.

### Departures from the toolkit spec (§5.4)

- **One target per registration, not per lifetime.** A new element means new interactions anyway,
  since they listen on the element. The uid is stable for the lifetime.
- **`isEventInteracting` instead of drag and resize getters.** `isValidSegDownEl` only asked whether
  either was set.

## Bug fixed

`TimeGridAllDayLane` declared `isHitComboAllowed` but never passed it on registration, so in a
resource TimeGrid view spanning more than one day, a selection or resize in the all-day row could
cross resources. The adapter reads the prop, which fixes it. Spec: `timeGrid-view selection with
resource columns above date columns disallows an all-day selection across resources`.

`TimeGridCols` and `DayGridRows` captured `isHitComboAllowed` at registration, so it would have gone
stale if the prop changed. No caller changes it, so nothing visible was broken.

## Tests

- `standard/packages/vanilla-tests/src/view-render/use-hit-target.ts`: a custom view registers with
  the hook, then:
  - a date click after navigating uses the latest `queryHit`;
  - after the root element changes tag, the click still reports once, for the new element.
- `premium/packages/vanilla-scheduler-tests/src/column/agenda-selection.ts` and
  `agenda-event-resizing.ts`: all-day selection and resize, within a resource and across resources.
- Each new spec was mutation-checked. Each fails with, respectively:
  - `queryHit` captured at registration;
  - no re-registration when the element changes;
  - the all-day lane without `isHitComboAllowed` (both the selection and the resize spec).
- The React suite's #8119 test received the component through `settings.component`. It now gets
  the target, and reads `moreLinkHeight` by walking React's fiber from `target.el`.

## Review

GPT-6.1-Sol, one round: no actionable findings. Its throwaway checks of `useHitTarget` passed 10 of
10 across React 17, 18 and 19 and Preact, including Strict Mode and `<Activity>`.

## Results

- Preact, the five broad filters:
  - standard: 1044 + 1014;
  - scheduler: 1057 + 1165;
  - the interaction filter (`/drag|drop|resiz|select|click|hover|hit|touch|interaction|external|popover|more|mouse/i`):
    standard 392, scheduler 225.

  All pass.
- React runtime (`FORCE_REACT`), the interaction filter: standard 392, scheduler 227. All pass.
- React suite: 38 of 38.
- DOM snapshots against `phase4fix.preact`: 0 changes, 0 call-count changes.
