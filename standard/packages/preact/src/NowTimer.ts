import { DateMarker, DateRange } from '@full-ui/headless-calendar'
import { type ReactNode } from 'react'
import { useNow } from './hooks/useNow'

export interface NowTimerProps {
  unit: string // TODO: add type of unit
  unitValue?: number // solely for nowIndicator:auto
  // nowMs is the exact instant of `now` — unlike the marker, unambiguous during DST transitions
  children?: (now: DateMarker, todayRange: DateRange, nowMs: number) => ReactNode
}

// a render-prop form of useNow, for class components
export function NowTimer(props: NowTimerProps) {
  const { nowDate, todayRange, nowMs } = useNow(props.unit, props.unitValue)

  return props.children(nowDate, todayRange, nowMs) as any
}
