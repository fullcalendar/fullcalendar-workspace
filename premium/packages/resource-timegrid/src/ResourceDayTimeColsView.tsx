import { createElement, DateProfileGenerator, memoize, DateProfile, ChunkContentCallbackArgs, CalendarContext } from '@fullcalendar/common'
import { TimeColsView, buildTimeColsModel, buildSlatMetas } from '@fullcalendar/timegrid'
import {
  ResourceDayHeader, ResourceDayTableModel, DayResourceTableModel, ResourceViewProps,
  Resource, flattenResources, DEFAULT_RESOURCE_ORDER,
} from '@fullcalendar/resource-common'
import { ResourceDayTable } from '@fullcalendar/resource-daygrid'
import { ResourceDayTimeCols } from './ResourceDayTimeCols'

export class ResourceDayTimeColsView extends TimeColsView {
  props: ResourceViewProps

  private flattenResources = memoize(flattenResources)
  private buildResourceTimeColsModel = memoize(buildResourceTimeColsModel)
  private buildSlatMetas = memoize(buildSlatMetas)

  render() {
    let { props, context } = this
    let { options, dateEnv } = context
    let { dateProfile } = props

    let splitProps = this.allDaySplitter.splitProps(props)
    let resourceOrderSpecs = options.resourceOrder || DEFAULT_RESOURCE_ORDER
    let resources = this.flattenResources(props.resourceStore, resourceOrderSpecs)
    let resourceDayTableModel = this.buildResourceTimeColsModel(
      dateProfile,
      context.dateProfileGenerator,
      resources,
      options.datesAboveResources,
      context,
    )

    let slatMetas = this.buildSlatMetas(
      dateProfile.slotMinTime,
      dateProfile.slotMaxTime,
      options.slotLabelInterval,
      options.slotDuration,
      dateEnv,
    )
    let { dayMinWidth } = options
    let hasAttachedAxis = !dayMinWidth
    let hasDetachedAxis = dayMinWidth

    let headerContent = options.dayHeaders && (
      <ResourceDayHeader
        resources={resources}
        dates={resourceDayTableModel.dayTableModel.headerDates}
        dateProfile={dateProfile}
        datesRepDistinctDays
        renderIntro={hasAttachedAxis ? this.renderHeadAxis : null}
      />
    )

    let allDayContent = (options.allDaySlot !== false) && ((contentArg: ChunkContentCallbackArgs) => (
      <ResourceDayTable
        {...splitProps.allDay}
        dateProfile={dateProfile}
        resourceDayTableModel={resourceDayTableModel}
        nextDayThreshold={options.nextDayThreshold}
        tableMinWidth={contentArg.tableMinWidth}
        colGroupNode={contentArg.tableColGroupNode}
        renderRowIntro={hasAttachedAxis ? this.renderTableRowAxis : null}
        showWeekNumbers={false}
        expandRows={false}
        headerAlignElRef={this.headerElRef}
        clientWidth={contentArg.clientWidth}
        clientHeight={contentArg.clientHeight}
        forPrint={props.forPrint}
        {...this.getAllDayMaxEventProps()}
      />
    ))

    let timeGridContent = (contentArg: ChunkContentCallbackArgs) => (
      <ResourceDayTimeCols
        {...splitProps.timed}
        dateProfile={dateProfile}
        axis={hasAttachedAxis}
        slotDuration={options.slotDuration}
        slatMetas={slatMetas}
        resourceDayTableModel={resourceDayTableModel}
        tableColGroupNode={contentArg.tableColGroupNode}
        tableMinWidth={contentArg.tableMinWidth}
        clientWidth={contentArg.clientWidth}
        clientHeight={contentArg.clientHeight}
        onSlatCoords={this.handleSlatCoords}
        expandRows={contentArg.expandRows}
        forPrint={props.forPrint}
        onScrollTopRequest={this.handleScrollTopRequest}
      />
    )

    return hasDetachedAxis
      ? this.renderHScrollLayout(
        headerContent,
        allDayContent,
        timeGridContent,
        resourceDayTableModel.colCnt,
        dayMinWidth,
        slatMetas,
        this.state.slatCoords,
      )
      : this.renderSimpleLayout(
        headerContent,
        allDayContent,
        timeGridContent,
      )
  }
}

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
