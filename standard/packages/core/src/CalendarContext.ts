import { DateEnv } from '@full-ui/headless-calendar'
import { BaseOptionsRefined, CalendarListeners } from './options.js'
import { PluginHooks } from './plugin-system-struct.js'
import { Emitter } from './common/Emitter.js'
import { Action } from './reducers/Action.js'
import { CalendarApiImpl } from './api/CalendarApiImpl.js'
import { CalendarData } from './reducers/data-types.js'
import { CalendarNowManager } from './reducers/CalendarNowManager.js'

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
