import { CalendarApiImpl } from './api/CalendarApiImpl'
import { ViewImpl } from './api/ViewImpl'
import { DateEnv } from '@full-ui/headless-calendar'
import { PluginHooks } from './plugin-system-struct'
import { createContext, type Context } from 'react'
import { DateProfileGenerator } from './DateProfileGenerator'
import { ViewSpec } from './structs/view-spec'
import { CalendarData } from './reducers/data-types'
import { Action } from './reducers/Action'
import { Emitter } from './common/Emitter'
import { HitTarget } from './interactions/hit-target'
import { CalendarContext } from './CalendarContext'
import { ViewOptionsRefined, CalendarListeners } from './options'
import { CalendarNowManager } from './reducers/CalendarNowManager'

export const ViewContextType: Context<any> = createContext<ViewContext>({} as any) // for Components
export type ResizeHandler = () => void

/*
it's important that ViewContext extends CalendarContext so that components that subscribe to ViewContext
can pass in their ViewContext to util functions that accept CalendarContext.
*/
export interface ViewContext extends CalendarContext {
  options: ViewOptionsRefined // more specific than BaseOptionsRefined
  dateProfileGenerator: DateProfileGenerator
  viewSpec: ViewSpec
  viewApi: ViewImpl
  baseId: string
  registerHitTarget: (target: HitTarget) => void
  unregisterHitTarget: (uid: string) => void
}

export function buildViewContext(
  viewSpec: ViewSpec,
  viewApi: ViewImpl,
  viewOptions: ViewOptionsRefined,
  dateProfileGenerator: DateProfileGenerator,
  dateEnv: DateEnv,
  nowManager: CalendarNowManager,
  pluginHooks: PluginHooks,
  dispatch: (action: Action) => void,
  getCurrentData: () => CalendarData,
  emitter: Emitter<Required<CalendarListeners>>,
  calendarApi: CalendarApiImpl,
  baseId: string,
  registerHitTarget: (target: HitTarget) => void,
  unregisterHitTarget: (uid: string) => void,
): ViewContext {
  return {
    dateEnv,
    nowManager,
    options: viewOptions,
    pluginHooks,
    emitter,
    dispatch,
    getCurrentData,
    calendarApi,
    viewSpec,
    viewApi,
    dateProfileGenerator,
    baseId,
    registerHitTarget,
    unregisterHitTarget,
  }
}
