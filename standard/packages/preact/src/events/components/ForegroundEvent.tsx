import { EventEl, EventPartProps } from './event-parts'
import { EventLayer, useEventDisplay } from './useEventDisplay'
import { memo, type ComponentType } from 'react'
import { DateFormatter, DateMarker } from '@full-ui/headless-calendar'
import { EventRenderRange } from '../../event-segs/event-ranges'
import { ElRef } from '../../render-hook/el-props'
import { useViewOptions } from '../../context/useGranularContexts'
import { Dictionary } from '../../util/object'
import { ViewOptionsRefined } from '../../options/options'

/*
Foreground events, as composed components. Each variant declares its class layers, geometry and
body, instead of one component switching on a display mode. Things that differ between callers of the same
variant (dragging, resizing, z-indexes, liquid inner) stay props.
See planning/phase-4-event-pilot.md
*/

export interface EventProps {
  elRef?: ElRef
  attrs?: any
  className?: string
  eventRange: EventRenderRange // timed/whole-day span
  slicedStart?: DateMarker // view-sliced timed/whole-day span
  slicedEnd?: DateMarker // view-sliced timed/whole-day span
  isStart: boolean // seg could have been split into small pieces
  isEnd: boolean // "
  isFirst?: boolean
  isLast?: boolean
  isDragging: boolean // rename to isMirrorDragging? make optional?
  isResizing: boolean // rename to isMirrorResizing? make optional?
  isMirror: boolean
  isSelected: boolean
  isPast: boolean
  isFuture: boolean
  isToday: boolean
  disableDragging?: boolean // defaults false
  disableResizing?: boolean // defaults false
  defaultTimeFormat: DateFormatter
  defaultDisplayEventTime?: boolean // default true
  defaultDisplayEventEnd?: boolean // default true
  isNarrow?: boolean // default false
  isShort?: boolean // default false
  level?: number // default 0
  forcedTimeText?: string
  disableLiquid?: boolean // for inner-element
  disableZindexes?: boolean
  renderProps?: Dictionary // so can include a resource
}

export interface ForegroundEventProps extends EventProps {
  variant: EventVariant
}

/*
A variant is data plus a composed body. The shell owns the outer element and its mount hooks, so a
caller switching an event between variants (DayGrid, per event) swaps only the body, and doesn't
remount the element or re-fire eventDidMount/eventWillUnmount
*/
export interface EventVariant {
  layers: EventLayer[] // class-option prefixes after `event`
  className: string
  getTitleClassName?: (options: ViewOptionsRefined) => string | undefined
  Body: ComponentType<EventPartProps>
}

export const ForegroundEvent = memo((props: ForegroundEventProps) => {
  const options = useViewOptions()
  const { variant } = props
  const { Body } = variant
  const display = useEventDisplay(props, variant.layers, {
    titleClassName: variant.getTitleClassName?.(options),
  })

  return (
    <EventEl props={props} display={display} className={variant.className}>
      <Body props={props} display={display} />
    </EventEl>
  )
})
