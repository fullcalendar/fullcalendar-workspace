import { DateSpan, DayGrid, EventSegUiInteractionState, Component, assignTo, EventRenderRange, EventDef, DateProfile, EventStore, EventUiHash, sliceEventStore, sliceBusinessHours, EventInteractionUiState, ComponentContext, reselector,
  DayGrid_eventRangeToSegs,
  DayGrid_dateSpanToSegs,
  DayGridSeg,
  Duration
} from "fullcalendar"
import { AbstractResourceDayTable } from './resource-day-table'

export interface ResourceDayGridProps {
  dateProfile: DateProfile | null
  resourceDayTable: AbstractResourceDayTable
  businessHours: EventStore
  eventStore: EventStore
  eventUis: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionUiState | null
  eventResize: EventInteractionUiState | null
  isRigid: boolean
  nextDayThreshold: Duration
}

export default class ResourceDayGrid extends Component<ResourceDayGridProps> {

  dayGrid: DayGrid

  businessHoursToSegs = reselector(businessHoursToSegs)
  eventStoreToSegs = reselector(eventStoreToSegs)
  buildDateSelection = reselector(dateSpanToSegs)
  buildEventDrag = reselector(buildSegInteraction)
  buildEventResize = reselector(buildSegInteraction)

  constructor(context: ComponentContext, dayGrid: DayGrid) {
    super(context)

    this.dayGrid = dayGrid
  }

  render(props: ResourceDayGridProps) {
    let { dayGrid } = this
    let { dateProfile, resourceDayTable, nextDayThreshold } = props

    dayGrid.receiveProps({
      dateProfile: props.dateProfile,
      cells: props.resourceDayTable.cells,
      businessHourSegs: this.businessHoursToSegs(props.businessHours, dateProfile, resourceDayTable, nextDayThreshold, dayGrid),
      eventSegs: this.eventStoreToSegs(props.eventStore, props.eventUis, dateProfile, resourceDayTable, nextDayThreshold, dayGrid),
      dateSelectionSegs: this.buildDateSelection(props.dateSelection, resourceDayTable, dayGrid),
      eventSelection: props.eventSelection,
      eventDrag: this.buildEventDrag(props.eventDrag, dateProfile, resourceDayTable, nextDayThreshold, dayGrid),
      eventResize: this.buildEventResize(props.eventResize, dateProfile, resourceDayTable, nextDayThreshold, dayGrid),
      isRigid: props.isRigid
    })
  }

}

function buildSegInteraction(interaction: EventInteractionUiState, dateProfile: DateProfile, resourceDayTable: AbstractResourceDayTable, nextDayThreshold: Duration, dayGrid: DayGrid): EventSegUiInteractionState {
  if (!interaction) {
    return null
  }

  return {
    segs: eventRangesToSegs(
      sliceEventStore(interaction.mutatedEvents, interaction.eventUis, dateProfile.activeRange, nextDayThreshold),
      resourceDayTable,
      dayGrid
    ),
    affectedInstances: interaction.affectedEvents.instances,
    isEvent: interaction.isEvent,
    sourceSeg: interaction.origSeg
  }
}

function dateSpanToSegs(dateSpan: DateSpan, resourceDayTable: AbstractResourceDayTable, dayGrid: DayGrid) {
  return dateSpan ? DayGrid_dateSpanToSegs(dateSpan, resourceDayTable.dayTable, dayGrid) : null
}

function businessHoursToSegs(businessHours: EventStore, dateProfile: DateProfile, resourceDayTable: AbstractResourceDayTable, nextDayThreshold: Duration, dayGrid: DayGrid) {
  return eventRangesToSegs(
    sliceBusinessHours(businessHours, dateProfile.activeRange, nextDayThreshold, dayGrid.calendar),
    resourceDayTable,
    dayGrid
  )
}

function eventStoreToSegs(eventStore: EventStore, eventUis: EventUiHash, dateProfile: DateProfile, resourceDayTable: AbstractResourceDayTable, nextDayThreshold: Duration, dayGrid: DayGrid) {
  return eventRangesToSegs(
    sliceEventStore(eventStore, eventUis, dateProfile.activeRange, nextDayThreshold),
    resourceDayTable,
    dayGrid
  )
}

function eventRangesToSegs(eventRanges: EventRenderRange[], resourceDayTable: AbstractResourceDayTable, dayGrid: DayGrid): DayGridSeg[] {
  let segs = []

  for (let eventRange of eventRanges) {
    segs.push(...eventRangeToSegs(eventRange, resourceDayTable, dayGrid))
  }

  return segs
}

function eventRangeToSegs(eventRange: EventRenderRange, resourceDayTable: AbstractResourceDayTable, dayGrid: DayGrid): DayGridSeg[] {
  return multiplySegs(
    DayGrid_eventRangeToSegs(eventRange, resourceDayTable.dayTable, dayGrid),
    extractEventResourceIds(eventRange.def),
    resourceDayTable
  )
}

// copied and pasted!!!
function multiplySegs(rawSegs: DayGridSeg[], resourceIds: string[], resourceDayTable: AbstractResourceDayTable): DayGridSeg[] {
  let segs: DayGridSeg[] = []

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
