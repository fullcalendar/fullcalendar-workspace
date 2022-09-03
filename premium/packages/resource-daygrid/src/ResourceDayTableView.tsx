import {
  createElement,
  createRef,
  DateProfileGenerator,
  memoize,
  DateProfile,
  ChunkContentCallbackArgs,
  CalendarContext,
} from '@fullcalendar/common'
import { TableView, buildDayTableModel } from '@fullcalendar/daygrid'
import {
  ResourceDayHeader, ResourceDayTableModel, DayResourceTableModel, ResourceViewProps,
  Resource, flattenResources, DEFAULT_RESOURCE_ORDER,
} from '@fullcalendar/resource-common'
import { ResourceDayTable } from './ResourceDayTable'

export class ResourceDayTableView extends TableView {
  props: ResourceViewProps

  private flattenResources = memoize(flattenResources)
  private buildResourceDayTableModel = memoize(buildResourceDayTableModel)
  private headerRef = createRef<ResourceDayHeader>()
  private tableRef = createRef<ResourceDayTable>()

  render() {
    let { props, context } = this
    let { options } = context

    let resourceOrderSpecs = options.resourceOrder || DEFAULT_RESOURCE_ORDER
    let resources = this.flattenResources(props.resourceStore, resourceOrderSpecs)
    let resourceDayTableModel = this.buildResourceDayTableModel(
      props.dateProfile,
      context.dateProfileGenerator,
      resources,
      options.datesAboveResources,
      context,
    )

    let headerContent = options.dayHeaders && (
      <ResourceDayHeader
        ref={this.headerRef}
        resources={resources}
        dateProfile={props.dateProfile}
        dates={resourceDayTableModel.dayTableModel.headerDates}
        datesRepDistinctDays
      />
    )

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
        nextDayThreshold={options.nextDayThreshold}
        tableMinWidth={contentArg.tableMinWidth}
        colGroupNode={contentArg.tableColGroupNode}
        dayMaxEvents={options.dayMaxEvents}
        dayMaxEventRows={options.dayMaxEventRows}
        showWeekNumbers={options.weekNumbers}
        expandRows={!props.isHeightAuto}
        headerAlignElRef={this.headerElRef}
        clientWidth={contentArg.clientWidth}
        clientHeight={contentArg.clientHeight}
        forPrint={props.forPrint}
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
  context: CalendarContext,
) {
  let dayTable = buildDayTableModel(dateProfile, dateProfileGenerator)

  return datesAboveResources ?
    new DayResourceTableModel(dayTable, resources, context) :
    new ResourceDayTableModel(dayTable, resources, context)
}
