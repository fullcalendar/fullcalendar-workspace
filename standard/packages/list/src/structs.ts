import { ViewApi } from '@fullcalendar/core'
import { DateMeta, MountData } from '@fullcalendar/core/internal'

export interface ListDayData extends DateMeta {
  view: ViewApi
}

export interface ListDayHeaderData extends ListDayData {
  isSticky: boolean
}
export type ListDayHeaderMountData = MountData<ListDayHeaderData>

export interface ListDayHeaderInnerData extends ListDayData {
  text: string
  textParts: Intl.DateTimeFormatPart[]
}
