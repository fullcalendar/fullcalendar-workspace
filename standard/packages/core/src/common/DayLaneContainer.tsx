import { ViewApi } from '../api/ViewApi.js'
import { DateMeta } from '../component-util/date-rendering.js'
import { DateMarker } from '@full-ui/headless-calendar'
import { MountData } from './render-hook.js'

export interface DayLaneData extends DateMeta {
  date: DateMarker // localized
  isNarrow: boolean
  isStack: boolean
  isMajor: boolean
  view: ViewApi
  [extraProp: string]: any // so can include a resource
}

export type DayLaneMountData = MountData<DayLaneData>
