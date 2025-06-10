import { createElement, Fragment } from '../preact.js'
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
  isCompact?: boolean
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
    const subcontentRenderProps = {
      event: eventApi,
      isCompact: props.isCompact || false,
    }
    const renderProps: EventDisplayData = {
      event: eventApi,
      view: context.viewApi,
      timeText: '', // never display time
      color: eventUi.color,
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
      level: 0,
      isCompact: props.isCompact || false,
      isSpacious: false,
      timeClassName: '', // never display time
      titleClassName: joinClassNames(
        generateClassName(options.eventTitleClassNames, subcontentRenderProps),
        generateClassName(options.backgroundEventTitleClassNames, subcontentRenderProps),
      ),
    }
    const outerClassNames = joinClassNames( // already includes eventClassNames below
      generateClassName(options.backgroundEventClassNames, renderProps),
      ...eventUi.classNames,
      classNames.fill,
      classNames.internalEvent,
      classNames.internalBgEvent,
    )
    const colorClassNames = generateClassName(options.backgroundEventColorClassNames, renderProps)

    return (
      <ContentContainer
        tag='div'
        className={outerClassNames}
        style={{
          '--fc-event-color': eventUi.color,
          '--fc-event-contrast-color': eventUi.contrastColor,
        }}
        defaultGenerator={renderInnerContent}
        elRef={this.handleEl}
        renderProps={renderProps}
        generatorName="eventContent"
        customGenerator={options.eventContent}
        classNameGenerator={options.eventClassNames}
        didMount={options.eventDidMount}
        willUnmount={options.eventWillUnmount}
      >
        {(InnerContent) => (
          <Fragment>
            {colorClassNames && (
              <div className={joinClassNames(colorClassNames, classNames.fill)} />
            )}
            <InnerContent tag='div' className={classNames.rel} />
          </Fragment>
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
    <div className={props.titleClassName}>{props.event.title}</div>
  )
}

// Other types of fills
// -------------------------------------------------------------------------------------------------

export function renderFill(fillType: string, options: ViewOptionsRefined) {
  return (
    <div className={joinArrayishClassNames(
      fillType === 'non-business' ? options.nonBusinessClassNames :
        fillType === 'highlight' ? options.highlightClassNames : undefined,
      classNames.fill,
    )} />
  )
}
