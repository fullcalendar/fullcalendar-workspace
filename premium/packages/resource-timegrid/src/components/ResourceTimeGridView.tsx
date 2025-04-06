import {
  CalendarContext,
  DateComponent,
  DateMarker,
  DateProfile,
  DateProfileGenerator,
  DateRange,
  Hit,
  NowTimer,
  mapHash,
  memoize
} from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { DayTableSlicer, createDayHeaderFormatter } from '@fullcalendar/daygrid/internal'
import { ResourceDayTableJoiner, buildResourceRowConfigs } from '@fullcalendar/resource-daygrid/internal'
import {
  AbstractResourceDayTableModel,
  DEFAULT_RESOURCE_ORDER,
  DayResourceTableModel,
  Resource,
  ResourceDayTableModel,
  ResourceViewProps,
  ResourcelessDayTableModel,
  VResourceSplitter,
  flattenResources,
} from '@fullcalendar/resource/internal'
import { AllDaySplitter, DayTimeColsSlicer, TimeGridLayout, buildDayRanges, buildTimeColsModel, organizeSegsByCol, splitInteractionByCol } from '@fullcalendar/timegrid/internal'
import { ResourceDayTimeColsJoiner } from '../ResourceDayTimeColsJoiner.js'

interface ResourceTimeGridViewState {
  axisWidth?: number
  slatHeight?: number
}

export class ResourceTimeGridView extends DateComponent<ResourceViewProps, ResourceTimeGridViewState> {
  // memo
  private flattenResources = memoize(flattenResources)
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
  private buildDayRanges = memoize(buildDayRanges)
  private dayRanges: DateRange[] // for now indicator
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
    let resourceDayTableModel = this.buildResourceTimeColsModel(
      dateProfile,
      context.dateProfileGenerator,
      resources,
      options.datesAboveResources,
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
    let dayRanges = this.dayRanges = this.buildDayRanges(resourceDayTableModel.dayTableModel, dateProfile, dateEnv)
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

    let datesRepDistinctDays = resourceDayTableModel.dayTableModel.rowCnt === 1
    let dayHeaderFormat = this.createDayHeaderFormatter(
      context.options.dayHeaderFormat,
      datesRepDistinctDays,
      resourceDayTableModel.colCnt,
    )

    return (
      <NowTimer unit={options.nowIndicator ? 'minute' : 'day' /* hacky */}>
        {(nowDate: DateMarker, todayRange: DateRange) => {
          // timed-only column splitting
          let colCnt = resourceDayTableModel.colCnt
          let fgEventSegsByCol = this.splitFgEventSegs(timedResourceJoinedProps.fgEventSegs, colCnt)
          let bgEventSegsByCol = this.splitBgEventSegs(timedResourceJoinedProps.bgEventSegs, colCnt)
          let businessHourSegsByCol = this.splitBusinessHourSegs(timedResourceJoinedProps.businessHourSegs, colCnt)
          let nowIndicatorSegsByCol = this.splitNowIndicatorSegs((() => {
            // was buildNowIndicatorSegs
            let nonResourceSegs = options.nowIndicator
              ? this.timedResourceSlicers[''].sliceNowDate(nowDate, this.props.dateProfile, this.context.options.nextDayThreshold, this.context, this.dayRanges)
              : [] // TODO: breaks memoization?
            return this.timedResourceJoiner.expandSegs(resourceDayTableModel, nonResourceSegs)
          })(), colCnt)
          let dateSelectionSegsByCol = this.splitDateSelectionSegs(timedResourceJoinedProps.dateSelectionSegs, colCnt)
          let eventDragByCol = this.splitEventDrag(timedResourceJoinedProps.eventDrag, colCnt)
          let eventResizeByCol = this.splitEventResize(timedResourceJoinedProps.eventResize, colCnt)

          const headerTiers = this.buildResourceRowConfigs(
            resources,
            options.datesAboveResources,
            resourceDayTableModel.dayTableModel.headerDates,
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
              todayRange={todayRange}
              cells={resourceDayTableModel.cells[0]}
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
    return allowAcrossResources || hit0.dateSpan.resourceId === hit1.dateSpan.resourceId
  }
}

/*
TODO: kill this and DayResourceTableModel/ResourceDayTableModel
*/
function buildResourceTimeColsModel(
  dateProfile: DateProfile,
  dateProfileGenerator: DateProfileGenerator,
  resources: Resource[],
  datesAboveResources: boolean,
  context: CalendarContext,
): AbstractResourceDayTableModel {
  let dayTable = buildTimeColsModel(dateProfile, dateProfileGenerator, context.dateEnv)

  if (!resources.length) {
    return new ResourcelessDayTableModel(dayTable)
  }

  return datesAboveResources ?
    new DayResourceTableModel(dayTable, resources, context) :
    new ResourceDayTableModel(dayTable, resources, context)
}
