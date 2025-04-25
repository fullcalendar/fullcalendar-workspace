import { createElement } from '@fullcalendar/core/preact'

export interface TimeGridAxisEmptyProps {
  isLiquid: boolean
  width: number | undefined
}

export function TimeGridAxisEmpty(props: TimeGridAxisEmptyProps) {
  return (
    <div
      role='gridcell' // is empty so can't be rowheader/columnheader
      className={props.isLiquid ? 'fcu-liquid' : 'fcu-content-box'}
      style={{ width: props.width }}
    />
  )
}
