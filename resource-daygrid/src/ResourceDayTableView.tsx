import {
  h, createRef,
  ComponentContext, DateProfileGenerator, memoize, parseFieldSpecs, DateProfile, ChunkContentCallbackArgs
} from '@fullcalendar/core'
import { TableView, buildDayTableModel, isEventLimitAuto } from '@fullcalendar/daygrid'
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
    let { colWeekNumbersVisible, cellWeekNumbersVisible } = this.processOptions(context.options)

    let resourceOrderSpecs = this.parseResourceOrder(options.resourceOrder)
    let resources = this.flattenResources(props.resourceStore, resourceOrderSpecs)
    let resourceDayTableModel = this.buildResourceDayTableModel(
      props.dateProfile,
      props.dateProfileGenerator,
      resources,
      options.datesAboveResources
    )

    return this.renderLayout(
      options.columnHeader &&
        <ResourceDayHeader
          ref={this.headerRef}
          resources={resources}
          dates={resourceDayTableModel.dayTableModel.headerDates}
          dateProfile={props.dateProfile}
          datesRepDistinctDays={true}
          renderIntro={this.renderHeadIntro}
        />,
      (contentArg: ChunkContentCallbackArgs) => (
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
          isRigid={isEventLimitAuto(options) && !props.isHeightAuto}
          nextDayThreshold={nextDayThreshold}
          colGroupNode={contentArg.tableColGroupNode}
          renderNumberIntro={this.renderNumberIntro}
          renderBgIntro={this.renderBgIntro}
          renderIntro={this.renderIntro}
          colWeekNumbersVisible={colWeekNumbersVisible}
          cellWeekNumbersVisible={cellWeekNumbersVisible}
          eventLimit={options.eventLimit}
          vGrow={!props.isHeightAuto}
          headerAlignElRef={this.headerElRef}
        />
      )
    )
  }

}


function buildResourceDayTableModel(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator, resources: Resource[], datesAboveResources: boolean) {
  let dayTable = buildDayTableModel(dateProfile, dateProfileGenerator)

  return datesAboveResources ?
    new DayResourceTableModel(dayTable, resources) :
    new ResourceDayTableModel(dayTable, resources)
}
