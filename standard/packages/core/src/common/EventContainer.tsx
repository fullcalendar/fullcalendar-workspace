import { ComponentChild, createElement } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { EventImpl } from '../api/EventImpl.js'
import {
  computeEventRangeDraggable,
  EventContentArg,
  getEventClassNames,
  setElEventRange,
  EventRenderRange,
} from '../component-util/event-rendering.js'
import { ContentContainer, InnerContainerFunc } from '../content-inject/ContentContainer.js'
import { ElProps } from '../content-inject/ContentInjector.js'
import { joinClassNames } from '../util/html.js'

export interface MinimalEventProps {
  eventRange: EventRenderRange
  isStart: boolean
  isEnd: boolean
  isDragging: boolean // rename to isMirrorDragging? make optional?
  isResizing: boolean // rename to isMirrorResizing? make optional?
  isDateSelecting: boolean // rename to isMirrorDateSelecting? make optional?
  isSelected: boolean
  isPast: boolean
  isFuture: boolean
  isToday: boolean
}

export type EventContainerProps = ElProps & MinimalEventProps & {
  defaultGenerator: (renderProps: EventContentArg) => ComponentChild
  disableDragging?: boolean
  disableResizing?: boolean
  timeText: string
  children?: InnerContainerFunc<EventContentArg>
}

export class EventContainer extends BaseComponent<EventContainerProps> {
  el: HTMLElement

  render() {
    const { props, context } = this
    const { options } = context
    const { eventRange } = props
    const { ui } = eventRange

    const renderProps: EventContentArg = {
      event: new EventImpl(context, eventRange.def, eventRange.instance),
      view: context.viewApi,
      timeText: props.timeText,
      textColor: ui.textColor,
      backgroundColor: ui.backgroundColor,
      borderColor: ui.borderColor,
      isDraggable: !props.disableDragging && computeEventRangeDraggable(eventRange, context),
      isStartResizable: !props.disableResizing && props.isStart && eventRange.ui.durationEditable && options.eventResizableFromStart,
      isEndResizable: !props.disableResizing && props.isEnd && eventRange.ui.durationEditable,
      isMirror: Boolean(props.isDragging || props.isResizing || props.isDateSelecting),
      isStart: Boolean(props.isStart),
      isEnd: Boolean(props.isEnd),
      isPast: Boolean(props.isPast), // TODO: don't cast. getDateMeta does it
      isFuture: Boolean(props.isFuture), // TODO: don't cast. getDateMeta does it
      isToday: Boolean(props.isToday), // TODO: don't cast. getDateMeta does it
      isSelected: Boolean(props.isSelected),
      isDragging: Boolean(props.isDragging),
      isResizing: Boolean(props.isResizing),
    }

    return (
      <ContentContainer
        {...props /* contains children */}
        elRef={this.handleEl}
        className={joinClassNames(
          props.className,
          ...getEventClassNames(renderProps),
          ...eventRange.ui.classNames,
        )}
        renderProps={renderProps}
        generatorName="eventContent"
        customGenerator={options.eventContent}
        defaultGenerator={props.defaultGenerator}
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

  componentDidUpdate(prevProps: EventContainerProps): void {
    if (this.el && this.props.eventRange !== prevProps.eventRange) {
      setElEventRange(this.el, this.props.eventRange)
    }
  }
}
