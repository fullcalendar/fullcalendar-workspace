import { ViewApi } from '../api/ViewApi'
import type { DateMeta } from '../component-util/date-rendering'
import type { MountData } from '../common/render-hook'

export interface ListDayData extends DateMeta {
  isFirst: boolean
  isLast: boolean
  view: ViewApi
}

export interface ListDayHeaderData extends DateMeta {
  view: ViewApi
}
export type ListDayHeaderMountData = MountData<ListDayHeaderData>

export interface ListDayEventsData extends DateMeta {
  view: ViewApi
}

export interface ListDayHeaderInnerData extends DateMeta {
  text: string
  textParts: Intl.DateTimeFormatPart[]
  dayNumberText: string
  hasNavLink: boolean
  level: number // 0 for listDayFormat, 1 for listDaySideFormat
  view: ViewApi
}
