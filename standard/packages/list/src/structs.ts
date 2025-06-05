import { ViewApi } from '@fullcalendar/core'
import { DateMeta, MountArg } from '@fullcalendar/core/internal'

export interface ListDayArg extends DateMeta {
  view: ViewApi
}

export interface ListDayHeaderArg extends ListDayArg {
  isSticky: boolean
}
export type ListDayHeaderMountArg = MountArg<ListDayHeaderArg>

export interface ListDayHeaderInnerArg extends ListDayArg {
  text: string
  textParts: Intl.DateTimeFormatPart[]
}
