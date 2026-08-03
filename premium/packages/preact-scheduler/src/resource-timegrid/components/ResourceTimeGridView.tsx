import {
  CalendarContext,
  DateComponent,
  DayCol,
  DateMarker,
  DateRange,
  DayTableModel,
  EventStore,
  Hit,
  NowTimer,
  mapHash,
  memoize,
  buildDayCols,
} from '@fullcalendar/preact/protected-api'
import { DayTableSlicer, createDayHeaderFormatter } from '@fullcalendar/preact/protected-api'
import { ResourceDayTableJoiner } from '../../resource-daygrid/ResourceDayTableJoiner'
import { buildResourceRowConfigs } from '../../resource-daygrid/resource-header-tier'
import { AbstractResourceDayTableModel } from '../../resource/common/AbstractResourceDayTableModel'
import { DEFAULT_RESOURCE_ORDER } from '../../resource/resources-crud'
import { buildDayResourceTableModel } from '../../resource/common/DayResourceTableModel'
import { Resource, ResourceHash } from '../../resource/structs/resource'
import { buildResourceDayTableModel } from '../../resource/common/ResourceDayTableModel'
import { ResourceViewProps } from '../../resource/View'
import { buildResourcelessDayTableModel } from '../../resource/common/ResourcelessDayTableModel'
import { computeHasEventsByDate } from '../../resource/common/per-date-filtering'
import { VResourceSplitter } from '../../resource/common/VResourceSplitter'
import { flattenResources } from '../../resource/common/resource-hierarchy'
import { AllDaySplitter, DayTimeColsSlicer, TimeGridLayout, buildTimeColsModel, organizeSegsByCol, splitInteractionByCol } from '@fullcalendar/preact/protected-api'
import { ResourceDayTimeColsJoiner } from '../ResourceDayTimeColsJoiner'

interface ResourceTimeGridViewState {
  axisWidth?: number
  slatHeight?: number
}

export class ResourceTimeGridView extends DateComponent<ResourceViewProps, ResourceTimeGridViewState> {
  state = {} as ResourceTimeGridViewState

  // memo
  private flattenResources = memoize(flattenResources)
  private buildDayCols = memoize(buildDayCols)
  private buildAllDayTableModel = memoize(buildTimeColsModel)
  private extractDayRanges = memoize((dayCols: DayCol[]) => dayCols.map((dayCol) => dayCol.range))
  private buildResourceTimeColsModel = memoize(buildResourceTimeColsModel)
  private buildResourceRowConfigs = memoize(buildResourceRowConfigs)
  private createDayHeaderFormatter = memoize(createDayHeaderFormatter)

  // internal
  private allDaySplitter = new AllDaySplitter()

  // for all-day-resource props
  private allDayResourceSplitter = new VResourceSplitter()
  private allDayResourceSlicers: { [resourceId: string]: DayTableSlicer } = {}
  private allDayResourceJoiner = new ResourceDayTableJoiner()

  // for timed resource props
  private dayRanges: DateRange[] // for now indicator
  private resourceDayTableModel: AbstractResourceDayTableModel
  private timedResourceSplitter = new VResourceSplitter()
  private timedResourceSlicers: { [resourceId: string]: DayTimeColsSlicer } = {}
  private timedResourceJoiner = new ResourceDayTimeColsJoiner()

  // timed-only column splitting
  private splitFgEventSegs = memoize(organizeSegsByCol)
  private splitBgEventSegs = memoize(organizeSegsByCol)
  private splitBusinessHourSegs = memoize(organizeSegsByCol)
  private splitNowIndicatorSegs = memoize(organizeSegsByCol)
  private splitDateSelectionSegs = memoize(organizeSegsByCol)
  private splitEventDrag = memoize(splitInteractionByCol)
  private splitEventResize = memoize(splitInteractionByCol)

  render() {
    let { props, context } = this
    let { options, dateEnv } = context
    let { dateProfile } = props

    let resourceOrderSpecs = options.resourceOrder || DEFAULT_RESOURCE_ORDER
    let resources = this.flattenResources(props.resourceStore, resourceOrderSpecs)
    let dayCols = this.buildDayCols(dateProfile, context.dateProfileGenerator, dateEnv, dateProfile)
    let dayRanges = this.dayRanges = this.extractDayRanges(dayCols)
    let dayTable = this.buildAllDayTableModel(dateProfile, context.dateProfileGenerator, dateEnv)
    let filterResourcesByDate = options.filterResourcesWithEvents === true && dayCols.length > 1
    let resourceDayTableModel = this.resourceDayTableModel = this.buildResourceTimeColsModel(
      dayTable,
      dayCols,
      resources,
      options.datesAboveResources,
      filterResourcesByDate ? props.eventStore : null,
      filterResourcesByDate ? props.resourceStore : null,
      context,
    )

    // split seg by all-day/timed
    let splitProps = this.allDaySplitter.splitProps(props)

    // split the all-day segs by resource
    let allDayResourceSplitProps = this.allDayResourceSplitter.splitProps({
      businessHours: splitProps.allDay.businessHours,
      dateSelection: splitProps.allDay.dateSelection,
      eventStore: splitProps.allDay.eventStore,
      eventUiBases: splitProps.allDay.eventUiBases,
      eventSelection: splitProps.allDay.eventSelection,
      eventDrag: splitProps.allDay.eventDrag,
      eventResize: splitProps.allDay.eventResize,
      resourceDayTableModel,
    })
    this.allDayResourceSlicers = mapHash(allDayResourceSplitProps, (split, resourceId) => this.allDayResourceSlicers[resourceId] || new DayTableSlicer())
    let allDayResourceSlicedProps = mapHash(this.allDayResourceSlicers, (slicer, resourceId) => slicer.sliceProps(
      allDayResourceSplitProps[resourceId],
      dateProfile,
      options.nextDayThreshold,
      context,
      resourceDayTableModel.dayTableModel,
    ))
    let allDayResourceJoinedProps = this.allDayResourceJoiner.joinProps(
      allDayResourceSlicedProps,
      resourceDayTableModel,
    )

    // split the timed segs by resource
    let timedResourceSplitProps = this.timedResourceSplitter.splitProps({
      businessHours: splitProps.timed.businessHours,
      dateSelection: splitProps.timed.dateSelection,
      eventStore: splitProps.timed.eventStore,
      eventUiBases: splitProps.timed.eventUiBases,
      eventSelection: splitProps.timed.eventSelection, // result not used
      eventDrag: splitProps.timed.eventDrag,
      eventResize: splitProps.timed.eventResize,
      resourceDayTableModel,
    })
    this.timedResourceSlicers = mapHash(timedResourceSplitProps, (split, resourceId) => this.timedResourceSlicers[resourceId] || new DayTimeColsSlicer())
    let timedResourceSlicedProps = mapHash(this.timedResourceSlicers, (slicer, resourceId) => slicer.sliceProps(
      timedResourceSplitProps[resourceId],
      dateProfile,
      null,
      context,
      dayRanges,
    ))
    let timedResourceJoinedProps = this.timedResourceJoiner.joinProps(
      timedResourceSlicedProps,
      resourceDayTableModel,
    )

    let datesRepDistinctDays = true
    let dayHeaderFormat = this.createDayHeaderFormatter(
      context.options.dayHeaderFormat,
      datesRepDistinctDays,
      resourceDayTableModel.colCount,
    )

    return (
      <NowTimer unit={options.nowIndicator ? 'minute' : 'day' /* hacky */}>
        {(nowDate: DateMarker, todayRange: DateRange, nowMs: number) => {
          // timed-only column splitting
          let colCount = resourceDayTableModel.colCount
          let fgEventSegsByCol = this.splitFgEventSegs(timedResourceJoinedProps.fgEventSegs, colCount)
          let bgEventSegsByCol = this.splitBgEventSegs(timedResourceJoinedProps.bgEventSegs, colCount)
          let businessHourSegsByCol = this.splitBusinessHourSegs(timedResourceJoinedProps.businessHourSegs, colCount)
          let nowIndicatorSegsByCol = this.splitNowIndicatorSegs((() => {
            // was buildNowIndicatorSegs
            let nonResourceSegs = !props.forPrint && options.nowIndicator
              ? this.timedResourceSlicers[''].sliceNowDate(nowDate, this.props.dateProfile, this.context.options.nextDayThreshold, this.context, this.dayRanges)
              : [] // TODO: breaks memoization?
            const expandedSegs = this.timedResourceJoiner.expandSegs(resourceDayTableModel, nonResourceSegs)
            const dayCnt = dayCols.length
            return expandedSegs.map((seg) => ({
              ...seg,
              showDot: !options.datesAboveResources && dayCnt > 1
                ? true
                : resourceDayTableModel.dateFirstCols[resourceDayTableModel.cols[seg.col].dateI] === seg.col,
            }))
          })(), colCount)
          let dateSelectionSegsByCol = this.splitDateSelectionSegs(timedResourceJoinedProps.dateSelectionSegs, colCount)
          let eventDragByCol = this.splitEventDrag(timedResourceJoinedProps.eventDrag, colCount)
          let eventResizeByCol = this.splitEventResize(timedResourceJoinedProps.eventResize, colCount)

          const headerTiers = this.buildResourceRowConfigs(
            resourceDayTableModel,
            datesRepDistinctDays,
            props.dateProfile,
            todayRange,
            dayHeaderFormat,
            context,
          )

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
              isHitComboAllowed={this.isHitComboAllowed}
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
              fgEventSegsByCol={fgEventSegsByCol}
              bgEventSegsByCol={bgEventSegsByCol}
              businessHourSegsByCol={businessHourSegsByCol}
              nowIndicatorSegsByCol={nowIndicatorSegsByCol}
              dateSelectionSegsByCol={dateSelectionSegsByCol}
              eventDragByCol={eventDragByCol}
              eventResizeByCol={eventResizeByCol}

              // universal content
              eventSelection={allDayResourceJoinedProps.eventSelection || splitProps.timed.eventSelection}
            />
          )
        }}
      </NowTimer>
    )
  }

  isHitComboAllowed = (hit0: Hit, hit1: Hit) => {
    let allowAcrossResources = this.dayRanges.length === 1
    return this.resourceDayTableModel.isHitComboAllowed(hit0, hit1, allowAcrossResources)
  }
}

/*
TODO: kill this and DayResourceTableModel/ResourceDayTableModel
*/
function buildResourceTimeColsModel(
  dayTable: DayTableModel,
  dayCols: DayCol[],
  resources: Resource[],
  datesAboveResources: boolean,
  eventStore: EventStore | null,
  resourceStore: ResourceHash | null,
  context: CalendarContext,
): AbstractResourceDayTableModel {
  if (!resources.length) {
    return buildResourcelessDayTableModel(dayTable, dayCols, context)
  }

  let hasEventsByDate = eventStore && resourceStore
    ? computeHasEventsByDate(eventStore, resourceStore, dayCols.map((dayCol) => dayCol.range))
    : null

  return datesAboveResources ?
    buildDayResourceTableModel(dayTable, dayCols, resources, context, hasEventsByDate) :
    buildResourceDayTableModel(dayTable, dayCols, resources, context, hasEventsByDate)
}
