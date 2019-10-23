import { ComponentContext, DateProfileGenerator, memoize, parseFieldSpecs, DateProfile, renderer } from '@fullcalendar/core'
import { TableView, buildDayTableModel } from '@fullcalendar/daygrid'
import { ResourceDayHeader, ResourceDayTableModel, DayResourceTableModel, ResourceViewProps, Resource, flattenResources } from '@fullcalendar/resource-common'
import ResourceDayTable from './ResourceDayTable'
import { hasRigidRows } from 'packages/daygrid/src/TableView'


export default class ResourceDayTableView extends TableView {

  static needsResourceData = true // for ResourceViewProps
  props: ResourceViewProps

  private flattenResources = memoize(flattenResources)
  private buildResourceDayTableModel = memoize(buildResourceDayTableModel)
  private renderHeader = renderer(ResourceDayHeader)
  private renderTable = renderer(ResourceDayTable)

  private resourceOrderSpecs: any
  private header: ResourceDayHeader | null
  private table: ResourceDayTable


  _processOptions(options) {
    super._processOptions(options)

    this.resourceOrderSpecs = parseFieldSpecs(options.resourceOrder)
  }


  render(props: ResourceViewProps, context: ComponentContext) {
    let { options, nextDayThreshold } = context

    let resources = this.flattenResources(props.resourceStore, this.resourceOrderSpecs)
    let resourceDayTableModel = this.buildResourceDayTableModel(
      props.dateProfile,
      props.dateProfileGenerator,
      resources,
      options.datesAboveResources
    )

    let {
      rootEl,
      headerWrapEl,
      contentWrapEl
    } = this.renderLayout({ type: props.viewSpec.type }, context)

    let header = this.renderHeader(headerWrapEl, { // might be null!
      resources,
      dates: resourceDayTableModel.dayTableModel.headerDates,
      dateProfile: props.dateProfile,
      datesRepDistinctDays: true,
      renderIntroHtml: this.renderHeadIntroHtml
    })

    let table = this.renderTable(contentWrapEl, {
      dateProfile: props.dateProfile,
      resourceDayTableModel,
      businessHours: props.businessHours,
      eventStore: props.eventStore,
      eventUiBases: props.eventUiBases,
      dateSelection: props.dateSelection,
      eventSelection: props.eventSelection,
      eventDrag: props.eventDrag,
      eventResize: props.eventResize,
      isRigid: hasRigidRows(options),
      nextDayThreshold,
      renderProps: this.tableRenderProps
    })

    this.header = header
    this.table = table

    return rootEl
  }


  updateSize(isResize: boolean, viewHeight: number, isAuto: boolean) {

    if (this.isLayoutSizeDirty()) {
      this.updateLayoutHeight(
        this.header ? this.header.rootEl : null,
        this.table.table,
        viewHeight,
        isAuto,
        this.context.options
      )
    }

    this.table.updateSize(isResize)
  }

}

function buildResourceDayTableModel(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator, resources: Resource[], datesAboveResources: boolean) {
  let dayTable = buildDayTableModel(dateProfile, dateProfileGenerator)

  return datesAboveResources ?
    new DayResourceTableModel(dayTable, resources) :
    new ResourceDayTableModel(dayTable, resources)
}
