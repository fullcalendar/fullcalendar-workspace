import { DateEnv } from '@full-ui/headless-calendar'
import { createContext, type Context } from 'react'
import { CalendarApiImpl } from './api/CalendarApiImpl'
import { ViewImpl } from './api/ViewImpl'
import { Emitter } from './common/Emitter'
import { DateProfileGenerator } from './DateProfileGenerator'
import { HitTarget } from './interactions/hit-target'
import { CalendarListeners, ViewOptionsRefined } from './options'
import { PluginHooks } from './plugin-system-struct'
import { Action } from './reducers/Action'
import { CalendarNowManager } from './reducers/CalendarNowManager'
import { CalendarData } from './reducers/data-types'
import { ViewSpec } from './structs/view-spec'

/*
The view context, split by what changes together (planning/phase-11-contexts-and-store-reads.md,
11a). CalendarInner provides these alongside ViewContextType, whose value (the facade) is unchanged.
Each value is memoized on a subset of the facade's inputs, so it never changes when the facade
doesn't
*/

export interface CalendarCore {
  calendarApi: CalendarApiImpl
  dispatch: (action: Action) => void
  emitter: Emitter<Required<CalendarListeners>>
  getCurrentData: () => CalendarData
  nowManager: CalendarNowManager
  baseId: string
  registerHitTarget: (target: HitTarget) => void
  unregisterHitTarget: (uid: string) => void
}

export interface ViewSpecContextValue {
  viewSpec: ViewSpec
  viewApi: ViewImpl
  dateProfileGenerator: DateProfileGenerator
}

export const CalendarCoreContext: Context<CalendarCore> = createContext<CalendarCore>({} as any)
export const PluginHooksContext: Context<PluginHooks> = createContext<PluginHooks>({} as any)
export const DateEnvContext: Context<DateEnv> = createContext<DateEnv>({} as any)
export const ViewSpecContext: Context<ViewSpecContextValue> = createContext<ViewSpecContextValue>({} as any)
export const ViewOptionsContext: Context<ViewOptionsRefined> = createContext<ViewOptionsRefined>({} as any)

export function buildCalendarCore(
  calendarApi: CalendarApiImpl,
  dispatch: (action: Action) => void,
  emitter: Emitter<Required<CalendarListeners>>,
  getCurrentData: () => CalendarData,
  nowManager: CalendarNowManager,
  baseId: string,
  registerHitTarget: (target: HitTarget) => void,
  unregisterHitTarget: (uid: string) => void,
): CalendarCore {
  return {
    calendarApi,
    dispatch,
    emitter,
    getCurrentData,
    nowManager,
    baseId,
    registerHitTarget,
    unregisterHitTarget,
  }
}

export function buildViewSpecContextValue(
  viewSpec: ViewSpec,
  viewApi: ViewImpl,
  dateProfileGenerator: DateProfileGenerator,
): ViewSpecContextValue {
  return { viewSpec, viewApi, dateProfileGenerator }
}
