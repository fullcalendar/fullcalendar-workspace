import {
  createViewComponent,
  DAY_GRID_LANE,
  DayGridLayout,
  DayGridRange,
  useDayGridViewData,
  useDayHeaderFormatter,
  useDayTableSegs,
  useStableCallback,
  useViewContext,
} from '@fullcalendar/preact/protected-api'
import { useMemo } from 'react'
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
import { buildResourceRowConfigs } from '../resource-header-tier'

// memoized on its props, and marked as a view (see createViewComponent)
export const ResourceDayGridView = createViewComponent(ResourceDayGridViewBody)

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
  const { dayTableModel: plainModel, datesRepDistinctDays, todayRange } = useDayGridViewData(dateProfile)
  const { dayCols } = plainModel // the first row's dates, as whole days

  // a multi-row column represents one weekday across many dates, so it has no single date
  // to filter by — those views keep view-wide filtering only. nextDayThreshold matches how
  // the renderer decides which day a timed event's tail belongs to
  const isFilteredByDate = options.filterResourcesWithEvents && dayCols.length > 1 && plainModel.rowCount === 1
  const hasEventsByDate = useMemo(
    () => isFilteredByDate
      ? computeHasEventsByDate(props.rawEventStore, resourceStore, dayCols, options.nextDayThreshold)
      : null,
    [isFilteredByDate, props.rawEventStore, resourceStore, dayCols, options.nextDayThreshold],
  )

  const { datesAboveResources } = options
  const model = useMemo(
    () => buildResourceDayTable(plainModel, resources, datesAboveResources, hasEventsByDate, context),
    [plainModel, resources, datesAboveResources, hasEventsByDate, context],
  )
  const keying = useMemo(() => buildResourceKeying(model.participants as Resource[]), [model.participants])

  const slicedProps = useDayTableSegs<DayGridRange>(
    props,
    keying,
    model,
    DAY_GRID_LANE,
    dateProfile,
    options.nextDayThreshold,
    context,
  )

  const dayHeaderFormat = useDayHeaderFormatter(datesRepDistinctDays, model.colCount)
  const businessHours = Boolean(options.businessHours)
  const blankRenderProps = useMemo(() => buildBlankDayCellProps(businessHours), [businessHours])
  const headerTiers = useMemo(
    () => buildResourceRowConfigs(
      toResourceHeaderInput(model, datesAboveResources),
      datesRepDistinctDays,
      dateProfile,
      todayRange,
      dayHeaderFormat,
      context,
      options.dayCellClass,
      blankRenderProps,
    ),
    [
      model, datesAboveResources, datesRepDistinctDays, dateProfile, todayRange, dayHeaderFormat, context,
      options.dayCellClass, blankRenderProps,
    ],
  )

  const isHitComboAllowed = useStableCallback((hit0, hit1) => (
    isResourceHitComboAllowed(hit0, hit1, model.dayCols.length === 1)
  ))

  return (
    <DayGridLayout
      labelId={props.labelId}
      labelStr={props.labelStr}

      dateProfile={dateProfile}
      todayRange={todayRange}
      cellRows={model.cellRows}
      forPrint={props.forPrint}
      isHitComboAllowed={isHitComboAllowed}
      className={props.className}

      // header content
      headerTiers={headerTiers}

      // body content
      fgEventSegs={slicedProps.fgEventSegs}
      bgEventSegs={slicedProps.bgEventSegs}
      businessHourSegs={slicedProps.businessHourSegs}
      dateSelectionSegs={slicedProps.dateSelectionSegs}
      eventDrag={slicedProps.eventDrag}
      eventResize={slicedProps.eventResize}
      eventSelection={slicedProps.eventSelection}
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
