import { createElement } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { EventContentArg, EventRenderRange } from '../component-util/event-rendering.js'
import { EventContainer } from './EventContainer.js'

export interface BgEventProps {
  eventRange: EventRenderRange
  isStart: boolean
  isEnd: boolean
  isPast: boolean
  isFuture: boolean
  isToday: boolean
}

export class BgEvent extends BaseComponent<BgEventProps> {
  render() {
    let { props } = this
    let { eventRange } = props

    return (
      <EventContainer
        tag="div"
        className='fc-bg-event'
        style={{ backgroundColor: eventRange.ui.backgroundColor }}
        defaultGenerator={renderInnerContent}
        eventRange={eventRange}
        isStart={props.isStart}
        isEnd={props.isEnd}
        timeText=""
        isDragging={false}
        isResizing={false}
        isDateSelecting={false}
        isSelected={false}
        isPast={props.isPast}
        isFuture={props.isFuture}
        isToday={props.isToday}
        disableDragging={true}
        disableResizing={true}
      />
    )
  }
}

function renderInnerContent(props: EventContentArg) {
  let { title } = props.event

  return title && (
    <div className="fc-event-title">{props.event.title}</div>
  )
}

export function renderFill(fillType: string) {
  return (
    <div className={`fc-${fillType}`} />
  )
}
