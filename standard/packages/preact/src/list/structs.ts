import { ViewApi } from '../api/ViewApi'
import type { DateMeta } from '../component-util/date-rendering'
import type { MountData } from '../common/render-hook'

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
