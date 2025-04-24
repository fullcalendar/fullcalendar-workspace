import { ViewApi } from '@fullcalendar/core'
import { MountArg } from '@fullcalendar/core/internal'

export interface ListDayArg {
  date: Date
}

export interface ListDayHeaderContentArg {
  date: Date
  sticky: boolean
  text: string
  sideText: string
  view: ViewApi
  navLinkAttrs: any // TODO type
  sideNavLinkAttrs: any // TODO type
}

export type ListDayHeaderMountArg = MountArg<ListDayHeaderContentArg>
