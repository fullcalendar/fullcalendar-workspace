import {
  BaseComponent,
  DaySeriesSlicer,
  DayTimeColsSlicer,
  TimeGridLayout,
  computeTimeGridPrintMode,
  mapHash,
  organizeSegsByCol,
  useDayHeaderFormatter,
  useStableCallback,
  useTimedSegsByCol,
  useTimeGridViewData,
  useViewContext,
} from '@fullcalendar/preact/protected-api'
import { useMemo, useRef, useState } from 'react'
import { ResourceDayTableJoiner } from '../../resource-daygrid/ResourceDayTableJoiner'
import { buildResourceRowConfigs } from '../../resource-daygrid/resource-header-tier'
import { DEFAULT_RESOURCE_ORDER } from '../../resource/resources-crud'
import { ResourceViewProps } from '../../resource/View'
import { computeHasEventsByDate, filterResourceStore } from '../../resource/common/resource-filtering'
import { buildResourceTableModel } from '../../resource/common/resource-table-model'
import { VResourceSplitter } from '../../resource/common/VResourceSplitter'
import { flattenResources } from '../../resource/common/resource-hierarchy'
import { ResourceDayTimeColsJoiner } from '../ResourceDayTimeColsJoiner'

// a class, because a view's component must be one (see parseViewConfig)
export class ResourceTimeGridView extends BaseComponent<ResourceViewProps> {
  render() {
    return <ResourceTimeGridViewBody {...this.props} />
  }
}

function ResourceTimeGridViewBody(props: ResourceViewProps) {
  const context = useViewContext()
  const { options } = context
  const { dateProfile } = props
  const { daySeries, dayCols, dayRanges, splitProps, nowDate, nowMs, todayRange } = useTimeGridViewData(props)

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

  const resourceDayTableModel = useMemo(
    () => buildResourceTableModel(
      null,
      dayCols,
      resources,
      options.datesAboveResources,
      hasEventsByDate,
      context,
    ),
    [dayCols, resources, options.datesAboveResources, hasEventsByDate, context],
  )

  // split the all-day segs by resource
  const [allDayResourceSplitter] = useState(() => new VResourceSplitter())
  const [allDayResourceJoiner] = useState(() => new ResourceDayTableJoiner())
  const allDayResourceSlicersRef = useRef<{ [resourceId: string]: DaySeriesSlicer }>({})
  const allDayResourceSplitProps = allDayResourceSplitter.splitProps({
    businessHours: splitProps.allDay.businessHours,
    dateSelection: splitProps.allDay.dateSelection,
    eventStore: splitProps.allDay.eventStore,
    eventUiBases: splitProps.allDay.eventUiBases,
    eventSelection: splitProps.allDay.eventSelection,
    eventDrag: splitProps.allDay.eventDrag,
    eventResize: splitProps.allDay.eventResize,
    resourceDayTableModel,
  })
  const allDayResourceSlicers = allDayResourceSlicersRef.current = mapHash(
    allDayResourceSplitProps,
    (split, resourceId) => allDayResourceSlicersRef.current[resourceId] || new DaySeriesSlicer(),
  )
  const allDayResourceSlicedProps = mapHash(allDayResourceSlicers, (slicer, resourceId) => slicer.sliceProps(
    allDayResourceSplitProps[resourceId],
    dateProfile,
    options.nextDayThreshold,
    context,
    daySeries,
  ))
  const allDayResourceJoinedProps = allDayResourceJoiner.joinProps(
    allDayResourceSlicedProps,
    resourceDayTableModel,
  )

  // split the timed segs by resource
  const [timedResourceSplitter] = useState(() => new VResourceSplitter())
  const [timedResourceJoiner] = useState(() => new ResourceDayTimeColsJoiner())
  const timedResourceSlicersRef = useRef<{ [resourceId: string]: DayTimeColsSlicer }>({})
  const timedResourceSplitProps = timedResourceSplitter.splitProps({
    businessHours: splitProps.timed.businessHours,
    dateSelection: splitProps.timed.dateSelection,
    eventStore: splitProps.timed.eventStore,
    eventUiBases: splitProps.timed.eventUiBases,
    eventSelection: splitProps.timed.eventSelection, // result not used
    eventDrag: splitProps.timed.eventDrag,
    eventResize: splitProps.timed.eventResize,
    resourceDayTableModel,
  })
  const timedResourceSlicers = timedResourceSlicersRef.current = mapHash(
    timedResourceSplitProps,
    (split, resourceId) => timedResourceSlicersRef.current[resourceId] || new DayTimeColsSlicer(),
  )
  const timedResourceSlicedProps = mapHash(timedResourceSlicers, (slicer, resourceId) => slicer.sliceProps(
    timedResourceSplitProps[resourceId],
    dateProfile,
    null,
    context,
    dayRanges,
  ))
  const timedResourceJoinedProps = timedResourceJoiner.joinProps(
    timedResourceSlicedProps,
    resourceDayTableModel,
  )

  // timed-only column splitting
  const colCount = resourceDayTableModel.colCount
  const timedSegsByCol = useTimedSegsByCol(timedResourceJoinedProps, colCount)

  // was buildNowIndicatorSegs. new each render, as sliceNowDate doesn't memoize
  const nonResourceNowSegs = !props.forPrint && options.nowIndicator
    ? timedResourceSlicers[''].sliceNowDate(nowDate, dateProfile, options.nextDayThreshold, context, dayRanges)
    : []
  const nowIndicatorSegsByCol = organizeSegsByCol(
    timedResourceJoiner.expandSegs(resourceDayTableModel, nonResourceNowSegs).map((seg) => ({
      ...seg,
      showDot: !options.datesAboveResources && dayCols.length > 1
        ? true
        : resourceDayTableModel.dateFirstCols[resourceDayTableModel.cols[seg.col].dateI] === seg.col,
    })),
    colCount,
  )

  const datesRepDistinctDays = true
  const dayHeaderFormat = useDayHeaderFormatter(datesRepDistinctDays, resourceDayTableModel.colCount)
  const isStack = computeTimeGridPrintMode(props.forPrint, options.eventPrintLayout) === 'stack'
  const blankRenderProps = useMemo(() => buildBlankDayLaneProps(isStack), [isStack])
  const headerTiers = useMemo(
    () => buildResourceRowConfigs(
      resourceDayTableModel,
      datesRepDistinctDays,
      dateProfile,
      todayRange,
      dayHeaderFormat,
      context,
      options.dayLaneClass,
      blankRenderProps,
    ),
    [
      resourceDayTableModel, datesRepDistinctDays, dateProfile, todayRange, dayHeaderFormat, context,
      options.dayLaneClass, blankRenderProps,
    ],
  )

  const isHitComboAllowed = useStableCallback((hit0, hit1) => {
    const allowAcrossResources = dayRanges.length === 1
    return resourceDayTableModel.isHitComboAllowed(hit0, hit1, allowAcrossResources)
  })

  return (
    <TimeGridLayout
      labelId={props.labelId}
      labelStr={props.labelStr}

      dateProfile={dateProfile}
      nowDate={nowDate}
      nowMs={nowMs}
      todayRange={todayRange}
      cells={resourceDayTableModel.cols}
      forPrint={props.forPrint}
      isHitComboAllowed={isHitComboAllowed}
      className={props.className}

      // header content
      headerTiers={headerTiers}

      // all-day content
      fgEventSegs={allDayResourceJoinedProps.fgEventSegs}
      bgEventSegs={allDayResourceJoinedProps.bgEventSegs}
      businessHourSegs={allDayResourceJoinedProps.businessHourSegs}
      dateSelectionSegs={allDayResourceJoinedProps.dateSelectionSegs}
      eventDrag={allDayResourceJoinedProps.eventDrag}
      eventResize={allDayResourceJoinedProps.eventResize}

      // timed content
      {...timedSegsByCol}
      nowIndicatorSegsByCol={nowIndicatorSegsByCol}

      // universal content
      eventSelection={allDayResourceJoinedProps.eventSelection || splitProps.timed.eventSelection}
    />
  )
}

// Extra DayLaneInfo props for the blank header's dayLaneClass hook.
// buildResourceRowConfigs supplies the shared date props.
function buildBlankDayLaneProps(isStack: boolean) {
  return { isStack }
}
