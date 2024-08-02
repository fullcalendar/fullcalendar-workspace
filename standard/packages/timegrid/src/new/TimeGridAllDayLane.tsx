import { DayGridRow, DayGridRowProps } from '@fullcalendar/daygrid/internal'
import { DateComponent, Hit } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'

export interface TimeGridAllDayLaneProps extends DayGridRowProps {
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
}

/*
rename to TimeGridAllDayMainCells
*/
export class TimeGridAllDayLane extends DateComponent<TimeGridAllDayLaneProps> {
  render() {
    return (
      <DayGridRow
        {...this.props}
        cellGroup
        rootElRef={this.handleRootEl}
        className='fc-timegrid-allday-main'
      />
    )
  }

  handleRootEl = (rootEl: HTMLDivElement) => {
    if (rootEl) {
      this.context.registerInteractiveComponent(this, {
        el: rootEl,
      })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  queryHit(positionLeft: number, positionTop: number): Hit {
    // TODO: use props.colWidth
    // Don't do what we did with DayGridRows and colPositions
    return null as any
  }
}
