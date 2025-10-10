import { ViewApi } from '@fullcalendar/core'
import { DateMeta, MountData } from '@fullcalendar/core/internal'

export interface ListDayData extends DateMeta {
  view: ViewApi
}

export interface ListDayHeaderData extends ListDayData {
}
export type ListDayHeaderMountData = MountData<ListDayHeaderData>

export interface ListDayHeaderInnerData extends ListDayData {
  text: string
  textParts: Intl.DateTimeFormatPart[]
  dayNumberText: string
  hasNavLink: boolean
  level: number // 0 for listDayFormat, 1 for listDaySideFormat
}
