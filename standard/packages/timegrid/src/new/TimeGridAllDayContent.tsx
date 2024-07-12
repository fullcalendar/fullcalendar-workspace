import { DayGridRow, DayGridRowProps } from '@fullcalendar/daygrid/internal'
import { DateComponent, Hit } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'

export class TimeGridAllDayContent extends DateComponent<DayGridRowProps> {
  render() {
    return (
      <DayGridRow {...this.props} elRef={this.handleRootEl} />
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
