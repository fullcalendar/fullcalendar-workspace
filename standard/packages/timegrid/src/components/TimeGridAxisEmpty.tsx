import { joinClassNames } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'

export interface TimeGridAxisEmptyProps {
  isLiquid: boolean
  width: number | undefined
}

export function TimeGridAxisEmpty(props: TimeGridAxisEmptyProps) {
  return (
    <div
      className={joinClassNames(
        'fc-timegrid-axis',
        props.isLiquid ? 'fc-liquid' : 'fc-content-box',
      )}
      style={{ width: props.width }}
    />
  )
}
