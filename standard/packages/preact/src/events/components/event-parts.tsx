import { EventProps } from './ForegroundEvent'
import { EventDisplay, buildLayerClassName } from './useEventDisplay'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { EventDisplayInfo } from './event-display-info'
import { setElEventRange } from './el-event-range'
import { CustomContent } from '../../render-hook/CustomContent'
import { useViewOptions } from '../../context/useGranularContexts'
import { useMountHooks } from '../../render-hook/useMountHooks'
import { ContentGenerator, generateClassName } from '../../render-hook/render-hook-types'
import { joinClassNames } from '../../util/html'
import { setRef } from '../../util/vdom'
import classNames from '../../styles.module.css'

// the parts a foreground event is composed of: the outer element, the inner content, the edges

export interface EventPartProps {
  props: EventProps
  display: EventDisplay
}

// The outer element. eventClass and the event mount hooks apply here
export function EventEl({ props, display, className, children }: EventPartProps & {
  className: string
  children: ReactNode
}) {
  const options = useViewOptions()
  const { eventRange } = props
  const { renderProps, isDraggable } = display
  const elRef = useRef<HTMLElement | null>(null)

  // the ref callback must be stable, or React would detach and re-attach it on every commit.
  // assigned during render, because the ref callback runs during the commit
  const latestRef = useRef({ elRef: props.elRef, eventRange })
  latestRef.current = { elRef: props.elRef, eventRange }
  const handleElRef = useRef<(el: HTMLElement | null) => void>(null)
  handleElRef.current ??= (el: HTMLElement | null) => {
    elRef.current = el
    setRef(latestRef.current.elRef, el)

    if (el) {
      setElEventRange(el, latestRef.current.eventRange)
    }
  }

  useLayoutEffect(() => {
    if (elRef.current) {
      setElEventRange(elRef.current, eventRange)
    }
  }, [eventRange])

  // after <CustomContent>'s layout effects, so the content is inside the element
  useMountHooks(elRef, options.eventDidMount, options.eventWillUnmount, renderProps)

  const Tag = display.tag as any

  return (
    <Tag
      {...props.attrs}
      {...display.attrs}
      // HACK because this event-element gets attached to root during some dragging
      dir={(props.isDragging && options.direction === 'rtl') ? 'rtl' : undefined}
      ref={handleElRef.current}
      className={joinClassNames(
        generateClassName(options.eventClass, renderProps),
        buildLayerClassName(options, display.layers, '', renderProps),
        eventRange.ui.className,
        props.className,
        className,
        (eventRange.def.url || isDraggable) && classNames.cursorPointer,
        classNames.internalEvent,
        props.isMirror && classNames.internalEventMirror,
        isDraggable && classNames.internalEventDraggable,
        renderProps.isSelected && classNames.internalEventSelected,
        (renderProps.isStartResizable || renderProps.isEndResizable) && classNames.internalEventResizable,
      )}
      style={{
        '--fc-event-color': renderProps.color,
        '--fc-event-contrast-color': renderProps.contrastColor,
      }}
    >
      {children}
    </Tag>
  )
}

// The slot eventContent fills. Defaults to the time and title
export function EventInner({ props, display }: EventPartProps) {
  const options = useViewOptions()

  return (
    <CustomContent<EventDisplayInfo>
      tag="div"
      className={joinClassNames(
        buildLayerClassName(options, ['event', ...display.layers], 'Inner', display.renderProps),
        !props.disableLiquid && classNames.liquid, // timegrid hack
        !props.disableZindexes && classNames.z0,
      )}
      renderProps={display.renderProps}
      generatorName="eventContent"
      generator={options.eventContent}
      fallback={renderInnerContent}
    />
  )
}

// The "before" or "after" element: a resizer, or a decoration like an arrow
export function EventEdge({ edge, axis, props, display, content }: EventPartProps & {
  edge: 'start' | 'end'
  axis: 'x' | 'y'
  content?: ContentGenerator<EventDisplayInfo>
}) {
  const options = useViewOptions()
  const { renderProps } = display
  const isStart = edge === 'start'
  const className = buildLayerClassName(
    options,
    ['event', ...display.layers],
    isStart ? 'Before' : 'After',
    renderProps,
  )
  const isResizable = isStart ? renderProps.isStartResizable : renderProps.isEndResizable

  if (!className && !content) {
    return null
  }

  return (
    <div
      className={joinClassNames(
        className,
        !props.disableZindexes && classNames.z1,
        isResizable && joinClassNames(
          axis === 'y'
            ? (isStart ? classNames.cursorResizeT : classNames.cursorResizeB)
            : (isStart ? classNames.cursorResizeS : classNames.cursorResizeE),
          // these classnames required for dnd
          classNames.internalEventResizer,
          isStart ? classNames.internalEventResizerStart : classNames.internalEventResizerEnd,
        ),
      )}
    >
      {content && (
        <CustomContent<EventDisplayInfo>
          tag="div"
          style={DISPLAY_CONTENTS}
          attrs={ARIA_HIDDEN}
          renderProps={renderProps}
          generatorName={undefined}
          generator={content}
        />
      )}
      {Boolean(isResizable && renderProps.isSelected) && (
        <div className={classNames.hit} />
      )}
    </div>
  )
}

const DISPLAY_CONTENTS = { display: 'contents' }
const ARIA_HIDDEN = { 'aria-hidden': true }

function renderInnerContent(innerProps: EventDisplayInfo) {
  return (
    <>
      {innerProps.timeText && (
        <div className={innerProps.timeClass}>{innerProps.timeText}</div>
      )}
      <div className={innerProps.titleClass}>
        {innerProps.event.title || <>&nbsp;</>}
      </div>
    </>
  )
}
