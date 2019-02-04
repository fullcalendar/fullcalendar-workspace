import { ComponentContext, ViewSpec, DateProfileGenerator, memoize, parseFieldSpecs, DateProfile } from '@fullcalendar/core'
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

    this.resourceTimeGrid = new ResourceTimeGrid(context, this.timeGrid)

    if (this.dayGrid) {
      this.resourceDayGrid = new ResourceDayGrid(context, this.dayGrid)
    }
  }

  destroy() {
    super.destroy()

    if (this.header) {
      this.header.destroy()
    }

    this.resourceTimeGrid.destroy()

    if (this.resourceDayGrid) {
      this.resourceDayGrid.destroy()
    }
  }

  render(props: ResourceViewProps) {
    super.render(props) // for flags for updateSize

    let splitProps = this.splitter.splitProps(props)
    let resources = this.flattenResources(props.resourceStore, this.resourceOrderSpecs)
    let resourceDayTable = this.buildResourceDayTable(
      this.props.dateProfile,
      this.dateProfileGenerator,
      resources,
      this.opt('datesAboveResources')
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

    this.resourceTimeGrid.receiveProps({
      ...splitProps['timed'],
      dateProfile: props.dateProfile,
      resourceDayTable
    })

    if (this.resourceDayGrid) {
      this.resourceDayGrid.receiveProps({
        ...splitProps['allDay'],
        dateProfile: props.dateProfile,
        resourceDayTable,
        isRigid: false,
        nextDayThreshold: this.nextDayThreshold
      })
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
