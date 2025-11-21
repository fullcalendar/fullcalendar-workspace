import { createElement } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { EventDisplayData, EventRenderRange, setElEventRange } from '../component-util/event-rendering.js'
import { memoize } from '../util/memoize.js'
import { EventDef } from '../structs/event-def.js'
import { EventInstance } from '../structs/event-instance.js'
import { EventImpl } from '../api/EventImpl.js'
import { ViewContext } from '../ViewContext.js'
import { joinArrayishClassNames, joinClassNames } from '../util/html.js'
import { ContentContainer, generateClassName } from '../content-inject/ContentContainer.js'
import { ViewOptionsRefined } from '../options.js'
import classNames from '../internal-classnames.js'

export interface BgEventProps {
  eventRange: EventRenderRange
  isStart: boolean
  isEnd: boolean
  isPast: boolean
  isFuture: boolean
  isToday: boolean
  isNarrow?: boolean
  isShort?: boolean
  isVertical: boolean
}

export class BgEvent extends BaseComponent<BgEventProps> {
  // memo
  private buildPublicEvent = memoize(
    (context: ViewContext, eventDef: EventDef, eventInstance: EventInstance) => new EventImpl(context, eventDef, eventInstance)
  )

  // ref
  private el: HTMLElement

  render() {
    const { props, context } = this
    const { eventRange } = props
    const { options } = context
    const eventUi = eventRange.ui

    const eventApi = this.buildPublicEvent(context, eventRange.def, eventRange.instance)
    const subcontentRenderProps = { // TODO: spread into renderProps?
      event: eventApi,
      isNarrow: props.isNarrow || false,
      isShort: props.isShort || false,
    }
    const renderProps: EventDisplayData = {
      event: eventApi,
      view: context.viewApi,
      timeText: '', // never display time
      color: eventUi.color || options.backgroundEventColor,
      contrastColor: eventUi.contrastColor,
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
      isInteractive: false,
      level: 0,
      isNarrow: props.isNarrow || false,
      isShort: props.isShort || false,
      timeClass: '', // never display time
      titleClass: joinClassNames(
        generateClassName(options.eventTitleClass, subcontentRenderProps),
        generateClassName(options.backgroundEventTitleClass, subcontentRenderProps),
      ),
      options: { eventOverlap: Boolean(options.eventOverlap) },
    }
    const outerClassName = joinArrayishClassNames( // already includes eventClass below
      generateClassName(options.backgroundEventClass, renderProps),
      eventUi.className,
      classNames.fill,
      classNames.internalEvent,
      classNames.internalBgEvent,
      props.isVertical ? classNames.flexCol : classNames.flexRow,
    )
    const innerClassName = joinClassNames(
      generateClassName(options.eventInnerClass, renderProps),
      generateClassName(options.backgroundEventInnerClass, renderProps),
      classNames.liquid,
    )

    return (
      <ContentContainer
        tag='div'
        className={outerClassName}
        style={{
          '--fc-event-color': renderProps.color,
          '--fc-event-contrast-color': renderProps.contrastColor,
        }}
        defaultGenerator={renderInnerContent}
        elRef={this.handleEl}
        renderProps={renderProps}
        generatorName="eventContent"
        customGenerator={options.eventContent}
        classNameGenerator={options.eventClass}
        didMount={options.eventDidMount}
        willUnmount={options.eventWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent tag='div' className={innerClassName} />
        )}
      </ContentContainer>
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

function renderInnerContent(props: EventDisplayData) {
  let { title } = props.event

  return title && (
    <div className={props.titleClass}>{props.event.title}</div>
  )
}

// Other types of fills
// -------------------------------------------------------------------------------------------------

export function renderFill(fillType: string, options: ViewOptionsRefined) {
  return (
    <div className={joinArrayishClassNames(
      fillType === 'non-business' ? options.nonBusinessClass :
        fillType === 'highlight' ? options.highlightClass : undefined,
      classNames.fill,
    )} />
  )
}
