import { createElement } from '@fullcalendar/core/preact'
import classNames from '@fullcalendar/core/internal-classnames'

export interface TimeGridAxisEmptyProps {
  isLiquid: boolean
  width: number | undefined
}

export function TimeGridAxisEmpty(props: TimeGridAxisEmptyProps) {
  return (
    <div
      role='gridcell' // is empty so can't be rowheader/columnheader
      className={props.isLiquid ? classNames.liquid : classNames.contentBox}
      style={{ width: props.width }}
    />
  )
}
