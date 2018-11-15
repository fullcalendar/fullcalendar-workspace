import { DateSpan, TimeGridSeg, dateSpanToSegs as dateSpanToSimpleSegs, EventSegUiInteractionState, Component, eventRangeToSegs as eventRangeToSimpleSegs, DateRange, TimeGrid, assignTo, EventRenderRange, EventDef, DateProfile, EventStore, EventUiHash, sliceEventStore, sliceBusinessHours, EventInteractionUiState, ComponentContext, buildDayRanges, reselector } from "fullcalendar"
import { AbstractResourceDayTable } from './resource-day-table'

export interface ResourceTimeGridProps {
  dateProfile: DateProfile | null
  resourceDayTable: AbstractResourceDayTable
  businessHours: EventStore
  eventStore: EventStore
  eventUis: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionUiState | null
  eventResize: EventInteractionUiState | null
}

export default class ResourceTimeGrid extends Component<ResourceTimeGridProps> {

  timeGrid: TimeGrid

  buildDayRanges = reselector(buildDayRanges)
  businessHoursToSegs = reselector(businessHoursToSegs)
  eventStoreToSegs = reselector(eventStoreToSegs)
  buildDateSelection = reselector(dateSpanToSegs)
  buildEventDrag = reselector(buildSegInteraction)
  buildEventResize = reselector(buildSegInteraction)

  constructor(context: ComponentContext, timeGrid: TimeGrid) {
    super(context)

    this.timeGrid = timeGrid
  }

  render(props: ResourceTimeGridProps) {
    let { timeGrid } = this
    let { dateProfile, resourceDayTable } = props

    let dayRanges = this.buildDayRanges(resourceDayTable.dayTable, dateProfile, this.dateEnv)

    timeGrid.receiveProps({
      dateProfile: props.dateProfile,
      cells: props.resourceDayTable.cells[0],
      businessHourSegs: this.businessHoursToSegs(props.businessHours, resourceDayTable, dateProfile, dayRanges, timeGrid),
      eventSegs: this.eventStoreToSegs(props.eventStore, props.eventUis, resourceDayTable, dateProfile, dayRanges, timeGrid),
      dateSelectionSegs: this.buildDateSelection(props.dateSelection, resourceDayTable, dayRanges, timeGrid),
      eventSelection: props.eventSelection,
      eventDrag: this.buildEventDrag(props.eventDrag, resourceDayTable, dateProfile, dayRanges, timeGrid),
      eventResize: this.buildEventResize(props.eventResize, resourceDayTable, dateProfile, dayRanges, timeGrid)
    })
  }

}

function buildSegInteraction(interaction: EventInteractionUiState, resourceDayTable: AbstractResourceDayTable, dateProfile: DateProfile, dayRanges: DateRange[], timeGrid: TimeGrid): EventSegUiInteractionState {
  if (!interaction) {
    return null
  }

  return {
    segs: eventRangesToSegs(
      sliceEventStore(interaction.mutatedEvents, interaction.eventUis, dateProfile.activeRange),
      resourceDayTable,
      dayRanges,
      timeGrid
    ),
    affectedInstances: interaction.affectedEvents.instances,
    isEvent: interaction.isEvent,
    sourceSeg: interaction.origSeg
  }
}

function eventStoreToSegs(eventStore: EventStore, eventUis: EventUiHash, resourceDayTable: AbstractResourceDayTable, dateProfile: DateProfile, dayRanges: DateRange[], timeGrid: TimeGrid) {
  return eventRangesToSegs(
    sliceEventStore(eventStore, eventUis, dateProfile.activeRange),
    resourceDayTable,
    dayRanges,
    timeGrid
  )
}

function businessHoursToSegs(businessHours: EventStore, resourceDayTable: AbstractResourceDayTable, dateProfile: DateProfile, dayRanges: DateRange[], timeGrid: TimeGrid) {
  return eventRangesToSegs(
    sliceBusinessHours(businessHours, dateProfile.activeRange, null, timeGrid.calendar),
    resourceDayTable,
    dayRanges,
    timeGrid
  )
}

function eventRangesToSegs(eventRanges: EventRenderRange[], resourceDayTable: AbstractResourceDayTable, dayRanges: DateRange[], timeGrid: TimeGrid): TimeGridSeg[] {
  let segs = []

  for (let eventRange of eventRanges) {
    segs.push(...eventRangeToSegs(eventRange, resourceDayTable, dayRanges, timeGrid))
  }

  return segs
}

function eventRangeToSegs(eventRange: EventRenderRange, resourceDayTable: AbstractResourceDayTable, dayRanges: DateRange[], timeGrid: TimeGrid): TimeGridSeg[] {
  return multiplySegs(
    eventRangeToSimpleSegs(eventRange, dayRanges, timeGrid),
    extractEventResourceIds(eventRange.def),
    resourceDayTable
  )
}

function dateSpanToSegs(dateSpan: DateSpan, resourceDayTable: AbstractResourceDayTable, dayRanges: DateRange[], timeGrid: TimeGrid): TimeGridSeg[] {
  if (!dateSpan) {
    return null
  }

  return multiplySegs(
    dateSpanToSimpleSegs(dateSpan, dayRanges, timeGrid),
    dateSpan.resourceId ? [ dateSpan.resourceId ] : [],
    resourceDayTable
  )
}

function multiplySegs(rawSegs: TimeGridSeg[], resourceIds: string[], resourceDayTable: AbstractResourceDayTable): TimeGridSeg[] {
  let segs: TimeGridSeg[] = []

  if (!resourceIds.length) {
    resourceIds = resourceDayTable.resourceIndex.publicIds
  }

  for (let rawSeg of rawSegs) {

    for (let resourceId of resourceIds) {
      let resourceIndex = resourceDayTable.resourceIndex.indicesByPublicId[resourceId]

      if (resourceIndex != null) {
        segs.push(
          assignTo({}, rawSeg, {
            col: resourceDayTable.computeCol(
              rawSeg.col,
              resourceIndex
            )
          })
        )
      }
    }
  }

  return segs
}

// copied and pasted!!!
function extractEventResourceIds(def: EventDef) {
  let resourceIds = def.extendedProps.resourceIds || [] /// put in real Def object?
  let resourceId = def.extendedProps.resourceId

  if (resourceId) {
    resourceIds.push(resourceId)
  }

  return resourceIds
}
