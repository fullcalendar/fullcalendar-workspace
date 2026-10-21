# Phase 7b: the day-table pipeline

Status: plan, revision 4 (2026-10-21, after spec review rounds 1-3 by Sol, §7-9; round 3: "ready to
implement" once its four verification P2s are fixed, which this revision does). Not started.

Sequencing: lands after phase 10 (date profile, done: `phase-10-date-profile.md`, step 1 added the
`DateProfileGenerator.hiddenDays` getter) and before phase 11 (granular contexts,
`useSyncExternalStore`, render-time purity). The design consumes that getter (§2.9) and makes every
new piece a pure function of explicit inputs, with the impure helpers it still calls listed for phase
11 (§2.10).

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

**Participating keys** are the **model's** `resources` (`VResourceSplitter.getKeyInfo` reads
`resourceDayTableModel.resourceIndex`, `VResourceJoiner.joinProps` reads `resourceIndex.ids`), in
order, plus `''`. That list is the view-wide filtered, flattened `resources` for the two resource
orderings, where a resource with no surviving column (per-date filtering, resources above dates)
still participates; but it is **`[]` when `buildResourceTableModel` fell back to the resourceless
model** because per-date filtering left no resource column at all (`resource-table-model.ts:34-35`,
`ResourcelessDayTableModel.ts:16`): then nothing participates, every key-targeted event, business
hours and interaction is dropped, and the header is the plain date row (`resource-header-tier.ts:24`,
`resources.length === 0`). For a seg sliced under key K or `''`, where "keyed columns" are columns that belong to
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

- **`EventRenderRange` objects** are created inside `sliceEventStore`, called from `Slicer._sliceEventStore` (memoized on `(eventStore, eventUiBases, dateProfile, nextDayThreshold, ...extraArgs)`), `_sliceInteraction` (on `(interaction, eventUiBases, dateProfile, nextDayThreshold, ...extra)`) and `_sliceBusinessHours` (on `(businessHours, dateProfile, nextDayThreshold, context, ...extra)`); `_sliceDateSpan` (on `(dateSelection, dateProfile, nextDayThreshold, eventUiBases, context, ...extra)`) fabricates a def and instance with **fresh ids** on each run.
- **The resource views' caches are per key and per category, and compare values, not the resource list.** Each key has its own `Slicer` instance (the ref map, `ResourceTimeGridView.tsx:78-92`), so each key's five memos hold or miss independently. Their inputs per key: the key's `eventStore` subset (`_splitEventStore`, rebuilt for every key when the whole store changes), the key's `eventUiBases` (`eventUiBuilders[key]`, `event-splitting.ts:44-55`: a per-key `memoize` on `(eventUiBases[''], resource.ui, individualUi[key])`, where `individualUi` is rebuilt with the store's `defKeys`), the key's `businessHours` (`resource.businessHours || props.businessHours`, a reference), the key's `dateSelection` (the same span object), the key's interaction split state (new per interaction). **Nothing compares the `Resource` object or the `resources` array**: a resource rename (new `Resource`, same `ui` and `businessHours` references, new `resources` list, new table model) leaves every per-key base and every per-key slicer memo intact; a change to resource A's `ui` (`eventColor`) rebuilds A's bases and A's fg/bg/selection/interaction segs only, never B's. So the **effective granularity is "per key, per category"**, with the whole store as a shared input: fg segs and their `eventRange`s for key K are the same objects across renders until the event store, K's bases, the date profile, `nextDayThreshold` or the plain date coordinates (`daySeries`/`dayRanges`/`dayTableModel`) change; K's fabricated selection instance (and its id) survives anything but those and the selection itself.
- **Two identity boundaries in the resource views.** The per-key slicer memos (ranges and date coordinates) do **not** depend on the resource table model, the `Resource` objects or the `resources` list; only the joiner memos (`(model, ...sets)`) do. A model-only change (a rename, above) reruns the joiner, which allocates new seg objects but **spreads the same `eventRange`**. In particular a fabricated selection keeps its instance id, so a `selectMirror` keyed by `instanceId` (`TimeGridCol.tsx:264`) is not remounted. The new design must keep both boundaries *and* the per-key granularity beneath the aggregate (§2.3-2.6): any aggregate memo whose deps include the keying or the resource list would re-fabricate B's selection on A's change or on a rename.
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
- **Pure functions, memoized at the same granularity as today:** stage 1 through **per-key,
  per-category caches** comparing the same per-key values today's per-key slicers and UI builders
  compare (never the `Resource` objects, the `resources` list or the keying), stage 2 through
  `useMemo` on the model (today's joiner boundary). Same or fewer rebuilds, never more.
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
  participants: unknown[]      // the entities the model was built FOR, in order (today's model.resources):
                               // plain: EMPTY. premium: the `resources` array itself, or EMPTY after the
                               // all-filtered fallback. the keying (§2.3) and the header derive from this,
                               // never from the view's `resources`, so the fallback empties both (§1.3)
}
```

`participants` is distinct from column ownership (`colsByEntityKey`): a participant may own no
column (per-date filtering, resources above dates), and the fallback empties the participants while
the view's `resources` is non-empty. Its identity is the input array (or a module `EMPTY`), so a
`useMemo` on it changes exactly when `resources` does. `colLookup(model, dateI, key) → colI | -1` is
a module function (a `Map` keyed `dateI:key` built alongside; internal).

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
// premium: buildResourceKeying(participants: Resource[]): DayTableKeying, useMemo on `model.participants`
//          (NOT on the view's `resources`: the fallback model has no participants, §1.3)
```

A def or span that names keys outside `keys` (a resource not in the view, or any resource after the
fallback) is dropped from those keys, as today (`event-splitting.ts:46-48`: only `keyInfos` keys are
produced).

**The keying's identity is never a stage-1 memo input.** A rename changes `resources`, the model and
the keying; stage 1 compares only the per-key *values* the keying carries (`uiByKey[K]`,
`businessHoursByKey[K]`, both references preserved by a rename) and the pure functions
`keysForEventDef`/`keyForDateSpan` (which depend on nothing but the def/span). Stage 2 and the
selection resolver may depend on the keying.

**Per-key, per-lane UI bases** (`event-ui-bases.ts`), reproducing `_getKeysForEventDefs` +
`_splitIndividualUi` + `eventUiBuilders[key]` (`event-splitting.ts:44-55`, `:79`, `:110`) and the lane
partition, as three layers with today's cache boundaries:

```ts
// 1. per store: which keys and lanes each current def belongs to
export function buildDefKeys(defs: EventDefHash, keysForEventDef): { [defId: string]: string[] }        // memo on (defs)
// 2. per (eventUiBases, defKeys, lane): the individual bases partitioned by key
export function splitIndividualUi(eventUiBases, defKeys, defs, lane): { [key: string]: EventUiHash }  // memo on (eventUiBases, defKeys, lane)
// 3. per key: the key's full bases, a per-key memoize on (eventUiBases[''], uiByKey[key], individualUi[key])
export function buildEventUiForKey(allUi: EventUi | null, keyUi: EventUi | undefined, individual: EventUiHash | undefined): EventUiHash
```

Layer 3 is a **per-key `memoize` map** held by the hook (today's `eventUiBuilders` pattern, which the
hook-toolkit spec §3.3 explicitly keeps as a `memoize` instance: "the per-key memoize map at
`event-splitting.ts:44`"), keyed by the key string, entries kept while the key participates and
dropped when it stops (as `mapHash(keyInfos, …)` does). So key K's bases object is the same across
renders until the calendar base, K's `ui` reference or the store's individual partition for K changes,
and B's bases never change because A's `ui` did. The `''` entry for `PLAIN_KEYING` and a DayGrid lane
is the input hash itself (same object: `DayGridView` has no splitter today). For `PLAIN_KEYING` and a
TimeGrid lane it is the lane partition `AllDaySplitter` makes.

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

export function sliceDayTableEvents(      // fg + bg, one pass over the store, for the keys asked for
  eventStore: EventStore,
  keys: string[],                          // the keys to (re)compute this time: the stale ones (see the cache below)
  eventUiBasesByKey: { [key: string]: EventUiHash },
  keysForEventDef: (def: EventDef) => string[],
  laneForDef: (def: EventDef) => Lanes,    // from the lane constant
  daySeries: DaySeries, dayCols: DayCol[],   // the PLAIN date coordinates (model.daySeries / model.dayCols)
  lane: DayTableLane,
  dateProfile: DateProfile,
  nextDayThreshold: Duration | null,
): { fg: KeyedRanges<Seg>, bg: KeyedRanges<Seg> }   // buckets for `keys` only

export function sliceDayTableBusinessHoursForKey(businessHours: EventStore | null, daySeries, dayCols, lane, dateProfile, nextDayThreshold, context): Seg[]
export function sliceDayTableDateSelectionForKey(dateSelection: DateSpan | null, basesForKey, daySeries, dayCols, lane, dateProfile, nextDayThreshold, context): Seg[]
export function sliceDayTableInteractionForKey(interaction, key, basesForKey, keysForEventDef, laneForDef, daySeries, dayCols, lane, dateProfile, nextDayThreshold): KeyedInteractionEntry<Seg> | null
  // KeyedInteractionEntry: { segs: Seg[], affectedInstances: EventInstanceHash, isEvent: boolean } — null when the key has neither an affected nor a mutated def (today's "no split state")
export function resolveDayTableEventSelection(eventSelection, eventStore, keys, keysForEventDef, lane): string
```

where `Seg` is `DayGridRange & EventRangeProps` (column-in-row coordinates, divisor
`dayCols.length`) for the `dayGrid` lane and `TimeGridRange & EventRangeProps` (`col = dateI`) for
`timeGrid`.

**The per-key cache (`keyed-cache.ts`)**, the hook-side owner of today's per-key slicer instances:

```ts
export interface KeyedCache<Args extends any[], Res> {
  // for each key: compare `argsFor(key)` to the key's stored args (isArraysEqual, as memoize does);
  // stale keys are recomputed, the rest return their stored result (same array, same eventRanges).
  // keys no longer present are evicted. returns { [key]: Res } with per-key stable entries
  get(keys: string[], argsFor: (key: string) => Args, compute: (staleKeys: string[]) => { [key: string]: Res }): { [key: string]: Res }
}
```

One `KeyedCache` per category per lane, created once per view instance (`useState(() =>
createKeyedCache())`), like today's `slicersRef` map. `compute` receives all stale keys at once, so
fg/bg still run **one pass over the store** for however many keys are stale (all of them on a store
change, as today; one of them when only that key's bases changed; none on a rename). The per-key
args are exactly today's per-key slicer args (§2.6). The aggregate `{ [key]: Res }` is a new object
per render; stage 2 compares its entries shallowly (`memoizeObjArg`/`isPropsEqualShallow`), so an
unchanged set of buckets doesn't re-project.

How `sliceDayTableEvents` reproduces `sliceEventStore` per key without subsets, in `sliceEventStore`'s
**three stages** over the whole store:

1. **Defs:** for each def in store order: `keys = keysForEventDef(def)` filtered to the requested
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

The per-key functions mirror the `Slicer` methods, each run through the key's `KeyedCache` entry:
`sliceDayTableBusinessHoursForKey` (input `businessHoursByKey[key] || businessHours`, a reference;
`''`: the calendar's; expanded with `expandRecurring` into the civil active range as
`_sliceBusinessHours`), `sliceDayTableDateSelectionForKey` (input: the span if `keyForDateSpan(span)
=== key` else `null`, as `_splitDateSpan` gives each key the same span object or nothing;
`intersectDateSpan`'s instant stripping; `fabricateEventRange` with that key's bases, so the
fabricated instance id lives as long as the key's cache entry holds), and
`sliceDayTableInteractionForKey`: segs from `interaction.mutatedEvents` instances whose *mutated* def
has the key (sliced with `sliceEventStore`'s rules, fg only, as `_sliceInteraction`);
`affectedInstances` = instances of `interaction.affectedEvents` whose *affected* def has the key and
the lane; `isEvent = interaction.isEvent`; `null` when the key has neither (today's missing split
state). Stage 2 decides what to merge (§2.5). `resolveDayTableEventSelection`: `''` unless the
instance exists in the store and its def belongs to one of `keys` or to `''`, and (TimeGrid) to the
lane; with `keys = []` after the fallback only `''`-keyed defs qualify, as today.

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
  entries[k]?.affectedInstances))` in key order (resource rules: `''` excluded; plain: the `''` entry
  is the whole lane subset); `isEvent` OR-ed over the included keys' entries; the result is `null`
  when no included key has an entry (`anyInteractions`; after the fallback `keys` is empty, so always
  `null`), or, for plain, when the interaction is null.

### 2.6 The hook

```ts
// useDayTableSegs.ts
export function useDayTableSegs<L extends DayTableLane>(
  props: SliceableProps,          // the view's eventStore, eventUiBases, businessHours, dateSelection, eventDrag, eventResize, eventSelection
  keying: DayTableKeying,         // PLAIN_KEYING, or buildResourceKeying(model.participants)
  model: DayTableModel,           // stage 1 reads its daySeries/dayCols (stable while the date inputs are), stage 2 the rest
  lane: L,
  dateProfile: DateProfile,
  nextDayThreshold: Duration | null,
  context: CalendarContext,
): SlicedProps<SegFor<L>>
```

Memo table. Stage 1 is **per key** (a `KeyedCache` per row, `keys = keying.keys` plus `''`); the
per-key args are today's per-key slicer args. Stage 2 is one `useMemo` per row with a shallow
compare of the bucket map. `coords` = `(model.daySeries, model.dayCols)`, two fields whose identity
follows the date inputs only (the resource model copies them from the plain model).

| Output | per-key stage-1 args (compared per key with `isArraysEqual`) | stage-2 deps |
|---|---|---|
| `defKeys` | `(eventStore.defs)` (one memo, not per key) | — |
| `individualUi` | `(eventUiBases, defKeys, lane)` (one memo, not per key) | — |
| `basesByKey[K]` | `(eventUiBases[''], keying.uiByKey[K], individualUi[K])` (today's `eventUiBuilders[key]`) | — |
| `fg`/`bg` buckets | `(eventStore, basesByKey[K], coords, lane, dateProfile, nextDayThreshold)`; stale keys computed in one pass | `(buckets shallow, model, keying)` |
| `businessHours` buckets | `(keying.businessHoursByKey[K] ?? businessHours, coords, lane, dateProfile, nextDayThreshold, context)` | `(buckets shallow, model, keying)` |
| `dateSelection` buckets | `(keyForDateSpan(dateSelection) === K ? dateSelection : null, basesByKey[K], coords, lane, dateProfile, nextDayThreshold, context)` | `(buckets shallow, model, keying)` |
| `eventDrag`, `eventResize` entries | `(interaction, basesByKey[K], coords, lane, dateProfile, nextDayThreshold)` | `(entries shallow, model, keying)` |
| `eventSelection` | `(eventSelection, eventStore, keying.keys, lane)` | — |

`lane` is a module constant per view (`DAY_GRID_LANE`, `TIME_GRID_ALL_DAY_LANE`, `TIME_GRID_TIMED_LANE`);
`keying` is `PLAIN_KEYING` or a `useMemo` on `model.participants`; the plain model is `useMemo`'d on
`(dateProfile, hiddenDays, dateEnv, config)`, today's deps of `dayTableModel`/`daySeries`/`dayCols`.
The returned `SlicedProps` object is new each render, as today's is; consumers take its fields.

**Invariant, enforced by review and the mutation checks:** no stage-1 arg is the keying, the
`resources` list, a `Resource` object or the model itself. Only per-key values with the same
identity behavior as today's inputs.

Why identity is at least as stable as today:

- **Standard views:** one key (`''`); stage 1's args are today's slicer memo args (`coords` standing
  in for `dayTableModel`/`daySeries`/`dayRanges`, built from the same inputs); stage 2 is the identity.
  Same granularity, same objects.
- **Resource views, per key:** K's fg/bg entry misses when the store, K's bases, the date inputs or
  the profile change, exactly today's per-key slicer; K's bases miss when the calendar base, K's `ui`
  reference or K's individual partition changes, exactly today's `eventUiBuilders[K]`; K's selection
  entry misses only on those or on the selection itself. So:
  - a **rename of B** (new `Resource`, same `ui`/`businessHours` references; new `resources`, model,
    keying): every stage-1 entry holds; stage 2 reruns (new seg objects, same `eventRange`s, same
    fabricated selection instance id, no mirror remount), as the joiner did. Note what this does
    *not* buy, today or after: the rebuilt model creates fresh `ResourceApi` render props for every
    resource column (`AbstractResourceDayTableModel.ts:217`), which reach the events' render props
    (`events.tsx:210`) and fail `CustomContent`'s shallow compare, so class and content hooks of
    untouched events may rerun. The locks therefore assert zero mirror mounts/unmounts and per-hook
    counts `<=` recorded, never "no calls for untouched events";
  - **A's parsed `ui` is replaced** (A's `ui` reference changes, B's doesn't): A's bases and A's
    entries recompute; B's selection mirror and B's segs keep their objects and ids, as today (the
    model rebuild caveat above applies to render props here too);
  - the **fallback** empties `keying.keys`: every key's entries are evicted (today: the splitter's
    key set empties); `''` stays.
  Stage 2 depends on the model and keying, as the joiner did on the model and the sets.
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
const segs = useDayTableSegs(props, PLAIN_KEYING, model, DAY_GRID_LANE, dateProfile, options.nextDayThreshold, context)
<DayGridLayout cellRows={model.cellRows} headerTiers={...} {...segs} />

// TimeGridView body
const model = useTimeGridModel(dateProfile)                     // slot ranges, no major unit
const allDay = useDayTableSegs(props, PLAIN_KEYING, model, TIME_GRID_ALL_DAY_LANE, ...)
const timed = useDayTableSegs(props, PLAIN_KEYING, model, TIME_GRID_TIMED_LANE, ..., null)
const timedByCol = useTimedSegsByCol(timed, model.colCount)
const nowSegsByCol = useNowIndicatorSegsByCol(nowDate, model, dateProfile, options.nextDayThreshold, datesAboveResources = false, enabled)   // §2.8
<TimeGridLayout cells={model.cols} ... eventSelection={allDay.eventSelection || timed.eventSelection} />

// ResourceTimeGridView body
const plainModel = useTimeGridModel(dateProfile)
const resources = ...(unchanged filtering and ordering)
const hasEventsByDate = ...(unchanged, reads plainModel.dayCols)
const model = useMemo(() => buildResourceDayTableModel(plainModel, resources, options.datesAboveResources, hasEventsByDate, context), [...])
// from the model's participants, not `resources`: after the all-filtered fallback the model has none (§1.3)
const keying = useMemo(() => buildResourceKeying(model.participants as Resource[]), [model.participants])
const allDay = useDayTableSegs(props, keying, model, TIME_GRID_ALL_DAY_LANE, ...)   // stage 1 reads model.daySeries/dayCols, copied from plainModel
const timed = useDayTableSegs(props, keying, model, TIME_GRID_TIMED_LANE, ..., null)
...
headerTiers={useMemo(() => buildResourceRowConfigs(toResourceHeaderInput(model, options.datesAboveResources), ...), [...])}  // resourceCount = model.participants.length
isHitComboAllowed={useStableCallback((h0, h1) => isResourceHitComboAllowed(h0, h1, model.dayCols.length === 1))}
```

`AllDaySplitter` goes away: `useTimeGridViewData` no longer returns `splitProps`; the lane filter does
the same def-level classification inside stage 1, the bases partition in `splitIndividualUi`, the
interaction partition in `sliceDayTableInteractionForKey` (affected and mutated separately), and
business hours stay whole in both lanes. `eventSelection` for the timed lane (`splitProps.timed.eventSelection`
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

### 2.9 Where 7b touches phase 10's output (landed)

Phase 10 kept `DateProfileGenerator` as the one class (methods delegating to module functions with
open recursion), the store keeps building instances, consumers' types didn't change, and the generator
has a cached `hiddenDays` getter (`DateProfileGenerator.ts:83-89`) returning a `HiddenDays`
(`isHidden`, `skip`, `trim`, `structs/hidden-days.ts`) whose methods **delegate through the generator's
own `isHiddenDay`/`skipHiddenDays`/`trimHiddenDays`**, so a custom subclass's overrides apply and the
object's identity follows the generator's (memoized by the store per view props). 7b:

- `common/DaySeriesModel.ts:35` (`dateProfileGenerator.isHiddenDay(date)`) becomes
  `buildDaySeries(range: DateRange, hiddenDays: HiddenDays): DaySeries` in
  `common/day-table/day-series.ts` (a plain object `{ dates, cnt, sliceRange }`; `sliceRange` as is),
  calling `hiddenDays.isHidden(date)`, which is the generator's `isHiddenDay` (override-safe, no
  method/hash distinction to worry about). **Never rebuilt from raw options**: the hooks read
  `context.dateProfileGenerator.hiddenDays` and pass it down.
- `buildDayTableModel(dateProfile, hiddenDays, dateEnv, config)` takes it through; memo deps
  `(dateProfile, hiddenDays, dateEnv)`, replacing today's `(dateProfile, dateProfileGenerator,
  dateEnv)`, the same identity since the getter caches per generator.
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
  class is deleted here and **the new full `DayTableModel` interface is the one type propagated through
  the whole retained chain**, no `Pick<>`s (the class has private members, so the new plain object is
  not assignable to it, and a narrowed type would not flow through the chain either). Retyped to
  `DayTableModel` (the interface) in this step: `DayTableSlicer`'s extra arg (`DayTableSlicer.ts:6-10`,
  reads `daySeries.sliceRange` and `colCount`, which is the plain table's dates per row);
  `buildResourceTableModel`'s parameter (`resource-table-model.ts:14`); the three factories'
  parameters (`DayResourceTableModel.ts:10`, `ResourceDayTableModel.ts:10`,
  `ResourcelessDayTableModel.ts:8`); `AbstractResourceDayTableModel`'s constructor parameter and
  public field (`:41`) and `buildResourceCells` (`:148`, reads `rowCount`, `cellRows`);
  `ResourceDayGridView`'s `DayTableModel` import and `buildDayGridCols` (`:173`, reads `cellRows[0]`).
  All read only fields the new interface has (`rowCount`, `colCount`, `cellRows`, `headerDates`,
  `daySeries`). `useDayGridViewData` returns the new model under the old `dayTableModel` name;
  `useTimeGridViewData` keeps returning `daySeries`, `dayCols`, `dayRanges` and `splitProps` (the
  `AllDaySplitter` instance survives only there) for premium. The premium package must compile
  (`pnpm build`, the landing gate) and its suite must pass in this step with no source changes beyond
  those retypings.
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
  `buildResourceKeying` (§2.3, from `model.participants`), `isResourceHitComboAllowed` (§2.8),
  `RESOURCE_KEYLESS_RULES`. The builder sets `participants` to the `resources` array it was given, or
  `EMPTY` on the all-filtered fallback (today's `model.resources`); `toResourceHeaderInput` takes
  `resourceCount` from it.
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
  model's `cellRows` built from the plain model's rows; stage-1 divisor is `model.dayCols.length`
  (the date columns, copied from the plain model).
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
11. Participation vs columns, two cases, both locked at the **state level** (a unit characterization
    running today's `VResourceSplitter` + `joinInteractions`/`joinSegs` and the new
    `sliceDayTableInteractionForKey` + `projectInteraction`/projections on the same synthetic inputs,
    for drag and resize, asserting `null`-ness, `affectedInstances`, `isEvent` and the segs):
    (a) a resource that survives view-wide filtering but owns no column (resources above dates, its
    only event on an interior hidden day) with another resource that does: an interaction targeting
    it activates the state (non-null) with no segs; its business hours and bg events project to
    nothing; `calendar.select` with its `resourceId` highlights nothing and throws nothing (DOM);
    (b) the **all-filtered fallback** (`resource-table-model.ts:34`, not the empty-resources branch at
    `:21`): the hidden day must be **interior**, e.g. `hiddenDays: [3]` with every resource's events on
    Wednesdays only. Hidden weekends (`weekends: false`) are trimmed off the active range's edges
    (`date-profile.ts:80`), so Saturday-only events fail *view-wide* filtering
    (`resource-filtering.ts:48`) and `resources` is already empty, which is the other branch. Assert
    the precondition in the spec: the view-wide filtered `resources` is non-empty (e.g. through
    `calendar.getResources()` after filtering is observable, or by checking that `filterResourceStore`
    keeps them) and `model.participants` is empty (the header is the plain date row, every column
    inert). Then: an interaction targeting any resource is `null`, resource business hours don't
    expand, and `isEventInteracting` (`useHitTarget.ts:86-88`) is false during such a drag from
    another calendar (DOM/state). `resources: []` alone doesn't exercise (b).
12. Mixed keyed and keyless grouped drag: event A (`resourceId: 'a'`) and event B (no resource) share
    a `groupId`; dragging A mutates both. **DOM:** B's mirror appears in every resource column and
    A's in the target column; B has no original copies (keyless fg renders nowhere, so nothing on the
    DOM can show its exclusion). **State:** B's instance is **not** in the joined `affectedInstances`
    (`VResourceJoiner.ts:159`), asserted by the unit characterization of 11 (today's `joinInteractions`
    vs the new projector, same inputs), for drag and resize.
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

- **Re-render probes that must re-execute the view body**, each proven in the spec itself (a counter
  that must move: `dayLaneClass`/`dayCellClass`, or a probe `viewClass` count) before its assertions:
  (a) `calendar.render()` (vanilla re-renders the root with the same props; `view-render/rerender.ts`
  does this), for every view; (b) a **minute tick** (jasmine mock clock advanced one minute) for the
  **TimeGrid views only**: they subscribe to `useNow('minute')` with `nowIndicator`
  (`useTimeGridViewData.ts:48`), while the DayGrid views subscribe to `useNow('day')`
  (`useDayGridViewData.ts:25`) and would not re-render; (c) a **day tick** for the DayGrid views: the
  clock set just before midnight and advanced past it, which re-renders the body with a new
  `todayRange` (proven by `dayCellClass` moving for the two days whose `isToday` flips) while every
  stage-1 and stage-2 input is unchanged. After each probe assert every event hook's count
  `toBeLessThanOrEqual(recorded)`, lifecycle hooks included (no `eventDidMount`/`eventWillUnmount` at
  all on a probe).
- **Resource title update with a selection mirror:** `calendar.getResourceById('b').setProp('title',
  'B2')` while a timed selection mirror is shown in `b`: **zero** `eventWillUnmount`/`eventDidMount`
  (the mirror keeps its fabricated instance id); every other hook `<=` its recorded per-hook baseline
  (the rebuilt model's fresh `ResourceApi` render props may rerun class and content hooks of untouched
  events today, §2.6; no resource-local expectation). Also the all-day row's mirror in
  `resourceTimeGridWeek` and the dayGrid mirror.
- **Another resource's parsed UI replaced, with a selection mirror:** `setProp('eventColor', …)` is
  **not** a UI change: `setResourceProp` assigns the raw property (`resourceStore.ts:81`) and never
  re-parses `ui`/`businessHours` (`resource.ts:61`), so it cannot be the probe. Use a controlled
  replacement that re-parses only A: `calendar.addResource({ id: 'a', title: 'A', eventColor: 'red' })`
  with A's existing id (`addResource` spreads the additions over the store, `resourceStore.ts:60`, so
  B's `Resource` object is kept by reference), with an explicit `resourceOrder` so the column order
  doesn't move. Assert the precondition first: A's internal `ui` reference changed and A's events now
  render red; B's internal `Resource` (hence `ui`, `businessHours`) is the same reference. Then: zero
  lifecycle calls for B's mirror; every hook `<=` recorded per hook. Same with A re-added with a
  `businessHours` input (B's reference preserved; A's non-business fills change).
- **Fallback transition** (spec 11(b)'s precondition: `hiddenDays: [3]`, Wednesday-only events,
  non-empty view-wide `resources`): with a timed selection in `b`, add a Thursday event for `a` (a
  resource column appears, leaving the fallback) and remove it again (entering): every hook `<=`
  recorded per hook, lifecycle included. This probe locks counts only: the key set empties and refills
  today too, so the mirror unmounts and mounts either way, and it cannot tell an evicted entry from a
  retained one (the `KeyedCache` unit locks do, §4.2 pure-function specs).
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
`dayGridMonth` (`calendar.render()`, the day tick) and `timeGridWeek` (`calendar.render()`, the
minute tick), each proven to reach the view body, plus drag, add event and unrelated option, per
hook, `<=` recorded.

Pure-function unit specs (Karma, importing from `fullcalendar/protected-api`), written in step 1/2
against the new functions, not characterization: `buildDayGridRanges` and `daySeries.sliceRange`
tables (including the hidden-day clamp cases from `DaySeriesModel.ts:5-9`); `projectDayGridSegs`
over a hand-built model for every ordering (plain, resources above dates, dates above resources,
resourceless, a missing middle column, a participating key with no columns, multi-row second week,
week crossings, hidden days, both orderings); `buildEventUiForKey`/`splitIndividualUi` precedence and membership
(calendar base, resource ui, individual, def ui; a def not in the key; lanes); `projectInteraction`
metadata membership (keyed vs keyless); `sliceDayTableEvents` order (instance order within a key,
inverse complements last) against `sliceEventStore` on a subset store as the oracle; and **direct
`KeyedCache` locks** (the only place that can tell cache behavior apart from rendering): (i) with
keys `a`, `b`, `c` and only `b`'s args changed, `compute` receives exactly `['b']` and `a`'s/`c`'s
results are the same objects as before; (ii) unchanged args for every key → `compute` not called,
every entry identical; (iii) a key leaving `keys` is evicted and, on re-entry, recomputed (fresh
entry, `compute` receives it) even with equal args; (iv) two cache instances (the selection and the
events caches of one lane, today's separate `memoize` fields, `slicing-utils.ts:34-38`) are
independent: invalidating one leaves the other's entries identical; (v) arg comparison is
element-wise identity (`isArraysEqual`), so an equal-by-value but new array misses, as `memoize`
does.

### 4.3 Mutation checks (run once per step, by hand, not committed)

Each should make a lock fail; if it doesn't, the lock is too weak:

- In `useDayTableSegs`, drop `eventStore` from the stage-1 fg memo deps → `add-event`; drop `eventDrag`
  → mid-drag assertions.
- Make the **selection** cache's per-key args include `model`, `keying`, `resources` or the
  `Resource` object → the resource-title-update lock (a new fabricated selection instance remounts
  the mirror: `eventDidMount` > 0). Doing the same to the fg/bg cache only does *not* regenerate
  selection instances (the caches are separate, as today's `memoize` fields are), so for fg/bg the
  detector is the `KeyedCache` unit lock (i) and the rename probe's `eventClass` counts, not the
  lifecycle counts.
- Replace the per-key bases `memoize` map with one aggregate memo over all keys' bases → the
  "another resource's parsed UI replaced" lock (B's mirror remounts when A is re-added with a new
  `eventColor`) and `KeyedCache` lock (i).
- Build the keying from the view's `resources` instead of `model.participants` → spec 11(b) (an
  interaction targeting a resource activates during the fallback; resource BH expand; header gains a
  resource row). The fallback-transition probe does not detect this (mirrors remount either way).
- Evict nothing from the `KeyedCache` (keep stale keys) → `KeyedCache` lock (iii); retain-on-reentry
  → lock (iii) too (the fallback-transition probe cannot).
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
- `filtered-fallback`: `resourceTimeGridWeek` and `resourceDayGridWeek` with
  `filterResourcesWithEvents: true`, `hiddenDays: [3]` (an **interior** hidden day; hidden weekends
  are trimmed off the range and would empty `resources` view-wide instead, the other branch), and
  every resource's events on Wednesdays only (the all-filtered fallback: plain date header, inert
  columns, calendar business hours, no resource BH), plus a timed selection in `b` (no highlight).
  Also a `filtered-empty` twin with `weekends: false` and Saturday-only events for the
  empty-resources branch (`resource-table-model.ts:21`), so both branches are snapshotted.
- `select-mirror-after-rename` and `select-mirror-after-other-ui-change`: `resourceTimeGridWeek`,
  `selectMirror: true`, a timed selection in `b`, then `setProp('title')` on `b` / `addResource` of `a`
  with the same id and a new `eventColor` (a real re-parse; `setProp('eventColor')` isn't one)
  on `a` in `setup` (DOM identical to `select-mirror`; the identity spec covers the lifecycle counts).
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
10. **Hidden days**: consume `context.dateProfileGenerator.hiddenDays`, landed in phase 10 step 1 as
    a cached getter whose `isHidden` delegates to the generator's `isHiddenDay` (override-safe). Never
    rebuild from raw options. Settled.
11. **`DayTableCell` vs `DayTableColumn`**: keep both; fresh resource fields per multi-row cell, shared
    single-row columns, as today. Sol agrees.
12. **Hosting**: standard hooks and pure code through `protected-api`; premium owns the resource model
    builder, keying, header input and hit-combo function. Sol agrees.
13. **Timeline follow-up** (`ResourceSplitter`, `TimelineLaneSlicer`, `isPropsValidWithResources` keep
    `Splitter`/`Slicer`): record in the roadmap's loose ends; the shared `sliceEventStore` driver is
    covered by the timeline suites during 7b. Sol agrees.
14. **Per-key bases and the store.** `individualUi` is keyed on `(eventUiBases, defKeys, lane)` with
    `defKeys` per `eventStore.defs`, so every key's bases rebuild on a store change, as today's
    `splitIndividualUi(eventUiBases, defKeys)` does, and with them every key's selection and
    interaction entries (a fabricated selection instance is re-created on `addEvent` today too; the
    `add-event` identity lock records that). Not count-neutral in general (Sol, round 2), but identical
    to today; a finer `individualUi` (per key, comparing the key's partition by value) would lower
    counts and is a loose end, not 7b.
15. **One model in the hook signature** (adopted): `useDayTableSegs` takes the model only; stage 1
    reads `model.daySeries`/`model.dayCols`, whose identities follow the date inputs (the resource
    builder copies them from the plain model), and lists those two fields, never the model, as args.
    This is independent of finding 1, which the per-key caches answer.
16. **New: the `KeyedCache`'s eviction.** Entries are evicted when their key leaves `keying.keys`
    (a removed resource, the fallback) and created on return, as today's `mapHash` over `keyInfos`
    rebuilds the slicer map (`ResourceTimeGridView.tsx:89-92` keeps instances by id, so a resource that
    leaves and returns gets a fresh slicer: same here). Lock: the fallback-transition identity probe.

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

## 8. Review round 2 (Sol, spec, high effort)

Round-1 disposition per Sol: #1, #4, #5, #6, #10, #12 resolved; #2, #7, #8, #9, #11 partly (the
remainders are findings 1-4 below); #3 not resolved (= finding 1). "The two-stage architecture is
sound."

| # | Finding | Response |
|---|---|---|
| 1 | P1: resource changes still invalidated stage 1. An aggregate `eventUiBasesByKey` memo keyed on the keying (built from `resources`) rebuilt on a rename and on another resource's UI change, re-fabricating the selection instance and remounting the mirror; "a rename reruns stage 2 only" was false. | Fixed. Stage 1 is now **per key, per category**, through a `KeyedCache` per row (today's per-key slicer instances), with per-key args that are today's values: the bases through three layers (`defKeys` per store, `individualUi` per `(eventUiBases, defKeys, lane)`, a per-key `memoize` on `(eventUiBases[''], uiByKey[K], individualUi[K])`, today's `eventUiBuilders[key]`); fg/bg per `(eventStore, basesByKey[K], coords, …)` with stale keys computed in one pass; selection and interactions per key likewise (§2.3-2.6). An explicit invariant: no stage-1 arg is the keying, the resource list, a `Resource` object or the model. A rename and another resource's UI change are traced in §2.6 and locked by the identity spec (zero lifecycle calls for `b`'s mirror on `b`'s rename and on `a`'s `eventColor`/`businessHours` change), plus two mutation checks (aggregate memo; model/keying in stage-1 args). |
| 2 | P2: participating keys needed the all-filtered fallback exception: today the resourceless fallback model has `resources = []`, emptying the splitter/joiner's keys, while `buildResourceKeying(resources)` kept them (interaction activation, resource BH, header). | Fixed. The model carries `participants` (the `resources` array it was built for, or `EMPTY` after the fallback: today's `model.resources`), distinct from column ownership; the keying is built from `model.participants`, the header's `resourceCount` too (§1.3, §2.2, §2.3, §2.7, step 2a). Spec 11 gained case (b), the fallback, with state-level locks for activation, BH, header and `isEventInteracting`, plus a `filtered-fallback` fixture and a fallback-transition identity probe; mutation check added. |
| 3 | P2: step 1's `Pick<>` retypings left the narrowed value flowing through the three factories and `buildResourceCells`, still typed as the full class. | Fixed. Step 1 propagates the one new full `DayTableModel` interface through the whole retained chain (`DayTableSlicer`, `buildResourceTableModel`, the three factories, `AbstractResourceDayTableModel`'s constructor and field, `buildResourceCells`, `ResourceDayGridView`'s import and `buildDayGridCols`), each listed with the fields it reads; `pnpm build` is the landing gate. |
| 4 | P2: premium 12 asked for an impossible observation (B's original copies don't render, so no hook args can show its exclusion from `affectedInstances`). | Fixed. Premium 12 keeps the DOM mirror assertions and moves the exclusion to a state-level unit characterization (today's `VResourceSplitter` + `joinInteractions` vs the new per-key slicer + `projectInteraction` on the same inputs, drag and resize), shared with spec 11. |
| Q14 | "Rebuilding every per-key base is count-neutral" is wrong for selections and interactions. | Corrected (§5 #14): per-key bases rebuild on a store change as today's `splitIndividualUi` does, which re-fabricates selections on `addEvent` today too; identical, not neutral; a finer partition is a loose end. |
| Q15 | Passing only `model` is fine if stage 1 uses its stable coordinate fields; it doesn't fix finding 1. | Adopted (§5 #15): one model, stage 1 lists `model.daySeries`/`model.dayCols` as args, never the model; finding 1 is answered by the per-key caches, not by this. |
| — | Phase 10 is done; `context.dateProfileGenerator.hiddenDays` exists. | §2.9 rewritten against the landed getter (cached per generator, delegating through `isHiddenDay`, so overrides apply and the method/hash caveat is gone); question 10 settled. |

## 9. Review round 3 (Sol, spec, high effort)

"No P1s. The architecture is sound; the four round-2 findings are resolved at the design level. Not
ready unchanged: four P2s remain in the verification instructions. Fix them, then ready to implement."

| # | Finding | Response |
|---|---|---|
| 1 | P2: the other-resource UI-change probe used `setProp('eventColor')`, which writes the raw property without re-parsing `ui`/`businessHours` (`resourceStore.ts:81`, `resource.ts:61`), so the invalidation never happened and the aggregate-cache mutation could survive. | Fixed. The probe is a controlled re-parse of A only: `addResource` with A's existing id and a new `eventColor` (the store spreads the additions, `resourceStore.ts:60`, so B's `Resource` is kept by reference), with an explicit `resourceOrder`; the spec asserts the precondition (A's internal `ui` reference and rendered colour changed, B's `Resource` reference unchanged) before the lifecycle counts; same for a `businessHours` input. §4.2, §4.3, §4.4 updated; the `setProp` quirk is noted. |
| 2 | P2: the rename/UI locks demanded "no `eventContent` for untouched events" / "only A's events", but the rebuilt model's fresh `ResourceApi` render props (`AbstractResourceDayTableModel.ts:217` → `events.tsx:210` → `CustomContent.tsx:168`) can rerun class/content hooks elsewhere, today and after. | Fixed. Those locks assert zero mirror mounts/unmounts and per-hook counts `<=` recorded baselines only; §2.6's trace now states what the retained model boundary does not buy. |
| 3 | P2: the fallback fixture (`weekends: false`, Saturday-only events) hits the empty-resources branch (`resource-table-model.ts:21`): hidden weekends are trimmed off the range (`date-profile.ts:80`), so the events fail view-wide filtering first. | Fixed. Fixture, spec 11(b) and the fallback-transition probe use an interior hidden day (`hiddenDays: [3]`, Wednesday-only events) and assert the precondition (non-empty view-wide `resources`, empty `model.participants`); a `filtered-empty` twin fixture snapshots the other branch. |
| 4 | P2: a one-minute tick cannot prove DayGrid view-body execution (`useNow('day')`, `useDayGridViewData.ts:25`). | Fixed. The minute tick is a TimeGrid-only probe; DayGrid uses `calendar.render()` and a day tick (clock advanced past midnight, proven by `dayCellClass` moving for the two days whose `isToday` flips), §4.2 premium and standard identity specs. |
| 5 | P3: mutation checks overclaimed (adding `model` to the fg/bg cache args doesn't regenerate selection instances; fallback lifecycle counts can't distinguish evicted from retained entries). | Fixed. Direct `KeyedCache` unit locks added (stale-key subsets, unchanged-entry identity, eviction and re-entry, independent instances per category, identity-based arg comparison); the lifecycle mutation claim is narrowed to the selection cache, the fg/bg detector is the cache lock plus the rename probe's class counts, and the eviction mutations point at the cache locks, not the transition probe. |
