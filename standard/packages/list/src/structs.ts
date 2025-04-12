import { ViewApi } from '@fullcalendar/core'
import { MountArg } from '@fullcalendar/core/internal'

export interface ListDayHeaderContentArg {
  date: Date
  isMajor: boolean
  text: string
  sideText: string
  view: ViewApi
  navLinkAttrs: any // TODO type
  sideNavLinkAttrs: any // TODO type
}

export type ListDayHeaderMountArg = MountArg<ListDayHeaderContentArg>
