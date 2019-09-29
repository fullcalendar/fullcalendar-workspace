import { ComponentContext, DateProfileGenerator, memoize, parseFieldSpecs, DateProfile } from '@fullcalendar/core'
import { AbstractTimeGridView, buildDayTable as buildAgendaDayTable } from '@fullcalendar/timegrid'
import { ResourceDayHeader, ResourceDayTable, DayResourceTable, ResourceViewProps, Resource, flattenResources } from '@fullcalendar/resource-common'
import { ResourceDayGrid } from '@fullcalendar/resource-daygrid'
import ResourceTimeGrid from './ResourceTimeGrid'

export default class ResourceTimeGridView extends AbstractTimeGridView {

  static needsResourceData = true // for ResourceViewProps
  props: ResourceViewProps

  header: ResourceDayHeader
  resourceTimeGrid: ResourceTimeGrid
  resourceDayGrid: ResourceDayGrid

  private resourceOrderSpecs: any
  private processOptions = memoize(this._processOptions)
  private flattenResources = memoize(flattenResources)
  private buildResourceDayTable = memoize(buildResourceDayTable)


  _processOptions(options) {
    this.resourceOrderSpecs = parseFieldSpecs(options.resourceOrder)
  }


  render(props: ResourceViewProps, context: ComponentContext) {
    super.render(props, context) // for flags for updateSize. and will call _renderSkeleton/_unrenderSkeleton

    let { options, nextDayThreshold } = context

    this.processOptions(options)

    let splitProps = this.splitter.splitProps(props)
    let resources = this.flattenResources(props.resourceStore, this.resourceOrderSpecs)
    let resourceDayTable = this.buildResourceDayTable(
      props.dateProfile,
      props.dateProfileGenerator,
      resources,
      options.datesAboveResources
    )

    if (this.header) {
      this.header.receiveProps({
        resources,
        dates: resourceDayTable.dayTable.headerDates,
        dateProfile: props.dateProfile,
        datesRepDistinctDays: true,
        renderIntroHtml: this.renderHeadIntroHtml
      }, context)
    }

    this.resourceTimeGrid.receiveProps({
      ...splitProps['timed'],
      dateProfile: props.dateProfile,
      resourceDayTable
    }, context)

    if (this.resourceDayGrid) {
      this.resourceDayGrid.receiveProps({
        ...splitProps['allDay'],
        dateProfile: props.dateProfile,
        resourceDayTable,
        isRigid: false,
        nextDayThreshold
      }, context)
    }

    this.startNowIndicator(props.dateProfile, props.dateProfileGenerator)
  }


  _renderSkeleton(context: ComponentContext) {
    super._renderSkeleton(context)

    if (context.options.columnHeader) {
      this.header = new ResourceDayHeader(
        this.el.querySelector('.fc-head-container')
      )
    }

    this.resourceTimeGrid = new ResourceTimeGrid(this.timeGrid)

    if (this.dayGrid) {
      this.resourceDayGrid = new ResourceDayGrid(this.dayGrid)
    }
  }


  _unrenderSkeleton() {
    super._unrenderSkeleton()

    if (this.header) {
      this.header.destroy()
    }

    this.resourceTimeGrid.destroy()

    if (this.resourceDayGrid) {
      this.resourceDayGrid.destroy()
    }
  }


  renderNowIndicator(date) {
    this.resourceTimeGrid.renderNowIndicator(date)
  }

}


function buildResourceDayTable(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator, resources: Resource[], datesAboveResources: boolean) {
  let dayTable = buildAgendaDayTable(dateProfile, dateProfileGenerator)

  return datesAboveResources ?
    new DayResourceTable(dayTable, resources) :
    new ResourceDayTable(dayTable, resources)
}
