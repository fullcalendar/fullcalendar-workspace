import {
  BaseComponent,
  DayGridRange,
  TIME_GRID_ALL_DAY_LANE,
  TIME_GRID_TIMED_LANE,
  TimeGridLayout,
  TimeGridRange,
  computeTimeGridPrintMode,
  resolveDayTableLaneEventSelection,
  useDayHeaderFormatter,
  useDayTableSegs,
  useNow,
  useNowIndicatorSegsByCol,
  useStableCallback,
  useTimedSegsByCol,
  useTimeGridModel,
  useViewContext,
} from '@fullcalendar/preact/protected-api'
import { useMemo } from 'react'
import { buildResourceRowConfigs } from '../../resource-daygrid/resource-header-tier'
import { DEFAULT_RESOURCE_ORDER } from '../../resource/resources-crud'
import { ResourceViewProps } from '../../resource/View'
import { computeHasEventsByDate, filterResourceStore } from '../../resource/common/resource-filtering'
import {
  buildResourceDayTable,
  buildResourceKeying,
  isResourceHitComboAllowed,
  toResourceHeaderInput,
} from '../../resource/common/resource-day-table'
import { flattenResources } from '../../resource/common/resource-hierarchy'
import { Resource } from '../../resource/structs/resource'

// a class, because a view's component must be one (see parseViewConfig)
export class ResourceTimeGridView extends BaseComponent<ResourceViewProps> {
  // reads no context, so an inherited contextType would only re-render it on every context change
  static contextType = undefined

  render() {
    return <ResourceTimeGridViewBody {...this.props} />
  }
}

function ResourceTimeGridViewBody(props: ResourceViewProps) {
  const context = useViewContext()
  const { options } = context
  const { dateProfile } = props
  const plainModel = useTimeGridModel(dateProfile)
  const { dayCols } = plainModel
  const { nowDate, nowMs, todayRange } = useNow(options.nowIndicator ? 'minute' : 'day' /* hacky */)

  const resourceStore = useMemo(
    () => filterResourceStore(
      props.resourceStore,
      options.filterResourcesWithEvents,
      props.rawEventStore,
      dateProfile.activeRange,
    ),
    [props.resourceStore, options.filterResourcesWithEvents, props.rawEventStore, dateProfile.activeRange],
  )
  const resourceOrderSpecs = options.resourceOrder || DEFAULT_RESOURCE_ORDER
  const resources = useMemo(
    () => flattenResources(resourceStore, resourceOrderSpecs),
    [resourceStore, resourceOrderSpecs],
  )

  // an event must intersect a column's rendered range to earn a column there
  const isFilteredByDate = options.filterResourcesWithEvents && dayCols.length > 1
  const hasEventsByDate = useMemo(
    () => isFilteredByDate
      ? computeHasEventsByDate(props.rawEventStore, resourceStore, dayCols)
      : null,
    [isFilteredByDate, props.rawEventStore, resourceStore, dayCols],
  )

  const { datesAboveResources } = options
  const model = useMemo(
    () => buildResourceDayTable(plainModel, resources, datesAboveResources, hasEventsByDate, context),
    [plainModel, resources, datesAboveResources, hasEventsByDate, context],
  )
  const keying = useMemo(() => buildResourceKeying(model.participants as Resource[]), [model.participants])
  const { colCount } = model

  const allDayProps = useDayTableSegs<DayGridRange>(
    props,
    keying,
    model,
    TIME_GRID_ALL_DAY_LANE,
    dateProfile,
    options.nextDayThreshold,
    context,
  )
  const timedProps = useDayTableSegs<TimeGridRange>(
    props,
    keying,
    model,
    TIME_GRID_TIMED_LANE,
    dateProfile,
    null,
    context,
  )
  const timedSegsByCol = useTimedSegsByCol(timedProps, colCount)
  const nowIndicatorSegsByCol = useNowIndicatorSegsByCol(
    nowDate,
    model,
    keying,
    dateProfile,
    options.nextDayThreshold,
    datesAboveResources,
    !props.forPrint && Boolean(options.nowIndicator),
  )

  const datesRepDistinctDays = true
  const dayHeaderFormat = useDayHeaderFormatter(datesRepDistinctDays, colCount)
  const isStack = computeTimeGridPrintMode(props.forPrint, options.eventPrintLayout) === 'stack'
  const blankRenderProps = useMemo(() => buildBlankDayLaneProps(isStack), [isStack])
  const headerTiers = useMemo(
    () => buildResourceRowConfigs(
      toResourceHeaderInput(model, datesAboveResources),
      datesRepDistinctDays,
      dateProfile,
      todayRange,
      dayHeaderFormat,
      context,
      options.dayLaneClass,
      blankRenderProps,
    ),
    [
      model, datesAboveResources, datesRepDistinctDays, dateProfile, todayRange, dayHeaderFormat, context,
      options.dayLaneClass, blankRenderProps,
    ],
  )

  const isHitComboAllowed = useStableCallback((hit0, hit1) => (
    isResourceHitComboAllowed(hit0, hit1, model.dayCols.length === 1)
  ))

  // the all-day lane's needs a participating resource (or none). the timed lane's only the lane
  const eventSelection = allDayProps.eventSelection ||
    resolveDayTableLaneEventSelection(props.eventSelection, props.eventStore, TIME_GRID_TIMED_LANE)

  return (
    <TimeGridLayout
      labelId={props.labelId}
      labelStr={props.labelStr}

      dateProfile={dateProfile}
      nowDate={nowDate}
      nowMs={nowMs}
      todayRange={todayRange}
      cells={model.cols}
      forPrint={props.forPrint}
      isHitComboAllowed={isHitComboAllowed}
      className={props.className}

      // header content
      headerTiers={headerTiers}

      // all-day content
      fgEventSegs={allDayProps.fgEventSegs}
      bgEventSegs={allDayProps.bgEventSegs}
      businessHourSegs={allDayProps.businessHourSegs}
      dateSelectionSegs={allDayProps.dateSelectionSegs}
      eventDrag={allDayProps.eventDrag}
      eventResize={allDayProps.eventResize}

      // timed content
      {...timedSegsByCol}
      nowIndicatorSegsByCol={nowIndicatorSegsByCol}

      // universal content
      eventSelection={eventSelection}
    />
  )
}

// Extra DayLaneInfo props for the blank header's dayLaneClass hook.
// buildResourceRowConfigs supplies the shared date props.
function buildBlankDayLaneProps(isStack: boolean) {
  return { isStack }
}
