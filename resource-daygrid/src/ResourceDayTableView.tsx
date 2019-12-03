import {
  h, createRef,
  ComponentContext, DateProfileGenerator, memoize, parseFieldSpecs, DateProfile
} from '@fullcalendar/core'
import { TableView, buildDayTableModel, hasRigidRows } from '@fullcalendar/daygrid'
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
      <ResourceDayHeader
        ref={this.headerRef}
        resources={resources}
        dates={resourceDayTableModel.dayTableModel.headerDates}
        dateProfile={props.dateProfile}
        datesRepDistinctDays={true}
        renderIntro={this.renderHeadIntro}
      />,
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
        isRigid={hasRigidRows(options)}
        nextDayThreshold={nextDayThreshold}
        renderNumberIntro={this.renderNumberIntro}
        renderBgIntro={this.renderBgIntro}
        renderIntro={this.renderIntro}
        colWeekNumbersVisible={colWeekNumbersVisible}
        cellWeekNumbersVisible={cellWeekNumbersVisible}
      />
    )
  }


  updateSize(isResize: boolean, viewHeight: number, isAuto: boolean) {
    let header = this.headerRef.current
    let table = this.tableRef.current

    if (isResize || this.isLayoutSizeDirty()) {
      this.updateLayoutHeight(
        header ? header.rootEl : null,
        table.table,
        viewHeight,
        isAuto
      )
    }

    table.updateSize(isResize)
  }

}


function buildResourceDayTableModel(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator, resources: Resource[], datesAboveResources: boolean) {
  let dayTable = buildDayTableModel(dateProfile, dateProfileGenerator)

  return datesAboveResources ?
    new DayResourceTableModel(dayTable, resources) :
    new ResourceDayTableModel(dayTable, resources)
}
