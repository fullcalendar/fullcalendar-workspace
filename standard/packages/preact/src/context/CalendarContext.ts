import { DateEnv } from '@full-ui/headless-calendar'
import { BaseOptionsRefined } from '@fullcalendar/core/protected-api'
import { CalendarListeners } from '../options/options'
import { PluginHooks } from '../plugins/plugin-types'
import { Emitter } from '../util/Emitter'
import { Action } from '../store/actions'
import { CalendarApiImpl } from '../api/CalendarApiImpl'
import { CalendarData } from '../store/data-types'
import { CalendarNowManager } from '../now/CalendarNowManager'

export interface CalendarContext {
  nowManager: CalendarNowManager
  dateEnv: DateEnv
  options: BaseOptionsRefined // does not have calendar-specific properties. aims to be compatible with ViewOptionsRefined
  pluginHooks: PluginHooks
  emitter: Emitter<Required<CalendarListeners>>
  dispatch(action: Action): void
  getCurrentData(): CalendarData
  calendarApi: CalendarApiImpl
}
