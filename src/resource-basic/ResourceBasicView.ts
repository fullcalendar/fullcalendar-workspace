import { ComponentContext, ViewSpec, DateProfileGenerator, memoize, parseFieldSpecs, DateProfile } from 'fullcalendar'
import { AbstractBasicView, buildBasicDayTable } from 'fullcalendar-basic'
import { ResourceDayHeader, ResourceDayTable, DayResourceTable } from 'fullcalendar-resources'
import ResourceDayGrid from './ResourceDayGrid'
import { ResourceViewProps, Resource, flattenResources } from 'fullcalendar-resources'

export default class ResourceBasicView extends AbstractBasicView {

  static needsResourceData = true // for ResourceViewProps
  props: ResourceViewProps

  header: ResourceDayHeader
  resourceDayGrid: ResourceDayGrid

  private resourceOrderSpecs: any
  private flattenResources = memoize(flattenResources)
  private buildResourceDayTable = memoize(buildResourceDayTable)

  constructor(
    context: ComponentContext,
    viewSpec: ViewSpec,
    dateProfileGenerator: DateProfileGenerator,
    parentEl: HTMLElement
  ) {
    super(context, viewSpec, dateProfileGenerator, parentEl)

    this.resourceOrderSpecs = parseFieldSpecs(this.opt('resourceOrder'))

    if (this.opt('columnHeader')) {
      this.header = new ResourceDayHeader(
        this.context,
        this.el.querySelector('.fc-head-container')
      )
    }

    this.resourceDayGrid = new ResourceDayGrid(context, this.dayGrid)
  }

  destroy() {
    super.destroy()

    if (this.header) {
      this.header.destroy()
    }

    this.resourceDayGrid.destroy()
  }

  render(props: ResourceViewProps) {
    super.render(props) // for flags for updateSize

    let resources = this.flattenResources(props.resourceStore, this.resourceOrderSpecs)
    let resourceDayTable = this.buildResourceDayTable(
      this.props.dateProfile,
      this.dateProfileGenerator,
      resources,
      this.opt('groupByDateAndResource')
    )

    if (this.header) {
      this.header.receiveProps({
        resources,
        dates: resourceDayTable.dayTable.headerDates,
        dateProfile: props.dateProfile,
        datesRepDistinctDays: true,
        renderIntroHtml: this.renderHeadIntroHtml
      })
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
      nextDayThreshold: this.nextDayThreshold
    })
  }

}

function buildResourceDayTable(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator, resources: Resource[], groupByDateAndResource: boolean) {
  let dayTable = buildBasicDayTable(dateProfile, dateProfileGenerator)

  return groupByDateAndResource ?
    new DayResourceTable(dayTable, resources) :
    new ResourceDayTable(dayTable, resources)
}
