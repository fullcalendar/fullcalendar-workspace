import { mapHash, Hit, DateSpan, DateComponent, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, Duration, renderer } from '@fullcalendar/core'
import { DayTableSlicer, Table, TableSeg } from '@fullcalendar/daygrid'
import { AbstractResourceDayTableModel, VResourceSplitter, VResourceJoiner } from '@fullcalendar/resource-common'
import { TableRenderProps } from 'packages/daygrid/src/Table'

export interface ResourceDayTableProps {
  dateProfile: DateProfile | null
  resourceDayTableModel: AbstractResourceDayTableModel
  businessHours: EventStore
  eventStore: EventStore
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  isRigid: boolean
  nextDayThreshold: Duration
  renderProps: TableRenderProps
}

export default class ResourceDayTable extends DateComponent<ResourceDayTableProps> {

  allowAcrossResources = false
  private renderTable = renderer(Table)
  private registerInteractive = renderer(this._registerInteractive, this._unregisterInteractive)

  private splitter = new VResourceSplitter()
  private slicers: { [resourceId: string]: DayTableSlicer } = {}
  private joiner = new ResourceDayTableJoiner()
  table: Table


  render(props: ResourceDayTableProps, context: ComponentContext) {
    let { dateProfile, resourceDayTableModel, nextDayThreshold } = props

    let splitProps = this.splitter.splitProps(props)

    this.slicers = mapHash(splitProps, (split, resourceId) => {
      return this.slicers[resourceId] || new DayTableSlicer()
    })

    let slicedProps = mapHash(this.slicers, (slicer, resourceId) => {
      return slicer.sliceProps(
        splitProps[resourceId],
        dateProfile,
        nextDayThreshold,
        context.calendar,
        resourceDayTableModel.dayTableModel
      )
    })

    let table = this.renderTable(true, {
      ...this.joiner.joinProps(slicedProps, resourceDayTableModel),
      dateProfile,
      cells: resourceDayTableModel.cells,
      isRigid: props.isRigid,
      renderProps: props.renderProps
    })

    this.registerInteractive(true, {
      el: table.rootEl
    })

    this.table = table
    this.allowAcrossResources = resourceDayTableModel.dayTableModel.colCnt === 1 // hack for EventResizing

    return table
  }


  updateSize(isResize: boolean) {
    this.table.updateSize(isResize)
  }


  _registerInteractive({ el }: { el: HTMLElement }, context: ComponentContext) {
    context.calendar.registerInteractiveComponent(this, { el })
  }


  _unregisterInteractive(funcState: void, context: ComponentContext) {
    context.calendar.unregisterInteractiveComponent(this)
  }


  buildPositionCaches() {
    this.table.buildPositionCaches()
  }


  queryHit(positionLeft: number, positionTop: number): Hit {
    let rawHit = this.table.positionToHit(positionLeft, positionTop)

    if (rawHit) {
      return {
        component: this,
        dateSpan: {
          range: rawHit.dateSpan.range,
          allDay: rawHit.dateSpan.allDay,
          resourceId: this.props.resourceDayTableModel.cells[rawHit.row][rawHit.col].resource.id
        },
        dayEl: rawHit.dayEl,
        rect: {
          left: rawHit.relativeRect.left,
          right: rawHit.relativeRect.right,
          top: rawHit.relativeRect.top,
          bottom: rawHit.relativeRect.bottom
        },
        layer: 0
      }
    }
  }

}


class ResourceDayTableJoiner extends VResourceJoiner<TableSeg> {

  transformSeg(seg: TableSeg, resourceDayTableModel: AbstractResourceDayTableModel, resourceI: number): TableSeg[] {
    let colRanges = resourceDayTableModel.computeColRanges(seg.firstCol, seg.lastCol, resourceI)

    return colRanges.map(function(colRange) {
      return {
        ...seg,
        ...colRange,
        isStart: seg.isStart && colRange.isStart,
        isEnd: seg.isEnd && colRange.isEnd
      }
    })
  }

}
