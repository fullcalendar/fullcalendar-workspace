# Phase 7b: the day-table pipeline

Status: plan, revision 2 (2026-10-21, after spec review round 1 by Sol, §7). Not started.

Sequencing: lands right after phase 10 (date profile, `phase-10-date-profile.md` revision 3) and
before phase 11 (granular contexts, `useSyncExternalStore`, render-time purity). The design consumes
phase 10's `DateProfileGenerator.hiddenDays` (§2.9) and makes every new piece a pure function of
explicit inputs, with the impure helpers it still calls listed for phase 11 (§2.10).

Background: `day-table-pipeline.md` (the problem), `refactor-roadmap.md` §7b (ground rules),
`phase-7-layout-families.md` (the hooks the views already use), `phase-9-store.md` (derived data).

Goal in one sentence: replace the split-by-resource, slice-per-resource, rejoin pipeline with one
pure column model and one pass over the store per lane, with the same DOM, the same callbacks and the
same or lower render-hook counts.

---

## 1. What's there today

About 1,700 lines across the two packages (the files below sum to 2,000 with the views). Four views
use it: `DayGridView`, `TimeGridView`, premium `ResourceDayGridView`, `ResourceTimeGridView`, plus
`SingleMonth` (MultiMonth) for the standard half.

### 1.1 Files

Standard (`standard/packages/preact/src`):

| File | What |
|---|---|
| `component-util/event-splitting.ts` (184) | `Splitter` base: `splitProps(props) → { [key]: SplittableProps }`. Per-key `eventStore` subset, `eventUiBases` (`buildEventUiForKey`, `:164`: calendar base `''` combined with the key's `ui`, plus the **individual per-def bases of the defs that belong to the key in the current store**, `:110-126`, keyed by `defKeys` from `getKeysForEventDefs(props.eventStore)`), `businessHours` (the key's or the calendar's, `:52`; never partitioned), `dateSelection` (if `getKeysForDateSpan` matches), `eventDrag`/`eventResize` (`_splitInteraction`, `:128`: the affected store split by the *affected* defs' keys, the mutated store by the *mutated* defs' keys, a per-key state for every key either has), `eventSelection` (kept only if the instance is in the subset). Memoized per field with `memoize`, plus a per-key `eventUiBuilders` map (`:44`). |
| `common/slicing-utils.ts` (270) | `Slicer<R, ExtraArgs>` base: `sliceProps(props, dateProfile, nextDayThreshold, context, ...extra) → SlicedProps<R>`. Five `memoize` fields keyed on their argument lists (`:34-38`); `sliceNowDate` (`:86`) is not memoized. `_sliceEventStore` calls `sliceEventStore` (`component-util/event-rendering.ts:49`) then `sliceRange` per `EventRenderRange`; `_sliceDateSpan` clips with `intersectDateSpan` (drops `instantStartMs`/`instantEndMs` when clipped, `:41-58`) and fabricates an `eventRange` (`fabricateEventRange`, `structs/date-span.ts:231`: a parsed def and a `createEventInstance` with fresh ids); `_sliceBusinessHours` expands recurring BH into the active range; `computeActiveRange` (`:259`) is the civil active range for all-day components and the slot-widened range for timed ones. `forceDayIfListItem` (`:63`, `:235`) makes multi-day `list-item` events one day. |
| `component-util/event-rendering.ts:49` | `sliceEventStore(eventStore, eventUiBases, framingRange, nextDayThreshold)`: three stages: (1) iterate **defs** to initialise `inverse-background` groups (`:57-72`); (2) iterate **instances in store order** (`:74-103`), classify by compiled `ui.display`, push fg/bg ranges or collect inverse ranges; (3) emit the inverse complements, by group then by def (`:105-140`). Output order is instance order, not def order. |
| `common/DaySeriesModel.ts` (97) | Dates of a render range minus hidden days, with `sliceRange(range) → SlicedCoordRange \| null` clamping endpoints on hidden days inward. Reads `dateProfileGenerator.isHiddenDay` (`:35`). |
| `common/day-cols.ts` (72) | `DayCol { key, date, range, isMajor, isDisabled, isInert?, renderProps?, attrs?, className?, dateSpanProps? }`; `buildDayColsFromSeries(daySeries, dateEnv, { slotRange, majorUnit, activeRange })`. |
| `daygrid/DayTableModel.ts` (139) | `DayTableModel` class (with private `dateEnv`, `majorUnit`, `activeRange`, `:37-39`): `rowCount`, `colCount`, `cellRows: DayTableCell[][]`, `headerDates`, `daySeries`; `DayTableCell` (same shape as `DayCol` minus `range`); `DayGridRange { row, start, end, isStart, isEnd }` (start/end are column indices within the row); `buildDayGridRanges(seriesRange, daysPerRow)` (`:112`). |
| `daygrid/components/util.tsx:14` | `buildDayTableModel(dateProfile, dateProfileGenerator, dateEnv)`: `breakOnWeeks` for year/month/week units, major unit otherwise. |
| `daygrid/DayTableSlicer.ts` (20) | `DayTableSlicer extends Slicer<DayGridRange, [DayTableModel]>` (`sliceRange` = `buildDayGridRanges(daySeries.sliceRange(range), dayTableModel.colCount)`, the **plain** table's column count) and `DaySeriesSlicer extends Slicer<DayGridRange, [DaySeriesModel]>` (`daySeries.cnt`); both `forceDayIfListItem = true`. |
| `daygrid/TableSeg.ts` (61) | `getDayGridSegKey(seg) = instanceId:start` (the slice-height map key), `splitSegsByRow`, `splitInteractionByRow`. |
| `daygrid/header-tier.ts` (268) | `buildDateRowConfigs`/`buildDateRowConfig`/`buildDateDataConfigs`/`buildDateRenderConfig`: the header tiers (`RowConfig`, `CellDataConfig`). |
| `timegrid/AllDaySplitter.ts` (33) | `Splitter` with keys `allDay`/`timed`: timed defs → `timed`; all-day defs with `hasBgRendering(def)` (**def-level** `def.ui.display`, not the compiled UI, `:27`) → both; other all-day → `allDay`; spans by `allDay`. Business hours are forwarded to both lanes whole (`event-splitting.ts:52`). |
| `timegrid/DayTimeColsSlicer.ts` (25) | `Slicer<TimeGridRange, [DateRange[]]>`: intersect with each column's range. |
| `timegrid/TimeColsSeg.ts` (68) | `TimeGridRange { col, startDate, endDate, isStart, isEnd, showDot? }`, `organizeSegsByCol`, `splitInteractionByCol`. |
| `daygrid/components/useDayGridViewData.ts` (41) | `useDayGridViewData(dateProfile)`: `dayTableModel` (`useMemo` on dateProfile, generator, dateEnv), `datesRepDistinctDays`, `todayRange` (`useNow('day')`). `useDayHeaderFormatter`. |
| `timegrid/components/useTimeGridViewData.ts` (87) | `useTimeGridViewData(props)`: `daySeries`, `dayCols` (slot ranges), `dayRanges`, `splitProps` from an `AllDaySplitter` held in state, now. `useTimedSegsByCol(timed, colCount)`: six `useMemo`s over `organizeSegsByCol`/`splitInteractionByCol`. |
| `daygrid/components/DayGridView.tsx` (60) | One `DayTableSlicer` in state; `slicer.sliceProps(props, dateProfile, nextDayThreshold, context, dayTableModel)`; header tiers `useMemo`. No splitter: the full `eventUiBases` reach the slicer. |
| `timegrid/components/TimeGridView.tsx` (98) | `DaySeriesSlicer` (all-day lane, `daySeries`) and `DayTimeColsSlicer` (timed, `dayRanges`); `sliceNowDate(nowDate, dateProfile, options.nextDayThreshold, context, dayRanges)` every render (`:47`); `organizeSegsByCol` of it in a `useMemo` whose key is new every render. |
| `daygrid/components/DayGridRows.tsx:237` | `splitAllDaySegsByRow`: the all-day row drops bg segs whose def is timed (TimeGrid's all-day lane receives timed bg defs from `AllDaySplitter`; they render in the columns only). |
| `multimonth/components/SingleMonth.tsx:45-50` | `buildDayTableModel` + a `DayTableSlicer` per month. |

Premium (`premium/packages/preact-scheduler/src`):

| File | What |
|---|---|
| `resource/common/VResourceSplitter.ts` (40) | `Splitter<VResourceProps>`: keys = the model's `resourceIndex.indicesById` (every resource in `resources`, whether or not it owns a column) plus `''`; key info is the `Resource` itself (`ui`, `businessHours`); defs by `resourceIds` or `['']`; spans by `dateSpan.resourceId \|\| ''`. |
| `resource/common/VResourceJoiner.ts` (191) | `joinProps(propSets, model)`: six `memoize` fields keyed on `(model, ...setsInKeyOrder)` with keys `resourceIndex.ids.concat([''])` (`:30`). `joinSegs` (`:59`): each resource's segs → its columns; the `''` set → every resource's columns *and* the placeholder columns (`resourceI = -1`); fg skips the `''` set entirely (`:37`, `NO_SEGS`). `joinBusinessHourSegs` (`:93`): resource sets → own columns, `''` → placeholders only. `joinInteractions` (`:133`): resource sets → own columns and **their `affectedInstances`/`isEvent` merged** (`:143-157`); the `''` set → every resource's columns, **segs only, no metadata** (`:159-165`); returns `null` unless a *resource* set had an interaction (`:168-171`). `expandSegs` (`:122`): the `''` rule for the now indicator. `transformSeg` creates new seg objects but **spreads the existing `eventRange`** (`ResourceDayTableJoiner.ts:15`). |
| `resource-daygrid/ResourceDayTableJoiner.ts` (22) | `transformSeg` through `computeColRanges`, `isStart`/`isEnd` AND-ed. |
| `resource-timegrid/ResourceDayTimeColsJoiner.ts` (25) | `transformSeg` through `computeCol`; `-1` drops the seg. |
| `resource/common/AbstractResourceDayTableModel.ts` (229) | The column index: `cols: ResourceDayCol[]` (`DayCol` + `dateI`, `resource`, `resourceI`), `groups`, `colLookup` (`dateI:resourceI`), `dateFirstCols`, `colGroupIndices`, `resourceColCount`, `resourceIndex` (all of `resources`, `:71`), `cells` (2D for multi-row daygrid through `buildResourceCells`, else `[cols]`), `computeCol`, `computeColRanges` (merges adjacent columns of the same *group*, so dates-above-resources breaks a resource's span per date, `:116`), `isHitComboAllowed(hit0, hit1, allowAcrossResources)` (`:142`). `buildResourceDayCol`/`buildResourceCellFields` (`:183-225`): `key = resourceId:iso`, `renderProps.resource = new ResourceApi(context, resource)`, `data-resource-id`, `dateSpanProps.resourceId`; placeholders get `isInert: true` and `aria-disabled`. |
| `resource/common/DayResourceTableModel.ts` (47) | dates above resources: one group per date; `hasMajor = dayCols.length > 1`; a date with no surviving resource gets one placeholder column. |
| `resource/common/ResourceDayTableModel.ts` (44) | resources above dates: one group per resource; `hasMajor = resources.length > 1 && dayCols.length > 1`; a resource with no surviving date is dropped from header and body (`:36`) **but stays in `resources`/`resourceIndex`**, so it still participates in splitting, interaction activation and event-selection resolution. |
| `resource/common/ResourcelessDayTableModel.ts` (17) | no resources: every column a placeholder (`resourceI = -1`, inert), one group, `isMajor` from the day col. |
| `resource/common/resource-table-model.ts` (39) | `buildResourceTableModel(dayTableModel, dayCols, resources, datesAboveResources, hasEventsByDate, context)`: picks one of the three; falls back to resourceless when per-date filtering leaves no resource column (`:34`). |
| `resource/common/ResourceIndex.ts` (23) | ids and `indicesById`. |
| `resource/common/resource-filtering.ts` (152) | `filterResourceStore` (view-wide) and `computeHasEventsByDate(rawEventStore, resourceStore, dayCols, nextDayThreshold)` (per date). Reads `DayCol.range` and `.date`. Not part of the pipeline; stays. |
| `resource-daygrid/resource-header-tier.ts` (247) | `buildResourceRowConfigs(model, …)`: four shapes (no resources; one date; dates above resources: date row with `colSpan = group.cols.length` plus a resource row with blank cells for placeholders; resources above dates: resource row with `colSpan` plus a date row keyed `resourceId:`). Reads `model.cols`, `groups`, `resources.length`, `dayCols.length`, `datesAboveResources` (`:22-49`). |
| `resource-daygrid/components/ResourceDayGridView.tsx` (181) | Below. |
| `resource-timegrid/components/ResourceTimeGridView.tsx` (218) | Below. |
| `resource/common/ResourceSplitter.ts` (33), `resource/validation.ts` | `ResourceSplitter` (keys from the whole `resourceStore`) is the timeline's and `isPropsValidWithResources`'s splitter. **Not in scope**: it shares only the `Splitter` base. `timeline/TimelineLaneSlicer.ts` likewise shares only the `Slicer` base. Both bases stay. |

### 1.2 Data flow, ResourceTimeGridView (the full case)

1. `useTimeGridViewData(props)`: `daySeries`, `dayCols` (slot ranges), `dayRanges`, `splitProps = AllDaySplitter.splitProps(props)` → `{ allDay, timed }`, `nowDate`/`nowMs`/`todayRange`. The view's `eventStore` is the store's `renderableEventStore` (`CalendarInner.tsx:135`), unchanged during a drag (mirrors come from `eventDrag`).
2. `filterResourceStore` → `flattenResources` (`resourceOrder`) → `computeHasEventsByDate` (when `filterResourcesWithEvents` and more than one day) → `buildResourceTableModel(null, dayCols, resources, datesAboveResources, hasEventsByDate, context)`, all `useMemo`. The model's deps include `context`, so any option change rebuilds it.
3. All-day lane: `VResourceSplitter.splitProps({ ...splitProps.allDay, resourceDayTableModel })` → per key a `DaySeriesSlicer` kept in a ref map (`:78-92`) → `sliceProps(split, dateProfile, nextDayThreshold, context, daySeries)` → `ResourceDayTableJoiner.joinProps(slicedByKey, model)` → `SlicedProps<DayGridRange>` in view-column space.
4. Timed lane: the same with `DayTimeColsSlicer` (`dayRanges`) and `ResourceDayTimeColsJoiner`, then `useTimedSegsByCol(joined, model.colCount)`.
5. Now indicator (`:139-151`): `timedResourceSlicers[''].sliceNowDate(nowDate, dateProfile, options.nextDayThreshold, context, dayRanges)` (new every render; `nextDayThreshold` non-null makes `computeActiveRange` the **civil** active range, so the 1 ms span is clipped to it before the slot-widened column ranges are intersected) → `joiner.expandSegs` → `showDot` from `dateFirstCols`/`cols[col].dateI` → `organizeSegsByCol` (no memo). So with `nowIndicator` on, every `TimeGridCol` gets a new `nowIndicatorSegs` array on every view render and re-renders (its `memo` never holds). The phase-1 count baseline has `nowIndicator: true`.
6. Header: `buildResourceRowConfigs(model, …)` (`useMemo`). Hits: `isHitComboAllowed = useStableCallback` over `model.isHitComboAllowed(hit0, hit1, dayRanges.length === 1)`.
7. `<TimeGridLayout cells={model.cols} …>`; `eventSelection = allDayJoined.eventSelection || splitProps.timed.eventSelection`.

`ResourceDayGridView` is the same with one lane: `useDayGridViewData` → `dayCols` from `cellRows[0]` (`buildDayGridCols`, civil-day ranges) → model built *with* the `dayTableModel` (so `model.cells` is 2D) → `VResourceSplitter` + `DayTableSlicer` per key (`dayTable` as the extra arg, so `DayGridRange.start/end` are column-in-row indices in the **plain** table, divisor `dayTable.colCount` = dates per row) → `ResourceDayTableJoiner` (expands into the resource-widened row) → `<DayGridLayout cellRows={model.cells} …>`. Per-date filtering only when `colCount > 1 && rowCount === 1` (`:58`).

`DayGridView`: `DayTableSlicer.sliceProps(props, …, dayTableModel)` straight into `DayGridLayout`. `TimeGridView`: `AllDaySplitter` → `DaySeriesSlicer` + `DayTimeColsSlicer` → `useTimedSegsByCol`.

### 1.3 The split and join rules (must be reproduced exactly)

**Participating keys** are every resource in `resources` (view-wide filtered and flattened), in order,
plus `''`. A resource with no surviving column (per-date filtering, resources above dates) still
participates. For a seg sliced under key K or `''`, where "keyed columns" are columns that belong to
a resource and "placeholder columns" are the inert ones (`resourceI = -1`; in the resourceless model,
*every* column):

| Category | key K | key `''` |
|---|---|---|
| fg events | K's columns (none if K owns no column) | nowhere (also nowhere in the resourceless model, `VResourceJoiner.ts:37`) |
| bg events | K's columns | every keyed column and every placeholder (once each) |
| business hours | K's columns (the resource's own BH, or the calendar's when the resource has none, `event-splitting.ts:52`) | placeholders only |
| date selection | K's columns | every keyed column and every placeholder |
| drag / resize segs | K's columns | every keyed column, never placeholders |
| drag / resize metadata | `affectedInstances` = union over participating K of K's affected subset (affected instances whose *affected* def has a resource id among the participating keys); `isEvent` OR-ed over the same | contributes nothing (`:159-165`) |
| drag / resize state | non-null iff some participating K has a per-key state (its affected or mutated subset is non-empty, `event-splitting.ts:141-157`) | alone: `null` |
| event selection | kept if the instance is in K's subset | kept if the instance is in the `''` subset; first non-empty wins in key order then `''` |

**Per-key event UI bases** (`buildEventUiForKey`): `''` = `combineEventUis([calendarBase, resource.ui])`;
individual per-def bases (today: the event source's UI, `reducers/store.ts:764-781`) are included for
a def only in the keys it belongs to **in the current, unmutated store** (`event-splitting.ts:110`,
keyed by `getKeysForEventDefs(props.eventStore)`). So a mirror of an event dragged from A into B is
compiled with B's bases, which lack that def's source base: it loses the source colour/class in B.
The same holds across TimeGrid lanes (`AllDaySplitter` partitions individual bases by the current
def's lane). `DayGridView` has no splitter, so its bases are the full hash.

**Seg order** within a key is the store's instance order (`sliceEventStore` stage 2), then the inverse
complements by group then by def. The joiner's output order is: for each participating resource in
order, its own segs, then the `''` segs expanded into its columns; then the `''` segs expanded into
placeholders. `sortEventSegs` is stable, so this order decides DOM order for sort ties (same start,
duration, title), e.g. a single event parsed before a recurring def's instances are appended by
expansion.

**Lanes** (TimeGrid): defs classified by `def.allDay` and def-level `hasBgRendering(def)`; spans by
`allDay`; interactions by the mutated and affected defs' lanes separately (so a timed→all-day drag
gives the timed lane an interaction with `affectedInstances` and no segs, and the all-day lane one
with segs and empty `affectedInstances`); business hours whole in both lanes; the all-day row then
drops bg segs of timed defs (`DayGridRows.tsx:237`).

**Multi-row daygrid**: a seg's `[start, end)` in column-in-row space (divisor: dates per row) is
mapped by `computeColRanges`, which splits at group boundaries and at missing (filtered) columns,
with `isStart = dateI === dateStartI`, `isEnd = dateI === dateEndI - 1` per piece, AND-ed with the
seg's own flags.

The standard views have no `''` distinction: fg, bg, BH, selection and interactions all render in every
column, and an interaction renders whenever it exists.

### 1.4 Where identity is created and preserved, and which hooks depend on it

- **`EventRenderRange` objects** are created inside `sliceEventStore`, called from `Slicer._sliceEventStore` (memoized on `(eventStore, eventUiBases, dateProfile, nextDayThreshold, ...extraArgs)`), `_sliceInteraction` (on `(interaction, eventUiBases, dateProfile, nextDayThreshold, ...extra)`) and `_sliceBusinessHours` (on `(businessHours, dateProfile, nextDayThreshold, context, ...extra)`); `_sliceDateSpan` (on `(dateSelection, dateProfile, nextDayThreshold, eventUiBases, context, ...extra)`) fabricates a def and instance with **fresh ids** on each run. In the resource views the per-key `eventStore`/`eventUiBases` come from the splitter's memoized fields; the subsets rebuild when the whole store changes, and the per-key bases rebuild when the store or the bases change (`defKeys` is recomputed per store). So the **effective granularity is "per view, per category"**: fg segs and their `eventRange`s are the same objects across renders until the event store, the UI bases, the date profile, `nextDayThreshold` or the plain date coordinates (`daySeries`/`dayRanges`/`dayTableModel`) change.
- **Two identity boundaries in the resource views.** The slicer memos (ranges and date coordinates) do **not** depend on the resource table model; only the joiner memos (`(model, ...sets)`) do. A model-only change (a resource renamed: new `Resource` object with the same `ui`/`businessHours` references, new `resources` array, new model; the store, bases and date ranges unchanged) reruns the joiner, which allocates new seg objects but **spreads the same `eventRange`**. In particular a fabricated selection keeps its instance id, so a `selectMirror` keyed by `instanceId` (`TimeGridCol.tsx:264`) is not remounted. The new design must keep these two boundaries (§2.5).
- **Seg arrays** come out of the slicer memos (standard) or the joiner memos (premium).
- **Who depends on it:**
  - `DayGridRows.tsx:72-83`: `useMemo` over `splitSegsByRow`/`splitInteractionByRow` keyed on the arrays. `DayGridRow` is `memo`; its `sortEventSegs` `useMemo` (`:187`) keys on `props.fgEventSegs`. `DayGridCell` is `memo` but its `fills`/`segs`/`fg` props are rebuilt every row render, so a row render re-renders its cells regardless.
  - `useTimedSegsByCol` → `TimeGridCols` (`memo`) → `TimeGridCol` (`memo` on the per-column arrays; `sortEventSegs` `useMemo` on `fgEventSegs`).
  - `ForegroundEvent` (`common/events.tsx:76`) and `BgEvent` (`common/bg-fill.tsx:25`) are `memo` with shallow props: a new `eventRange` object re-renders them and re-runs every `*Class` hook (`eventClass`, `rowEventClass`, `columnEventClass`, `eventInnerClass`, …) and `generateClassName`. `*Content` hooks are additionally guarded by `CustomContent`'s shallow `renderProps` compare (`content-inject/CustomContent.tsx:169`), with `event: EventImpl` memoized on `def`/`instance` (`events.tsx:192`). Mount hooks (`events.tsx:300`) fire per element, keyed by instance id in TimeGrid (`TimeGridCol.tsx:264`, mirrors included) and by slice key in DayGrid. **So `eventRange` identity governs the `*Class` counts, `def`/`instance` identity governs the `*Content` counts, and the key strings (instance ids included, fabricated ones too) govern `*DidMount`/`*WillUnmount` counts.** Phase 7 saw exactly this: keying the day columns on the date profile dropped `timeGridWeek/drag` event class hooks from 111 to 27.
  - `getDayGridSegKey` (`instanceId:start`), `getSliceKey`, `buildEventRangeKey` and `getDayGridPrintSliceKey` are value keys (DOM `key`s and height-map keys), not identity. They must keep producing the same strings.
  - Column/cell objects: `model.cols`/`cells` are `useMemo`'d with the model; `DayGridCell`'s `renderProps` `useMemo` (`DayGridCell.tsx:116`) and `TimeGridCol`'s props key on `cell.renderProps`/`attrs`/`dateSpanProps` identity. Header cells (`DayGridHeaderCell`, `memo`) key on the tiers' `renderProps` objects.
- **When identity breaks today** (and counts are what they are): any store change rebuilds every seg of every category in that view (add-event); any option change rebuilds the resource model (its `useMemo` has `context`) and therefore every joined seg object (not the `eventRange`s); the now indicator (above) rebuilds its segs every render.

### 1.5 Consumers that read the model's columns

- Hits: `DayGridRows.queryHit` (`:111`) reads `cellRows[row][col]` (`isInert` → `null`, `date`, `dateSpanProps`); `TimeGridCols.queryHit` (`:56`) and `TimeGridAllDayLane.queryHit` (`:39`) read `cells[col]`. Placeholders reject hits (`isInert`), so nothing can be dropped or selected onto them. `isHitComboAllowed` flows through `useHitTarget` to `interactions/hit-target.ts:19`. Premium's `transformDateSelectionJoin` (`resource/DateSelecting.ts`) and `massageEventDragMutation` (`resource/EventDragging.ts`; a multi-resource event dragged A→B in `[A, C]` becomes `[C, B]`, `:26-37`) read `hit.dateSpan.resourceId`, which comes from `dateSpanProps`.
- Scrolling: `computeTopFromDate`/`computeRowFromPosition` (`daygrid/components/util.tsx:96,144`) read `cellRows[row][0].key`/`date`.
- Print: `DayGridLayoutPrint` takes fg/bg/BH only; `TimeGridLayout` blanks selection and interactions for print (`:137-142`).
- More links and popovers: `DayGridCell` gets `segs`/`hiddenSegs` cut by the placement adapter; `TimeGridCol` passes `hiddenGroup.segs` to `TimeGridMoreLink`; both pass the cell's `renderProps`/`dateSpanProps` (the resource) to `MorePopover`. They consume `eventRange` and the seg coordinates only.
- Headers: `headerTiers` from `buildDateRowConfigs` / `buildResourceRowConfigs`.
- `computeHasEventsByDate` reads `dayCols` (`DayCol.range`, `.date`).

---

## 2. Target design

### 2.1 Principles

- One **column model** type for every day-table view: plain, resourceless, resources above dates,
  dates above resources. Built by pure functions. Standard knows nothing about resources: a column
  carries an opaque `entityKey` (`''` for none) and whatever render props the builder gives it.
- **Two stages, two identity boundaries, as today** (§1.4): stage 1 slices ranges per key in the
  *plain* date coordinates (one pass over the store, per-key buckets, no store subsets, no per-key
  slicer instances); stage 2 projects them onto the model's view columns (the joiner's job, as a pure
  function). For plain views stage 2 is the identity and returns stage 1's arrays unchanged.
- The resource dimension enters through a small **keying** object (which keys a def or span belongs
  to, per-key UI and business hours, the `''` rules of §1.3).
- **Pure functions, memoized at the call site** with `useMemo` on the same inputs today's `memoize`
  fields compare, so identity granularity is unchanged (same or fewer rebuilds, never more).
- Seg shapes stay: `DayGridRange & EventRangeProps` and `TimeGridRange & EventRangeProps`, with the
  same `isStart`/`isEnd` semantics, the same order and the same key strings. The layouts, rows,
  columns, cells, more-links, popovers and hit code don't change.

### 2.2 The column model

New directory `standard/packages/preact/src/common/day-table/` (files: `model.ts`, `day-series.ts`,
`keying.ts`, `event-ui-bases.ts`, `slice-ranges.ts`, `project-day-grid.ts`, `project-time-grid.ts`,
`now-indicator.ts`, `useDayTableSegs.ts`).

```ts
// model.ts
export interface DayTableColumn extends DayCol {   // DayCol: key, date, range, isMajor, isDisabled, isInert?, renderProps?, attrs?, className?, dateSpanProps?
  dateI: number        // index into `dayCols` (column-in-row for multi-row tables)
  entityKey: string    // '' for plain views and placeholder columns; premium: the resource id
  entity: unknown      // null, or premium's Resource. opaque to standard
  groupI: number       // index into `groups`
}

export interface DayTableColumnGroup {
  key: string                  // premium: date iso or resource id; plain: ''
  date?: DateMarker            // dates-above-resources, or the one-date case
  entity?: unknown             // resources-above-dates
  cols: DayTableColumn[]
}

export interface DayTableModel {
  // the date dimension (stage 1 coordinates)
  daySeries: DaySeries         // §2.9
  dayCols: DayCol[]            // one per date column: dayCols.length = dates per row. computeHasEventsByDate reads these
  rowCount: number
  // the view columns (stage 2 coordinates)
  colCount: number             // view columns per row (dayCols.length × resources, roughly)
  cols: DayTableColumn[]       // colCount long, in render order
  groups: DayTableColumnGroup[]
  cellRows: DayTableCell[][]   // rowCount × colCount. DayGridLayout, hits and scrolling read these
  headerDates: DateMarker[]    // cellRows[0] dates (SingleMonth, DayGridView headers)
  colsByEntityKey: { [key: string]: number[] }   // view-column indices per key, ascending. a participating key may have no entry
  keylessCols: number[]        // columns with entityKey '' (all of them in plain and resourceless models)
  dateFirstCols: number[]      // first view column per dateI (now indicator's showDot)
  isInert: boolean             // every column inert (premium resourceless); plain views: false
}
```

The ordered list of **participating** keys is not on the model but on the keying (§2.3), because it
is the splitter's notion (every resource), not the column index's (resources owning columns).
`colLookup(model, dateI, key) → colI | -1` is a module function (a `Map` keyed `dateI:key` built
alongside; internal).

Builders:

```ts
// standard
export function buildDayTableModel(
  dateProfile: DateProfile,
  hiddenDays: HiddenDays,        // context.dateProfileGenerator.hiddenDays (§2.9)
  dateEnv: DateEnv,
  config: {
    breakOnWeeks: boolean        // DayGrid: /year|month|week/.test(currentRangeUnit)
    majorUnit?: string           // DayGrid single-row: computeMajorUnit minus 'day'; TimeGrid: none
    slotRange?: DayColSlotRange  // TimeGrid: dateProfile (slotMinTime/slotMaxTime)
  },
): DayTableModel
```

It produces exactly today's `DayTableModel.cellRows` (`DayTableModel.ts:66-99`) and
`buildDayColsFromSeries` columns (`day-cols.ts:48`), with `entityKey: ''`, one group, `keylessCols:
all`, `headerDates` as today. The all-hidden-week crash in `buildDayTableRenderRange` (phase 10's
step-0 finding, on the loose-ends list) is upstream of this builder and stays as it is.

```ts
// premium, resource/common/resource-day-table.ts (replaces the four model files and ResourceIndex)
export function buildResourceDayTableModel(
  dayTableModel: DayTableModel,   // the plain one (its daySeries, dayCols, rowCount, cellRows[*][dateI])
  resources: Resource[],
  datesAboveResources: boolean,
  hasEventsByDate: HasEventsByDate | null,
  context: CalendarContext,       // for the per-cell ResourceApi, as today
): DayTableModel
```

Column order, groups, `hasMajor` rules, placeholder insertion, the "resource with no surviving date
is dropped from the columns" rule, the "every column would be a placeholder → resourceless" fallback,
the per-row `cells` with a fresh `ResourceApi` per cell (single-row models share `cols` as the one
row, as `cells = [cols]` does today), key strings (`resourceId:iso`), `attrs`, `className: ''`,
`dateSpanProps`, `isInert`/`aria-disabled`: all ported line for line from
`AbstractResourceDayTableModel.ts`, `DayResourceTableModel.ts`, `ResourceDayTableModel.ts`,
`ResourcelessDayTableModel.ts` and `resource-table-model.ts`. The resourceless case sets
`isInert: true` and every column `entityKey: ''`.

`DayTableCell` and `DayTableColumn` stay distinct (multi-row resource daygrid rebuilds the resource
fields per row, `AbstractResourceDayTableModel.ts:147-181`; `cellRows[0]` and `cols` describe the
same columns as today's `cells` and `cols` do).

### 2.3 Keying

```ts
// keying.ts
export interface DayTableKeying {
  keys: string[]                                 // the participating keys in order, '' excluded. plain: []. premium: every resource id in `resources` order
  keysForEventDef(def: EventDef): string[]       // plain: [''], premium: def.resourceIds or ['']
  keyForDateSpan(span: DateSpan): string         // plain: '', premium: span.resourceId || ''
  uiByKey: { [key: string]: EventUi | undefined }           // premium: resource.ui
  businessHoursByKey: { [key: string]: EventStore | undefined } // premium: resource.businessHours
  keylessRules: KeylessRules                     // §1.3's '' column: PLAIN_KEYLESS_RULES or RESOURCE_KEYLESS_RULES
}

export interface KeylessRules {
  fg: 'all' | 'none'                 // plain: all. resource: none
  businessHours: 'keyless'           // both (plain: all columns are keyless)
  bg: 'all'
  dateSelection: 'all'
  interactionSegs: 'all' | 'keyedOnly'   // plain: all. resource: keyed columns only
  interactionMetadata: 'included' | 'excluded'  // plain: included. resource: excluded (§1.3)
  interactionActivation: 'any' | 'keyedOnly'    // plain: non-null whenever it exists. resource: null unless a participating key has a state
}

export const PLAIN_KEYING: DayTableKeying  // a module constant: stable identity for memo deps
// premium: buildResourceKeying(resources: Resource[]): DayTableKeying, useMemo on `resources`
```

A def or span that names keys outside `keys` (a resource not in the view) is dropped from those keys,
as today (`event-splitting.ts:46-48`: only `keyInfos` keys are produced).

**Per-key, per-lane UI bases** (`event-ui-bases.ts`), reproducing `_splitIndividualUi` +
`buildEventUiForKey` and the lane partition:

```ts
export function buildEventUiBasesByKey(
  eventUiBases: EventUiHash,
  currentDefs: EventDefHash,     // props.eventStore.defs: membership is decided by the current, unmutated defs
  keying: DayTableKeying,
  lane: DayTableLane,            // TimeGrid: a def's individual base is included only in the lanes the current def belongs to
): { [key: string]: EventUiHash }
```

For each participating key and `''`: `{ '': combineEventUis([eventUiBases[''], uiByKey[key]]),
...individual bases of defs whose keysForEventDef(currentDef) include key and whose lane
classification (§1.3) includes lane }`. The `''` entry for `PLAIN_KEYING` and a DayGrid lane is the
input hash itself (same object: `DayGridView` has no splitter today). For `PLAIN_KEYING` and a
TimeGrid lane it is the lane partition `AllDaySplitter` makes. Memoized on `(eventUiBases,
currentDefs, keying, lane)`, which is today's granularity (`splitIndividualUi` on `(eventUiBases,
defKeys)`, `defKeys` on the store).

### 2.4 Stage 1: slicing ranges per key, in date coordinates

```ts
// slice-ranges.ts
export interface DayTableLane {
  kind: 'dayGrid' | 'timeGrid'
  // 'dayGrid': all-day coordinates (DayGridRange in column-in-row space), nextDayThreshold applies, list-item events are one day
  // 'timeGrid': timed coordinates (TimeGridRange with col = dateI), nextDayThreshold null, active range widened by slot times
  allDayFilter?: 'allDay' | 'timed'   // TimeGrid only: AllDaySplitter's def/span rules. undefined: no filter (DayGrid)
}

export interface KeyedRanges<R> { [key: string]: R[] }   // one bucket per participating key and ''

export function sliceDayTableEvents(      // fg + bg, one pass over the store
  eventStore: EventStore,
  eventUiBasesByKey: { [key: string]: EventUiHash },
  keying: DayTableKeying,
  daySeries: DaySeries, dayCols: DayCol[],   // the PLAIN date coordinates (model.daySeries / model.dayCols of the plain model)
  lane: DayTableLane,
  dateProfile: DateProfile,
  nextDayThreshold: Duration | null,
): { fg: KeyedRanges<Seg>, bg: KeyedRanges<Seg> }

export function sliceDayTableBusinessHours(businessHours, keying, daySeries, dayCols, lane, dateProfile, nextDayThreshold, context): KeyedRanges<Seg>
export function sliceDayTableDateSelection(dateSelection, eventUiBasesByKey, keying, daySeries, dayCols, lane, dateProfile, nextDayThreshold, context): KeyedRanges<Seg>
export function sliceDayTableInteraction(interaction, eventUiBasesByKey, keying, daySeries, dayCols, lane, dateProfile, nextDayThreshold): KeyedInteraction<Seg> | null
  // KeyedInteraction: { segsByKey: KeyedRanges<Seg>, affectedInstancesByKey: { [key]: EventInstanceHash }, isEventByKey: { [key]: boolean } }
export function resolveDayTableEventSelection(eventSelection, eventStore, keying, lane): string
```

where `Seg` is `DayGridRange & EventRangeProps` (column-in-row coordinates, divisor
`dayCols.length`) for the `dayGrid` lane and `TimeGridRange & EventRangeProps` (`col = dateI`) for
`timeGrid`.

How `sliceDayTableEvents` reproduces `sliceEventStore` per key without subsets, in `sliceEventStore`'s
**three stages** over the whole store:

1. **Defs:** for each def in store order: `keys = keysForEventDef(def)` filtered to the participating
   keys (or `''`); apply the lane filter (timed def → timed lane; all-day def with def-level
   `hasBgRendering(def)` → both; other all-day → all-day lane). For each surviving key: compile
   `ui = compileEventUi(def, eventUiBasesByKey[key])` into a per-key `uiByDefId` and, if `display ===
   'inverse-background'`, initialise that key's inverse group/def state (`event-rendering.ts:61-72`,
   with `defByGroupId` first-wins per key).
2. **Instances, in store order:** for each instance: its def's surviving keys as above; per key push an
   `EventRenderRange` (framing range from `computeActiveRange(dateProfile, lane.kind === 'dayGrid')`,
   `nextDayThreshold` normalisation, `buildSlicedEventRange`, `isStart`/`isEnd`) into that key's fg or
   bg bucket, or collect the inverse range (`:74-103`). Then map it to date coordinates (step 4).
3. **Inverse complements:** per key, by group then by def, as `:105-140`, mapped the same way.
   **Implementation:** restructure `sliceEventStore` into these three module functions taking an
   explicit per-key state object (`initInverseState(def, ui, state)`, `sliceInstance(def, instance, ui,
   framing, ndt, state)`, `emitInverseComplements(state, framing)`); `sliceEventStore` becomes the
   single-key (`''`) driver with its signature and output unchanged (list, timeline and the interaction
   paths keep calling it). A per-def loop is not equivalent (order, inverse groups).
4. **Date coordinates** per lane, with no reference to the resource model:
   - **dayGrid:** `daySeries.sliceRange(range)` → `buildDayGridRanges(coordRange, dayCols.length)`
     (rows and column-in-row `start`/`end`, divisor = dates per row, as `DayTableSlicer.ts:10` with the
     plain table's `colCount`). `forceDayIfListItem` applies (`slicing-utils.ts:235`).
   - **timeGrid:** for each `dayCols[dateI]`, `intersectRanges(range, dayCols[dateI].range)` →
     `{ col: dateI, startDate, endDate, isStart, isEnd }` (`DayTimeColsSlicer.ts`).
   For plain views these are exactly today's segs, same objects per render as long as the memo holds.

`sliceDayTableBusinessHours` (per participating key: `businessHoursByKey[key] || businessHours`,
expanded with `expandRecurring` into the civil active range as `_sliceBusinessHours`; `''`: the
calendar's), `sliceDayTableDateSelection` (`keyForDateSpan`, `intersectDateSpan`'s instant stripping,
`fabricateEventRange` with that key's bases) and `sliceDayTableInteraction` mirror the `Slicer`
methods. Interaction, per key: segs from `interaction.mutatedEvents` instances whose *mutated* def
has the key (sliced with `sliceEventStore`'s rules, fg only, as `_sliceInteraction`);
`affectedInstancesByKey[key]` = instances of `interaction.affectedEvents` whose *affected* def has the
key and the lane; `isEventByKey[key] = interaction.isEvent` for keys with either subset non-empty.
Stage 2 decides what to merge (§2.5). `resolveDayTableEventSelection`: `''` unless the instance exists
in the store and its def belongs to a participating key or to `''`, and (TimeGrid) to the lane.

### 2.5 Stage 2: projection onto view columns

```ts
// project-day-grid.ts / project-time-grid.ts
export function projectDayGridSegs<S extends DayGridRange>(ranges: KeyedRanges<S>, model: DayTableModel, keying: DayTableKeying, category: Category): S[]
export function projectTimeGridSegs<S extends TimeGridRange>(ranges: KeyedRanges<S>, model, keying, category): S[]
export function projectInteraction<S>(keyed: KeyedInteraction<S> | null, model, keying, project): EventSegUiInteractionState<S> | null
```

- **Target columns** per `(key, category)` from the keying rules (§1.3): key K →
  `model.colsByEntityKey[K] ?? []`; `''` → `keylessCols`, all columns, or none per `keylessRules`.
- **dayGrid:** for each seg and each row piece, expand `[start, end)` (column-in-row) over the target
  columns with `computeColRanges`' rule (`AbstractResourceDayTableModel.ts:98-136`: walk `dateI` from
  `start` to `end`, look up the key's column for that `dateI`, merge adjacent view columns of the same
  `groupI`, break on a missing column, `isStart`/`isEnd` per piece AND-ed with the seg's). New seg
  objects spread the input seg (`{ ...seg, ...colRange }`), so `eventRange` identity carries over.
- **timeGrid:** `colLookup(model, seg.col, key)`; `-1` drops the seg; otherwise `{ ...seg, col }`.
- **Order:** for each participating key in `keying.keys` order: K's bucket, then the `''` bucket
  expanded into K's columns; then the `''` bucket expanded into placeholders (`joinSegs`). Business
  hours: K's buckets then `''` into placeholders (`joinBusinessHourSegs`). Interactions: K's buckets
  interleaved with the `''` bucket per K (`joinInteractions`), no placeholder pass.
- **Plain models** (`PLAIN_KEYING`, one bucket `''`, every column keyless, `rules` all-columns): the
  projection returns the stage-1 array **itself** (no copy), so identity is exactly today's.
- **Interaction metadata:** `affectedInstances` = `Object.assign({}, ...keys.map(k =>
  affectedInstancesByKey[k]))` in key order (resource rules: `''` excluded; plain: the `''` entry is
  the whole lane subset); `isEvent` OR-ed over the included keys; the result is `null` when no
  included key has a state (`anyInteractions`), or, for plain, when the interaction is null.

### 2.6 The hook

```ts
// useDayTableSegs.ts
export function useDayTableSegs<L extends DayTableLane>(
  props: SliceableProps,          // the view's eventStore, eventUiBases, businessHours, dateSelection, eventDrag, eventResize, eventSelection
  keying: DayTableKeying,
  plainModel: DayTableModel,      // stage-1 coordinates
  model: DayTableModel,           // stage-2 columns (the same object for plain views)
  lane: L,
  dateProfile: DateProfile,
  nextDayThreshold: Duration | null,
  context: CalendarContext,
): SlicedProps<SegFor<L>>
```

Memo table (the two boundaries of §1.4, with today's dependency sets):

| Output | stage-1 memo deps (ranges, date coordinates) | stage-2 memo deps (projection) |
|---|---|---|
| `eventUiBasesByKey` | `eventUiBases, eventStore.defs, keying, lane` | — |
| `fg`, `bg` buckets (one memo, as `_sliceEventStore`) | `eventStore, eventUiBasesByKey, plainModel, lane, dateProfile, nextDayThreshold` | `buckets, model, keying` |
| `businessHours` buckets | `businessHours, keying, plainModel, lane, dateProfile, nextDayThreshold, context` | `buckets, model, keying` |
| `dateSelection` buckets | `dateSelection, eventUiBasesByKey, plainModel, lane, dateProfile, nextDayThreshold, context` | `buckets, model, keying` |
| `eventDrag`, `eventResize` keyed states | `interaction, eventUiBasesByKey, plainModel, lane, dateProfile, nextDayThreshold` | `keyed, model, keying` |
| `eventSelection` | `eventSelection, eventStore, keying, lane` | — |

`lane` is a module constant per view (`DAY_GRID_LANE`, `TIME_GRID_ALL_DAY_LANE`, `TIME_GRID_TIMED_LANE`);
`keying` is `PLAIN_KEYING` or a `useMemo` on `resources`; `plainModel` is `useMemo`'d on
`(dateProfile, hiddenDays, dateEnv, config)`, today's deps of `dayTableModel`/`daySeries`/`dayCols`.
The returned `SlicedProps` object is new each render, as today's is; consumers take its fields.

Why identity is at least as stable as today:

- **Standard views:** stage 1's deps are today's slicer memo args (the plain model standing in for
  `dayTableModel`/`daySeries`/`dayRanges`, built from the same inputs); stage 2 is the identity. Same
  granularity, same objects.
- **Resource views:** stage 1 depends on the store, the per-key bases (which rebuild on `(eventUiBases,
  defs, keying)`, today's `(eventUiBases, defKeys)` plus the resource list, which the splitter also
  rebuilt its `keyInfos` from), the date profile and the plain coordinates; **not** on the resource
  model. Stage 2 depends on the model and keying, as the joiner did on the model and the sets. A
  resource rename reruns stage 2 only: new seg objects, same `eventRange`s, same fabricated selection
  instance id, no mirror remount. Same two boundaries.
- A **drag**: `eventDrag` changes each move → only the interaction memos recompute; fg/bg/BH/selection
  arrays and their `eventRange`s are untouched. Unaffected `ForegroundEvent`s skip through `memo`.
- **Measurement re-renders** don't reach the view body. **Now ticks** re-render the body with the same
  props: every memo holds. The now-indicator segs are rebuilt (today too); §2.8 makes them a `useMemo`.
- The joiner's "new seg objects on recompute" is kept at the same boundary (stage 2), so counts are
  unchanged there; nothing allocates more often than today.

### 2.7 Views after the change

```tsx
// DayGridView body
const model = useDayGridModel(dateProfile)                     // plain; replaces useDayGridViewData's dayTableModel (same memo deps, hiddenDays from the generator)
const segs = useDayTableSegs(props, PLAIN_KEYING, model, model, DAY_GRID_LANE, dateProfile, options.nextDayThreshold, context)
<DayGridLayout cellRows={model.cellRows} headerTiers={...} {...segs} />

// TimeGridView body
const model = useTimeGridModel(dateProfile)                     // slot ranges, no major unit
const allDay = useDayTableSegs(props, PLAIN_KEYING, model, model, TIME_GRID_ALL_DAY_LANE, ...)
const timed = useDayTableSegs(props, PLAIN_KEYING, model, model, TIME_GRID_TIMED_LANE, ..., null)
const timedByCol = useTimedSegsByCol(timed, model.colCount)
const nowSegsByCol = useNowIndicatorSegsByCol(nowDate, model, dateProfile, options.nextDayThreshold, datesAboveResources = false, enabled)   // §2.8
<TimeGridLayout cells={model.cols} ... eventSelection={allDay.eventSelection || timed.eventSelection} />

// ResourceTimeGridView body
const plainModel = useTimeGridModel(dateProfile)
const resources = ...(unchanged filtering and ordering)
const hasEventsByDate = ...(unchanged, reads plainModel.dayCols)
const model = useMemo(() => buildResourceDayTableModel(plainModel, resources, options.datesAboveResources, hasEventsByDate, context), [...])
const keying = useMemo(() => buildResourceKeying(resources), [resources])
const allDay = useDayTableSegs(props, keying, plainModel, model, TIME_GRID_ALL_DAY_LANE, ...)
const timed = useDayTableSegs(props, keying, plainModel, model, TIME_GRID_TIMED_LANE, ..., null)
...
isHitComboAllowed={useStableCallback((h0, h1) => isResourceHitComboAllowed(h0, h1, plainModel.dayCols.length === 1))}
```

`AllDaySplitter` goes away: `useTimeGridViewData` no longer returns `splitProps`; the lane filter does
the same def-level classification inside stage 1, the bases partition in `buildEventUiBasesByKey`, the
interaction partition in `sliceDayTableInteraction` (affected and mutated separately), and business
hours stay whole in both lanes. `eventSelection` for the timed lane (`splitProps.timed.eventSelection`
= "the instance is in the timed subset") is `resolveDayTableEventSelection` with the lane.

The header builders keep their shapes. `buildDateRowConfigs` takes `model.headerDates` as before;
`buildResourceRowConfigs` takes a small `ResourceHeaderInput { groups, resourceCount, dateCount,
datesAboveResources, cols }` (§3, step 2a) built from the model by a one-liner. Its output, keys and
`colSpan`s don't change.

### 2.8 Now indicator

`sliceDayTableNowIndicator(nowDate, model, dateProfile, nextDayThreshold, datesAboveResources)`:
reproduce `sliceNowDate` + `expandSegs` + `showDot`: the 1 ms span is first clipped to
`computeActiveRange(dateProfile, Boolean(nextDayThreshold))` (the **civil** active range, since both
views pass `options.nextDayThreshold`; `slicing-utils.ts:190`), `null` → no segs; then intersected
with each `dayCols[dateI].range` (slot-widened) and projected into **every** column (`expandSegs`'
`''` rule: keyed and placeholder), `showDot` as `ResourceTimeGridView.tsx:146-148` (plain model:
`dateFirstCols[dateI] === col` is always true, matching the standard path where `showDot` is
undefined and `TimeGridCol` defaults it to `true`). `useNowIndicatorSegsByCol` memoizes it and its
`organizeSegsByCol` on `(nowDate, model, dateProfile, nextDayThreshold, datesAboveResources, colCount,
enabled)`. The seg carries no usable `eventRange` today (`{}` bases); keep it absent. Lowers counts
when the now indicator is on and anything else re-renders the view; snapshots unchanged. Locked by
§4.2's clipping specs (negative `slotMinTime`, extended `slotMaxTime`, now at the active-range edges).

### 2.9 Where 7b touches phase 10's output (revision 3)

Phase 10 keeps `DateProfileGenerator` as the one class (methods delegating to module functions with
open recursion), the store keeps building instances, consumers' types don't change, and the generator
exposes `hiddenDays: HiddenDays` (`isHidden`, `skip`, `trim`, `structs/hidden-days.ts`), built from the
generator's hash so a custom subclass's `initHiddenDays` override is honoured. 7b:

- `common/DaySeriesModel.ts:35` (`dateProfileGenerator.isHiddenDay(date)`) becomes
  `buildDaySeries(range: DateRange, hiddenDays: HiddenDays): DaySeries` in
  `common/day-table/day-series.ts` (a plain object `{ dates, cnt, sliceRange }`; `sliceRange` as is),
  calling `hiddenDays.isHidden(date)`. **Never rebuilt from raw options**: the hooks read
  `context.dateProfileGenerator.hiddenDays` and pass it down, so a custom generator class's override
  applies. Phase 10 notes today's distinction that overriding `isHiddenDay` (the method) doesn't
  change `skipHiddenDays` (the hash); `DaySeriesModel` calls the *method*, so if phase 10's
  `hiddenDays` object does not reflect an `isHiddenDay` override, 7b must keep calling
  `generator.isHiddenDay` instead. Decide against phase 10's final code (§5, question 10); the pure
  function takes an `isHidden: (date: DateMarker) => boolean` either way.
- `buildDayTableModel(dateProfile, hiddenDays, dateEnv, config)` takes it through; memo deps
  `(dateProfile, hiddenDays (or the generator), dateEnv)`, replacing today's `(dateProfile,
  dateProfileGenerator, dateEnv)`, which is the same identity (the store memoizes the generator by its
  props).
- `SingleMonth.tsx:46` and `useTimeGridViewData.ts:33` are the other two generator readers in this
  pipeline; both go through the new builders.
- `computeMajorUnit(dateProfile, dateEnv)` / `isMajorUnit` stay as they are; 7b keeps calling them for
  `isMajor`. `TableDateProfileGenerator`'s replacement (`dateProfileRenderRange`) and
  `buildDayTableRenderRange` are untouched: 7b consumes `dateProfile.renderRange`, `activeRange`,
  `currentRangeUnit`, `slotMinTime`, `slotMaxTime` only, and must not change the all-hidden-week crash
  (loose ends).
- Phase 10's §3 lists the consumers it leaves on `isHiddenDay`/`skipHiddenDays` for 7b and phase 11 to
  migrate: `DaySeriesModel`, `day-cols`, the daygrid/timegrid view data (7b, this plan);
  `MultiMonthView`, the timeline's date profile, lane slicer and `isValidDate` (not 7b; phase 11 or the
  timeline follow-up).

### 2.10 What phase 11 will want, and what is still impure

- The model builders, keying, the three stage-1 slicers, the stage-2 projections and the now-indicator
  slicing take explicit inputs; the hooks are thin `useMemo` wrappers. Phase 11 can call the pure
  parts in a render-time derivation or lift them into store-derived data.
- **Still impure, carried over from today and to be listed as phase-11 requirements, not solved here:**
  `fabricateEventRange` (`structs/date-span.ts:231`: `refineEventDef`/`parseEventDef` allocate global
  def ids and run parsing plugins, `createEventInstance` allocates an instance id, `util/misc.ts:9`) for
  date selections and the now indicator; `expandRecurring` (`structs/recurring-event.ts:79`: allocates
  instance ids and runs the recurring plugins) for business hours; `new ResourceApi(context, resource)`
  per cell. Phase 11 needs deterministic synthetic identities for the fabricated ranges and the plugin
  work separated or made replay-safe before these can run speculatively. 7b keeps calling them inside
  the memoized stage-1 functions exactly as `Slicer` does.
- Narrow contexts: the hooks read `options.nextDayThreshold`, `options.datesAboveResources`,
  `options.resourceOrder`, `options.filterResourcesWithEvents`, `options.nowIndicator`, `dateEnv`,
  `dateProfileGenerator.hiddenDays` and `viewApi` (render props). The pure code takes them as
  parameters, so phase 11 swaps `useViewContext()` for the narrow hooks at the call sites only.
- Keying the resource model on `context` is what makes any option change rebuild every projected seg in
  the resource views (§1.4); 7b keeps it (behavior identity), phase 11/12 can narrow it.

---

## 3. Steps, in landing order

Each step: targeted Karma during work, then both packages' full suites in both runtimes, a DOM
snapshot compare against the baseline recorded before step 1 (all fixtures, including step 0's), a
count compare (no count up), and **a clean TypeScript build of every package (`pnpm build`) as a
landing gate**, since `protected-api` types change in every step. Sol reviews each step.

### Step 0: behavior locks and baselines (no production change)

- New specs (§4.2), new snapshot fixtures and count scenarios (§4.4). Run them on today's code; they
  must pass (characterization) except where they document a known quirk as a pending spec.
- Record `baseline` snapshots and counts in both runtimes after phase 10 lands (the baseline must be
  from the commit 7b starts on).

### Step 1: the standard pipeline (DayGrid, TimeGrid, SingleMonth)

Changes:

- Add `common/day-table/` (§2.2-2.6, 2.8) with `PLAIN_KEYING`, the three lane constants, the hooks
  `useDayGridModel`, `useTimeGridModel`, `useDayTableSegs`, `useNowIndicatorSegsByCol`.
- Restructure `sliceEventStore` (`component-util/event-rendering.ts:49`) into the three stage functions
  with an explicit state object (§2.4); `sliceEventStore` keeps its signature and output (list,
  timeline, validation untouched; their fixtures prove it).
- Move `DaySeriesModel` to `day-table/day-series.ts` taking `hiddenDays` (§2.9). `DaySeriesModel`
  stays exported from `protected-api` as a deprecated alias of the plain object's type until step 2b.
- `DayGridView`, `TimeGridView`, `SingleMonth` switch to the hooks.
- **Explicit compatibility for premium, which still runs the old path until step 2:** the `DayTableModel`
  class is deleted here, and every premium-facing boundary is retyped to structural interfaces in the
  same change (the class has private members, so the new plain object is not assignable to it):
  `DayTableSlicer`'s extra arg becomes `Pick<DayTableModel, 'daySeries' | 'dayCols'>` (it reads
  `daySeries.sliceRange` and the dates-per-row count, `DayTableSlicer.ts:10`);
  `buildResourceTableModel`'s and `AbstractResourceDayTableModel`'s `dayTableModel` parameter becomes
  `Pick<DayTableModel, 'rowCount' | 'cellRows'> | null` (`buildResourceCells` reads those,
  `AbstractResourceDayTableModel.ts:154-156`); `ResourceDayGridView` reads `rowCount`, `colCount`,
  `cellRows` (unchanged names). `useDayGridViewData` returns the new model under the old `dayTableModel`
  name; `useTimeGridViewData` keeps returning `daySeries`, `dayCols`, `dayRanges` and `splitProps` (the
  `AllDaySplitter` instance survives only there) for premium. The premium package must compile and its
  suite must pass in this step without source changes beyond those retypings.
- Kept and still exported: `DayTableSlicer`, `DaySeriesSlicer`, `DayTimeColsSlicer`, `AllDaySplitter`.

Verification focus: `dayGridMonth`/`dayGridWeek`/`dayGridDay`/`timeGridWeek`/`timeGridDay`/
`multiMonthYear`/`listWeek`/`timelineWeek` fixtures in every variant, counts for `dayGridMonth/*` and
`timeGridWeek/*`, the standard suite (`event-render/*`, `event-drag/*`, `event-resize/*`,
`date-selection/*`, `view-render/*`, `render-hooks/*`, `legacy/*`), the premium suite unchanged.

Risks: the `AllDaySplitter` rules (def-level bg display; bases and interaction partitions; BH whole);
the three-stage restructuring of `sliceEventStore` (instance order, inverse groups); now-indicator
clipping and `showDot`; `forceDayIfListItem`; `SingleMonth`'s per-month hook call (same memo
granularity per month); `eventSelection` for the timed lane.

### Step 2a: premium column model and ResourceTimeGridView

Changes:

- `resource/common/resource-day-table.ts`: `buildResourceDayTableModel` (§2.2),
  `buildResourceKeying` (§2.3), `isResourceHitComboAllowed` (§2.8), `RESOURCE_KEYLESS_RULES`.
- **Header seam:** `buildResourceRowConfigs` takes `ResourceHeaderInput { groups: { date?, resource?,
  cols: { key, date, isMajor, resource }[] }[], resourceCount, dateCount, datesAboveResources }`.
  `ResourceTimeGridView` builds it from the new model (`toResourceHeaderInput(model, datesAboveResources)`),
  `ResourceDayGridView` from the old one (`fromAbstractModel(model)`, a few lines kept until 2b).
  Both callers change in this step; output unchanged.
- `ResourceTimeGridView` onto `useTimeGridModel` + `buildResourceDayTableModel` + `useDayTableSegs`
  (both lanes) + `useNowIndicatorSegsByCol`. Delete its splitter/slicer/joiner state and refs.
- `ResourceDayGridView` still on the old path (`buildResourceTableModel`, `AbstractResourceDayTableModel`,
  `VResourceSplitter`, `DayTableSlicer`, `ResourceDayTableJoiner` survive this step unchanged apart
  from step 1's retypings).
- Delete `ResourceDayTimeColsJoiner.ts`.

Verification focus: `resourceTimeGridDay`/`Week` fixtures (default, rtl, print, pannable,
now-indicator, selection, grouped, dates-above-resources, the new ones), premium `column/agenda-*`,
`column/column-*`, `misc/filterResourcesWithEvents*`, `misc/resource-render-props`,
`misc/resource-event-styling`, `misc/render-hook-contract-resource`, `misc/eventResourceEditable-col`,
`misc/print-scroll-pannable`, the new count scenarios for `resourceTimeGridWeek`, and the
`resourceDayGrid*` fixtures (unchanged path, header seam).

Risks: the rules table (§1.3) for `''` segs and metadata; BH precedence; the activation rule; seg
order (§2.5); per-key bases during cross-resource drags; `eventSelection` across lanes; `showDot`.

### Step 2b: ResourceDayGridView and deletions

Changes:

- `ResourceDayGridView` onto the shared path (one `dayGrid` lane). Multi-row models: the resource
  model's `cellRows` built from the plain model's rows; stage-1 divisor is `plainModel.dayCols.length`.
- `buildResourceRowConfigs`'s old-model adapter removed.
- Delete: `VResourceSplitter.ts`, `VResourceJoiner.ts`, `ResourceDayTableJoiner.ts`,
  `AbstractResourceDayTableModel.ts`, `DayResourceTableModel.ts`, `ResourceDayTableModel.ts`,
  `ResourcelessDayTableModel.ts`, `resource-table-model.ts`, `ResourceIndex.ts`. Keep
  `ResourceSplitter.ts` (timeline, validation).
- Standard deletions now that premium no longer reads them: `daygrid/DayTableSlicer.ts`,
  `timegrid/DayTimeColsSlicer.ts`, `timegrid/AllDaySplitter.ts`, the `DaySeriesModel` alias,
  `useTimeGridViewData`'s `splitProps`/`dayRanges`/`daySeries` (the hook becomes `useTimeGridModel` +
  `useNow`), `common/day-cols.ts`'s builders fold into the model builder (`DayCol` type stays; no
  consumer outside the two packages imports them). `daygrid/DayTableModel.ts` keeps `DayTableCell`,
  `DayGridRange`, `buildDayGridRanges` (or they move to `day-table/`). `TableSeg.ts`'s and
  `TimeColsSeg.ts`'s helpers stay (still used by the rows/columns).
- `Slicer` (`slicing-utils.ts`) and `Splitter` stay for the timeline and validation (follow-up).
- `protected-api.ts` export list updated; `@fullcalendar/react`'s `tests/hooks.tsx` imports only
  `useRenderHookEl`/`useReportedSize` from `dist/protected-api`, unaffected.

Verification focus: `resourceDayGridDay`/`Week`/`Month` fixtures, `column/basic-*`,
`column/column-businessHours`, `column/column-structure` (month view, resyncs), the per-date and
placeholder specs' daygrid halves, `misc/resource-render-props` daygrid cases, the new
`resourceDayGridWeek` count scenarios, both whole suites (the standard deletions touch exports).

Risks: multi-row + dates-above-resources segment splitting (`computeColRanges` port); the stage-1
divisor (dates per row, not view columns: §7 #1); hidden days in resource daygrid (the daySeries
clamp is in date space, the expansion in view space); `+more` popover drag to another resource
(`basic-event-dnd.ts:58`).

### Step 3: not in 7b

Finer per-instance seg identity across store changes is dropped from 7b (§7 #6 and question 6): its
reconciliation key would need coordinate disambiguation for multi-segment events, and it is a count
optimisation, not part of the pipeline replacement. Record it as a loose end.

---

## 4. Tests

### 4.1 Existing coverage to run per step

Standard (`standard/packages/vanilla-tests/src`): `event-render/dayGrid-events.ts`,
`timeGrid-events.ts`, `timeGrid-events-short.ts`, `bg-events.ts`, `eventOrder.ts`, `minTime.ts`,
`maxTime.ts`, `multiMonth-events.ts`, `print-preview.ts`, `validRange.ts`, `event-render-hooks.ts`,
`event-list-semantics.ts`; `event-drag/*`, `event-resize/*`, `date-selection/*`; `view-render/*`
(`daygrid-multi.ts`, `timegrid-allday-slot.ts`, `showNonCurrentDates.ts`, `use-hit-target.ts`,
`daygrid-dirty-hit.ts`, `activity-rerender.ts`, `rerender.ts`, `print-scroll.ts`); `date-render/*`;
`render-hooks/render-hook-contract.ts` and `event-class-cascade.ts`; `legacy/*`.

Premium (`premium/packages/vanilla-scheduler-tests/src`): `column/*` (22 files: structure, event
render, business hours, selection, dnd, resizing, external dnd, dateClick, now indicator, week
numbers, rerendering, resource fetch), `misc/filterResourcesWithEvents.ts`,
`filterResourcesWithEvents-perDate.ts`, `filterResourcesWithEvents-placeholders.ts`,
`resource-render-props.ts`, `resource-event-styling.ts`, `render-hook-contract-resource.ts`,
`eventResourceEditable-col.ts`, `Resource.remove.ts`, `resourceOrder.ts`,
`refetchResourcesOnNavigate.ts`, `print-scroll-pannable.ts`, `visibleRange.ts`, `smoke.ts`,
`destroy.ts`, `rerenders.ts`, `event-class-cascade-timeline.ts` (shared-helper regression for the
timeline, with the `timeline*`/`resourceTimeline*` fixtures and `timeline/*`).

### 4.2 New characterization specs (step 0, written against today's code)

Every count assertion below compares **each hook separately** (`eventClass`, `eventInnerClass`,
`rowEventClass`/`columnEventClass`, `eventContent`, `eventDidMount`, `eventWillUnmount`,
`backgroundEventClass`/`DidMount`/`WillUnmount`, `dayCellClass`, `dayLaneClass`, `moreLinkClass`)
against numbers recorded from today's code and written into the spec with the commit.

Premium, `column/vresource-slicing-rules.ts` (resourceTimeGrid and resourceDayGrid, both
`datesAboveResources` values, `describeValues`):

1. A foreground event with no resource renders nowhere, including in a view with `resources: []`
   (resourceless) and on a placeholder date (`column-event-render.ts:261-270` covers the two-day case
   with resources; add resourceless).
2. A background event with no resource renders once per resource column and once per placeholder.
3. Business hours: a resource's own BH in its columns; a resource without BH gets the calendar's;
   placeholders get the calendar's, never a resource's (`placeholders.ts:362-387` covers timeGrid;
   add dayGrid); `businessHours: false` with a resource BH (`column-businessHours.ts:146`); BH render
   in both the all-day row and the columns of a resource timeGrid (whole in both lanes).
4. `calendar.select()` without `resourceId` highlights every column (resource and placeholder); with
   `resourceId` only that resource's columns. One-day view: a drag-select from resource `a` into `b`
   fires `select` with `resource.id === 'a'` (forward) and `'b'` (reverse), in the timed area and the
   all-day row; a three-day view rejects it (`agenda-selection.ts:136`).
5. Drag mirrors: a single-resource event dragged A→B shows one mirror, in B's column; a multi-resource
   event in `[A, C]` dragged A→B shows mirrors in C and B (`EventDragging.ts:26-37`), none in A; an
   external element (`agenda-external-dnd.ts`) dragged over B shows one mirror in B. Mid-drag DOM
   assertions, both orderings, LTR and RTL.
6. Event selection is instance-wide: clicking one copy of a multi-resource event marks every copy
   (`TimeGridCol.tsx:248`, `DayGridRow.tsx:478`); it stays selected across a re-render; an event whose
   only resource is outside the view is not marked.
7. Multi-resource event in dates-above-resources, multi-day, resourceDayGridWeek: one seg per
   (date, resource); resources-above-dates: one continuous span per resource; a hidden day
   (`weekends: false`) inside the span clamps the span in resources-above-dates and drops that date's
   seg in dates-above-resources.
8. Per-date filtering with a missing middle column: two single-day events for resource `a` on days 1
   and 3 (day 2 filtered out for `a`), then `calendar.select({ start: day1, end: day4, resourceId:
   'a' })`: the highlight has two pieces with `isStart` only on the first and `isEnd` only on the last
   (`computeColRanges`' missing-column rule, exercised by a selection since an event spanning the gap
   would earn the column, `resource-filtering.ts:136`). Plus a direct unit characterization of the
   mapper over a synthetic model (§4.2, pure-function specs).
9. `resourceDayGridMonth` with resources: an event spanning a week boundary renders in both rows,
   under the right resource columns.
10. Sort ties: two events with the same start, duration and title in resources `a` and `b` render in
    resource order; a single event parsed before a recurring def with the same title/start/duration
    renders before the recurring instance (instance order, `event-rendering.ts:74`), in resource and
    plain views.
11. A resource that survives view-wide filtering but owns no column (per-date filtering, resources
    above dates, its only event on an interior hidden day) still participates: a drag of its event
    (reachable from the popover? no: it has no column; use `calendar.select` with its `resourceId`,
    which must produce no highlight and no error, and an `eventDrag` state from another calendar
    whose mutated def targets it, asserted through the hit-target's `isEventInteracting`) — if nothing
    observable differs, lock it at the state level with a unit characterization of `joinInteractions`
    (today) vs `projectInteraction` (new) over a synthetic model.
12. Mixed keyed and keyless grouped drag: event A (`resourceId: 'a'`) and event B (no resource) share
    a `groupId`; dragging A mutates both; B's mirror appears in every resource column and A's in the
    target; B's original instance is **not** in `affectedInstances` (`VResourceJoiner.ts:159`): assert
    through `eventClass`/`eventContent` args (`isDragging` false for B's copies) and the mirror DOM.
    Same for resize.
13. Source styles during cross-resource and cross-lane drags: an event from a source with
    `color: red` in resource A dragged into B: the mirror in B has no source colour (B's bases lack the
    def's source base, §1.3); a timed event of that source dragged into the all-day row likewise.
    Assert the mirror's background and `eventClass` args. Also an event from another calendar dragged
    in (no source base at all).
14. All-day classification: an all-day event whose *source* sets `display: 'background'` (def-level
    display unset) renders in the all-day row only, not in the columns (`AllDaySplitter.ts:27` uses
    `hasBgRendering(def)`); an all-day event with its own `display: 'background'` renders in both; a
    timed background event only in the columns (`DayGridRows.tsx:237`).
15. Inverse-background shared across resources: two `inverse-background` defs with one `groupId`, in
    resources `a` and `[a, b]`: `a`'s columns show the complement of both, `b`'s the complement of the
    second only; a def with no in-range instance still initialises its group (complement is the whole
    framing range) and its complement is emitted after the fg/bg ranges, in today's order.

Premium, `column/vresource-identity.ts` (identity locks, Karma, both runtimes),
`resourceTimeGridWeek` and `resourceDayGridWeek`, 20 events across 4 resources, `selectMirror: true`,
`nowIndicator: true`, one all-day and one timed selection:

- **Re-render probes that must re-execute the view body:** (a) `calendar.render()` (vanilla
  re-renders the root with the same props; `view-render/rerender.ts` does this) and (b) a now tick
  (jasmine mock clock advanced one minute). Prove the probe reaches the view body in the spec itself
  (e.g. `dayLaneClass`/`dayCellClass` counters move, or a probe `viewClass` count), then assert every
  event hook's count after the probe `toBeLessThanOrEqual(recorded)`, lifecycle hooks included (no
  `eventDidMount`/`eventWillUnmount` at all on a probe).
- **Resource title update with a selection mirror:** `calendar.getResourceById('b').setProp('title',
  'B2')` while a timed selection mirror is shown in `b`: no `eventWillUnmount`/`eventDidMount` for
  the mirror, no `eventContent` for untouched events; `eventClass` counts `<=` recorded (today's joiner
  re-renders them with new seg objects; the plan keeps that boundary, so equal).
- **Drag:** counts after a drag of one event (`$.simulate('drag')`) `<=` recorded; `eventDidMount`
  only for the mirror(s).
- **Add event:** counts `<=` recorded.
- **Unrelated option** (`setOption('dragScroll', false)`): counts `<=` recorded (today: every seg
  re-renders because the model keys on `context`; the plan keeps that).

Standard, `view-render/day-table-slicing.ts`:

1. Hidden days: a timed event whose `nextDayThreshold`-adjusted end lands on a hidden day clamps inward
   with `isEnd` false (`fc-event-end` class absent) in `dayGridWeek` with `weekends: false`.
2. `display: 'list-item'` multi-day event occupies one day in dayGrid and in timeGrid's all-day row
   (`forceDayIfListItem` in both slicers).
3. All-day background event renders in both the all-day row and the timed columns of `timeGridWeek`;
   source-level background display: all-day row only (as premium 14).
4. `inverse-background` with a `groupId` across two defs in `timeGridWeek` and `dayGridMonth`; a
   def with no in-range instance; emission order after fg/bg.
5. Sort ties: single event vs recurring def (premium 10) in `dayGridMonth` and `timeGridWeek`.
6. `eventSelection` in `timeGridWeek`: selecting an all-day event vs a timed event (the lane resolver).
7. Now-indicator clipping: `timeGridDay`, `slotMaxTime: '26:00'`, now `01:00` the next civil day: no
   line in the previous day's column; `slotMinTime: '-02:00'`, now `23:00` the previous day: no line;
   now exactly at `activeRange.start` and `activeRange.end - 1ms`: present/absent as today.
8. Cross-lane drag source styles and `affectedInstances` per lane: a timed event dragged into the
   all-day row: the original is hidden (`isDragging` in the timed lane), the mirror has no source
   colour (all-day lane bases lack the def), `eventClass` args recorded.
9. Timed bg segs are dropped by the all-day row (`DayGridRows.tsx:237`).

Standard, `view-render/day-table-identity.ts`: the same probes as the premium identity spec for
`dayGridMonth` and `timeGridWeek` (`calendar.render()`, now tick, drag, add event, unrelated option),
per hook, `<=` recorded.

Pure-function unit specs (Karma, importing from `fullcalendar/protected-api`), written in step 1/2
against the new functions, not characterization: `buildDayGridRanges` and `daySeries.sliceRange`
tables (including the hidden-day clamp cases from `DaySeriesModel.ts:5-9`); `projectDayGridSegs`
over a hand-built model for every ordering (plain, resources above dates, dates above resources,
resourceless, a missing middle column, a participating key with no columns, multi-row second week,
week crossings, hidden days, both orderings); `buildEventUiBasesByKey` precedence and membership
(calendar base, resource ui, individual, def ui; a def not in the key; lanes); `projectInteraction`
metadata membership (keyed vs keyless); `sliceDayTableEvents` order (instance order within a key,
inverse complements last) against `sliceEventStore` on a subset store as the oracle.

### 4.3 Mutation checks (run once per step, by hand, not committed)

Each should make a lock fail; if it doesn't, the lock is too weak:

- In `useDayTableSegs`, drop `eventStore` from the stage-1 fg memo deps → `add-event`; drop `eventDrag`
  → mid-drag assertions.
- Make the stage-1 fg memo depend on `model` → the resource-title-update lock (new seg objects are
  fine, but a new fabricated selection instance remounts the mirror: `eventDidMount` > 0).
- Make a stage-1 memo depend on `props` (recomputes every render) → identity probes (`render()`, now
  tick) go up.
- Use `model.colCount` as the stage-1 divisor → premium 9 (second week) and the `resourceDayGridMonth`
  snapshots.
- Include every individual base in every key → premium 13 (source colour appears in B's mirror).
- Include `''` metadata → premium 12.
- Set `RESOURCE_KEYLESS_RULES.fg` to `'all'` → premium 1; `businessHours` to `'all'` → premium 3
  (distinct hours).
- Swap `isStart`/`isEnd` AND-ing in the daygrid projection → premium 7 and the `fc-event-start/end`
  snapshots.
- Merge columns across groups (ignore `groupI`) → premium 7 (dates above resources) and the
  `dates-above-resources` snapshots.
- Iterate defs instead of instances in stage 1 → premium 10 / standard 5.
- Drop the civil clipping from the now indicator → standard 7.
- Drop `context` from the model deps → nothing should fail (behavior identity only, §5 question 5).

### 4.4 DOM snapshot fixtures and count scenarios

Existing fixtures that matter (`dom-snapshot/fixtures.ts`): all `RESOURCE_TIMEGRID_VIEWS` and
`RESOURCE_DAYGRID_VIEWS` in `default`, `rtl`, `print`, `pannable`, `now-indicator` (timegrid);
`selection` (`resourceTimeGridDay`, resource `b`); `grouped` (`resourceTimeGridDay`);
`dates-above-resources` (`resourceTimeGridWeek`, `resourceDayGridWeek`); every standard
`dayGrid*`/`timeGrid*`/`multiMonthYear` variant; the `list*`, `timeline*`, `resourceTimeline*`
fixtures (shared `sliceEventStore` restructuring).

Add in step 0:

- `dates-above-resources`: add `resourceDayGridMonth` and `resourceTimeGridDay`.
- `more-links` and `popover`: add `resourceTimeGridWeek`, `resourceDayGridWeek`.
- `hidden-days`: add `resourceDayGridWeek`, `resourceTimeGridWeek`, `resourceDayGridMonth`.
- `selection`: add `resourceDayGridWeek`; `selection-no-resource` for `resourceTimeGridDay` and
  `resourceDayGridWeek`; `select-mirror` (`selectMirror: true`, timed selection) for
  `resourceTimeGridWeek` and `timeGridWeek`.
- `mid-drag` for `resourceTimeGridWeek` and `resourceDayGridWeek` (drag `Timed 1` toward resource
  `b`'s column), LTR and RTL; `mid-drag-multi` (the `multitimed` event in `[c1, d]` dragged toward
  `a`); `mid-drag-to-allday` (`timeGridWeek` and `resourceTimeGridWeek`, a timed event dragged into
  the all-day row); `mid-drag-grouped` (premium 12's pair).
- `filtered-per-date`: `resourceTimeGridWeek` and `resourceDayGridWeek` with
  `filterResourcesWithEvents: true`, both orderings.
- `resourceless`: `resourceTimeGridDay`, `resourceDayGridWeek` with `resources: []`.
- `business-hours`: `resourceTimeGridDay` with `businessHours: true` and resource `b` overriding, and
  `resourceDayGridWeek`.
- `multi-resource-ties`: `resourceTimeGridDay` with two equal events in `a` and `b`, one in both, and a
  single-vs-recurring tie.
- `source-styles`: events from an event source with `color` in resource views (the `eventUiBases`
  individual entries exist only with sources).
- `inverse-bg-shared`: premium 15's pair, `resourceTimeGridDay` and `resourceDayGridWeek`.
- Standard: `list-item-multiday` (`dayGridMonth`, `eventDisplay: 'list-item'` with the multi-day
  event), `inverse-bg` (`timeGridWeek` and `dayGridMonth`, two `inverse-background` events sharing a
  `groupId`, one with no in-range instance), `source-bg-allday` (standard 3), `now-indicator-extended`
  (`timeGridDay`, `slotMaxTime: '26:00'`, `now` after midnight).

Count scenarios (`dom-snapshot/counts.ts`): add `resourceTimeGridWeek` and `resourceDayGridWeek` to
`VIEWS` (extend the `drag` direction check to `resourceTimeGrid`); a `datesAboveResources` pair; a
`select-mirror-resource-rename` action (select a timed range in `b`, then `setProp('title')`); a
`now-tick` action where the runner can advance the clock, else rely on the identity specs.

Record the baseline with all of these before step 1, in both runtimes.

---

## 5. Risks and open questions (with Sol's round-1 answers folded in)

1. **Resourceless resource views render no foreground events** (`VResourceJoiner.ts:37`). Keep and
   lock (premium 1); candidate behavior change for a later release. Sol agrees.
2. **Non-resource interaction segs render only alongside a resource interaction, and contribute no
   metadata** (`:159-171`). Reachable: a grouped drag of a resource event with a resourceless partner
   (premium 12), a cross-calendar drag; not reachable through placeholders (they reject hits). Keep,
   lock at the DOM level (12) and at the state level (unit characterization). Sol agrees; the earlier
   "external element onto a placeholder" explanation was wrong and is replaced.
3. **`allowAcrossResources = dayCount === 1`**: one-day views may select across resource columns and
   report the first hit's resource. Keep and lock forward and reverse, timed and all-day (premium 4).
   Sol agrees. Still ask Adam whether "across *dates*" was the intent, for a later release.
4. **Seg order**: instance order within a key, resource-bucket order, keyless expansion placement,
   inverse-complement emission order, all reproduced (§2.4-2.5) and locked (premium 10, 15; standard
   4, 5; the ties fixtures). Sol agrees.
5. **The resource model keys on `context`**: keep for 7b, and keep today's *narrower* stage-1 caches
   under the model projection (§2.6), so a model rebuild never re-fabricates or re-slices. Sol agrees.
6. **Finer identity (old step 3)**: dropped from 7b (Sol: its `instanceId:key` reconciliation key also
   needs coordinate disambiguation for multi-segment events). Loose end.
7. **Now-indicator memoization**: include after preserving the civil-range clipping and `showDot`
   (§2.8, standard 7). Sol agrees.
8. **`AllDaySplitter` removal**: proceed after preserving def-level classification, the per-lane base
   partition, the separate affected/mutated interaction partition, and business hours whole in both
   lanes (§1.3, §2.3-2.4; premium 13-14, standard 3, 8, 9). Sol agrees.
9. **`sliceEventStore` restructuring**: three stages with an explicit state object, not a per-def
   helper (§2.4); the single-key driver keeps the signature; list/timeline fixtures and specs
   (`event-class-cascade-timeline.ts`, `timeline/*`) are regression coverage during 7b. Sol agrees.
10. **Hidden days**: consume `context.dateProfileGenerator.hiddenDays`; if phase 10's object cannot
    reflect an `isHiddenDay` method override (phase 10 keeps the method/hash distinction), pass
    `generator.isHiddenDay` as the predicate instead. Never rebuild from raw options. Decide against
    phase 10's landed code.
11. **`DayTableCell` vs `DayTableColumn`**: keep both; fresh resource fields per multi-row cell, shared
    single-row columns, as today. Sol agrees.
12. **Hosting**: standard hooks and pure code through `protected-api`; premium owns the resource model
    builder, keying, header input and hit-combo function. Sol agrees.
13. **Timeline follow-up** (`ResourceSplitter`, `TimelineLaneSlicer`, `isPropsValidWithResources` keep
    `Splitter`/`Slicer`): record in the roadmap's loose ends; the shared `sliceEventStore` driver is
    covered by the timeline suites during 7b. Sol agrees.
14. **New:** `buildEventUiBasesByKey` depends on `eventStore.defs`, so per-key bases rebuild on every
    store change (today too: `defKeys` is per store). Fine for identity (fg rebuilds then anyway) but
    worth noting as a count-neutral cost; a `defs`-keyed memo is cheap.
15. **New:** the hook signature takes both `plainModel` and `model`. For plain views they are the
    same object; for resource views the plain model's `cellRows`/`cols` are never rendered, only its
    `daySeries`/`dayCols`. Alternative: stage 1 takes `(daySeries, dayCols)` and the resource model
    carries them (it does). Recommendation: pass the resource model only and read
    `model.daySeries`/`model.dayCols` in stage 1, whose memo deps list those two fields, not the model.
    Either way the dependency sets of §2.6 hold.

## 6. Behavior changes (to keep updated during implementation)

Intended: none. Tolerated: render-hook counts may drop (now-indicator memoization). Any DOM diff in
the snapshot compare blocks the step.

## 7. Review round 1 (Sol, spec, high effort)

| # | Finding | Response |
|---|---|---|
| 1 | P1: daygrid slicing used the expanded `model.colCount` as the date-row divisor. | Fixed. Stage 1 runs in the plain date coordinates with divisor `dayCols.length` (dates per row), as `DayTableSlicer.ts:10`; `colCount` is stage 2's (§2.4 step 4, §2.5). Unit specs over second week, week crossings, hidden days, both orderings; mutation check added (§4.3). |
| 2 | P1: per-key UI bases ignored current-store def membership and lane classification; cross-resource and cross-lane mirrors would gain source styles. | Fixed. `buildEventUiBasesByKey(eventUiBases, currentDefs, keying, lane)` includes a def's individual base only in the keys and lanes the current def belongs to (§2.3); `PLAIN_KEYING` returns the input hash only for DayGrid (no splitter today) and the lane partition for TimeGrid. Locks: premium 13, standard 8, `source-styles` fixtures, mutation check. |
| 3 | P1: a model-only change re-fabricated selection ranges (new instance id → mirror remount), because one memo mixed slicing and projection. | Fixed. Two stages with two memo boundaries matching today's slicer/joiner split: stage 1 (ranges, date coordinates) never depends on the resource model; stage 2 (projection) spreads the existing `eventRange` (§2.1, §2.5, §2.6). Lock: the resource-title-update identity spec counting mounts/unmounts; mutation check. |
| 4 | P1: a per-def pass changes sort-tie placement (instance order) and inverse-bg handling. | Fixed. Stage 1 keeps `sliceEventStore`'s three stages (defs for inverse init, instances in store order, complements last) with per-key state; `sliceEventStore` becomes the single-key driver (§2.4). Locks: premium 10, 15; standard 4, 5; the ties and inverse fixtures; the oracle unit spec. |
| 5 | P1: the now-indicator algorithm dropped the civil active-range clipping. | Fixed. §2.8 clips to `computeActiveRange(dateProfile, Boolean(nextDayThreshold))` before intersecting the slot-widened columns, then memoizes. Lock: standard 7 and the `now-indicator-extended` fixture; mutation check. |
| 6 | P1: interaction metadata merged the `''` set, which the joiner excludes. | Fixed. Stage 1 returns per-key `affectedInstancesByKey`/`isEventByKey`; stage 2 merges only the participating keys under the resource rules (`interactionMetadata: 'excluded'`), all keys under the plain rules (§2.3-2.5). Lock: premium 12 (grouped mixed drag and resize, hook args), `mid-drag-grouped` fixture, unit spec, mutation check. |
| 7 | P2: `entityKeys` conflated participating resources with column owners. | Fixed. The participating keys live on the keying (`keying.keys`, every resource in order); the model's `colsByEntityKey` may lack an entry for a participating key (§2.2-2.3). Lock: premium 11 and the "participating key with no columns" unit case. |
| 8 | P2: step 2a broke the shared header builder; step 1 assumed structural compatibility with a class that has private members. | Fixed. Step 2a gives `buildResourceRowConfigs` a `ResourceHeaderInput` with adapters from both models and updates both callers; step 1 deletes the class and retypes every premium-facing boundary (`DayTableSlicer`'s extra arg, `buildResourceTableModel`/`AbstractResourceDayTableModel`'s parameter) to `Pick<>` interfaces; a clean build of every package is a landing gate for every step (§3). |
| 9 | P2: characterization rules 5, 6, 8 and question 2's reachability were wrong. | Fixed. 5: single-resource vs multi-resource (`[A, C]` → `[C, B]`) vs external mirrors; 6: selection is instance-wide; 8: a spanning *selection* between endpoint events plus a synthetic-model unit case; question 2: grouped/cross-calendar cases, placeholders reject hits (§4.2, §5 #2). |
| 10 | P2: the phase-11 purity claim was false for `fabricateEventRange`, `expandRecurring` (ids, plugins). | Fixed. §2.10 lists them as still-impure, carried over unchanged, and as phase-11 requirements (deterministic synthetic ids, plugin work separated); no promise that they move into render/store selectors as is. |
| 11 | P2: coverage missed the inputs that distinguish the old caches and expansion semantics; four counters and `updateSize()` were weak probes. | Fixed. Added premium 11-15 and standard 3-9 (title-update remount, source-style crossover, instance-vs-def order, mixed metadata, zero-column participant, shared inverse groups and empty-instance defs, def-level bg classification, BH in both lanes, timed bg dropped by the all-day row, RTL and all-day↔timed mid-drag fixtures, popover drag already in `basic-event-dnd.ts:58`); identity specs compare every hook separately, lifecycle included, and use `calendar.render()` and a now tick with an in-spec proof that the probe reaches the view body (§4.2-4.4). |
| 12 | P2: §2.9 should adopt phase 10 revision 3 (generator stays, exposes `hiddenDays`, honours overrides). | Fixed. §2.9 consumes `context.dateProfileGenerator.hiddenDays` (or the generator's `isHiddenDay` where an override must apply), never rebuilds from options, notes the all-hidden-week crash as an untouched loose end, and lists phase 10's remaining `isHiddenDay` consumers outside 7b. |
| Q1-13 | Sol's answers to the open questions. | Adopted in full (§5): preserve and lock 1-3, exact order 4, context dependency plus narrower stage-1 caches 5, drop step 3 (6), now-indicator after clipping 7, `AllDaySplitter` removal with the four preserved partitions 8, three-stage `sliceEventStore` 9, generator's `hiddenDays` 10, two cell/column types 11, hosting 12, timeline follow-up with regression coverage 13. No pushback. |
