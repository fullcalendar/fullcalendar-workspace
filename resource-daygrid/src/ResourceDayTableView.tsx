import {
  h, createRef,
  ComponentContext, DateProfileGenerator, memoize, parseFieldSpecs, DateProfile, ChunkContentCallbackArgs, Calendar
} from '@fullcalendar/core'
import { TableView, buildDayTableModel } from '@fullcalendar/daygrid'
import { ResourceDayHeader, ResourceDayTableModel, DayResourceTableModel, ResourceViewProps, Resource, flattenResources } from '@fullcalendar/resource-common'
import ResourceDayTable from './ResourceDayTable'


export default class ResourceDayTableView extends TableView {

  static needsResourceData = true // for ResourceViewProps
  props: ResourceViewProps

  private flattenResources = memoize(flattenResources)
  private buildResourceDayTableModel = memoize(buildResourceDayTableModel)
  private parseResourceOrder = memoize(parseFieldSpecs)
  private headerRef = createRef<ResourceDayHeader>()
  private tableRef = createRef<ResourceDayTable>()


  render(props: ResourceViewProps, state: {}, context: ComponentContext) {
    let { options, nextDayThreshold } = context
    let resourceOrderSpecs = this.parseResourceOrder(options.resourceOrder)
    let resources = this.flattenResources(props.resourceStore, resourceOrderSpecs)
    let resourceDayTableModel = this.buildResourceDayTableModel(
      props.dateProfile,
      props.dateProfileGenerator,
      resources,
      options.datesAboveResources,
      context.calendar
    )

    let headerContent = options.dayLabels &&
      <ResourceDayHeader
        ref={this.headerRef}
        resources={resources}
        dates={resourceDayTableModel.dayTableModel.headerDates}
        dateProfile={props.dateProfile}
        datesRepDistinctDays={true}
      />

    let bodyContent = (contentArg: ChunkContentCallbackArgs) => (
      <ResourceDayTable
        ref={this.tableRef}
        dateProfile={props.dateProfile}
        resourceDayTableModel={resourceDayTableModel}
        businessHours={props.businessHours}
        eventStore={props.eventStore}
        eventUiBases={props.eventUiBases}
        dateSelection={props.dateSelection}
        eventSelection={props.eventSelection}
        eventDrag={props.eventDrag}
        eventResize={props.eventResize}
        nextDayThreshold={nextDayThreshold}
        tableMinWidth={contentArg.tableMinWidth}
        colGroupNode={contentArg.tableColGroupNode}
        eventLimit={options.eventLimit}
        vGrowRows={!props.isHeightAuto}
        headerAlignElRef={this.headerElRef}
        clientWidth={contentArg.clientWidth}
        clientHeight={contentArg.clientHeight}
      />
    )

    return options.dayMinWidth
      ? this.renderHScrollLayout(headerContent, bodyContent, resourceDayTableModel.colCnt, options.dayMinWidth)
      : this.renderSimpleLayout(headerContent, bodyContent)
  }

}


function buildResourceDayTableModel(
  dateProfile: DateProfile,
  dateProfileGenerator: DateProfileGenerator,
  resources: Resource[],
  datesAboveResources: boolean,
  calendar: Calendar
) {
  let dayTable = buildDayTableModel(dateProfile, dateProfileGenerator)

  return datesAboveResources ?
    new DayResourceTableModel(dayTable, resources, calendar) :
    new ResourceDayTableModel(dayTable, resources, calendar)
}
