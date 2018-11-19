import { AbstractBasicView, ComponentContext, ViewSpec, DateProfileGenerator, ViewProps, reselector, parseFieldSpecs, DateProfile, DayTable, DaySeries } from 'fullcalendar'
import ResourceDayHeader from '../common/ResourceDayHeader'
import { buildRowNodes } from '../common/resource-hierarchy'
import { ResourceHash, Resource } from '../structs/resource'
import { ResourceDayTable, DayResourceTable } from '../common/resource-day-table'
import ResourceDayGrid from './ResourceDayGrid'

export default class AgendaView extends AbstractBasicView {

  header: ResourceDayHeader
  resourceDayGrid: ResourceDayGrid

  flattenResources = reselector(flattenResources)
  buildResourceDayTable = reselector(buildResourceDayTable)

  constructor(
    context: ComponentContext,
    viewSpec: ViewSpec,
    dateProfileGenerator: DateProfileGenerator,
    parentEl: HTMLElement
  ) {
    super(context, viewSpec, dateProfileGenerator, parentEl)

    if (this.opt('columnHeader')) {
      this.header = new ResourceDayHeader(
        this.context,
        this.el.querySelector('.fc-head-container')
      )
    }

    if (this.dayGrid) {
      this.resourceDayGrid = new ResourceDayGrid(context, this.dayGrid)
    }
  }

  destroy() {
    super.destroy()

    if (this.header) {
      this.header.destroy()
    }
  }

  render(props: ViewProps) {
    super.render(props) // for flags for updateSize

    let resourceStore = (this.props as any).resourceStore
    let resources = this.flattenResources(resourceStore, this.opt('resourceOrder'))
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
      eventUis: props.eventUis,
      dateSelection: props.dateSelection,
      eventSelection: props.eventSelection,
      eventDrag: props.eventDrag,
      eventResize: props.eventResize,
      isRigid: this.hasRigidRows(),
      nextDayThreshold: this.nextDayThreshold
    })
  }

}


// TODO: make utils!!!...

function flattenResources(resourceStore: ResourceHash, orderInput): Resource[] {
  // NOTE: abusing this util function. don't need grouping for example
  return buildRowNodes(resourceStore, [], parseFieldSpecs(orderInput), false)
    .map(function(node) {
      return node.resource
    })
}

function buildResourceDayTable(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator, resources: Resource[], groupByDateAndResource: boolean) {
  let dayTable = buildDayTable(dateProfile, dateProfileGenerator)

  return groupByDateAndResource ?
    new DayResourceTable(dayTable, resources) :
    new ResourceDayTable(dayTable, resources)
}

function buildDayTable(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator): DayTable {
  let daySeries = new DaySeries(dateProfile.renderRange, dateProfileGenerator)

  return new DayTable(
    daySeries,
    /year|month|week/.test(dateProfile.currentRangeUnit)
  )
}
