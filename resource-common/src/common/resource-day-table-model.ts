import { ReducerContext, SlicedProps, EventDef, mapHash, Splitter, DayTableModel, DayTableCell, SplittableProps, DateSpan, Seg, memoize, EventSegUiInteractionState } from '@fullcalendar/common'
import { Resource } from '../structs/resource'
import { __assign } from 'tslib'
import { ResourceApi } from '../api/ResourceApi'

export interface ResourceDayTableCell extends DayTableCell {
  resource: Resource
}

export abstract class AbstractResourceDayTableModel {

  cells: ResourceDayTableCell[][]
  rowCnt: number
  colCnt: number
  resourceIndex: ResourceIndex


  constructor(
    public dayTableModel: DayTableModel,
    public resources: Resource[],
    private context: ReducerContext
  ) {
    this.resourceIndex = new ResourceIndex(resources)

    this.rowCnt = dayTableModel.rowCnt
    this.colCnt = dayTableModel.colCnt * resources.length

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
    let { rowCnt, dayTableModel, resources } = this
    let rows: ResourceDayTableCell[][] = []

    for (let row = 0; row < rowCnt; row++) {
      let rowCells: ResourceDayTableCell[] = []

      for (let dateCol = 0; dateCol < dayTableModel.colCnt; dateCol++) {

        for (let resourceCol = 0; resourceCol < resources.length; resourceCol++) {
          let resource = resources[resourceCol]
          let extraHookProps = { resource: new ResourceApi(this.context, resource) }
          let extraDataAttrs = { 'data-resource-id': resource.id }
          let extraClassNames = [ 'fc-resource' ]
          let date = dayTableModel.cells[row][dateCol].date

          rowCells[
            this.computeCol(dateCol, resourceCol)
          ] = {
            key: resource.id + ':' + date.toISOString(),
            date,
            resource,
            extraHookProps,
            extraDataAttrs,
            extraClassNames
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
export class ResourceDayTableModel extends AbstractResourceDayTableModel {

  computeCol(dateI, resourceI) {
    return resourceI * this.dayTableModel.colCnt + dateI
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
export class DayResourceTableModel extends AbstractResourceDayTableModel {

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
  resourceDayTableModel: AbstractResourceDayTableModel
}

/*
TODO: just use ResourceHash somehow? could then use the generic ResourceSplitter
*/
export class VResourceSplitter extends Splitter<VResourceProps> {

  getKeyInfo(props: VResourceProps) {
    let { resourceDayTableModel } = props

    let hash = mapHash(resourceDayTableModel.resourceIndex.indicesById, function(i) {
      return resourceDayTableModel.resources[i] // has `ui` AND `businessHours` keys!
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
  joinProps(propSets: { [resourceId: string]: SlicedProps<SegType> }, resourceDayTable: AbstractResourceDayTableModel): SlicedProps<SegType> {
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

  joinSegs(resourceDayTable: AbstractResourceDayTableModel, ...segGroups: SegType[][]): SegType[] {
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
  expandSegs(resourceDayTable: AbstractResourceDayTableModel, segs: SegType[]) {
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

  joinInteractions(resourceDayTable: AbstractResourceDayTableModel, ...interactions: EventSegUiInteractionState[]): EventSegUiInteractionState | null {
    let resourceCnt = resourceDayTable.resources.length
    let affectedInstances = {}
    let transformedSegs = []
    let anyInteractions = false
    let isEvent = false

    for (let i = 0; i < resourceCnt; i++) {
      let interaction = interactions[i]

      if (interaction) {
        anyInteractions = true

        for (let seg of interaction.segs) {
          transformedSegs.push(
            ...this.transformSeg(seg as SegType, resourceDayTable, i) // TODO: templateify Interaction::segs
          )
        }

        __assign(affectedInstances, interaction.affectedInstances)
        isEvent = isEvent || interaction.isEvent
      }

      if (interactions[resourceCnt]) { // one beyond. the all-resource

        for (let seg of interactions[resourceCnt].segs) {
          transformedSegs.push(
            ...this.transformSeg(seg as SegType, resourceDayTable, i) // TODO: templateify Interaction::segs
          )
        }
      }
    }

    if (anyInteractions) {
      return {
        affectedInstances,
        segs: transformedSegs,
        isEvent
      }
    } else {
      return null
    }
  }

  // needs to generate NEW seg obj!!! because of .el
  abstract transformSeg(seg: SegType, resourceDayTable: AbstractResourceDayTableModel, resourceI: number): SegType[]

}
