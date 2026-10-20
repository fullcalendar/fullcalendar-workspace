import { memo, useMemo } from 'react'
import { SlotLaneInfo } from '../../render-hook-misc'
import { joinClassNames } from '../../util/html'
import { getDateMeta } from '../../component-util/date-rendering'
import { useViewContext } from '../../hooks/useViewContext'
import { useRenderHookEl } from '../../hooks/useRenderHookEl'
import classNames from '../../styles.module.css'
import { TimeSlatMeta } from '../time-slat-meta'

export interface TimeGridSlatLaneProps extends TimeSlatMeta {
  borderTop: boolean
}

export const TimeGridSlatLane = memo(function TimeGridSlatLane(props: TimeGridSlatLaneProps) {
  let context = useViewContext()
  let { options, dateEnv } = context
  let dateMeta = useMemo(() => getDateMeta(props.date, dateEnv), [props.date, dateEnv])
  let renderProps: SlotLaneInfo = {
    // this is a time-specific slot. not day-specific, so don't do today/nowRange
    ...dateMeta,

    time: props.time,
    isMajor: false,
    isMinor: !props.isLabeled,
    view: context.viewApi,
  }
  let renderHookEl = useRenderHookEl({
    classGenerator: options.slotLaneClass,
    didMount: options.slotLaneDidMount,
    willUnmount: options.slotLaneWillUnmount,
    renderProps,
  })

  return (
    <div
      ref={renderHookEl.ref}
      data-time={props.isoTimeStr}
      className={joinClassNames(
        classNames.noMargin,
        classNames.noPadding,
        classNames.liquid,
        classNames.borderlessX,
        classNames.borderlessBottom,
        !props.borderTop && classNames.borderlessTop,
        renderHookEl.className,
      )}
    />
  )
})
