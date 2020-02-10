import {
  h, ComponentContext, DateProfileGenerator, memoize, parseFieldSpecs, DateProfile, ChunkContentCallbackArgs
} from '@fullcalendar/core'
import { TimeColsView, buildTimeColsModel } from '@fullcalendar/timegrid'
import { ResourceDayHeader, ResourceDayTableModel, DayResourceTableModel, ResourceViewProps, Resource, flattenResources } from '@fullcalendar/resource-common'
import { ResourceDayTable } from '@fullcalendar/resource-daygrid'
import ResourceDayTimeCols from './ResourceDayTimeCols'


export default class ResourceDayTimeColsView extends TimeColsView {

  static needsResourceData = true // for ResourceViewProps
  props: ResourceViewProps

  private flattenResources = memoize(flattenResources)
  private buildResourceTimeColsModel = memoize(buildResourceTimeColsModel)
  private parseResourceOrder = memoize(parseFieldSpecs)


  render(props: ResourceViewProps, state: {}, context: ComponentContext) {
    let { options, nextDayThreshold } = context

    let splitProps = this.allDaySplitter.splitProps(props)
    let resourceOrderSpecs = this.parseResourceOrder(options.resourceOrder)
    let resources = this.flattenResources(props.resourceStore, resourceOrderSpecs)
    let resourceDayTableModel = this.buildResourceTimeColsModel(
      props.dateProfile,
      props.dateProfileGenerator,
      resources,
      options.datesAboveResources
    )

    return this.renderLayout(
      options.columnHeader &&
        <ResourceDayHeader
          resources={resources}
          dates={resourceDayTableModel.dayTableModel.headerDates}
          dateProfile={props.dateProfile}
          datesRepDistinctDays={true}
          renderIntro={this.renderHeadIntro}
        />,
      options.allDaySlot && ((contentArg: ChunkContentCallbackArgs) => (
        <ResourceDayTable
          {...splitProps['allDay']}
          dateProfile={props.dateProfile}
          resourceDayTableModel={resourceDayTableModel}
          isRigid={false}
          nextDayThreshold={nextDayThreshold}
          colGroupNode={contentArg.tableColGroupNode}
          renderNumberIntro={this.renderTableIntro}
          renderBgIntro={this.renderTableBgIntro}
          renderIntro={this.renderTableIntro}
          colWeekNumbersVisible={false}
          cellWeekNumbersVisible={false}
          eventLimit={this.getAllDayEventLimit()}
          vGrow={false}
          headerAlignElRef={this.headerElRef}
          clientWidth={contentArg.clientWidth}
        />
      )),
      (contentArg: ChunkContentCallbackArgs) => (
        <ResourceDayTimeCols
          {...splitProps['timed']}
          dateProfile={props.dateProfile}
          resourceDayTableModel={resourceDayTableModel}
          tableColGroupNode={contentArg.tableColGroupNode}
          tableMinWidth={contentArg.tableMinWidth}
          clientWidth={contentArg.clientWidth}
          clientHeight={contentArg.clientHeight}
          vGrowRows={contentArg.vGrowRows}
          renderBgIntro={this.renderTimeColsBgIntro}
          renderIntro={this.renderTimeColsIntro}
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
