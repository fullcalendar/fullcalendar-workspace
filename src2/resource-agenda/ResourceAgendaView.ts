import { AbstractAgendaView, TimeGrid, DayGrid, DateProfile, DaySeries, DateProfileGenerator, ComponentContext, ViewSpec, TimeGridSlicer, DayGridSlicer, reselector, assignTo, StandardDateComponentProps, parseFieldSpecs } from 'fullcalendar'
import ResourceDayHeader from '../common/ResourceDayHeader'
import { ResourceHash, Resource } from '../structs/resource'
import { buildRowNodes } from '../timeline/resource-hierarchy'

export default class AgendaView extends AbstractAgendaView {

  header: ResourceDayHeader

  constructor(
    context: ComponentContext,
    viewSpec: ViewSpec,
    dateProfileGenerator: DateProfileGenerator,
    parentEl: HTMLElement
  ) {
    super(context, viewSpec, dateProfileGenerator, parentEl, TimeGrid, DayGrid)

    if (this.opt('columnHeader')) {
      this.header = new ResourceDayHeader(
        this.context,
        this.el.querySelector('.fc-head-container')
      )
    }
  }

  destroy() {
    super.destroy()

    if (this.header) {
      this.header.destroy()
    }
  }

  render(props: StandardDateComponentProps) {
    super.render(props)

    let allDaySeletion = null
    let timedSelection = null

    if (props.dateSelection) {
      if (props.dateSelection.allDay) {
        allDaySeletion = props.dateSelection
      } else {
        timedSelection = props.dateSelection
      }
    }

    let timeGridSlicer = this.buildTimeGridSlicer(props.dateProfile)

    if (this.header) {
      this.header.receiveProps({
        resources: this.flattenResources((this.props as any).resourceStore, this.opt('resourceOrder')),
        dates: timeGridSlicer.daySeries.dates,
        dateProfile: props.dateProfile,
        datesRepDistinctDays: true,
        renderIntroHtml: this.renderHeadIntroHtml
      })
    }

    this.timeGrid.receiveProps(
      assignTo({}, props, {
        eventStore: this.filterEventsForTimeGrid(props.eventStore, props.eventUis),
        dateSelection: timedSelection,
        eventDrag: this.buildEventDragForTimeGrid(props.eventDrag),
        eventResize: this.buildEventResizeForTimeGrid(props.eventResize),
        slicer: timeGridSlicer
      })
    )

    if (this.dayGrid) {
      this.dayGrid.receiveProps(
        assignTo({}, props, {
          eventStore: this.filterEventsForDayGrid(props.eventStore, props.eventUis),
          dateSelection: allDaySeletion,
          eventDrag: this.buildEventDragForDayGrid(props.eventDrag),
          eventResize: this.buildEventResizeForDayGrid(props.eventResize),
          slicer: this.buildDayGridSlicer(props.dateProfile)
        })
      )
    }
  }

  flattenResources = reselector(function(resourceStore: ResourceHash, orderInput): Resource[] {
    // NOTE: abusing this util function. don't need grouping for example
    return buildRowNodes(resourceStore, [], parseFieldSpecs(orderInput), false)
      .map(function(node) {
        return node.resource
      })
  })

  buildDayGridSlicer = reselector(function(this: AgendaView, dateProfile: DateProfile) {
    return new DayGridSlicer(
      new DaySeries(dateProfile.renderRange, this.dateProfileGenerator),
      this.isRtl,
      false
    )
  })

  buildTimeGridSlicer = reselector(function(this: AgendaView, dateProfile) {
    return new TimeGridSlicer(
      dateProfile,
      this.dateProfileGenerator,
      this.dateEnv
    )
  })

}
