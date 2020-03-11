import {
  h, ComponentContext, DateProfileGenerator, memoize, parseFieldSpecs, DateProfile, ChunkContentCallbackArgs, createDuration
} from '@fullcalendar/core'
import { TimeColsView, buildTimeColsModel, buildSlatMetas } from '@fullcalendar/timegrid'
import { ResourceDayHeader, ResourceDayTableModel, DayResourceTableModel, ResourceViewProps, Resource, flattenResources } from '@fullcalendar/resource-common'
import { ResourceDayTable } from '@fullcalendar/resource-daygrid'
import ResourceDayTimeCols from './ResourceDayTimeCols'


export default class ResourceDayTimeColsView extends TimeColsView {

  static needsResourceData = true // for ResourceViewProps
  props: ResourceViewProps

  private flattenResources = memoize(flattenResources)
  private buildResourceTimeColsModel = memoize(buildResourceTimeColsModel)
  private parseResourceOrder = memoize(parseFieldSpecs)
  private parseSlotDuration = memoize(createDuration)
  private buildSlatMetas = memoize(buildSlatMetas)


  render(props: ResourceViewProps, state: {}, context: ComponentContext) {
    let { options, nextDayThreshold, dateEnv } = context

    let splitProps = this.allDaySplitter.splitProps(props)
    let resourceOrderSpecs = this.parseResourceOrder(options.resourceOrder)
    let resources = this.flattenResources(props.resourceStore, resourceOrderSpecs)
    let resourceDayTableModel = this.buildResourceTimeColsModel(
      props.dateProfile,
      props.dateProfileGenerator,
      resources,
      options.datesAboveResources
    )

    let slotDuration = this.parseSlotDuration(options.slotDuration)
    let slatMetas = this.buildSlatMetas(props.dateProfile, options.slotLabelInterval, slotDuration, dateEnv)
    let axis = true

    return this.renderLayout(
      axis,
      options.columnHeader &&
        <ResourceDayHeader
          resources={resources}
          dates={resourceDayTableModel.dayTableModel.headerDates}
          dateProfile={props.dateProfile}
          datesRepDistinctDays={true}
          renderIntro={axis ? this.renderHeadAxis : null}
        />,
      options.allDaySlot && ((contentArg: ChunkContentCallbackArgs) => (
        <ResourceDayTable
          {...splitProps['allDay']}
          dateProfile={props.dateProfile}
          resourceDayTableModel={resourceDayTableModel}
          nextDayThreshold={nextDayThreshold}
          colGroupNode={contentArg.tableColGroupNode}
          renderRowIntro={axis ? this.renderTableRowAxis : null}
          eventLimit={this.getAllDayEventLimit()}
          vGrowRows={false}
          headerAlignElRef={this.headerElRef}
          clientWidth={contentArg.clientWidth}
          clientHeight={contentArg.clientHeight}
        />
      )),
      (contentArg: ChunkContentCallbackArgs) => (
        <ResourceDayTimeCols
          {...splitProps['timed']}
          dateProfile={props.dateProfile}
          axis={axis}
          slotDuration={slotDuration}
          slatMetas={slatMetas}
          resourceDayTableModel={resourceDayTableModel}
          tableColGroupNode={contentArg.tableColGroupNode}
          tableMinWidth={contentArg.tableMinWidth}
          clientWidth={contentArg.clientWidth}
          clientHeight={contentArg.clientHeight}
          vGrowRows={contentArg.vGrowRows}
          forPrint={props.forPrint}
          onScrollTopRequest={this.handleScrollTopRequest}
        />
      )
    )
  }

}


function buildResourceTimeColsModel(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator, resources: Resource[], datesAboveResources: boolean) {
  let dayTable = buildTimeColsModel(dateProfile, dateProfileGenerator)

  return datesAboveResources ?
    new DayResourceTableModel(dayTable, resources) :
    new ResourceDayTableModel(dayTable, resources)
}
