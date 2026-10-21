import {
  BaseComponent,
  DayCol,
  DayTableModel,
  addDays,
  mapHash,
  useStableCallback,
  useViewContext,
} from '@fullcalendar/preact/protected-api'
import {
  DayGridLayout,
  DayTableSlicer,
  useDayGridViewData,
  useDayHeaderFormatter,
} from '@fullcalendar/preact/protected-api'
import { useMemo, useRef, useState } from 'react'
import { DEFAULT_RESOURCE_ORDER } from '../../resource/resources-crud'
import { ResourceViewProps } from '../../resource/View'
import { computeHasEventsByDate, filterResourceStore } from '../../resource/common/resource-filtering'
import { buildResourceTableModel } from '../../resource/common/resource-table-model'
import { VResourceSplitter } from '../../resource/common/VResourceSplitter'
import { flattenResources } from '../../resource/common/resource-hierarchy'
import { ResourceDayTableJoiner } from '../ResourceDayTableJoiner'
import { buildResourceRowConfigs, fromAbstractModel } from '../resource-header-tier'

// a class, because a view's component must be one (see parseViewConfig)
export class ResourceDayGridView extends BaseComponent<ResourceViewProps> {
  render() {
    return <ResourceDayGridViewBody {...this.props} />
  }
}

function ResourceDayGridViewBody(props: ResourceViewProps) {
  const context = useViewContext()
  const { options } = context
  const { dateProfile } = props

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
  const { dayTableModel: dayTable, datesRepDistinctDays, todayRange } = useDayGridViewData(dateProfile)
  const dayCols = useMemo(() => buildDayGridCols(dayTable), [dayTable])

  // a multi-row column represents one weekday across many dates, so it has no single date
  // to filter by — those views keep view-wide filtering only. nextDayThreshold matches how
  // the renderer decides which day a timed event's tail belongs to
  const isFilteredByDate = options.filterResourcesWithEvents && dayTable.colCount > 1 && dayTable.rowCount === 1
  const hasEventsByDate = useMemo(
    () => isFilteredByDate
      ? computeHasEventsByDate(props.rawEventStore, resourceStore, dayCols, options.nextDayThreshold)
      : null,
    [isFilteredByDate, props.rawEventStore, resourceStore, dayCols, options.nextDayThreshold],
  )

  const resourceDayTableModel = useMemo(
    () => buildResourceTableModel(
      dayTable,
      dayCols,
      resources,
      options.datesAboveResources,
      hasEventsByDate,
      context,
    ),
    [dayTable, dayCols, resources, options.datesAboveResources, hasEventsByDate, context],
  )

  const [splitter] = useState(() => new VResourceSplitter())
  const [joiner] = useState(() => new ResourceDayTableJoiner())
  const slicersRef = useRef<{ [resourceId: string]: DayTableSlicer }>({})

  const splitProps = splitter.splitProps({
    resourceDayTableModel,
    businessHours: props.businessHours,
    dateSelection: props.dateSelection,
    eventStore: props.eventStore,
    eventUiBases: props.eventUiBases,
    eventSelection: props.eventSelection,
    eventDrag: props.eventDrag,
    eventResize: props.eventResize,
  })
  const slicers = slicersRef.current = mapHash(
    splitProps,
    (split, resourceId) => slicersRef.current[resourceId] || new DayTableSlicer(),
  )
  const slicedProps = mapHash(slicers, (slicer, resourceId) => slicer.sliceProps(
    splitProps[resourceId],
    dateProfile,
    options.nextDayThreshold,
    context,
    dayTable,
  ))
  const joinedSlicedProps = joiner.joinProps(slicedProps, resourceDayTableModel)

  const dayHeaderFormat = useDayHeaderFormatter(datesRepDistinctDays, resourceDayTableModel.colCount)
  const businessHours = Boolean(options.businessHours)
  const blankRenderProps = useMemo(() => buildBlankDayCellProps(businessHours), [businessHours])
  const headerTiers = useMemo(
    () => buildResourceRowConfigs(
      fromAbstractModel(resourceDayTableModel),
      datesRepDistinctDays,
      dateProfile,
      todayRange,
      dayHeaderFormat,
      context,
      options.dayCellClass,
      blankRenderProps,
    ),
    [
      resourceDayTableModel, datesRepDistinctDays, dateProfile, todayRange, dayHeaderFormat, context,
      options.dayCellClass, blankRenderProps,
    ],
  )

  const isHitComboAllowed = useStableCallback((hit0, hit1) => {
    const allowAcrossResources = dayTable.colCount === 1
    return resourceDayTableModel.isHitComboAllowed(hit0, hit1, allowAcrossResources)
  })

  return (
    <DayGridLayout
      labelId={props.labelId}
      labelStr={props.labelStr}

      dateProfile={dateProfile}
      todayRange={todayRange}
      cellRows={resourceDayTableModel.cells}
      forPrint={props.forPrint}
      isHitComboAllowed={isHitComboAllowed}
      className={props.className}

      // header content
      headerTiers={headerTiers}

      // body content
      fgEventSegs={joinedSlicedProps.fgEventSegs}
      bgEventSegs={joinedSlicedProps.bgEventSegs}
      businessHourSegs={joinedSlicedProps.businessHourSegs}
      dateSelectionSegs={joinedSlicedProps.dateSelectionSegs}
      eventDrag={joinedSlicedProps.eventDrag}
      eventResize={joinedSlicedProps.eventResize}
      eventSelection={joinedSlicedProps.eventSelection}
    />
  )
}

// Extra DayCellInfo props for the blank header's dayCellClass hook.
// buildResourceRowConfigs supplies the shared date props.
function buildBlankDayCellProps(businessHours: boolean) {
  return {
    inPopover: false,
    hasNavLink: false,
    text: '',
    textParts: [],
    weekdayText: '',
    dayNumberText: '',
    monthText: '',
    options: { businessHours },
  }
}

// Resource daygrid columns repeat across rows, so their date-level descriptors use the first row.
function buildDayGridCols(dayTable: DayTableModel): DayCol[] {
  return dayTable.cellRows[0].map((cell) => ({
    ...cell,
    range: {
      start: cell.date,
      end: addDays(cell.date, 1),
    },
  }))
}
