import { ViewApi } from '@fullcalendar/core'
import { DateMarker, DateMeta, MountData } from '@fullcalendar/core/internal'

export interface DayCellData extends DateMeta {
  date: DateMarker // localized
  isMajor: boolean
  isCompact: boolean
  hasLabel: boolean
  hasMonthLabel: boolean
  hasNavLink: boolean
  view: ViewApi
  text: string
  textParts: Intl.DateTimeFormatPart[]
  [extraProp: string]: any // so can include a resource
}

export type DayCellMountData = MountData<DayCellData>
