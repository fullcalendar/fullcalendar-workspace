import { AbstractAgendaView, ComponentContext, ViewSpec, DateProfileGenerator, ViewProps, reselector, parseFieldSpecs, DateProfile, buildAgendaDayTable } from 'fullcalendar'
import ResourceDayHeader from '../common/ResourceDayHeader'
import { flattenResources } from '../common/resource-hierarchy'
import { Resource } from '../structs/resource'
import { ResourceDayTable, DayResourceTable } from '../common/resource-day-table'
import ResourceTimeGrid from './ResourceTimeGrid'
import ResourceDayGrid from '../resource-basic/ResourceDayGrid'

export default class ResourceAgendaView extends AbstractAgendaView {

  header: ResourceDayHeader
  resourceTimeGrid: ResourceTimeGrid
  resourceDayGrid: ResourceDayGrid

  private resourceOrderSpecs: any
  private flattenResources = reselector(flattenResources)
  private buildResourceDayTable = reselector(buildResourceDayTable)

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

  render(props: ViewProps) {
    super.render(props) // for flags for updateSize

    let resources = this.flattenResources(props.resourceStore, this.resourceOrderSpecs)
    let resourceDayTable = this.buildResourceDayTable(
      this.props.dateProfile,
      this.dateProfileGenerator,
      resources,
      this.opt('groupByDateAndResource')
    )

    let { splitter } = this
    let eventStores = splitter.splitEventStore(props.eventStore)
    let eventDrags = splitter.splitEventDrag(props.eventDrag)
    let eventResizes = splitter.splitEventResize(props.eventResize)

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
      dateProfile: props.dateProfile,
      resourceDayTable,
      businessHours: props.businessHours,
      eventStore: eventStores.timed,
      eventUiBases: props.eventUiBases,
      dateSelection: props.dateSelection,
      eventSelection: props.eventSelection,
      eventDrag: eventDrags.timed,
      eventResize: eventResizes.timed
    })

    if (this.resourceDayGrid) {
      this.resourceDayGrid.receiveProps({
        dateProfile: props.dateProfile,
        resourceDayTable,
        businessHours: props.businessHours,
        eventStore: eventStores.allDay,
        eventUiBases: props.eventUiBases,
        dateSelection: props.dateSelection,
        eventSelection: props.eventSelection,
        eventDrag: eventDrags.allDay,
        eventResize: eventResizes.allDay,
        isRigid: false,
        nextDayThreshold: this.nextDayThreshold
      })
    }
  }

  renderNowIndicator(date) {
    this.resourceTimeGrid.renderNowIndicator(date)
  }

}

function buildResourceDayTable(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator, resources: Resource[], groupByDateAndResource: boolean) {
  let dayTable = buildAgendaDayTable(dateProfile, dateProfileGenerator)

  return groupByDateAndResource ?
    new DayResourceTable(dayTable, resources) :
    new ResourceDayTable(dayTable, resources)
}
