import { ComponentContext, DateProfileGenerator, memoize, parseFieldSpecs, DateProfile } from '@fullcalendar/core'
import { AbstractDayGridView, buildBasicDayTable } from '@fullcalendar/daygrid'
import { ResourceDayHeader, ResourceDayTable, DayResourceTable, ResourceViewProps, Resource, flattenResources } from '@fullcalendar/resource-common'
import ResourceDayGrid from './ResourceDayGrid'


export default class ResourceDayGridView extends AbstractDayGridView {

  static needsResourceData = true // for ResourceViewProps
  props: ResourceViewProps

  header: ResourceDayHeader
  resourceDayGrid: ResourceDayGrid

  private resourceOrderSpecs: any
  private flattenResources = memoize(flattenResources)
  private buildResourceDayTable = memoize(buildResourceDayTable)


  _processOptions(options) {
    super._processOptions(options)

    this.resourceOrderSpecs = parseFieldSpecs(options.resourceOrder)
  }


  render(props: ResourceViewProps, context: ComponentContext) {
    super.render(props, context) // for flags for updateSize. also _renderSkeleton/_unrenderSkeleton

    let { options, nextDayThreshold } = context

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

    this.resourceDayGrid.receiveProps({
      dateProfile: props.dateProfile,
      resourceDayTable,
      businessHours: props.businessHours,
      eventStore: props.eventStore,
      eventUiBases: props.eventUiBases,
      dateSelection: props.dateSelection,
      eventSelection: props.eventSelection,
      eventDrag: props.eventDrag,
      eventResize: props.eventResize,
      isRigid: this.hasRigidRows(),
      nextDayThreshold
    }, context)
  }


  _renderSkeleton(context: ComponentContext) {
    super._renderSkeleton(context)

    if (context.options.columnHeader) {
      this.header = new ResourceDayHeader(
        this.el.querySelector('.fc-head-container')
      )
    }

    this.resourceDayGrid = new ResourceDayGrid(this.dayGrid)
  }


  _unrenderSkeleton() {
    super._unrenderSkeleton()

    if (this.header) {
      this.header.destroy()
    }

    this.resourceDayGrid.destroy()
  }

}

function buildResourceDayTable(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator, resources: Resource[], datesAboveResources: boolean) {
  let dayTable = buildBasicDayTable(dateProfile, dateProfileGenerator)

  return datesAboveResources ?
    new DayResourceTable(dayTable, resources) :
    new ResourceDayTable(dayTable, resources)
}
