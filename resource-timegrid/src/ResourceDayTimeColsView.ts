import { ComponentContext, DateProfileGenerator, memoize, parseFieldSpecs, DateProfile, renderer } from '@fullcalendar/core'
import { TimeColsView, buildDayTableModel as buildAgendaDayTableModel } from '@fullcalendar/timegrid'
import { ResourceDayHeader, ResourceDayTableModel, DayResourceTableModel, ResourceViewProps, Resource, flattenResources } from '@fullcalendar/resource-common'
import { ResourceDayTable } from '@fullcalendar/resource-daygrid'
import ResourceDayTimeCols from './ResourceDayTimeCols'

export default class ResourceDayTimeColsView extends TimeColsView {

  static needsResourceData = true // for ResourceViewProps
  props: ResourceViewProps

  private processOptions = memoize(this._processOptions)
  private flattenResources = memoize(flattenResources)
  private buildResourceDayTableModel = memoize(buildResourceDayTableModel)
  private renderHeader = renderer(ResourceDayHeader)
  private renderTable = renderer(ResourceDayTable)
  private renderTimeCols = renderer(ResourceDayTimeCols)

  private allDayTable: ResourceDayTable
  private timeCols: ResourceDayTimeCols
  private resourceOrderSpecs: any


  render(props: ResourceViewProps, context: ComponentContext) {
    let { options, nextDayThreshold } = context

    this.processOptions(options)

    let splitProps = this.allDaySplitter.splitProps(props)
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
    } = this.renderLayout({ type: props.viewSpec.type })

    this.renderHeader({
      parentEl: headerWrapEl, // might be null
      resources,
      dates: resourceDayTableModel.dayTableModel.headerDates,
      dateProfile: props.dateProfile,
      datesRepDistinctDays: true,
      renderIntroHtml: this.renderHeadIntroHtml
    })

    let allDayTable = this.renderTable({
      parentEl: contentWrapEl, // might be null
      prepend: true,
      ...splitProps['allDay'],
      dateProfile: props.dateProfile,
      resourceDayTableModel,
      isRigid: false,
      nextDayThreshold,
      renderProps: this.tableRenderProps
    })

    let timeCols = this.renderTimeCols({
      parentEl: contentWrapEl,
      ...splitProps['timed'],
      dateProfile: props.dateProfile,
      resourceDayTableModel,
      renderProps: this.timeColsRenderProps
    })

    this.startNowIndicator()

    this.allDayTable = allDayTable
    this.timeCols = timeCols

    return rootEl
  }


  _processOptions(options) {
    this.resourceOrderSpecs = parseFieldSpecs(options.resourceOrder)
  }


  updateSize(isResize: boolean, viewHeight: number, isAuto: boolean) {

    if (isResize || this.isLayoutSizeDirty()) {
      this.updateLayoutSize(
        this.timeCols.timeCols,
        this.allDayTable ? this.allDayTable.table : null,
        viewHeight,
        isAuto
      )
    }

    if (this.allDayTable) {
      this.allDayTable.updateSize(isResize)
    }

    this.timeCols.updateSize(isResize)
  }


  getAllDayTableObj() {
    return this.allDayTable
  }


  getTimeColsObj() {
    return this.timeCols
  }

}


function buildResourceDayTableModel(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator, resources: Resource[], datesAboveResources: boolean) {
  let dayTable = buildAgendaDayTableModel(dateProfile, dateProfileGenerator)

  return datesAboveResources ?
    new DayResourceTableModel(dayTable, resources) :
    new ResourceDayTableModel(dayTable, resources)
}
