import { MountData } from './render-hook.js'

export type DateTimeFormatPartWithWeek = Omit<Intl.DateTimeFormatPart, 'type'> & {
  type: Intl.DateTimeFormatPart['type'] | 'week'
}

export interface WeekNumberDisplayData {
  num: number
  text: string
  textParts: DateTimeFormatPartWithWeek[]
  date: Date
  isCompact: boolean
  isCell: boolean
}

export type WeekNumberMountData = MountData<WeekNumberDisplayData>
