import { MountData } from './render-hook.js'

export type DateTimeFormatPartWithWeek = Omit<Intl.DateTimeFormatPart, 'type'> & {
  type: Intl.DateTimeFormatPart['type'] | 'week'
}

// week number HEADER

export interface WeekNumberHeaderData {
  num?: number // undefined if not for specific date
  date?: Date // undefined if not for specific date
  text: string
  textParts: DateTimeFormatPartWithWeek[]
  isNarrow: boolean
  hasNavLink: boolean
  options: { dayMinWidth: number | undefined }
}

export type WeekNumberHeaderMountData = MountData<WeekNumberHeaderData>

// week number CELL (eventually)

export interface WeekNumberCellData { // TODO: DRY with inline?
  num: number
  date: Date
  text: string
  textParts: DateTimeFormatPartWithWeek[]
  isNarrow: boolean
  hasNavLink: boolean
}

export type WeekNumberCellMountData = MountData<WeekNumberCellData>

// INLINE week number

export interface InlineWeekNumberData {
  num: number
  date: Date
  text: string
  textParts: DateTimeFormatPartWithWeek[]
  isNarrow: boolean
  hasNavLink: boolean
}

export type InlineWeekNumberMountData = MountData<InlineWeekNumberData>
