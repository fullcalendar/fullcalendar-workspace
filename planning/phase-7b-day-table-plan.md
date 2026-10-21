# Phase 7b: the day-table pipeline

Status: plan, revision 1 (2026-10-21). Not started.

Sequencing: lands right after phase 10 (date profile) and before phase 11 (granular contexts,
`useSyncExternalStore`, render-time purity). The design below takes phase 10's hidden-days value
object as input and never touches `DateProfileGenerator` (§3.9); every new piece is a pure function
of explicit inputs, so phase 11 can run it during render (§3.10).

Background: `day-table-pipeline.md` (the problem), `refactor-roadmap.md` §7b (ground rules),
`phase-7-layout-families.md` (the hooks the views already use), `phase-9-store.md` (derived data).

Goal in one sentence: replace the split-by-resource, slice-per-resource, rejoin pipeline with one
pure column model and one slicing pass per lane, with the same DOM, the same callbacks and the same
or lower render-hook counts.

---

## 1. What's there today

About 1,700 lines across the two packages (the files below sum to 2,000 with the views). Four views
use it: `DayGridView`, `TimeGridView`, premium `ResourceDayGridView`, `ResourceTimeGridView`, plus
`SingleMonth` (MultiMonth) for the standard half.

### 1.1 Files

Standard (`standard/packages/preact/src`):

| File | What |
|---|---|
| `component-util/event-splitting.ts` (184) | `Splitter` base: `splitProps(props) → { [key]: SplittableProps }`. Per-key `eventStore` subset, `eventUiBases` (`buildEventUiForKey`: calendar base `''` + the key's `ui` + the individual per-def UIs), `businessHours` (the key's or the calendar's), `dateSelection` (if `getKeysForDateSpan` matches), `eventDrag`/`eventResize` (split by the mutated and affected defs' keys), `eventSelection` (kept only if the instance is in the subset). Memoized per field with `memoize`, plus a per-key `eventUiBuilders` map (`:44`). |
| `common/slicing-utils.ts` (270) | `Slicer<R, ExtraArgs>` base: `sliceProps(props, dateProfile, nextDayThreshold, context, ...extra) → SlicedProps<R>`. Five `memoize` fields keyed on their argument lists (`:34-38`); `sliceNowDate` (`:86`) is not memoized. `_sliceEventStore` calls `sliceEventStore` (`component-util/event-rendering.ts:49`) then `sliceRange` per `EventRenderRange`; `_sliceDateSpan` clips with `intersectDateSpan` (drops `instantStartMs`/`instantEndMs` when clipped, `:41-58`) and fabricates an `eventRange`; `_sliceBusinessHours` expands recurring BH into the active range; `computeActiveRange` (`:259`) widens by `slotMinTime`/`slotMaxTime` for timed components. `forceDayIfListItem` (`:63`, `:235`) makes multi-day `list-item` events one day. |
| `common/DaySeriesModel.ts` (97) | Dates of a render range minus hidden days, with `sliceRange(range) → SlicedCoordRange \| null` clamping endpoints on hidden days inward. Reads `dateProfileGenerator.isHiddenDay` (`:35`). |
| `common/day-cols.ts` (72) | `DayCol { key, date, range, isMajor, isDisabled, isInert?, renderProps?, attrs?, className?, dateSpanProps? }`; `buildDayColsFromSeries(daySeries, dateEnv, { slotRange, majorUnit, activeRange })`. |
| `daygrid/DayTableModel.ts` (139) | `DayTableModel` class: `rowCount`, `colCount`, `cellRows: DayTableCell[][]`, `headerDates`, `daySeries`; `DayTableCell` (same shape as `DayCol` minus `range`); `DayGridRange { row, start, end, isStart, isEnd }` (start/end are column indices within the row); `buildDayGridRanges(seriesRange, daysPerRow)` (`:112`). |
| `daygrid/components/util.tsx:14` | `buildDayTableModel(dateProfile, dateProfileGenerator, dateEnv)`: `breakOnWeeks` for year/month/week units, major unit otherwise. |
| `daygrid/DayTableSlicer.ts` (20) | `DayTableSlicer extends Slicer<DayGridRange, [DayTableModel]>` and `DaySeriesSlicer extends Slicer<DayGridRange, [DaySeriesModel]>`; both `forceDayIfListItem = true`. |
| `daygrid/TableSeg.ts` (61) | `getDayGridSegKey(seg) = instanceId:start` (the slice-height map key), `splitSegsByRow`, `splitInteractionByRow`. |
| `daygrid/header-tier.ts` (268) | `buildDateRowConfigs`/`buildDateRowConfig`/`buildDateDataConfigs`/`buildDateRenderConfig`: the header tiers (`RowConfig`, `CellDataConfig`). |
| `timegrid/AllDaySplitter.ts` (33) | `Splitter` with keys `allDay`/`timed`: timed defs → `timed`; all-day bg defs → both; all-day fg → `allDay`; spans by `allDay`. |
| `timegrid/DayTimeColsSlicer.ts` (25) | `Slicer<TimeGridRange, [DateRange[]]>`: intersect with each column's range. |
| `timegrid/TimeColsSeg.ts` (68) | `TimeGridRange { col, startDate, endDate, isStart, isEnd, showDot? }`, `organizeSegsByCol`, `splitInteractionByCol`. |
| `daygrid/components/useDayGridViewData.ts` (41) | `useDayGridViewData(dateProfile)`: `dayTableModel` (`useMemo` on dateProfile, generator, dateEnv), `datesRepDistinctDays`, `todayRange` (`useNow('day')`). `useDayHeaderFormatter`. |
| `timegrid/components/useTimeGridViewData.ts` (87) | `useTimeGridViewData(props)`: `daySeries`, `dayCols` (slot ranges), `dayRanges`, `splitProps` from an `AllDaySplitter` held in state, now. `useTimedSegsByCol(timed, colCount)`: six `useMemo`s over `organizeSegsByCol`/`splitInteractionByCol`. |
| `daygrid/components/DayGridView.tsx` (60) | One `DayTableSlicer` in state; `slicer.sliceProps(props, dateProfile, nextDayThreshold, context, dayTableModel)`; header tiers `useMemo`. |
| `timegrid/components/TimeGridView.tsx` (98) | `DaySeriesSlicer` (all-day lane, `daySeries`) and `DayTimeColsSlicer` (timed, `dayRanges`); `sliceNowDate` every render; `organizeSegsByCol` of it in a `useMemo` whose key is new every render. |
| `multimonth/components/SingleMonth.tsx:45-50` | `buildDayTableModel` + a `DayTableSlicer` per month. |

Premium (`premium/packages/preact-scheduler/src`):

| File | What |
|---|---|
| `resource/common/VResourceSplitter.ts` (40) | `Splitter<VResourceProps>`: keys = the model's resource ids (`resourceIndex.indicesById`) plus `''`; key info is the `Resource` itself (`ui`, `businessHours`); defs by `resourceIds` or `['']`; spans by `dateSpan.resourceId \|\| ''`. |
| `resource/common/VResourceJoiner.ts` (191) | `joinProps(propSets, model)`: six `memoize` fields keyed on `(model, ...setsInKeyOrder)`. `joinSegs` (`:59`): each resource's segs → its columns; the `''` set → every resource's columns *and* the placeholder columns (`resourceI = -1`); fg skips the `''` set entirely (`:37`, `NO_SEGS`). `joinBusinessHourSegs` (`:93`): resource sets → own columns, `''` → placeholders only. `joinInteractions` (`:133`): resource sets → own columns, `''` → every resource's columns (never placeholders); returns `null` unless a *resource* set had an interaction (`:168-171`). `expandSegs` (`:122`): the `''` rule for the now indicator. `transformSeg` creates new seg objects. |
| `resource-daygrid/ResourceDayTableJoiner.ts` (22) | `transformSeg` through `computeColRanges`, `isStart`/`isEnd` AND-ed. |
| `resource-timegrid/ResourceDayTimeColsJoiner.ts` (25) | `transformSeg` through `computeCol`; `-1` drops the seg. |
| `resource/common/AbstractResourceDayTableModel.ts` (229) | The column index: `cols: ResourceDayCol[]` (`DayCol` + `dateI`, `resource`, `resourceI`), `groups`, `colLookup` (`dateI:resourceI`), `dateFirstCols`, `colGroupIndices`, `resourceColCount`, `resourceIndex`, `cells` (2D for multi-row daygrid through `buildResourceCells`, else `[cols]`), `computeCol`, `computeColRanges` (merges adjacent columns of the same *group*, so dates-above-resources breaks a resource's span per date, `:116`), `isHitComboAllowed(hit0, hit1, allowAcrossResources)` (`:142`). `buildResourceDayCol`/`buildResourceCellFields` (`:183-225`): `key = resourceId:iso`, `renderProps.resource = new ResourceApi(context, resource)`, `data-resource-id`, `dateSpanProps.resourceId`; placeholders get `isInert: true` and `aria-disabled`. |
| `resource/common/DayResourceTableModel.ts` (47) | dates above resources: one group per date; `hasMajor = dayCols.length > 1`; a date with no surviving resource gets one placeholder column. |
| `resource/common/ResourceDayTableModel.ts` (44) | resources above dates: one group per resource; `hasMajor = resources.length > 1 && dayCols.length > 1`; a resource with no surviving date is dropped from header and body. |
| `resource/common/ResourcelessDayTableModel.ts` (17) | no resources: every column a placeholder (`resourceI = -1`, inert), one group, `isMajor` from the day col. |
| `resource/common/resource-table-model.ts` (39) | `buildResourceTableModel(dayTableModel, dayCols, resources, datesAboveResources, hasEventsByDate, context)`: picks one of the three; falls back to resourceless when per-date filtering leaves no resource column (`:34`). |
| `resource/common/ResourceIndex.ts` (23) | ids and `indicesById`. |
| `resource/common/resource-filtering.ts` (152) | `filterResourceStore` (view-wide) and `computeHasEventsByDate(rawEventStore, resourceStore, dayCols, nextDayThreshold)` (per date). Reads `DayCol.range` and `.date`. Not part of the pipeline; stays. |
| `resource-daygrid/resource-header-tier.ts` (247) | `buildResourceRowConfigs(model, …)`: four shapes (no resources; one date; dates above resources: date row with `colSpan = group.cols.length` plus a resource row with blank cells for placeholders; resources above dates: resource row with `colSpan` plus a date row keyed `resourceId:`). Reads `model.cols`, `groups`, `resources`, `dayCols.length`, `datesAboveResources`. |
| `resource-daygrid/components/ResourceDayGridView.tsx` (181) | Below. |
| `resource-timegrid/components/ResourceTimeGridView.tsx` (218) | Below. |
| `resource/common/ResourceSplitter.ts` (33), `resource/validation.ts` | `ResourceSplitter` (keys from the whole `resourceStore`) is the timeline's and `isPropsValidWithResources`'s splitter. **Not in scope**: it shares only the `Splitter` base. `timeline/TimelineLaneSlicer.ts` likewise shares only the `Slicer` base. Both bases stay. |

### 1.2 Data flow, ResourceTimeGridView (the full case)

1. `useTimeGridViewData(props)`: `daySeries`, `dayCols` (slot ranges), `dayRanges`, `splitProps = AllDaySplitter.splitProps(props)` → `{ allDay, timed }`, `nowDate`/`nowMs`/`todayRange`.
2. `filterResourceStore` → `flattenResources` (`resourceOrder`) → `computeHasEventsByDate` (when `filterResourcesWithEvents` and more than one day) → `buildResourceTableModel(null, dayCols, resources, datesAboveResources, hasEventsByDate, context)`, all `useMemo`. The model's deps include `context`, so any option change rebuilds it.
3. All-day lane: `VResourceSplitter.splitProps({ ...splitProps.allDay, resourceDayTableModel })` → per key a `DaySeriesSlicer` kept in a ref map (`:78-92`) → `sliceProps(split, dateProfile, nextDayThreshold, context, daySeries)` → `ResourceDayTableJoiner.joinProps(slicedByKey, model)` → `SlicedProps<DayGridRange>` in view-column space.
4. Timed lane: the same with `DayTimeColsSlicer` (`dayRanges`) and `ResourceDayTimeColsJoiner`, then `useTimedSegsByCol(joined, model.colCount)`.
5. Now indicator (`:139-151`): `timedResourceSlicers[''].sliceNowDate(...)` (new every render) → `joiner.expandSegs` → `showDot` from `dateFirstCols`/`cols[col].dateI` → `organizeSegsByCol` (no memo). So with `nowIndicator` on, every `TimeGridCol` gets a new `nowIndicatorSegs` array on every view render and re-renders (its `memo` never holds). The phase-1 count baseline has `nowIndicator: true`.
6. Header: `buildResourceRowConfigs(model, …)` (`useMemo`). Hits: `isHitComboAllowed = useStableCallback` over `model.isHitComboAllowed(hit0, hit1, dayRanges.length === 1)`.
7. `<TimeGridLayout cells={model.cols} …>`; `eventSelection = allDayJoined.eventSelection || splitProps.timed.eventSelection`.

`ResourceDayGridView` is the same with one lane: `useDayGridViewData` → `dayCols` from `cellRows[0]` (`buildDayGridCols`, civil-day ranges) → model built *with* the `dayTableModel` (so `model.cells` is 2D) → `VResourceSplitter` + `DayTableSlicer` per key (`dayTable` as the extra arg, so `DayGridRange.start/end` are column-in-row indices) → `ResourceDayTableJoiner` → `<DayGridLayout cellRows={model.cells} …>`. Per-date filtering only when `colCount > 1 && rowCount === 1` (`:58`).

`DayGridView`: `DayTableSlicer.sliceProps(props, …, dayTableModel)` straight into `DayGridLayout`. `TimeGridView`: `AllDaySplitter` → `DaySeriesSlicer` + `DayTimeColsSlicer` → `useTimedSegsByCol`.

### 1.3 The joiner's expansion rules (must be reproduced exactly)

For a seg sliced under key K (a resource id) or `''` (no resource), where "keyed columns" are columns that belong to a resource and "placeholder columns" are the inert ones (`resourceI = -1`; in the resourceless model, *every* column):

| Category | key K | key `''` |
|---|---|---|
| fg events | K's columns | nowhere (also nowhere in the resourceless model, `VResourceJoiner.ts:37`) |
| bg events | K's columns | every keyed column and every placeholder (once each) |
| business hours | K's columns (the resource's own BH, or the calendar's when the resource has none, `event-splitting.ts:52`) | placeholders only |
| date selection | K's columns | every keyed column and every placeholder |
| drag / resize segs | K's columns | every keyed column, never placeholders; the whole state is `null` unless some *keyed* interaction exists (`:168`) |
| event selection | kept if the instance is in K's subset | kept if the instance is in the `''` subset; first non-empty wins in key order then `''` |

Multi-row daygrid: a seg's `[start, end)` in column-in-row space is mapped by `computeColRanges`, which splits at group boundaries and at missing (filtered) columns, with `isStart = dateI === dateStartI`, `isEnd = dateI === dateEndI - 1` per piece, AND-ed with the seg's own flags.

The standard views have no `''` distinction: fg, bg, BH, selection and interactions all render in every column, and an interaction renders whenever it exists.

### 1.4 Where identity is created and preserved, and which hooks depend on it

- **`EventRenderRange` objects** are created inside `sliceEventStore`, called from `Slicer._sliceEventStore` (memoized on `(eventStore, eventUiBases, dateProfile, nextDayThreshold, ...extraArgs)`), `_sliceInteraction` (on `(interaction, eventUiBases, dateProfile, nextDayThreshold, ...extra)`) and `_sliceBusinessHours` (on `(businessHours, dateProfile, nextDayThreshold, context, ...extra)`); `_sliceDateSpan` (on `(dateSelection, dateProfile, nextDayThreshold, eventUiBases, context, ...extra)`). In the resource views the per-key `eventStore`/`eventUiBases` come from the splitter's memoized fields, which all rebuild when the whole store (or bases) changes. So the **effective granularity is "per view, per category"**: fg segs and their `eventRange`s are the same objects across renders until the event store, the UI bases, the date profile, `nextDayThreshold`, the day series/ranges or (resource views) the table model changes.
- **Seg arrays** come out of the slicer memos (standard) or the joiner memos (`(model, ...sets)`, premium). The joiner creates **new seg objects** whenever it recomputes, even when a seg is unchanged.
- **Who depends on it:**
  - `DayGridRows.tsx:72-83`: `useMemo` over `splitSegsByRow`/`splitInteractionByRow` keyed on the arrays. `DayGridRow` is `memo`; its `sortEventSegs` `useMemo` (`:187`) keys on `props.fgEventSegs`. `DayGridCell` is `memo` but its `fills`/`segs`/`fg` props are rebuilt every row render, so a row render re-renders its cells regardless.
  - `useTimedSegsByCol` → `TimeGridCols` (`memo`) → `TimeGridCol` (`memo` on the per-column arrays; `sortEventSegs` `useMemo` on `fgEventSegs`).
  - `ForegroundEvent` (`common/events.tsx:76`) and `BgEvent` (`common/bg-fill.tsx:25`) are `memo` with shallow props: a new `eventRange` object re-renders them and re-runs every `*Class` hook (`eventClass`, `rowEventClass`, `columnEventClass`, `eventInnerClass`, …) and `generateClassName`. `*Content` hooks are additionally guarded by `CustomContent`'s shallow `renderProps` compare (`content-inject/CustomContent.tsx:169`), with `event: EventImpl` memoized on `def`/`instance` (`events.tsx:192`). **So `eventRange` identity governs the `*Class` counts, and `def`/`instance` identity governs the `*Content` counts.** Phase 7 saw exactly this: keying the day columns on the date profile dropped `timeGridWeek/drag` event class hooks from 111 to 27.
  - `getDayGridSegKey` (`instanceId:start`), `getSliceKey`, `buildEventRangeKey` and `getDayGridPrintSliceKey` are value keys (DOM `key`s and height-map keys), not identity. They must keep producing the same strings, since they decide element reuse and `*DidMount`/`*WillUnmount` counts.
  - Column/cell objects: `model.cols`/`cells` are `useMemo`'d with the model; `DayGridCell`'s `renderProps` `useMemo` (`DayGridCell.tsx:116`) and `TimeGridCol`'s props key on `cell.renderProps`/`attrs`/`dateSpanProps` identity. Header cells (`DayGridHeaderCell`, `memo`) key on the tiers' `renderProps` objects.
- **When identity breaks today** (and counts are what they are): any store change rebuilds every seg of every category in that view (add-event); any option change rebuilds the resource model (its `useMemo` has `context`) and therefore every joined seg; the now indicator (above) rebuilds its segs every render.

### 1.5 Consumers that read the model's columns

- Hits: `DayGridRows.queryHit` (`:111`) reads `cellRows[row][col]` (`isInert` → `null`, `date`, `dateSpanProps`); `TimeGridCols.queryHit` (`:56`) and `TimeGridAllDayLane.queryHit` (`:39`) read `cells[col]`. `isHitComboAllowed` flows through `useHitTarget` to `interactions/hit-target.ts:19`. Premium's `transformDateSelectionJoin` (`resource/DateSelecting.ts`) and `massageEventDragMutation` (`resource/EventDragging.ts`) read `hit.dateSpan.resourceId`, which comes from `dateSpanProps`.
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
- One **slicing pass** per lane that maps each event range straight to view columns. No per-key
  store subsets, no per-key slicer instances, no rejoin. The resource dimension enters through a
  small **keying** object (which keys a def or span belongs to, per-key UI and business hours, and the
  `''` expansion rules of §1.3).
- **Pure functions, memoized at the call site** with `useMemo` on the same inputs today's `memoize`
  fields compare, so identity granularity is unchanged (same or fewer rebuilds, never more).
- Seg shapes stay: `DayGridRange & EventRangeProps` and `TimeGridRange & EventRangeProps`, with the
  same `isStart`/`isEnd` semantics and the same key strings. The layouts, rows, columns, cells,
  more-links, popovers and hit code don't change.

### 2.2 The column model

New directory `standard/packages/preact/src/common/day-table/` (files: `model.ts`, `keying.ts`,
`slice.ts`, `day-grid-segs.ts`, `time-grid-segs.ts`, `now-indicator.ts`, `useDayTableSegs.ts`).
`DaySeriesModel` moves in as `day-series.ts` (a plain function, §2.9).

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
  // the date dimension
  daySeries: DaySeries         // §2.9
  dayCols: DayCol[]            // one per date column (dateI space). computeHasEventsByDate reads these
  rowCount: number
  colCount: number             // view columns per row
  // the view columns
  cols: DayTableColumn[]       // colCount long, in render order
  groups: DayTableColumnGroup[]
  cellRows: DayTableCell[][]   // rowCount × colCount. DayGridLayout, hits and scrolling read these
  headerDates: DateMarker[]    // cellRows[0] dates (SingleMonth, DayGridView headers)
  entityKeys: string[]         // ordered keys that own columns ('' excluded). [] for plain views
  colsByEntityKey: { [key: string]: number[] }   // view-column indices per key, ascending
  keylessCols: number[]        // columns with entityKey '' (all of them in plain and resourceless models)
  dateFirstCols: number[]      // first view column per dateI (now indicator's showDot)
  isInert: boolean             // every column inert (premium resourceless); plain views: false
}
```

`colLookup(model, dateI, key) → colI | -1` is a module function over `colsByEntityKey` (or a
`Map<string, number>` keyed `dateI:key` built alongside; pick whichever reads better, it's internal).

Builders:

```ts
// standard
export function buildDayTableModel(
  dateProfile: DateProfile,
  hiddenDays: HiddenDays,        // phase 10's value object (§2.9)
  dateEnv: DateEnv,
  config: {
    breakOnWeeks: boolean        // DayGrid: /year|month|week/.test(currentRangeUnit)
    majorUnit?: string           // DayGrid single-row: computeMajorUnit minus 'day'; TimeGrid: none
    slotRange?: DayColSlotRange  // TimeGrid: dateProfile (slotMinTime/slotMaxTime)
  },
): DayTableModel
```

It produces exactly today's `DayTableModel.cellRows` (`DayTableModel.ts:66-99`) and
`buildDayColsFromSeries` columns (`day-cols.ts:48`), with `entityKey: ''`, one group, `entityKeys:
[]`, `keylessCols: all`. `headerDates` as today.

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
is dropped" rule, the "every column would be a placeholder → resourceless" fallback, the per-row
`cells` with a fresh `ResourceApi` per cell, key strings (`resourceId:iso`), `attrs`, `className: ''`,
`dateSpanProps`, `isInert`/`aria-disabled`: all ported line for line from
`AbstractResourceDayTableModel.ts`, `DayResourceTableModel.ts`, `ResourceDayTableModel.ts`,
`ResourcelessDayTableModel.ts` and `resource-table-model.ts`. The resourceless case sets
`entityKeys: []`, `isInert: true`, every column `entityKey: ''`.

Note `DayTableCell` and `DayTableColumn` stay distinct: cells are per row (a multi-row resource
daygrid rebuilds the resource fields per row, `AbstractResourceDayTableModel.ts:147-181`), columns are
per view. `cellRows[0]` and `cols` describe the same columns, as today's `cells` and `cols` do.

### 2.3 Keying

```ts
// keying.ts
export interface DayTableKeying {
  keysForEventDef(def: EventDef): string[]      // plain: [''], premium: def.resourceIds or ['']
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
  interaction: 'all' | 'keyedOnly'   // plain: all (and the state is non-null whenever it exists). resource: keyed columns, state null unless a keyed interaction exists
}

export const PLAIN_KEYING: DayTableKeying  // a module constant: stable identity for memo deps
// premium: buildResourceKeying(resources: Resource[]): DayTableKeying, useMemo on `resources`
```

Per-key event UI bases are compiled once per key per `eventUiBases` change:
`buildEventUiBasesByKey(eventUiBases, keying, keys) → { [key]: EventUiHash }`, reproducing
`buildEventUiForKey` (`event-splitting.ts:164`): `{ '': combineEventUis([bases[''], uiByKey[key]]),
...individual }`. For the plain keying it returns `{ '': eventUiBases }` unchanged (same object, so
nothing downstream changes for the standard views).

### 2.4 The slicing pass

```ts
// slice.ts
export interface DayTableLane {            // what today's extra args and forceDayIfListItem encode
  kind: 'dayGrid' | 'timeGrid'
  // 'dayGrid': all-day coordinates (rows and columns), nextDayThreshold applies, list-item events are one day
  // 'timeGrid': timed coordinates (column + startDate/endDate), nextDayThreshold null, active range widened by slot times
  allDayFilter?: 'allDay' | 'timed'        // TimeGrid only: AllDaySplitter's def/span rules (§1.1). undefined: no filter (DayGrid)
}

export function sliceDayTableEvents(      // fg + bg, one pass over the store
  eventStore: EventStore,
  eventUiBasesByKey: { [key: string]: EventUiHash },
  keying: DayTableKeying,
  model: DayTableModel,
  lane: DayTableLane,
  dateProfile: DateProfile,
  nextDayThreshold: Duration | null,
): { fg: Seg[], bg: Seg[] }

export function sliceDayTableBusinessHours(businessHours, keying, model, lane, dateProfile, nextDayThreshold, context): Seg[]
export function sliceDayTableDateSelection(dateSelection, eventUiBasesByKey, keying, model, lane, dateProfile, nextDayThreshold, context): Seg[]
export function sliceDayTableInteraction(interaction, eventUiBasesByKey, keying, model, lane, dateProfile, nextDayThreshold): EventSegUiInteractionState<R> | null
export function resolveDayTableEventSelection(eventSelection, eventStore, keying, model): string
export function sliceDayTableNowIndicator(nowDate, model, dateProfile, datesAboveResources): (TimeGridRange & { showDot })[]   // now-indicator.ts
```

where `Seg` is `DayGridRange & EventRangeProps` for the `dayGrid` lane and `TimeGridRange &
EventRangeProps` for `timeGrid`.

How `sliceDayTableEvents` reproduces today's results without subsets:

1. Iterate the store once. For each def: `keys = keysForEventDef(def)`; apply the lane's all-day
   filter (`AllDaySplitter` rules: timed def → timed lane; all-day bg def → both lanes; all-day fg →
   all-day lane). For each key, compile the UI with that key's bases (`compileEventUi(def,
   eventUiBasesByKey[key])`) and build the `EventRenderRange`s exactly as `sliceEventStore` does
   (framing range from `computeActiveRange(dateProfile, lane.kind === 'dayGrid')`,
   `nextDayThreshold` conversion, `isStart`/`isEnd`, `inverse-background` grouping per key).
   **Implementation:** extract `sliceEventStore`'s per-def body into
   `sliceEventDefRanges(def, instances, ui, framingRange, nextDayThreshold, inverseBgState)` and have
   both `sliceEventStore` (unchanged signature, used by list, timeline and the interaction paths) and
   the new pass call it. The inverse-background bookkeeping (`inverseBgByGroupId`,
   `inverseBgByDefId`, `defByGroupId`, `event-rendering.ts:50-52`) becomes a small state object
   created per key. A def with several resource keys yields one `EventRenderRange` per key with that
   key's `ui`, as today (`resource-event-styling.ts` locks the colors).
2. Map each range to view columns for its key: `mapRangeToDayGridSegs(range, key, model, keying,
   category)` / `mapRangeToTimeGridSegs(...)`:
   - **dayGrid:** `daySeries.sliceRange(range)` → `buildDayGridRanges(coordRange, model.colCount)`
     (rows, column-in-row `start`/`end`) → for each row piece, expand `[start, end)` over the
     **target columns** of the key (below) with `computeColRanges`' merging rule (adjacent view
     columns of the same `groupI` merge; a missing column breaks; `isStart`/`isEnd` per piece
     AND-ed). For the plain model that collapses to the identity mapping, so `DayGridView` gets the
     same `{ row, start, end }` as today.
   - **timeGrid:** for each target column of the key, `intersectRanges(range, col.range)` →
     `{ col, startDate, endDate, isStart, isEnd }` (`DayTimeColsSlicer.ts`). A key with no column
     for that `dateI` yields nothing (today's `-1`).
   - **Target columns** per `(key, category)` from the keying rules (§1.3): key K →
     `colsByEntityKey[K]`; `''` → `keylessCols`, all columns, or none per `keylessRules`.
     For `'' → all` the expansion order must match the joiner's (resource by resource in
     `entityKeys` order, then placeholders) so sort order of equal segs is unchanged; `sortEventSegs`
     is stable, so the input order matters for ties (locked by snapshots).
3. Output order: today's fg array is in the joiner's order: for each resource in order, that
   resource's segs (in that key's slicer order, which is store order), then its `''` expansions; then
   placeholders' `''` segs. The single pass naturally produces store order grouped by def, not key
   order. **Sort the output by `(keyOrder, storeOrder)` to match**, or prove the consumers don't
   depend on it. They do: `sortEventSegs` sorts by `eventOrder` specs and is stable, so ties keep
   input order, which affects DOM order for events with equal start/duration/title. Keep the
   joiner's order (cheap: segs are collected per key into buckets, then concatenated in
   `['' expansions per entity...]` order). Pin this with the `default`/`dates-above-resources`
   snapshots and a new "two equal events in two resources" fixture (§4.4).
4. `forceDayIfListItem` applies in the dayGrid lane (`slicing-utils.ts:235`).

`sliceDayTableBusinessHours`, `...DateSelection`, `...Interaction` mirror `_sliceBusinessHours`,
`_sliceDateSpan` (with `intersectDateSpan`'s instant stripping) and `_sliceInteraction`, using the
keying's rules for their category. Interaction: segs from `interaction.mutatedEvents` keyed by the
mutated defs' keys; `affectedInstances` is the union of all `affectedEvents.instances` as today
(`VResourceJoiner.ts:155`: merged across keys; plain: the whole hash); `isEvent` OR-ed. For the
resource rules the result is `null` unless some mutated or affected def has a key in `entityKeys`
(today's `anyInteractions`, which is set by the existence of a per-key split state, which exists when
either the affected or the mutated store has that key, `event-splitting.ts:141-157`).

`resolveDayTableEventSelection`: `''` unless the instance exists and its def has no keys (`''`) or
at least one key in `entityKeys`; TimeGrid combines the two lanes as today
(`ResourceTimeGridView.tsx:209`).

### 2.5 The hook

```ts
// useDayTableSegs.ts
export function useDayTableSegs<L extends DayTableLane>(
  props: SliceableProps,          // the view's eventStore, eventUiBases, businessHours, dateSelection, eventDrag, eventResize, eventSelection
  keying: DayTableKeying,
  model: DayTableModel,
  lane: L,
  dateProfile: DateProfile,
  nextDayThreshold: Duration | null,
  context: CalendarContext,
): SlicedProps<SegFor<L>>
```

Internally seven `useMemo`s with exactly today's dependency sets:

| Output | deps (today's memoize args, see §1.4) |
|---|---|
| `eventUiBasesByKey` | `eventUiBases, keying` |
| `fg`, `bg` (one memo, as `_sliceEventStore`) | `eventStore, eventUiBasesByKey, model, lane, dateProfile, nextDayThreshold` |
| `businessHourSegs` | `businessHours, keying, model, lane, dateProfile, nextDayThreshold, context` |
| `dateSelectionSegs` | `dateSelection, eventUiBasesByKey, model, lane, dateProfile, nextDayThreshold, context` |
| `eventDrag`, `eventResize` | `interaction, eventUiBasesByKey, model, lane, dateProfile, nextDayThreshold` |
| `eventSelection` | `eventSelection, eventStore, keying, model` |

`lane` is a module constant per view (`DAY_GRID_LANE`, `TIME_GRID_ALL_DAY_LANE`, `TIME_GRID_TIMED_LANE`),
`keying` is `PLAIN_KEYING` or a `useMemo` on `resources`. The returned `SlicedProps` object is new
each render, as today's is; consumers take its fields.

Why identity is at least as stable as today:

- Standard views: today's fg memo depends on `(eventStore, eventUiBases, dateProfile, nextDayThreshold, dayTableModel | daySeries | dayRanges)`; the new one on `(eventStore, eventUiBasesByKey = eventUiBases itself for PLAIN_KEYING, model, lane const, dateProfile, nextDayThreshold)`. `model` is `useMemo`'d on `(dateProfile, hiddenDays, dateEnv, config)`, the same deps `dayTableModel`/`daySeries`/`dayCols` have (`useDayGridViewData.ts:21`, `useTimeGridViewData.ts:32-42`). Same granularity.
- Resource views: today the joined fg depends on `(model, every key's eventStore subset, bases subset, dateProfile, nextDayThreshold, daySeries)`, and every subset rebuilds when the store or bases change. The new memo depends on `(eventStore, eventUiBasesByKey, model, dateProfile, nextDayThreshold)`, where `eventUiBasesByKey` rebuilds on `(eventUiBases, keying)` and `keying` on `resources`. `model` already depends on `resources`. Same granularity. The joiner's "new seg objects on recompute" quirk disappears, which can only lower counts.
- A **drag**: `eventDrag` changes each move → only the interaction memo recomputes; fg/bg/BH/selection arrays and their `eventRange`s are untouched, as today. `TimeGridCol`/`DayGridRow` re-render (their `eventDrag` prop changed) but every unaffected `ForegroundEvent` skips through `memo`.
- **Measurement re-renders** (`DayGridRow`'s `setRenderCount`, `useMeasuredState` in layouts) don't reach the view body, so nothing recomputes, as today.
- **Now ticks** re-render the view body with the same props: every memo holds. The now-indicator segs are rebuilt (today too); §2.7 makes them a `useMemo` on `(nowDate, model, dateProfile, datesAboveResources)`, which can only lower counts.

### 2.6 Views after the change

```tsx
// DayGridView body
const model = useDayGridModel(dateProfile)                     // was useDayGridViewData's dayTableModel; same memo deps plus hiddenDays
const segs = useDayTableSegs(props, PLAIN_KEYING, model, DAY_GRID_LANE, dateProfile, options.nextDayThreshold, context)
<DayGridLayout cellRows={model.cellRows} headerTiers={...} {...segs} />

// TimeGridView body
const model = useTimeGridModel(dateProfile)                     // slot ranges, no major unit
const allDay = useDayTableSegs(props, PLAIN_KEYING, model, TIME_GRID_ALL_DAY_LANE, ...)
const timed = useDayTableSegs(props, PLAIN_KEYING, model, TIME_GRID_TIMED_LANE, ..., null)
const timedByCol = useTimedSegsByCol(timed, model.colCount)
const nowSegsByCol = useNowIndicatorSegsByCol(nowDate, model, dateProfile, enabled)   // §2.7
<TimeGridLayout cells={model.cols} ... />

// ResourceTimeGridView body
const plainModel = useTimeGridModel(dateProfile)
const resources = ...(unchanged filtering and ordering)
const hasEventsByDate = ...(unchanged, reads plainModel.dayCols)
const model = useMemo(() => buildResourceDayTableModel(plainModel, resources, options.datesAboveResources, hasEventsByDate, context), [...])
const keying = useMemo(() => buildResourceKeying(resources), [resources])
const allDay = useDayTableSegs(props, keying, model, TIME_GRID_ALL_DAY_LANE, ...)
const timed = useDayTableSegs(props, keying, model, TIME_GRID_TIMED_LANE, ..., null)
...
eventSelection={allDay.eventSelection || timed.eventSelection}
isHitComboAllowed={useStableCallback((h0, h1) => isResourceHitComboAllowed(h0, h1, model.dayCols.length === 1))}
```

`AllDaySplitter` goes away: `useTimeGridViewData` no longer returns `splitProps`; the lane filter
does the same per-def classification inside the pass. `eventSelection` for the timed lane today is
`splitProps.timed.eventSelection` = "the instance is in the timed subset" =
`resolveDayTableEventSelection` with the lane filter applied (the def must be timed, or all-day bg).
Make the resolver lane-aware for TimeGrid.

The header builders keep their shapes. `buildDateRowConfigs` takes `model.headerDates` as before;
`buildResourceRowConfigs(model, …)` reads `model.groups` (`group.date`, `group.entity as Resource`,
`group.cols`), `model.entityKeys.length`, `model.dayCols.length` and `datesAboveResources` (passed
in, no longer stored on the model). Its output, keys and `colSpan`s don't change.

### 2.7 Now indicator

`sliceDayTableNowIndicator(nowDate, model, dateProfile, datesAboveResources)`: the 1 ms span
intersected with each column's range (every column, like `expandSegs`' `''` rule: keyed and
placeholder), `showDot` as `ResourceTimeGridView.tsx:146-148` (plain model: `dateFirstCols[dateI]
=== col` is always true, so `showDot: true`, matching the standard path where `showDot` is undefined
and `TimeGridCol` defaults it to `true`). `useNowIndicatorSegsByCol` memoizes it and its
`organizeSegsByCol` on `(nowDate, model, dateProfile, datesAboveResources, colCount, enabled)`. The
seg carries no usable `eventRange` today (`{}` bases); keep it absent. Lowers counts when the now
indicator is on and anything else re-renders the view; snapshots unchanged.

### 2.8 Hits

Unchanged: `cells`/`cellRows` keep `isInert`, `date`, `dateSpanProps`. Premium's
`isResourceHitComboAllowed(hit0, hit1, allowAcrossResources)` is the method from
`AbstractResourceDayTableModel.ts:142` as a function; `allowAcrossResources` stays `dayCount === 1`
(§5, question 3).

### 2.9 Where 7b touches phase 10's output

Phase 10 replaces `DateProfileGenerator.isHiddenDay`/`skipHiddenDays`/`trimHiddenDays` with a
hidden-days value object (`isHidden`, `skip`, `trim`), makes `buildDateProfile` pure and keeps a
`DateProfileGenerator` facade on `ViewContext` at most for compatibility. 7b consumes hidden days in
exactly one place and takes them as an explicit input:

- `common/DaySeriesModel.ts:35` (`dateProfileGenerator.isHiddenDay(date)`) becomes
  `buildDaySeries(range: DateRange, hiddenDays: HiddenDays): DaySeries` in
  `common/day-table/day-series.ts` (a plain object `{ dates, cnt, sliceRange }` or a class with no
  generator reference; `sliceRange` stays as is). If phase 10 exposes an `isHidden(date)` function
  rather than an object, take `isHidden: (date: DateMarker) => boolean`. Nothing else in the day
  tables reads hidden days.
- `buildDayTableModel(dateProfile, hiddenDays, dateEnv, config)` takes it through. The hooks
  (`useDayGridModel`, `useTimeGridModel`) read it from wherever phase 10 puts it (the date profile
  itself, if phase 10 attaches `hiddenDays` to `DateProfile`, which would be simplest; otherwise the
  context facade) and pass it down. The memo deps are `(dateProfile, hiddenDays, dateEnv)`, replacing
  today's `(dateProfile, dateProfileGenerator, dateEnv)`.
- `SingleMonth.tsx:46` and `useTimeGridViewData.ts:33` are the other two generator readers in this
  pipeline; both go through the new builders.
- `computeMajorUnit(dateProfile, dateEnv)` / `isMajorUnit` (`DateProfileGenerator.ts`) stay as they
  are after phase 10 (pure functions of the profile); 7b keeps calling them for `isMajor`.
- `TableDateProfileGenerator`/`buildDayTableRenderRange` are untouched: 7b consumes
  `dateProfile.renderRange`, `activeRange`, `currentRangeUnit`, `slotMinTime`, `slotMaxTime` only.
- If phase 10 lands with the facade still on `ViewContext`, the hooks can read
  `context.dateProfileGenerator.hiddenDays` (or equivalent) during the transition; the pure
  functions never see the generator either way.

### 2.10 What phase 11 will want

- The model, keying, slicing pass and now-indicator slicing are pure functions of explicit inputs
  (`dateProfile`, hidden days, `dateEnv`, options values, resources, stores, `context` only for
  `ResourceApi` construction and `fabricateEventRange`/`expandRecurring`). Phase 11 can call them in a
  render-time derivation or lift them into store-derived data without change; the hooks are the only
  React layer and are thin `useMemo` wrappers.
- Narrow contexts: the hooks read `options.nextDayThreshold`, `options.datesAboveResources`,
  `options.resourceOrder`, `options.filterResourcesWithEvents`, `options.nowIndicator`, `dateEnv` and
  the hidden days. List them as the hooks' inputs explicitly (parameters, not `useViewContext()`
  inside the pure code), so phase 11 can swap `useViewContext()` for `useViewOptions()`/`useDateEnv()`
  at the call sites only.
- The remaining `context` dependencies worth flagging to phase 11/12: `new ResourceApi(context,
  resource)` per cell (phase 12's stable wrappers), `fabricateEventRange(span, bases, context)` and
  `expandRecurring(businessHours, range, context)` (both read `dateEnv`/plugin hooks through context).
  Keying the model on `context` is what makes any option change rebuild every seg in the resource
  views today (§1.4); 7b keeps that (behavior identity), phase 11/12 can narrow it.

---

## 3. Steps, in landing order

Each step: targeted Karma during work, then both packages' full suites in both runtimes, a DOM
snapshot compare against the baseline recorded before step 1 (all fixtures, including the new ones
from step 0), and a count compare (no count up). Sol reviews each step (roadmap ground rules).

### Step 0: behavior locks and baselines (no production change)

- New specs (§4.2), new snapshot fixtures and count scenarios (§4.4). Run them on today's code;
  they must pass (characterization) except where they document a known quirk as a pending spec.
- Record `baseline` snapshots and counts in both runtimes after phase 10 lands (the baseline must be
  from the commit 7b starts on).

### Step 1: the standard pipeline (DayGrid, TimeGrid, SingleMonth)

Changes:

- Add `common/day-table/` (§2.2-2.5, 2.7) with `PLAIN_KEYING`, the three lane constants, the hooks
  `useDayGridModel`, `useTimeGridModel`, `useDayTableSegs`, `useNowIndicatorSegsByCol`.
- Extract `sliceEventDefRanges` from `sliceEventStore` (`component-util/event-rendering.ts:49`);
  `sliceEventStore` keeps its signature and output (list, timeline, validation untouched).
- Move `DaySeriesModel` to `day-table/day-series.ts` taking hidden days (§2.9). Keep the class name
  exported from `protected-api` as an alias until step 2 removes the premium readers; premium reads
  `daySeries` only through `useTimeGridViewData`, which step 1 still returns for compatibility.
- `DayGridView`, `TimeGridView`, `SingleMonth` switch to the hooks. `useDayGridViewData` keeps
  returning a `dayTableModel` with today's fields (`rowCount`, `colCount`, `cellRows`, `headerDates`,
  `daySeries`) because premium reads them until step 2; make `DayTableModel` the new interface and
  keep the class-era fields on it (the new model has them all). `useTimeGridViewData` keeps
  returning `daySeries`, `dayCols`, `dayRanges`, `splitProps` for premium until step 2 (the
  `AllDaySplitter` instance survives there only).
- Nothing deleted yet. `DayTableSlicer`, `DaySeriesSlicer`, `DayTimeColsSlicer`, `AllDaySplitter`
  stay exported for premium.

Verification focus: `dayGridMonth`/`dayGridWeek`/`timeGridWeek`/`timeGridDay`/`multiMonthYear`
fixtures in every variant (default, rtl, print, pannable, more-links, popover, week-numbers,
now-indicator, selection, hidden-days, render-hooks, mid-drag-rtl), counts for `dayGridMonth/*` and
`timeGridWeek/*`, the standard suite (`event-render/*`, `event-drag/*`, `event-resize/*`,
`date-selection/*`, `view-render/*`, `render-hooks/*`, `legacy/*`).

Risks: the `AllDaySplitter` rule for all-day background events (both lanes); inverse-background
grouping when extracted; the now-indicator `showDot` default; `forceDayIfListItem`; `SingleMonth`'s
`DayTableSlicer` per month becoming a per-month hook call (same memo granularity per month);
`eventSelection` for the timed lane (`splitProps.timed.eventSelection`).

### Step 2a: premium column model and ResourceTimeGridView

Changes:

- `resource/common/resource-day-table.ts`: `buildResourceDayTableModel` (§2.2),
  `buildResourceKeying` (§2.3), `isResourceHitComboAllowed` (§2.8). `RESOURCE_KEYLESS_RULES`.
- `resource-daygrid/resource-header-tier.ts` retyped to `DayTableModel`/`DayTableColumnGroup`
  (`datesAboveResources` passed in). Output unchanged.
- `ResourceTimeGridView` onto `useTimeGridModel` + `buildResourceDayTableModel` + `useDayTableSegs`
  (both lanes) + `useNowIndicatorSegsByCol`. Delete its splitter/slicer/joiner state and refs.
- `ResourceDayGridView` still on the old path. To keep it compiling, `buildResourceTableModel` and
  `AbstractResourceDayTableModel` survive this step unchanged (they take the old `DayTableModel`
  fields, which step 1 preserved).
- Delete `ResourceDayTimeColsJoiner.ts`.

Verification focus: `resourceTimeGridDay`/`Week` fixtures (default, rtl, print, pannable,
now-indicator, selection, grouped, dates-above-resources, the new ones), premium `column/agenda-*`,
`column/column-*`, `misc/filterResourcesWithEvents*`, `misc/resource-render-props`,
`misc/resource-event-styling`, `misc/render-hook-contract-resource`, `misc/eventResourceEditable-col`,
`misc/print-scroll-pannable`, the new count scenarios for `resourceTimeGridWeek`.

Risks: the expansion table (§1.3) for `''` segs, especially placeholders; BH precedence; the
interaction `null` rule; seg order for ties (§2.4 step 3); `eventSelection` across lanes;
`showDot`.

### Step 2b: ResourceDayGridView and deletions

Changes:

- `ResourceDayGridView` onto the shared path (one `dayGrid` lane). Multi-row models: the resource
  model's `cellRows` built from the plain model's rows.
- Delete: `VResourceSplitter.ts`, `VResourceJoiner.ts`, `ResourceDayTableJoiner.ts`,
  `AbstractResourceDayTableModel.ts`, `DayResourceTableModel.ts`, `ResourceDayTableModel.ts`,
  `ResourcelessDayTableModel.ts`, `resource-table-model.ts`, `ResourceIndex.ts`. Keep
  `ResourceSplitter.ts` (timeline, validation).
- Standard deletions now that premium no longer reads them: `daygrid/DayTableSlicer.ts`,
  `timegrid/DayTimeColsSlicer.ts`, `timegrid/AllDaySplitter.ts`, the `DayTableModel` class
  (`daygrid/DayTableModel.ts` keeps `DayTableCell`, `DayGridRange`, `buildDayGridRanges`, or they move
  to `day-table/`), `useTimeGridViewData`'s `splitProps`/`dayRanges`/`daySeries` (the hook becomes
  `useTimeGridModel` + `useNow`), `useDayGridViewData`'s model field becomes the new model.
  `common/day-cols.ts`'s `buildDayCols` (unused after this; check `protected-api` consumers) and
  `buildDayColsFromSeries` fold into the model builder. `TableSeg.ts`'s `splitSegsByRow`/
  `splitInteractionByRow` and `TimeColsSeg.ts`'s helpers stay (still used by the rows/columns).
- `Slicer` (`slicing-utils.ts`) loses nothing it still needs for the timeline; `Splitter` stays for
  `ResourceSplitter`. Note both as follow-ups for the timeline (out of scope).
- `protected-api.ts` export list updated (`DayTableSlicer`, `DaySeriesSlicer`, `DayTimeColsSlicer`,
  `AllDaySplitter`, `DayTableModel` class, `DaySeriesModel`, `buildDayCols*` removed; the new model,
  keying, hooks and lane constants added). `@fullcalendar/react`'s `tests/hooks.tsx` imports only
  `useRenderHookEl`/`useReportedSize` from `dist/protected-api`, unaffected.

Verification focus: `resourceDayGridDay`/`Week`/`Month` fixtures, `column/basic-*`,
`column/column-businessHours`, `column/column-structure` (month view, resyncs), the per-date and
placeholder specs' daygrid halves, `misc/resource-render-props` daygrid cases, the new
`resourceDayGridWeek` count scenarios. Plus the whole of both suites again, since the standard
deletions touch exports.

Risks: multi-row + dates-above-resources segment splitting (`computeColRanges` port); hidden days in
resource daygrid (the daySeries clamp is in dateI space, the expansion in view space); `+more` popover
drag to another resource (`basic-event-dnd.ts:58`).

### Step 3 (optional, decide after 2b): finer seg identity

Keep seg and `eventRange` objects for events whose `(def, instance, ui, range, isStart, isEnd)` didn't
change when the store changes (add-event, drag end): a reconciliation pass over the previous result
keyed by `instanceId:key`. Counts can only drop (`eventClass` on `add-event` scenarios). DOM identical.
Not required by 7b; a separate commit with its own count compare, and skipped if the compare shows
anything else moving. See §5, question 6.

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
`destroy.ts`.

### 4.2 New characterization specs (step 0, written against today's code)

Premium, `column/vresource-slicing-rules.ts` (resourceTimeGrid and resourceDayGrid, both
`datesAboveResources` values, `describeValues`), one `it` per row of §1.3:

1. A foreground event with no resource renders nowhere, including in a view with `resources: []`
   (resourceless) and in a placeholder column. (`column-event-render.ts:261-270` covers the
   two-day case with resources; add resourceless.)
2. A background event with no resource renders once per resource column and once per placeholder.
3. Business hours: a resource's own BH in its columns; a resource without BH gets the calendar's;
   placeholders get the calendar's, never a resource's (`placeholders.ts:362-387` covers timeGrid;
   add dayGrid); `businessHours: false` with a resource BH (`column-businessHours.ts:146`).
4. `calendar.select()` without `resourceId` highlights every column (resource and placeholder);
   with `resourceId` only that resource's columns.
5. A drag mirror appears only in the target resource's column; dragging across resources moves the
   mirror (`agenda-event-dnd.ts:23` checks the drop; add a mid-drag DOM assertion). An external drag
   (`agenda-external-dnd.ts`) onto a resource shows a mirror in that column only.
6. `eventSelection`: clicking an event in resource A marks only A's copy selected for a
   multi-resource event (`isSelected` class), and selection survives a re-render.
7. Multi-resource event in dates-above-resources, multi-day, resourceDayGridWeek: one seg per
   (date, resource); resources-above-dates: one continuous span per resource; a hidden day
   (`weekends: false`) inside the span clamps, not breaks, the span in resources-above-dates, and
   drops that date's seg in dates-above-resources.
8. Per-date filtering (`filterResourcesWithEvents`) with a multi-day event whose middle date is
   filtered out for that resource: the span breaks there (`computeColRanges`' missing-column rule).
9. `resourceDayGridMonth` with resources: an event spanning a week boundary renders in both rows,
   under the right resource columns.
10. Equal-sort-order events (same start, duration, title) in two resources render in resource order
    (seg order tie, §2.4 step 3).

Premium, `column/vresource-identity.ts` (count locks, Karma, both runtimes):

- `resourceTimeGridWeek` and `resourceDayGridWeek` with 20 events across 4 resources and
  `eventClass`/`eventContent`/`dayLaneClass`/`dayCellClass` counters: counts after the initial render,
  after `calendar.updateSize()` (a measurement re-render), after a now tick (`nowIndicator: true`,
  jasmine clock advancing a minute), after a drag of one event (`$.simulate('drag')`), and after
  `addEvent`. Assert `toBeLessThanOrEqual(recorded)` with the recorded numbers from today's code
  written into the spec (`// recorded 2026-10-xx on <commit>`). These duplicate the count tool's
  intent but run in CI and in both runtimes without the manual tool.

Standard, `view-render/day-table-slicing.ts`:

1. Hidden days: a timed event whose `nextDayThreshold`-adjusted end lands on a hidden day clamps
   inward with `isEnd` false (`fc-event-end` class absent) in `dayGridWeek` with `weekends: false`.
2. `display: 'list-item'` multi-day event occupies one day in dayGrid (`forceDayIfListItem`), and the
   full span in timeGrid's all-day row? (it also uses `forceDayIfListItem = true` via
   `DaySeriesSlicer`; confirm and lock.)
3. All-day background event renders in both the all-day row and the timed columns of `timeGridWeek`
   (`AllDaySplitter` rule); a timed background event only in the columns.
4. `inverse-background` with a `groupId` across two defs in `timeGridWeek` and `dayGridMonth`
   (the extracted grouping state).
5. A selection clipped by `validRange` loses `instantStartMs` (observable through `select` info?
   if not observable, skip and rely on the pure-function unit test below).
6. `eventSelection` in `timeGridWeek`: selecting an all-day event vs a timed event (the lane
   resolver).

Pure-function unit specs (Karma, importing from `fullcalendar/protected-api`), written in step 1
against the new functions, not characterization: `buildDayGridRanges` and `daySeries.sliceRange`
tables (existing behavior, including the hidden-day clamp cases from `DaySeriesModel.ts:5-9`);
`mapRangeToDayGridSegs` over a hand-built model for every ordering (plain, resources above dates,
dates above resources, resourceless, with a missing column, multi-row); `buildEventUiBasesByKey`
precedence (calendar base, resource ui, individual, def ui: `resource-event-styling.ts` locks the
rendered colors, this locks the compiled `EventUi`).

### 4.3 Mutation checks (run once per step, by hand, not committed)

Each should make a lock fail; if it doesn't, the lock is too weak:

- In `useDayTableSegs`, drop `eventStore` from the fg memo deps (stale segs) → `add-event`
  specs/counts; drop `eventDrag` → mid-drag assertions.
- Make the fg memo depend on `props` (recomputes every render) → `vresource-identity.ts` counts
  after `updateSize()` and the now tick go up.
- Set `RESOURCE_KEYLESS_RULES.fg` to `'all'` → rule 1; `businessHours` to `'all'` → rule 3
  (placeholder gets a resource's BH when a resource's BH is calendar-equal? no: use distinct hours).
- Swap `isStart`/`isEnd` AND-ing in the daygrid mapper → rule 7 and `fc-event-start/end` snapshots.
- Merge columns across groups in the daygrid mapper (ignore `groupI`) → rule 7 (dates above
  resources) and the `dates-above-resources` snapshot.
- Change the output order to store order → rule 10 and the `default` snapshots with equal events.
- Build the model with `context` dropped from its deps → nothing should fail (it is only behavior
  identity, not correctness) — a reminder that this is a decision (§5, question 5), not a lock.

### 4.4 DOM snapshot fixtures and count scenarios

Existing fixtures that matter (`dom-snapshot/fixtures.ts`): all `RESOURCE_TIMEGRID_VIEWS` and
`RESOURCE_DAYGRID_VIEWS` in `default`, `rtl`, `print`, `pannable`, `now-indicator` (timegrid);
`selection` (`resourceTimeGridDay`, resource `b`); `grouped` (`resourceTimeGridDay`);
`dates-above-resources` (`resourceTimeGridWeek`, `resourceDayGridWeek`); and every standard
`dayGrid*`/`timeGrid*`/`multiMonthYear` variant (`more-links`, `popover`, `week-numbers`,
`hidden-days`, `render-hooks`, `mid-drag-rtl`).

Add in step 0:

- `dates-above-resources`: add `resourceDayGridMonth` and `resourceTimeGridDay`.
- `more-links` and `popover`: add `resourceTimeGridWeek`, `resourceDayGridWeek` (resource in the
  popover's render props).
- `hidden-days`: add `resourceDayGridWeek`, `resourceTimeGridWeek`, `resourceDayGridMonth`.
- `selection`: add `resourceDayGridWeek`; a `selection-no-resource` variant for `resourceTimeGridDay`
  and `resourceDayGridWeek` (no `resourceId`: every column highlighted).
- `mid-drag` for `resourceTimeGridWeek` and `resourceDayGridWeek` (drag `Timed 1` toward resource
  `b`'s column), LTR.
- `filtered-per-date`: `resourceTimeGridWeek` and `resourceDayGridWeek` with
  `filterResourcesWithEvents: true` (the fixture events already leave gaps), both orderings.
- `resourceless`: `resourceTimeGridDay`, `resourceDayGridWeek` with `resources: []` and the fixture
  events (inert columns, BH and bg visible, no fg).
- `business-hours`: `resourceTimeGridDay` with `businessHours: true` and resource `b` overriding
  (`businessHours: { startTime: '10:00', endTime: '14:00' }`), and `resourceDayGridWeek`.
- `multi-resource-ties`: `resourceTimeGridDay` with two events of equal start/end/title in resources
  `a` and `b` and one event in both (`resourceIds: ['a', 'b']`).
- Standard: `list-item-multiday` (`dayGridMonth`, `eventDisplay: 'list-item'` with the multi-day
  event), `inverse-bg` (`timeGridWeek` and `dayGridMonth`, two `inverse-background` events sharing a
  `groupId`).

Count scenarios (`dom-snapshot/counts.ts`): add `resourceTimeGridWeek` and `resourceDayGridWeek` to
`VIEWS` (the six actions apply; `drag` already handles vertical vs horizontal by view type prefix,
extend the check to `resourceTimeGrid`). Add a `datesAboveResources` pair
(`resourceTimeGridWeek-dates-above` with the option) and a `now-tick` action for the timegrid views
(`nowIndicator` is already on in the base options; advance the clock if the scenario runner supports
it, otherwise skip and rely on `vresource-identity.ts`).

Record the baseline with all of these before step 1, in both runtimes.

---

## 5. Risks and open questions

1. **Resourceless resource views render no foreground events** (`VResourceJoiner.ts:37`, §1.3). An
   event with no `resourceId` in a `resourceTimeGridDay` with `resources: []` renders nothing, while
   its background twin renders. Looks like an accident of the joiner, but
   `filterResourcesWithEvents-placeholders.ts:271-316` ("is inert in a resourceless view") locks the
   inert part. **Recommendation:** keep it (behavior identity), lock it with rule 1, and list it as
   a candidate behavior change for a later release.
2. **Non-resource interactions are dropped unless a resource interaction exists**
   (`VResourceJoiner.ts:168-171`). Reachable only by dragging between calendars or an external
   element onto a placeholder (its `dateSpan` has no `resourceId`). **Recommendation:** keep, lock
   with rule 5's placeholder case, note as a candidate change.
3. **`allowAcrossResources = dayCount === 1`** (`ResourceDayGridView.tsx:126`,
   `ResourceTimeGridView.tsx:175`): in a one-day view a selection may cross resource columns, and
   `transformDateSelectionJoin` then reports the first hit's resource. `agenda-selection.ts` only
   tests three-day views. **Recommendation:** keep and lock with a one-day case in rule 4 (select
   across `a` and `b` in `resourceTimeGridDay`: `select` fires with `resource.id === 'a'`), and ask
   whether this was meant to be "across *dates* is allowed when there is only one date".
4. **Seg order for sort ties** (§2.4 step 3). The single pass must bucket by key to reproduce the
   joiner's order. **Recommendation:** do it; it is cheap, and rule 10 plus the `multi-resource-ties`
   fixture lock it.
5. **The resource model keys on `context`** so every option change rebuilds every resource seg
   (§1.4). Narrowing the deps would lower counts but changes which `ResourceApi` a cell's render props
   hold after an option change (it captures `context`). **Recommendation:** keep `context` in the deps
   in 7b; phase 12's stable wrappers remove the reason.
6. **Finer identity (step 3).** Reusing seg objects across store changes would cut `eventClass`
   counts on `add-event` and drag end. It adds a reconciliation pass and a second notion of "equal"
   (`EventRenderRange` fields). **Recommendation:** not in 7b's core; decide after 2b with the count
   compare in hand.
7. **Now-indicator memoization** (§2.7) changes a count downward and nothing else.
   **Recommendation:** include in step 1 (standard) and 2a (premium), since the pure function has to
   be written anyway.
8. **`AllDaySplitter` removal** moves the all-day/timed classification into the pass. The subtle rule
   is all-day *background* events in both lanes (`AllDaySplitter.ts:27`). Locked by the standard spec
   3. **Recommendation:** proceed; keep `AllDaySplitter` until step 2b only because premium's view
   reads `splitProps` until then.
9. **`sliceEventStore` extraction** touches list and timeline rendering through a shared helper.
   **Recommendation:** keep `sliceEventStore`'s body a thin loop over the extracted per-def function
   and let the list/timeline fixtures (`listWeek`, `timelineWeek`, `resourceTimelineWeek`, all
   variants) prove it.
10. **Phase 10's shape of hidden days** (§2.9): value object with `isHidden`, or a function?
    **Recommendation:** 7b's `buildDaySeries` takes the object; if phase 10 attaches it to
    `DateProfile`, the hooks need no context read at all. Decide when phase 10's plan is written;
    7b's pure code is indifferent.
11. **`DayTableCell` vs `DayTableColumn`** stay two types because multi-row resource daygrid rebuilds
    resource fields per row with a fresh `ResourceApi` (`AbstractResourceDayTableModel.ts:213-216`,
    "deliberate"). Unifying would change `renderProps.resource` identity across rows (no DOM change,
    but a different `ResourceApi` object reaches `dayCellContent` per row today). **Recommendation:**
    keep both; revisit with phase 12.
12. **Where the hooks live.** `useDayTableSegs` in standard, used by premium through
    `protected-api`, like `useTimedSegsByCol` today. **Recommendation:** yes; premium contributes only
    the model builder, the keying and the hit-combo function.
13. **Timeline follow-up (out of scope):** `ResourceSplitter`, `TimelineLaneSlicer` and
    `isPropsValidWithResources` keep the `Splitter`/`Slicer` bases alive. They could move to the same
    keying and a timeline lane later; note it in the roadmap as a loose end after 7b.

## 6. Behavior changes (to keep updated during implementation)

Intended: none. Tolerated: render-hook counts may drop (now-indicator memoization; the joiner no
longer allocating new seg objects on recompute). Any DOM diff in the snapshot compare blocks the
step.
