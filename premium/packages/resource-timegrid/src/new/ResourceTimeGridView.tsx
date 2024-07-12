import {
  CalendarContext,
  DateComponent,
  DateMarker,
  DateProfile,
  DateProfileGenerator,
  DateRange,
  NowTimer,
  mapHash,
  memoize,
} from "@fullcalendar/core/internal"
import { createElement } from '@fullcalendar/core/preact'
import { DateHeaderCell, DayOfWeekHeaderCell, DayTableSlicer } from '@fullcalendar/daygrid/internal'
import { ResourceDayTableJoiner, buildHeaderTiers } from '@fullcalendar/resource-daygrid/internal'
import {
  DEFAULT_RESOURCE_ORDER,
  DayResourceTableModel,
  Resource,
  ResourceDayTableModel,
  ResourceViewProps,
  VResourceSplitter,
  flattenResources,
} from '@fullcalendar/resource/internal'
import { AllDaySplitter, DayTimeColsSlicer, TimeGridLayout, TimeGridWeekNumberCell, buildDayRanges, buildTimeColsModel, splitInteractionByCol, splitSegsByCol } from '@fullcalendar/timegrid/internal'
import { ResourceHeaderCell } from '../../../resource-daygrid/src/new/ResourceHeaderCell.js'; // TODO: aahhhh
import { ResourceDayTimeColsJoiner } from '../ResourceDayTimeColsJoiner.js'

interface ResourceTimeGridViewState {
  axisWidth?: number
  slatHeight?: number
}

export class ResourceTimeGridView extends DateComponent<ResourceViewProps, ResourceTimeGridViewState> {
  private flattenResources = memoize(flattenResources)
  private buildResourceTimeColsModel = memoize(buildResourceTimeColsModel)

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
  private splitFgEventSegs = memoize(splitSegsByCol)
  private splitBgEventSegs = memoize(splitSegsByCol)
  private splitBusinessHourSegs = memoize(splitSegsByCol)
  private splitNowIndicatorSegs = memoize(splitSegsByCol)
  private splitDateSelectionSegs = memoize(splitSegsByCol)
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
      businessHours: splitProps.allDay.businessHours,
      dateSelection: splitProps.allDay.dateSelection,
      eventStore: splitProps.allDay.eventStore,
      eventUiBases: splitProps.allDay.eventUiBases,
      eventSelection: splitProps.allDay.eventSelection,
      eventDrag: splitProps.allDay.eventDrag,
      eventResize: splitProps.allDay.eventResize,
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

    let headerTiers = buildHeaderTiers( // TODO: memoize
      resources,
      resourceDayTableModel.dayTableModel.headerDates,
      options.datesAboveResources,
      resourceDayTableModel.dayTableModel.rowCnt === 1, // datesRepDistinctDays
      context,
    )

    return (
      <NowTimer unit={options.nowIndicator ? 'minute' : 'day' /* hacky */}>
        {(nowDate: DateMarker, todayRange: DateRange) => {
          // timed-only column splitting
          let colCnt = resourceDayTableModel.cells.length
          let fgEventSegsByCol = this.splitFgEventSegs(timedResourceJoinedProps.fgEventSegs, colCnt)
          let bgEventSegsByCol = this.splitBgEventSegs(timedResourceJoinedProps.bgEventSegs, colCnt)
          let businessHourSegsByCol = this.splitBusinessHourSegs(timedResourceJoinedProps.businessHourSegs, colCnt)
          let nowIndicatorSegsByCol = this.splitNowIndicatorSegs((() => {
            // was buildNowIndicatorSegs
            let nonResourceSegs = this.timedResourceSlicers[''].sliceNowDate(nowDate, this.props.dateProfile, this.context.options.nextDayThreshold, this.context, this.dayRanges)
            return this.timedResourceJoiner.expandSegs(resourceDayTableModel, nonResourceSegs)
          })(), colCnt)
          let dateSelectionSegsByCol = this.splitDateSelectionSegs(timedResourceJoinedProps.dateSelectionSegs, colCnt)
          let eventDragByCol = this.splitEventDrag(timedResourceJoinedProps.eventDrag, colCnt)
          let eventResizeByCol = this.splitEventResize(timedResourceJoinedProps.eventResize, colCnt)

          return (
            <TimeGridLayout
              cells={resourceDayTableModel.cells[0]}
              dateProfile={dateProfile}
              nowDate={nowDate}
              todayRange={todayRange}

              headerTiers={headerTiers}
              renderHeaderLabel={(tierNum, handleEl) => (
                (options.weekNumbers && tierNum === headerTiers.length - 1) ? (
                  <TimeGridWeekNumberCell dateProfile={dateProfile} />
                ) : (
                  <div>{/* empty */}</div>
                )
              )}
              renderHeaderContent={(cell, tierNum, handleEl) => {
                // TODO: make this function reusable for ResourceDayGridView
                if (cell.type === 'date') {
                  return (
                    <DateHeaderCell
                      cell={cell}
                      navLink={headerTiers[tierNum].length > 1}
                      dateProfile={dateProfile}
                      todayRange={todayRange}
                      dayHeaderFormat={undefined /* TODO: do dayHeaderFormat somehow!!! */}
                      colSpan={cell.colSpan}
                      colWidth={undefined}
                      isSticky={tierNum < headerTiers.length - 1}
                    />
                  )
                } else if (cell.type === 'dayOfWeek') {
                  return (
                    <DayOfWeekHeaderCell
                      key={cell.dow}
                      cell={cell}
                      dayHeaderFormat={undefined /* TODO: dayHeaderFormat */}
                      colSpan={cell.colSpan}
                      colWidth={undefined}
                      isSticky={tierNum < headerTiers.length - 1}
                    />
                  )
                } else { // 'resource'
                  return (
                    <ResourceHeaderCell
                      cell={cell}
                      colSpan={cell.colSpan}
                      colWidth={undefined}
                      isSticky={tierNum < headerTiers.length - 1}
                    />
                  )
                }
              }}
              getHeaderModelKey={(cell) => (
                // TODO: make this function reusable for ResourceDayGridView
                cell.type === 'resource'
                  ? cell.resource.id
                  : cell.type === 'date'
                    ? cell.date.toISOString() // correct?
                    : cell.dow
              )}

              businessHourSegs={allDayResourceJoinedProps.businessHourSegs}
              bgEventSegs={allDayResourceJoinedProps.bgEventSegs}
              fgEventSegs={allDayResourceJoinedProps.fgEventSegs}
              dateSelectionSegs={allDayResourceJoinedProps.dateSelectionSegs}
              eventSelection={allDayResourceJoinedProps.eventSelection /* TODO: make a separate timed version */}
              eventDrag={allDayResourceJoinedProps.eventDrag}
              eventResize={allDayResourceJoinedProps.eventResize}

              fgEventSegsByCol={fgEventSegsByCol}
              bgEventSegsByCol={bgEventSegsByCol}
              businessHourSegsByCol={businessHourSegsByCol}
              nowIndicatorSegsByCol={nowIndicatorSegsByCol}
              dateSelectionSegsByCol={dateSelectionSegsByCol}
              eventDragByCol={eventDragByCol}
              eventResizeByCol={eventResizeByCol}

              isHeightAuto={props.isHeightAuto}
              forPrint={props.forPrint}
            />
          )
        }}
      </NowTimer>
    )
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
) {
  let dayTable = buildTimeColsModel(dateProfile, dateProfileGenerator)

  return datesAboveResources ?
    new DayResourceTableModel(dayTable, resources, context) :
    new ResourceDayTableModel(dayTable, resources, context)
}
