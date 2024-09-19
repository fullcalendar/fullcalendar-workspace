import { computeColFromPosition, DayGridRow, DayGridRowProps, getCellEl } from '@fullcalendar/daygrid/internal'
import { addDays, DateComponent, Hit } from '@fullcalendar/core/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'

export interface TimeGridAllDayLaneProps extends DayGridRowProps {
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
}

export class TimeGridAllDayLane extends DateComponent<TimeGridAllDayLaneProps> {
  // ref
  private rootEl: HTMLElement
  private heightRef = createRef<number>()

  render() {
    return (
      <DayGridRow
        {...this.props}
        cellGroup
        className='fcnew-timegrid-allday-main'
        forceVSpacing
        rootElRef={this.handleRootEl}
        heightRef={this.heightRef}
      />
    )
  }

  handleRootEl = (rootEl: HTMLDivElement) => {
    this.rootEl = rootEl

    if (rootEl) {
      this.context.registerInteractiveComponent(this, {
        el: rootEl,
      })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  queryHit(positionLeft: number, positionTop: number, elWidth: number): Hit {
    const { props, context, heightRef } = this

    const colCnt = props.cells.length
    const { col, left, right } = computeColFromPosition(
      positionLeft,
      elWidth,
      props.colWidth,
      colCnt,
      context.isRtl
    )
    const cell = props.cells[col]
    const cellStartDate = cell.date
    const cellEndDate = addDays(cellStartDate, 1)

    return {
      dateProfile: props.dateProfile,
      dateSpan: {
        range: {
          start: cellStartDate,
          end: cellEndDate,
        },
        allDay: true,
        ...cell.extraDateSpan,
      },
      // HACK. TODO: This is expensive to do every hit-query
      dayEl: getCellEl(this.rootEl, col),
      rect: {
        left,
        right,
        top: 0,
        bottom: heightRef.current,
      },
      layer: 0,
    }
  }
}
