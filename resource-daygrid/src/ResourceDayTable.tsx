import {
  h, createRef, VNode,
  mapHash, Hit, DateSpan, DateComponent, DateProfile, EventStore, EventUiHash, EventInteractionState, ComponentContext, Duration
} from '@fullcalendar/core'
import { DayTableSlicer, Table, TableSeg } from '@fullcalendar/daygrid'
import { AbstractResourceDayTableModel, VResourceSplitter, VResourceJoiner } from '@fullcalendar/resource-common'

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
  colGroupNode: VNode
  renderNumberIntro: (row: number, cells: any) => VNode[]
  renderBgIntro: () => VNode[]
  renderIntro: () => VNode[]
  colWeekNumbersVisible: boolean // week numbers render in own column? (caller does HTML via intro)
  cellWeekNumbersVisible: boolean // display week numbers in day cell?
  eventLimit: boolean | number
  vGrow: boolean
}

export default class ResourceDayTable extends DateComponent<ResourceDayTableProps> {

  allowAcrossResources = false

  private splitter = new VResourceSplitter()
  private slicers: { [resourceId: string]: DayTableSlicer } = {}
  private joiner = new ResourceDayTableJoiner()
  private tableRef = createRef<Table>()

  get table() { return this.tableRef.current }


  render(props: ResourceDayTableProps, state: {}, context: ComponentContext) {
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

    this.allowAcrossResources = resourceDayTableModel.dayTableModel.colCnt === 1 // hack for EventResizing

    return (
      <Table
        ref={this.tableRef}
        elRef={this.handleRootEl}
        {...this.joiner.joinProps(slicedProps, resourceDayTableModel)}
        dateProfile={dateProfile}
        cells={resourceDayTableModel.cells}
        isRigid={props.isRigid}
        colGroupNode={props.colGroupNode}
        renderNumberIntro={props.renderNumberIntro}
        renderBgIntro={props.renderBgIntro}
        renderIntro={props.renderIntro}
        colWeekNumbersVisible={props.colWeekNumbersVisible}
        cellWeekNumbersVisible={props.cellWeekNumbersVisible}
        eventLimit={props.eventLimit}
        vGrow={props.vGrow}
      />
    )
  }


  handleRootEl = (rootEl: HTMLElement | null) => {
    let { calendar } = this.context

    if (rootEl) {
      calendar.registerInteractiveComponent(this, { el: rootEl })
    } else {
      calendar.unregisterInteractiveComponent(this)
    }
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
