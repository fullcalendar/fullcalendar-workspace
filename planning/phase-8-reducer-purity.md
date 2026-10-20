# Phase 8: reducer purity

Status: done.

## What changed

The goal was to stop render-time side effects in the data layer, while it still lives in
`CalendarDataManager`, before any store split (phase 9).

### Timers only between mount and unmount

`NowTimerRunner` (`standard/packages/preact/src/NowTimerRunner.ts`):

- `update()` only computes now. It re-arms only when the runner is already started.
- **`start()`** arms the timer.
  - It refreshes now only if the next change was already due (`nextChangeMs`), which happens when
    time passed while hidden or unmounted. Otherwise it waits out the remainder. So mounting alone
    never causes a re-render.
  - An earlier version refreshed on every start. For units that don't snap (Timeline), that reported
    a few-millisecond change on every mount, and doubled initial render-hook calls. The `rerender
    performance for resource timeline` spec caught it.
- **`stop()`** disarms. `destroy()` is `stop()`.

Who starts and stops it:

- `NowTimer` (class component): `componentDidMount` starts, `componentWillUnmount` stops. Strict Mode
  and `<Activity>` remounts call both, in order.
- `CalendarDataManager`: `mount()` starts, `unmount()` stops.
  - React `Calendar`: `mount()`/`unmount()` in a layout effect, which re-runs for Strict Mode and
    `<Activity>`.
  - Vanilla `Calendar` (and `vanilla-w-react`): `mount()` in the constructor, as the timer always
    started there, and again in `render()` for rendering after `destroy()`. `destroy()` unmounts.

### Effects users can observe wait for the commit

`CalendarDataManager` has a private effect queue. It holds the `loading` callback.

How the queue runs:

- **Outside render** (vanilla, API calls, fetch callbacks): effects run in the drain loop right after
  the reduction that queued them. Their dispatches are processed in the same drain, so ordering and
  synchronous read-after-write are unchanged.
- **Render-time `update(props, isRendering = true)`** (the React `Calendar` only): effects stay
  queued, and `flushEffects()` runs them from a layout effect after every commit.
- **Render-time drains don't call `onDataChange`.** The render already uses the returned data. This
  removes the render-phase `setRevision` that every option-change dispatch used to cause.
- **A mount-gated calendar holds effects while not mounted.** Otherwise a fetch started by a render
  that never committed would run that render's effects when it resolves.

### Controller binding follows committed data

`CalendarDataManager.syncController(controller)` (also on `CalendarData`) binds a controller and
unbinds the previous one. It remembers the last controller it synced (`committedController`).

- **React:** `CalendarInner` calls it in `componentDidMount` and `componentDidUpdate`, with its own
  props, before the prop-set handlers emit `datesSet`. A replacement controller therefore gets the
  `datesSet` of the commit that binds it, and a render that never commits never binds anything.
- **Preact:** the same, plus the `Calendar` component's per-commit layout effect. Preact runs every
  layout effect before any `componentDidMount`, so without it a parent's layout effect would find
  the controller unbound on mount (e.g. a `controller.gotoDate()` would be lost). In React that
  extra sync runs after `CalendarInner`'s and does nothing.
- **Vanilla:** it's called after each reduction while mounted, and from `mount()`, because vanilla
  renders the latest data and controllers are usable before `render()`.
- **`unmount()`** unbinds the committed controller. The next sync or `mount()` takes it back with
  `_restoreApi`, i.e. only if no other calendar has bound it since.
- The `controller` option-change handler is gone.

### No `flushSync` inside a commit

`onDataChange` gets a third argument, `isInCommit`, which is true when called from `mount()` or
`flushEffects()`, i.e. from React's layout effects. `mount()` sets it before starting the timer,
because a timer that catches up drains, and runs held effects. React's `Calendar` then sets state without
`flushSync`, which React forbids there; React renders a layout-effect state change synchronously
anyway. This happens when a calendar shown again in `<Activity>` catches up on an event change made
while hidden.

### Data changes only while mounted (React)

- `isMountGated: true` (React `Calendar` only) holds `onDataChange` while not mounted. `mount()`
  delivers what's pending.
- A render React discards never mounts, so its async fetch results go nowhere (#8092's warning).
- An unmounted calendar gets nothing (#7070).
- A hidden `<Activity>` calendar catches up when shown.

### Deliberately not changed: fetching stays in the reducer

`sourceDef.fetch()` still runs inside the reduction, during render for React. Moving it to the effect
queue would:

- drop events from server-rendered HTML. Array sources resolve synchronously during
  `renderToString` today, and SSR users would see that as a regression;
- add a render pass on mount, in which the calendar renders without events first.

What made render-time fetching harmful was its *results* reaching a never-mounted or unmounted
component. Mount gating handles that. For a discarded render, the in-flight fetch only holds the
discarded manager until it resolves, and nothing leaks.

Revisit this in phase 9 if the store split makes fetching easy to schedule.

## Results

- **React suite (`@fullcalendar/react`, vitest):** 38 pass.
  - The 3 `it.fails` cases from phase 2 now pass and are plain `it`: Strict Mode timers, #8112 bug 1,
    and #8092 timers.
  - 2 new cases: a Suspense-discarded fetch updates nothing (#8092), and `loading` can set state.
  - Both were mutation-checked: they fail with mount gating disabled and `loading` emitted inline.
  - 3 more after review: a controller from a discarded render is never bound (even when its fetch
    resolves after unmount); a replacement controller gets the commit's `datesSet`; an event changed
    while hidden in `<Activity>` applies when shown, without the `flushSync` warning. All 3 fail on
    the first phase-8 commit.
- **Vanilla Karma, Preact:**
  - Two broad filters covered 952 + 1307 standard specs and 1154 + 969 scheduler specs (overlapping);
    all pass.
  - The render-hook contract and cascade specs pass.
- **DOM snapshots and call counts:** `compare baseline phase8` (Preact) shows 0 of 129 fixtures
  changed, and 0 counts increased or decreased.
- **Vanilla Karma, React (`FORCE_REACT=1`):** 8 failures, all pre-existing. They're identical with
  the pre-phase-8 source, checked by building it.
  - The "no handlers attached after destroy" specs (5 views): react-dom leaves its root listeners
    behind.
  - `CalendarController is not taken back by a destroyed calendar that renders again`:
    `vanilla-w-react` can't render a React root again after `destroy()`.

  These are limitations of the React test runtime, unrelated to this phase.

## Review

GPT-6.1-Sol reviewed `c15d6602d` and found three regressions, all fixed in `afab4ceb1`:

1. A Suspense-discarded render that changed the controller left the old one bound after unmount, and
   its late fetch bound the new one to the unmounted calendar.
2. A replacement controller missed the `datesSet` of the commit that bound it, because the binding
   waited for the parent `Calendar`'s layout effect, which runs after `CalendarInner`'s.
3. Showing an `<Activity>`-hidden calendar after an event change called `flushSync` from a layout
   effect.

Round 2 (`afab4ceb1`) found two more, both fixed:

4. In Preact, the controller was bound in `CalendarInner.componentDidMount`, after a parent's layout
   effects. Checked with a throwaway Preact test (fails without the fix). There's no Preact
   component suite to keep it in; worth adding one.
5. `mount()` set `isInCommit` after starting the timer, so a timer catching up after `<Activity>`
   showed the calendar could run a held `loading` callback whose event change hit `flushSync`.
   Covered by a React spec.

## Follow-ups

- Mutation of shared wiring during render (`calendarApi.currentDataManager = this`,
  `emitter.setOptions`) remains. It's idempotent and harmless for discarded renders, because those
  objects belong to the discarded instance. Phase 9 removes it with the store split.
- `NowTimer` still re-arms during render when its inputs change on a mounted instance. That's
  harmless (same instance, clear then set), and goes away when `useNow` replaces it.
