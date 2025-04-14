import { createElement } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { EventContentArg, EventRenderRange, setElEventRange } from '../component-util/event-rendering.js'
import { memoize } from '../util/memoize.js'
import { EventDef } from '../structs/event-def.js'
import { EventInstance } from '../structs/event-instance.js'
import { EventImpl } from '../api/EventImpl.js'
import { ViewContext } from '../ViewContext.js'
import { joinArrayishClassNames, joinClassNames } from '../util/html.js'
import { ContentContainer } from '../content-inject/ContentContainer.js'

export interface BgEventProps {
  eventRange: EventRenderRange
  isStart: boolean
  isEnd: boolean
  isPast: boolean
  isFuture: boolean
  isToday: boolean
}

export class BgEvent extends BaseComponent<BgEventProps> {
  // memo
  private buildPublicEvent = memoize(
    (context: ViewContext, eventDef: EventDef, eventInstance: EventInstance) => new EventImpl(context, eventDef, eventInstance)
  )

  // ref
  private el: HTMLElement

  render() {
    let { props, context } = this
    let { eventRange } = props
    let { options } = context
    let eventUi = eventRange.ui

    let renderProps: EventContentArg = {
      event: this.buildPublicEvent(context, eventRange.def, eventRange.instance),
      view: context.viewApi,
      timeText: '', // never display time
      textColor: eventUi.textColor,
      backgroundColor: eventUi.backgroundColor,
      borderColor: eventUi.borderColor,
      isDraggable: false,
      isStartResizable: false,
      isEndResizable: false,
      isMirror: false,
      isStart: props.isStart,
      isEnd: props.isEnd,
      isPast: props.isPast,
      isFuture: props.isFuture,
      isToday: props.isToday,
      isSelected: false,
      isDragging: false,
      isResizing: false,
      isListItem: false,
      timeClassName: '', // never display time
      titleClassName: joinArrayishClassNames(options.eventTitleClassNames),
      titleOuterClassName: joinArrayishClassNames(options.eventTitleOuterClassNames),
    }

    return (
      <ContentContainer
        tag='div'
        className={joinClassNames(...eventUi.classNames)}
        style={{
          backgroundColor: eventUi.backgroundColor,
        }}
        defaultGenerator={renderInnerContent}
        elRef={this.handleEl}
        renderProps={renderProps}
        generatorName="eventContent"
        customGenerator={options.eventContent}
        classNameGenerator={options.eventClassNames}
        didMount={options.eventDidMount}
        willUnmount={options.eventWillUnmount}
      />
    )
  }

  handleEl = (el: HTMLElement | null) => {
    this.el = el

    if (el) {
      setElEventRange(el, this.props.eventRange)
    }
  }

  componentDidUpdate(prevProps: BgEventProps): void {
    if (this.el && this.props.eventRange !== prevProps.eventRange) {
      setElEventRange(this.el, this.props.eventRange)
    }
  }
}

function renderInnerContent(props: EventContentArg) {
  let { title } = props.event

  return title && (
    <div className={props.titleOuterClassName}>
      <div className={props.titleClassName}>{props.event.title}</div>
    </div>
  )
}

export function renderFill(fillType: string) {
  return (
    <div className={`fc-${fillType}`} />
  )
}
