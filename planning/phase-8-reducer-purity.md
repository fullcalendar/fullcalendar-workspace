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

`CalendarDataManager` has an effect queue (`queueEffect`, also on `CalendarData` for option-change
handlers). It holds:

- the `loading` callback;
- the initial controller binding;
- the `controller` option-change handler's bind/unbind.

How the queue runs:

- **Outside render** (vanilla, API calls, fetch callbacks): effects run in the drain loop right after
  the reduction that queued them. Their dispatches are processed in the same drain, so ordering and
  synchronous read-after-write are unchanged.
- **Render-time `update(props, isRendering = true)`** (the React `Calendar` only): effects stay
  queued, and `flushEffects()` runs them from a layout effect after every commit.
- **Render-time drains don't call `onDataChange`.** The render already uses the returned data. This
  removes the render-phase `setRevision` that every option-change dispatch used to cause.

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

- **React suite (`@fullcalendar/react`, vitest):** 34 pass.
  - The 3 `it.fails` cases from phase 2 now pass and are plain `it`: Strict Mode timers, #8112 bug 1,
    and #8092 timers.
  - 2 new cases: a Suspense-discarded fetch updates nothing (#8092), and `loading` can set state.
  - Both were mutation-checked: they fail with mount gating disabled and `loading` emitted inline.
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

## Follow-ups

- Mutation of shared wiring during render (`calendarApi.currentDataManager = this`,
  `emitter.setOptions`) remains. It's idempotent and harmless for discarded renders, because those
  objects belong to the discarded instance. Phase 9 removes it with the store split.
- `NowTimer` still re-arms during render when its inputs change on a mounted instance. That's
  harmless (same instance, clear then set), and goes away when `useNow` replaces it.
