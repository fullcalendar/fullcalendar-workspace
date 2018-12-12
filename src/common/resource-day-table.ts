import { SlicedProps, EventDef, mapHash, Splitter, DayTable, DayTableCell, ViewSpec, SplittableProps, DateSpan, Seg, memoize, EventSegUiInteractionState } from 'fullcalendar'
import { Resource } from '../structs/resource'

export interface ResourceDayTableCell extends DayTableCell {
  resource: Resource
}

export abstract class AbstractResourceDayTable {

  cells: ResourceDayTableCell[][]
  rowCnt: number
  colCnt: number
  dayTable: DayTable
  resources: Resource[]
  resourceIndex: ResourceIndex


  constructor(dayTable: DayTable, resources: Resource[]) {
    this.dayTable = dayTable
    this.resources = resources
    this.resourceIndex = new ResourceIndex(resources)

    this.rowCnt = dayTable.rowCnt
    this.colCnt = dayTable.colCnt * resources.length

    this.cells = this.buildCells()
  }


  abstract computeCol(dateI, resourceI): number


  buildCells(): ResourceDayTableCell[][] {
    let { rowCnt, dayTable, resources } = this
    let rows: ResourceDayTableCell[][] = []

    for (let row = 0; row < rowCnt; row++) {
      let rowCells: ResourceDayTableCell[] = []

      for (let dateCol = 0; dateCol < dayTable.colCnt; dateCol++) {

        for (let resourceCol = 0; resourceCol < resources.length; resourceCol++) {
          let resource = resources[resourceCol]
          let htmlAttrs = 'data-resource-id="' + resource.id + '"'

          rowCells[
            this.computeCol(dateCol, resourceCol)
          ] = {
            date: dayTable.cells[row][dateCol].date,
            resource,
            htmlAttrs
          }
        }
      }

      rows.push(rowCells)
    }

    return rows
  }

}


/*
resources over dates
*/
export class ResourceDayTable extends AbstractResourceDayTable {

  computeCol(dateI, resourceI) {
    return resourceI * this.dayTable.colCnt + dateI
  }

}


/*
dates over resources
*/
export class DayResourceTable extends AbstractResourceDayTable {

  computeCol(dateI, resourceI) {
    return dateI * this.resources.length + resourceI
  }

}


export class ResourceIndex {

  indicesById: { [resourceId: string]: number }
  ids: string[]
  length: number

  constructor(resources: Resource[]) {
    let indicesById = {}
    let ids = []

    for (let i = 0; i < resources.length; i++) {
      let id = resources[i].id

      ids.push(id)
      indicesById[id] = i
    }

    this.ids = ids
    this.indicesById = indicesById
    this.length = resources.length
  }

}


export function isVResourceViewEnabled(viewSpec: ViewSpec) {
  let { options } = viewSpec

  return options.resources && (
    viewSpec.singleUnit === 'day' ||
    options.groupByResource ||
    options.groupByDateAndResource
  )
}


// splitter

export interface VResourceProps extends SplittableProps {
  resourceDayTable: AbstractResourceDayTable
}

/*
TODO: just use ResourceHash somehow? would help code reuse
*/
export class VResourceSplitter extends Splitter<VResourceProps> {

  getAllKeys(props: VResourceProps) {
    return props.resourceDayTable.resourceIndex.ids.concat([ '' ])
  }

  getKeyBusinessHours(props: VResourceProps) {
    let { resourceDayTable } = props

    return mapHash(resourceDayTable.resourceIndex.indicesById, function(i) {
      return resourceDayTable.resources[i].businessHours
    })
  }

  getKeyEventUis(props: VResourceProps) {
    let { resourceDayTable } = props

    return mapHash(resourceDayTable.resourceIndex.indicesById, function(i) {
      return resourceDayTable.resources[i].ui
    })
  }

  getKeysForDateSpan(dateSpan: DateSpan): string[] {
    return [ dateSpan.resourceId || '' ]
  }

  getKeysForEventDef(eventDef: EventDef): string[] {
    let resourceIds = eventDef.resourceIds

    if (!resourceIds.length) {
      return [ '' ]
    }

    return resourceIds
  }

}


// joiner

const NO_SEGS = [] // for memoizing

export abstract class VResourceJoiner<SegType extends Seg> {

  private joinDateSelection = memoize(this.joinSegs)
  private joinBusinessHours = memoize(this.joinSegs)
  private joinFgEvents = memoize(this.joinSegs)
  private joinBgEvents = memoize(this.joinSegs)
  private joinEventDrags = memoize(this.joinInteractions)
  private joinEventResizes = memoize(this.joinInteractions)

  /*
  propSets also has a '' key for things with no resource
  */
  joinProps(propSets: { [resourceId: string]: SlicedProps<SegType> }, resourceDayTable: AbstractResourceDayTable): SlicedProps<SegType> {
    let dateSelectionSets = []
    let businessHoursSets = []
    let fgEventSets = []
    let bgEventSets = []
    let eventDrags = []
    let eventResizes = []
    let eventSelection = ''
    let keys = resourceDayTable.resourceIndex.ids.concat([ '' ]) // add in the all-resource key

    for (let key of keys) {
      let props = propSets[key]

      dateSelectionSets.push(props.dateSelectionSegs)
      businessHoursSets.push(props.businessHourSegs)
      fgEventSets.push(key ? props.fgEventSegs : NO_SEGS) // don't include fg all-resource segs
      bgEventSets.push(props.bgEventSegs)
      eventDrags.push(props.eventDrag)
      eventResizes.push(props.eventResize)
      eventSelection = eventSelection || props.eventSelection
    }

    return {
      dateSelectionSegs: this.joinDateSelection(resourceDayTable, ...dateSelectionSets),
      businessHourSegs: this.joinBusinessHours(resourceDayTable, ...businessHoursSets),
      fgEventSegs: this.joinFgEvents(resourceDayTable, ...fgEventSets),
      bgEventSegs: this.joinBgEvents(resourceDayTable, ...bgEventSets),
      eventDrag: this.joinEventDrags(resourceDayTable, ...eventDrags),
      eventResize: this.joinEventResizes(resourceDayTable, ...eventResizes),
      eventSelection
    }
  }

  joinSegs(resourceDayTable: AbstractResourceDayTable, ...segGroups: SegType[][]): SegType[] {
    let transformedSegs = []
    let colCnt = segGroups.length - 1 // because last item is the all-resource

    for (let i = 0; i < colCnt; i++) {

      for (let seg of segGroups[i]) {
        transformedSegs.push(
          this.transformSeg(seg, resourceDayTable, i)
        )
      }

      for (let seg of segGroups[colCnt]) { // all-resource
        transformedSegs.push(
          this.transformSeg(seg, resourceDayTable, i)
        )
      }

    }

    return transformedSegs
  }

  joinInteractions(resourceDayTable: AbstractResourceDayTable, ...interactions: EventSegUiInteractionState[]): EventSegUiInteractionState {
    let affectedInstances = {}
    let transformedSegs = []
    let isEvent = false
    let sourceSeg = null
    let colCnt = interactions.length - 1 // because last item is the all-resource

    for (let i = 0; i < colCnt; i++) {
      let interaction = interactions[i]

      if (interaction) {

        for (let seg of interaction.segs) {
          transformedSegs.push(
            this.transformSeg(seg as SegType, resourceDayTable, i) // TODO: templateify Interaction::segs
          )
        }

        Object.assign(affectedInstances, interaction.affectedInstances)
        isEvent = isEvent || interaction.isEvent
        sourceSeg = sourceSeg || interaction.sourceSeg
      }

      if (interactions[colCnt]) { // all-resource

        for (let seg of interactions[colCnt].segs) {
          transformedSegs.push(
            this.transformSeg(seg as SegType, resourceDayTable, i) // TODO: templateify Interaction::segs
          )
        }
      }
    }

    return {
      affectedInstances,
      segs: transformedSegs,
      isEvent,
      sourceSeg
    }
  }

  // needs to generate NEW seg obj!!! because of .el
  abstract transformSeg(seg: SegType, resourceDayTable: AbstractResourceDayTable, resourceI: number)

}
