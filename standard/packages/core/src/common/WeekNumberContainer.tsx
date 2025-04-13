import { MountArg } from './render-hook.js'

export interface WeekNumberContentArg {
  num: number
  text: string
  date: Date
}

export type WeekNumberMountArg = MountArg<WeekNumberContentArg>
