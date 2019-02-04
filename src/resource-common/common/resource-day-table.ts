import { SlicedProps, EventDef, mapHash, Splitter, DayTable, DayTableCell, SplittableProps, DateSpan, Seg, memoize, EventSegUiInteractionState } from '@fullcalendar/core'
import { Resource } from '../structs/resource'
import { __assign } from 'tslib'

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
  abstract computeColRanges(dateStartI, dateEndI, resourceI): {
    firstCol: number,
    lastCol: number,
    isStart: boolean,
    isEnd: boolean
  }[]


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

  /*
  all date ranges are intact
  */
  computeColRanges(dateStartI, dateEndI, resourceI) {
    return [
      {
        firstCol: this.computeCol(dateStartI, resourceI),
        lastCol: this.computeCol(dateEndI, resourceI),
        isStart: true,
        isEnd: true
      }
    ]
  }

}


/*
dates over resources
*/
export class DayResourceTable extends AbstractResourceDayTable {

  computeCol(dateI, resourceI) {
    return dateI * this.resources.length + resourceI
  }

  /*
  every single day is broken up
  */
  computeColRanges(dateStartI, dateEndI, resourceI) {
    let segs = []

    for (let i = dateStartI; i <= dateEndI; i++) {
      let col = this.computeCol(i, resourceI)

      segs.push({
        firstCol: col,
        lastCol: col,
        isStart: i === dateStartI,
        isEnd: i === dateEndI
      })
    }

    return segs
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


// splitter

export interface VResourceProps extends SplittableProps {
  resourceDayTable: AbstractResourceDayTable
}

/*
TODO: just use ResourceHash somehow? could then use the generic ResourceSplitter
*/
export class VResourceSplitter extends Splitter<VResourceProps> {

  getKeyInfo(props: VResourceProps) {
    let { resourceDayTable } = props

    let hash = mapHash(resourceDayTable.resourceIndex.indicesById, function(i) {
      return resourceDayTable.resources[i] // has `ui` AND `businessHours` keys!
    }) as any // :(

    hash[''] = {}

    return hash
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
      businessHoursSets.push(key ? props.businessHourSegs : NO_SEGS) // don't include redundant all-resource businesshours
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
    let resourceCnt = resourceDayTable.resources.length
    let transformedSegs = []

    for (let i = 0; i < resourceCnt; i++) {

      for (let seg of segGroups[i]) {
        transformedSegs.push(
          ...this.transformSeg(seg, resourceDayTable, i)
        )
      }

      for (let seg of segGroups[resourceCnt]) { // one beyond. the all-resource
        transformedSegs.push(
          ...this.transformSeg(seg, resourceDayTable, i)
        )
      }

    }

    return transformedSegs
  }

  /*
  for expanding non-resource segs to all resources.
  only for public use.
  no memoizing.
  */
  expandSegs(resourceDayTable: AbstractResourceDayTable, segs: SegType[]) {
    let resourceCnt = resourceDayTable.resources.length
    let transformedSegs = []

    for (let i = 0; i < resourceCnt; i++) {

      for (let seg of segs) {
        transformedSegs.push(
          ...this.transformSeg(seg, resourceDayTable, i)
        )
      }

    }

    return transformedSegs
  }

  joinInteractions(resourceDayTable: AbstractResourceDayTable, ...interactions: EventSegUiInteractionState[]): EventSegUiInteractionState {
    let resourceCnt = resourceDayTable.resources.length
    let affectedInstances = {}
    let transformedSegs = []
    let isEvent = false
    let sourceSeg = null

    for (let i = 0; i < resourceCnt; i++) {
      let interaction = interactions[i]

      if (interaction) {

        for (let seg of interaction.segs) {
          transformedSegs.push(
            ...this.transformSeg(seg as SegType, resourceDayTable, i) // TODO: templateify Interaction::segs
          )
        }

        __assign(affectedInstances, interaction.affectedInstances)
        isEvent = isEvent || interaction.isEvent
        sourceSeg = sourceSeg || interaction.sourceSeg
      }

      if (interactions[resourceCnt]) { // one beyond. the all-resource

        for (let seg of interactions[resourceCnt].segs) {
          transformedSegs.push(
            ...this.transformSeg(seg as SegType, resourceDayTable, i) // TODO: templateify Interaction::segs
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
  abstract transformSeg(seg: SegType, resourceDayTable: AbstractResourceDayTable, resourceI: number): SegType[]

}
