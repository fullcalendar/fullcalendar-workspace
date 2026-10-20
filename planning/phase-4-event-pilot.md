# Phase 4: pilot, composed event components

## Status

Done.

**Files:**

- `standard/packages/preact/src/common/events.tsx`: `RowEvent`, `ColumnEvent` and `ListItemEvent`, built
  from shared parts.
  - `useEventDisplay` does the shared computation.
  - `buildLayerClassName` joins a part's class options across the event, block and variant layers.
  - The parts are `EventEl` (outer element: eventClass, the mount hooks, `setElEventRange`, the RTL
    `dir` hack), `EventInner` (the eventContent slot) and `EventEdge` (before/after: resizer classes,
    edge content, hit area).
  - The hit expanders are inline in the variants.
- `standard/packages/preact/src/content-inject/CustomContent.tsx`: the memoised content slot from spec
  §6.3.
- `standard/packages/preact/src/hooks/`: `useViewContext`, `useLatest`, `useMountHooks`.
- `StandardEvent.tsx` is deleted.
  - Callers pick a variant: DayGrid and its popover per event (`hasListItemDisplay`), TimeGrid →
    `ColumnEvent`, List → `ListItemEvent`, Timeline → `RowEvent`.
  - `protected-api` exports the three variants and `EventProps`.
- `useRenderHookEl` (spec §6.4) wasn't needed. `EventEl` calls `generateClassName` and
  `useMountHooks` directly, which is all that hook would wrap. Revisit in phase 5 when several areas
  share it.

**Results:**

- **DOM snapshots:** 0 of 129 fixtures changed, under both runtimes.
- **Call counts:** 0 increased, 18 decreased, under both runtimes. Highlights:
  - `eventContent` in a busy month view's drag: 105 → 3;
  - adding an event: 104 → 1;
  - timeGridWeek drag: 111 → 4.
  - The before/after content hooks dropped too.
  - Cause: the stable `renderProps.options`, and `<CustomContent>`'s memo, now that its comparison can
    succeed.
- **Specs:**
  - render-hook contract and cascade specs: 160 standard and 62 scheduler, both runtimes;
  - broad regression filters: 952 + 1307 standard and 1154 + 969 scheduler;
  - React suite: 34.
  - All pass.

## Behavior changes

- **`eventContent` and `rowEventBefore/AfterContent` run less often.** They now run only when their
  render props, generator or attributes change. Before, they ran on every render of the event. The
  roadmap welcomes this. Anyone relying on `eventContent` being re-called with unchanged props (e.g.
  reading outside state without passing a new function) would see stale content. That was already the
  documented behaviour of the memoised `ContentInjector`, which just never applied to events, because
  their `renderProps.options` was a new object every render.
- **A `RenderId` bump no longer re-runs `eventClass`.** `calendar.render()` while already rendering
  bumps it, and the Vue/Angular wrappers rely on that. The bump still re-runs every content
  generator, through `<CustomContent>`. Class generators are recomputed on any real prop change, as
  before.
- **Switching display variant remounts the event.** If an event switches between list-item and row
  display (its range or `eventDisplay` changes), the event component type changes, so it remounts:
  `eventWillUnmount` then `eventDidMount`. Before, the same instance re-rendered. This is rare, and it
  falls under the timing changes the roadmap tolerates.

## Purpose

Replace `StandardEvent` with small function components that compose. It's the first real use of the
hook toolkit and the render-hook primitives.

Why events go first:

- They're leaf components that don't measure anything or read the store.
- They exercise every render-hook kind.
- They show the inverted-responsibility problem most clearly.

## Today

Callers of `common/StandardEvent.tsx`:

| `display` | Callers |
|---|---|
| `row` | DayGrid block events (`DayGridRow`, the `DayGridMoreLink` popover), the TimeGrid all-day row, Timeline (`TimelineEvent`) |
| `column` | TimeGrid (`TimeGridEvent`) |
| `list-item` | List (`ListEvent`), DayGrid dot events (`DayGridRow`, `DayGridMoreLink`) |

What `display` decides inside it:

- **Class slots:** 6 slots (outer, inner, before, after, time, title), each looked up under up to 4
  prefixes.
- **Title:** which edge it sticks to.
- **Layout:** flex direction.
- **Resizing:** the hit-expander axis, and the resizer cursor direction and side.
- **Before/after content:** row events only.

The callers then patch the rest with flags:

- `TimeGridEvent`: `disableLiquid` and a `liquid` class.
- `ListEvent`: `disableDragging`, `disableResizing`, `disableZindexes` and `forcedTimeText`.
- `TimelineEvent`: `defaultDisplayEventTime`.

## Target structure

Names are illustrative.

- **Shared computation:** a hook or plain function that turns an event range plus context into the
  render props.
  - Covers the time text, the cached `EventApi`, draggable and start/end resizable, colors,
    `timeClass`/`titleClass`, and the flags like `isPast`/`isSelected`.
  - Also produces the tag and attrs from `getEventTagAndAttrs`.
- **Parts:**
  - `EventEl`, the outer element: tag and attrs, mount hooks, `--fc-event-color`/`--fc-event-contrast-color`,
    the internal class names that drag-and-drop and selection rely on, and `setElEventRange` on the
    element. Keeps the `dir="rtl"` hack for a dragged event, because the drag mirror is appended
    outside the calendar root.
  - `EventResizer` (`edge` start/end, `axis` x/y): the resizer element, its cursor and internal
    classes, and its hit area when selected.
  - `EventHitExpander` (`axis`).
  - `<CustomContent>` for `eventContent`, with `EventInner` (time and title) as the default content.
- **Variants:** each declares its class layers and geometry instead of switching on `display`.
  - `RowEvent`: layers `event`, `blockEvent`, `rowEvent`. x-axis resizers and hit expander, title
    sticks to the start edge (`rowEventTitleSticky`), and the only variant with
    `rowEventBeforeContent`/`rowEventAfterContent`.
  - `ColumnEvent`: layers `event`, `blockEvent`, `columnEvent`. y-axis resizers and hit expander,
    title sticks to the top, the liquid layout TimeGrid needs.
  - `ListItemEvent`: layers `event`, `listItemEvent`. No hit expander. It still renders the
    before/after elements when their *classes* are set, because DayGrid's dot comes from
    `listItemEventBeforeClass`.
- **Caller choices, not variant traits.** These stay props on every variant, because callers differ
  within one variant:
  - dragging: DayGrid dot events drag, List events don't;
  - resizing: `TimeGridCol` disables it for some column events, DayGrid for its list-item events;
  - z-indexes: only `ListEvent` disables them (sticky list headers); DayGrid dot events have the `z0`/`z1`
    classes today and must keep them.
- **Callers pick the variant.** DayGrid chooses between `RowEvent` and `ListItemEvent` per event,
  using `hasListItemDisplay`, as it does today.
- The view-specific wrappers (`TimeGridEvent`, `ListEvent`, `TimelineEvent`) either become thin
  function components that pass view defaults (time format, forced time text), or disappear into
  their callers.
- **Layers are data, not logic:** for example, `classLayers(options, ['event', 'blockEvent', 'rowEvent'], 'Inner', renderProps)`.
  That keeps the public cascade exactly as it is.

## Contracts

- The phase-2 specs pass, including the event class cascade spec.
- The DOM snapshot comparison against the phase-1 baseline shows no diffs, apart from any listed
  under "Behavior changes" below.
- The render props passed to `eventContent`, `eventClass` and the other event hooks have the same
  keys and values.
- Drag, resize, select and click specs pass unchanged. They depend on the internal classes and on
  `setElEventRange`.
- Scheduler: `info.resource` still reaches event hooks through `renderProps`.
- `renderProps.options` (`{ eventOverlap }`) is built once per option change, not per render, so
  `<CustomContent>`'s shallow comparison can work. Expect fewer `eventContent` calls (see the phase-2
  note on known inflation).

## Verification

- Targeted Karma runs for `event-render`, `event-drag`, `event-resize`, `event-click-hover`, list and
  timeline events, and the phase-2 specs. Add an RTL drag spec if none exists.
- DOM snapshot compare, under both runtimes.
- Render-hook callback counts before and after, using the phase-2 count harness on a busy month view
  and a busy timeGridWeek, through initial render, navigation, option changes and a drag. Record them
  here. **Gate: no count may go up** (see the roadmap ground rules).
- GPT-6.1-Sol review of the phase.

## Behavior changes

None expected. Record any here.

## Lessons for phase 5

- **Stable ref callbacks matter.** An inline ref callback is replaced on every render, so React
  detaches and re-attaches it each commit, which churns parents' `elRef`s. `EventEl` and
  `<CustomContent>` keep one callback per instance, which reads the latest target through a ref
  assigned during render. That's safe here because it's only a ref target, but write it down as a
  convention (spec §2).
- **Most of the call-count win came from one unstable object** (`renderProps.options`). Look for the
  same pattern in other areas' render props before converting them. It's cheap to fix even in class
  components.
- **Other components that switch on a mode the same way:**
  - `MoreLinkTrigger` (`display` row/column);
  - `DayGridHeaderCell`, shared by DayGrid, TimeGrid and the resource views;
  - the resource spreadsheet cells (`forPrint` td/div).
- **`generic memo`** needs `as unknown as typeof Impl` to keep a component's type parameter (see
  `CustomContent`).
