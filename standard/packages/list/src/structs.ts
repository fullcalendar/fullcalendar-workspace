import { DayHeaderContentArg } from '@fullcalendar/core'
import { MountArg } from '@fullcalendar/core/internal'

export interface ListDayHeaderContentArg extends DayHeaderContentArg {
  text: string
  sideText: string
}

export type ListDayHeaderMountArg = MountArg<ListDayHeaderContentArg>
