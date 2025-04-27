import { MountArg } from './render-hook.js'

export type DateTimeFormatPartWithWeek = Omit<Intl.DateTimeFormatPart, 'type'> & {
  type: Intl.DateTimeFormatPart['type'] | 'week'
}

export interface WeekNumberContentArg {
  num: number
  text: string
  textParts: DateTimeFormatPartWithWeek[]
  date: Date
}

export type WeekNumberMountArg = MountArg<WeekNumberContentArg>
