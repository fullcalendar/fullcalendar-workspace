import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { EventDisplayInfo, EventTextInfo, EventRenderRange, setElEventRange } from '../component-util/event-rendering'
import { EventImpl } from '../api/EventImpl'
import { joinClassNames } from '../util/html'
import { CustomContent } from '../content-inject/CustomContent'
import { useViewContext } from '../hooks/useViewContext'
import { useRenderHookEl } from '../hooks/useRenderHookEl'
import { generateClassName } from './render-hook'
import { Dictionary, ViewOptionsRefined } from '../options'
import classNames from '../styles.module.css'

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
  renderProps?: Dictionary // so can include a resource
}

export const BgEvent = memo(function BgEvent(props: BgEventProps) {
  const context = useViewContext()
  const { eventRange } = props
  const { options } = context
  const eventUi = eventRange.ui
  const elRef = useRef<HTMLElement | null>(null)

  const eventApi = useMemo(
    () => new EventImpl(context, eventRange.def, eventRange.instance),
    [context, eventRange.def, eventRange.instance],
  )
  const eventOverlap = Boolean(options.eventOverlap)
  const renderPropsOptions = useMemo(() => ({ eventOverlap }), [eventOverlap])
  const subcontentRenderProps: EventTextInfo = {
    ...props.renderProps, // first, so built-in props take precedence
    event: eventApi,
    timeText: '', // never display time
    isNarrow: props.isNarrow || false,
    isShort: props.isShort || false,
  }
  const renderProps: EventDisplayInfo = {
    ...props.renderProps, // first, so built-in props take precedence
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
    isFirst: false,
    isLast: false,
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
    titleClass: generateClassName(options.backgroundEventTitleClass, subcontentRenderProps),
    options: renderPropsOptions,
  }
  const renderHookEl = useRenderHookEl({
    classGenerator: options.backgroundEventClass,
    didMount: options.backgroundEventDidMount,
    willUnmount: options.backgroundEventWillUnmount,
    renderProps,
    elRef,
  })

  useLayoutEffect(() => {
    setElEventRange(elRef.current, eventRange)
  }, [eventRange])

  // does not include backgroundEventClass.. added below
  const outerClassName = joinClassNames(
    eventUi.className,
    classNames.fill,
    classNames.internalEvent,
    classNames.internalBgEvent,
    props.isVertical ? classNames.flexCol : classNames.flexRow,
  )
  const innerClassName = joinClassNames(
    generateClassName(options.backgroundEventInnerClass, renderProps),
    classNames.liquid,
  )

  return (
    <div
      ref={renderHookEl.ref}
      className={joinClassNames(renderHookEl.className, outerClassName)}
      style={{
        '--fc-event-color': renderProps.color,
        '--fc-event-contrast-color': renderProps.contrastColor,
      } as any}
    >
      <CustomContent
        tag='div'
        className={innerClassName}
        renderProps={renderProps}
        generatorName="backgroundEventContent"
        generator={options.backgroundEventContent}
        fallback={renderInnerContent}
      />
    </div>
  )
})

function renderInnerContent(props: EventDisplayInfo) {
  let { title } = props.event

  return title && (
    <div className={props.titleClass}>{props.event.title}</div>
  )
}

// Other types of fills
// -------------------------------------------------------------------------------------------------

export function renderFill(fillType: string, options: ViewOptionsRefined) {
  return (
    <div className={joinClassNames(
      fillType === 'non-business' ? options.nonBusinessHoursClass :
        fillType === 'highlight' ? options.highlightClass : undefined,
      classNames.fill,
    )} />
  )
}
