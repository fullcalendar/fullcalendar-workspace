# ViewContext consumer inventory (for phase 11)

A read-only survey by an Explore agent, 2026-10-21, after phase 10. Paths: **S** =
`standard/packages/preact/src/`, **P** = `premium/packages/preact-scheduler/src/`. `useViewContext()`
(S `hooks/useViewContext.ts:8`) returns `useContext(ViewContextType)` (S `ViewContext.ts:16`);
`ViewContext` extends `CalendarContext`.

## 1. Hooks that read the context

| File:line | Hook | Fields |
|---|---|---|
| S hooks/useNow.ts:12 | useNow | nowManager, dateEnv, options.nowIndicatorSnap |
| S hooks/useScrollerSyncer.ts:19 | useScrollerSyncer | pluginHooks (`getScrollerSyncerClass`), read once in a `[]` mount effect |
| S hooks/useHitTarget.ts:33 | useHitTarget | registerHitTarget, unregisterHitTarget; the whole context in `useLatest`, exposed as `HitTarget.context` (getter, :82) |
| S daygrid/components/useDayGridViewData.ts:20 | useDayGridViewData | dateProfileGenerator, dateEnv; useNow |
| S daygrid/components/useDayGridViewData.ts:35 | useDayHeaderFormatter | options.dayHeaderFormat |
| S timegrid/components/useTimeGridViewData.ts:29 | useTimeGridViewData | options.nowIndicator, dateEnv, dateProfileGenerator; useNow |
| P timeline/print-adapter.ts:103 | useTimelinePrintBands | options.eventOrder/eventMinWidth/eventOrderStrict, dateEnv |

Only through those hooks: `NowTimer`, `ListDays` (useNow); `TimeGridAllDayLane` (useHitTarget);
`TimelinePrintFg` (useTimelinePrintBands).

## 2. Consumer classification (89 sites: 56 standard, 32 premium, 1 `.Consumer`)

- **Only `options` (27, no other context access):** CustomContentImpl, Toolbar, ToolbarSection,
  TimeGridLayoutNormal, TimeGridSlatHeaderLabel, TimeGridColLane, ForegroundEvent, rowEventVariant.Body,
  EventEl, EventInner, EventEdge, NowIndicatorDot (`.Consumer`), ListEvent, useDayHeaderFormatter,
  DayGridHeaderRowImpl, DayGridCellEl, DayGridLayoutNormal, InlineWeekNumber, DayGridLayoutPrint,
  DayGridLayoutBody, ResourceLaneCell, ResourcePrintLaneCell, ResourceSubrow, ResourceExpander,
  ResourceGroupSubrow, ResourceIndent, TimelineHeaderRow. Plus 3 that also call a context-reading hook:
  the two Pannable layouts (useScrollerSyncer → pluginHooks), DayGridRows (useHitTarget).
- **Only `dateEnv` (3):** DayGridHeaderCellLabel, TimelineNowIndicatorArrow, TimelineNowIndicatorLine.
- **Only `options` + `dateEnv` (4):** TimelineBg, TimelineFg (`renderMirrorSegs` reads only those),
  useTimelinePrintBands, TimeGridCols (also useHitTarget).
- **`options`/`dateEnv` + `viewApi` (14):** TimeGridAllDayHeader, ListNoEvents, HeaderCell,
  SuperHeaderCell, ResourceGroupCell, GroupLane (viewApi only), TimeGridSlatHeader, TimeGridSlatLane,
  TimeGridCol, NowIndicatorHeaderContainer, NowIndicatorLineContainer, ListDay, TimelineSlatCell,
  MorePopover (also useHitTarget).
- **`pluginHooks` (13):** directly useScrollerSyncer, ResizableTwoCol, HeaderCells (`elementDraggingImpl`,
  in a `useState` initializer); through utilities useEventDisplay (`computeEventRangeDraggable`) and
  every `Slicer.sliceProps` caller (DayGridViewBody, TimeGridViewBody, SingleMonth,
  ResourceDayGridViewBody, ResourceTimeGridViewBody, TimelineViewBody, ResourceTimelineViewBody,
  ResourceLane, ResourcePrintRow).
- **`viewSpec` (11):** 8 only forward it as `<ViewContainer viewSpec>`, which ignores the prop (DayGridLayout,
  TimeGridLayout, ListViewBody, MultiMonthViewBody, TimelineLayoutNormal, TimelineLayoutPrint,
  ResourceTimelineLayoutNormal, ResourceTimelineLayoutPrint); real readers: ViewContainer,
  ViewHookComponent, ListDayHeader.
- **`dateProfileGenerator` (8):** useDayGridViewData, useTimeGridViewData, MultiMonthViewBody,
  SingleMonth, TimelineViewBody, ResourceTimelineViewBody, ResourceLane, ResourcePrintRow.
- **`viewApi` (about 32),** including everything using header-tier builders, EventImpl or
  buildMoreLinkRenderProps.
- **Hit targets:** useHitTarget, from MorePopover, TimeGridAllDayLane, TimeGridCols, ListViewBody,
  DayGridRows, TimelineLayoutNormal, ResourceTimelineLayoutNormal. (`DateComponent`'s methods read it too,
  unused.)
- **`emitter` (4):** TimeGridLayout (`[emitter]` effect, :135), TimelineLayoutNormal (`[]` mount effect),
  ResourceTimelineLayoutNormal (via useResourceTimelineScroll's `[]` mount effect), useEventDisplay
  (getEventTagAndAttrs).
- **`dispatch` (2):** ResourceCell, ResourceGroupHeaderCell.
- **`calendarApi` (about 14):** via buildNavLinkAttrs (DayGridCell, DayGridRow, TimeGridWeekNumber,
  ListDayHeaderInner, SingleMonth, TimelineHeaderCell), header-tier `buildDateDataConfigs`, MoreLink*,
  lazily via EventImpl/ResourceApi.
- **`getCurrentData`:** never eagerly in render; lazily through EventImpl/ResourceApi.
- **`nowManager`:** useNow only. **`baseId` (3):** MoreLinkContainer, SingleMonth,
  ResourceTimelineLayoutNormal.

## 3. Utilities taking a ViewContext / CalendarContext

Called from components: buildDateStr (dateEnv), buildNavLinkAttrs (dateEnv, nav-link options,
calendarApi), buildMoreLinkRenderProps (viewApi, moreLinkText, calendarApi), the header-tier builders
(dateEnv, viewApi, dayHeader options, nav links), buildWeekNumberRenderProps (dateEnv, weekNumberFormat),
appendFillSegs (options), TimeGridSlatHeader's createRenderProps (dateEnv, viewApi),
computeEventRangeDraggable (pluginHooks.isDraggableTransformers, passing the context on; premium's
`transformIsDraggable` reads getCurrentData), buildEventRangeTimeText (dateEnv, display options),
getEventTagAndAttrs (emitter, eventInteractive, viewApi, EventImpl), `new EventImpl(context)` (stored;
lazily dateEnv, allDayMaintainDuration, calendarApi.store, getCurrentData), `Slicer.sliceProps` /
`sliceNowDate` (via fabricateEventRange/expandRecurring: pluginHooks.eventRefiners,
eventDefMemberAdders, recurringTypes, dateEnv, default-duration options; the context is an argument of
the memoized `sliceBusinessHours`/`sliceDateSelection`), renderMirrorSegs, the premium header-tier and
table-model builders (`new ResourceApi(context)`), refineResourceLaneRenderProps, ResourceCell's
refineRenderProps, useResourceTimelineScroll (options, dateEnv, emitter).

Interactions get a ViewContext through `HitTarget.context` (`HitDragging` sets `hit.context`) and read
emitter, viewApi, interaction options, dateEnv, dispatch, getCurrentData, calendarApi and
pluginHooks.dateSelectionTransformers/externalDefTransforms; their helpers (`triggerDateSelect`,
`buildDateSpanApiWithContext`, `getDefaultEventEnd`, `buildDatePointApiWithContext`, validation,
`applyMutationToEventStore`, premium transforms) take it as a `CalendarContext`.

Store-side utilities get the store's own `CalendarContext` (`buildCalendarContext`, rebuilt each
reduction, with calendar-level options), not the React context.

## 4. Creation and memoization

The only provider: `CalendarInner` (S CalendarInner.tsx:76–123), wrapping the toolbars, the view and
`viewContainerAppends`; `MorePopover` portals inherit it. `memoize(buildViewContext)` compares its 14
positional inputs by identity. Constant per calendar: nowManager, dispatch, getCurrentData, emitter,
calendarApi, register/unregisterHitTarget, baseId (unless `id` changes). Changing: `options` (the view's
refined options: new only when a view option's raw value changes, or on a view switch), `viewSpec`
(`buildViewSpecs` memoized on the stable overrides, which any calendar-level option change replaces, so
practically any option change), `dateEnv`, `pluginHooks`, `dateProfileGenerator` (`memoizeObjArg` on its
props), `viewApi` (`memoize` on viewType, getCurrentData, dateEnv). Navigation, events, selection,
drag/resize and now ticks arrive as props, not through the context.

## 5. Identity dependencies

- `useMemo`s keyed on the whole `context`: S common/events.tsx:194, common/bg-fill.tsx:34,
  daygrid/components/DayGridView.tsx:34, DayGridRow.tsx:200, timegrid/components/TimeGridView.tsx:63,
  TimeGridSlatHeader.tsx:50, multimonth/components/SingleMonth.tsx:69; P ResourceDayGridView.tsx:75 and
  ~:120, ResourceTimeGridView.tsx:72 and ~:169, ResourceLane.tsx:58, ResourcePrintRow.tsx:62,
  ResourceCell.tsx:47. On the whole `options`: P TimelineView.tsx:41, ResourceTimelineView.tsx:59.
- `memoize()` with the context as an argument: `Slicer.sliceBusinessHours`/`sliceDateSelection` (S
  common/slicing-utils.ts:34–35).
- Effects: `[emitter]` in TimeGridLayout.tsx:135; mount-only captures of emitter (TimelineLayoutNormal
  :196–222, useResourceTimelineScroll :361–400) and pluginHooks (useScrollerSyncer :25,
  ResizableTwoCol :30); a `useState` initializer capture in HeaderCells :27; useHitTarget captures
  `unregisterHitTarget` at registration (:55).
- Context identity comparisons as "same calendar" checks: S interaction-plugin/interactions/
  EventDragging.ts:171, 212, 262, 384, 387, 417; ExternalElementDragging.ts:187 (both sides from
  `HitTarget.context`, the latest context).
- Stored contexts: `EventImpl._context`, `ResourceApi._context`; render-time refs: ResourceTimelineLayout
  Normal's `contextRef`, TimelineLayoutNormal's and useHitTarget's `useLatest`, useResourceTimelineScroll's
  `inputRef`.
- Class views (`DayGridView`, `TimeGridView`, `ListView`, `MultiMonthView`, the four premium views) and
  `Scroller` have `contextType` through `BaseComponent`/`DateComponent` and never read `this.context`;
  they re-render on every context change regardless of `shouldComponentUpdate`. `CalendarInner` (the
  provider) also has it, unread.
