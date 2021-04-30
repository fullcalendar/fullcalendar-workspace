import {
  createElement, createRef, VNode,
  mapHash, Hit, DateSpan, DateComponent, EventStore, EventUiHash, EventInteractionState, Duration, RefObject, CssDimValue, DateProfile,
} from '@fullcalendar/common'
import { DayTableSlicer, Table } from '@fullcalendar/daygrid'
import { AbstractResourceDayTableModel, VResourceSplitter } from '@fullcalendar/resource-common'
import { ResourceDayTableJoiner } from './ResourceDayTableJoiner'

export interface ResourceDayTableProps {
  dateProfile: DateProfile
  resourceDayTableModel: AbstractResourceDayTableModel
  businessHours: EventStore
  eventStore: EventStore
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  nextDayThreshold: Duration
  tableMinWidth: CssDimValue
  colGroupNode: VNode
  renderRowIntro?: () => VNode
  dayMaxEvents: boolean | number
  dayMaxEventRows: boolean | number
  expandRows: boolean
  showWeekNumbers: boolean
  headerAlignElRef?: RefObject<HTMLElement> // for more popover alignment
  clientWidth: number | null
  clientHeight: number | null
  forPrint: boolean
}

export class ResourceDayTable extends DateComponent<ResourceDayTableProps> {
  private splitter = new VResourceSplitter()
  private slicers: { [resourceId: string]: DayTableSlicer } = {}
  private joiner = new ResourceDayTableJoiner()
  private tableRef = createRef<Table>()

  render() {
    let { props, context } = this
    let { resourceDayTableModel, nextDayThreshold, dateProfile } = props

    let splitProps = this.splitter.splitProps(props)
    this.slicers = mapHash(splitProps, (split, resourceId) => this.slicers[resourceId] || new DayTableSlicer())
    let slicedProps = mapHash(this.slicers, (slicer, resourceId) => slicer.sliceProps(
      splitProps[resourceId],
      dateProfile,
      nextDayThreshold,
      context,
      resourceDayTableModel.dayTableModel,
    ))

    return (
      <Table
        forPrint={props.forPrint}
        ref={this.tableRef}
        elRef={this.handleRootEl}
        {...this.joiner.joinProps(slicedProps, resourceDayTableModel)}
        cells={resourceDayTableModel.cells}
        dateProfile={dateProfile}
        colGroupNode={props.colGroupNode}
        tableMinWidth={props.tableMinWidth}
        renderRowIntro={props.renderRowIntro}
        dayMaxEvents={props.dayMaxEvents}
        dayMaxEventRows={props.dayMaxEventRows}
        showWeekNumbers={props.showWeekNumbers}
        expandRows={props.expandRows}
        headerAlignElRef={props.headerAlignElRef}
        clientWidth={props.clientWidth}
        clientHeight={props.clientHeight}
      />
    )
  }

  handleRootEl = (rootEl: HTMLElement | null) => {
    if (rootEl) {
      this.context.registerInteractiveComponent(this, {
        el: rootEl,
        isHitComboAllowed: (hit0: Hit, hit1: Hit) => {
          let allowAcrossResources = this.props.resourceDayTableModel.dayTableModel.colCnt === 1
          return allowAcrossResources || hit0.dateSpan.resourceId === hit1.dateSpan.resourceId
        }
      })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  prepareHits() {
    this.tableRef.current.prepareHits()
  }

  queryHit(positionLeft: number, positionTop: number): Hit {
    let rawHit = this.tableRef.current.positionToHit(positionLeft, positionTop)

    if (rawHit) {
      return {
        dateProfile: this.props.dateProfile,
        dateSpan: {
          range: rawHit.dateSpan.range,
          allDay: rawHit.dateSpan.allDay,
          resourceId: this.props.resourceDayTableModel.cells[rawHit.row][rawHit.col].resource.id,
        },
        dayEl: rawHit.dayEl,
        rect: {
          left: rawHit.relativeRect.left,
          right: rawHit.relativeRect.right,
          top: rawHit.relativeRect.top,
          bottom: rawHit.relativeRect.bottom,
        },
        layer: 0,
      }
    }

    return null
  }
}
