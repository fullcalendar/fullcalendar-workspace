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
import { DateMarker } from '../datelib/marker.js'
import { memoize } from '../util/memoize.js'
import { ViewContext } from '../ViewContext.js'
import { EventDef } from '../structs/event-def.js'
import { EventInstance } from '../structs/event-instance.js'

export interface MinimalEventProps {
  eventRange: EventRenderRange // timed/whole-day span
  slicedStart?: DateMarker // view-sliced timed/whole-day span
  slicedEnd?: DateMarker // view-sliced timed/whole-day span
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
  // memo
  private buildPublicEvent = memoize(
    (context: ViewContext, eventDef: EventDef, eventInstance: EventInstance) => new EventImpl(context, eventDef, eventInstance)
  )

  el: HTMLElement

  render() {
    const { props, context } = this
    const { options } = context
    const { eventRange } = props
    const { ui } = eventRange

    const renderProps: EventContentArg = {
      // make stable. everything else atomic
      // FYI, eventRange unfortunately gets reconstructed a lot, but def/instance is stable
      event: this.buildPublicEvent(context, eventRange.def, eventRange.instance),

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
        attrs={props.attrs}
        className={joinClassNames(
          props.className,
          ...getEventClassNames(renderProps),
          ...eventRange.ui.classNames,
        )}
        style={props.style}
        elRef={this.handleEl}
        renderProps={renderProps}
        generatorName="eventContent"
        customGenerator={options.eventContent}
        defaultGenerator={props.defaultGenerator}
        tag={props.tag}
        classNameGenerator={options.eventClassNames}
        didMount={options.eventDidMount}
        willUnmount={options.eventWillUnmount}
      >{props.children}</ContentContainer>
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
