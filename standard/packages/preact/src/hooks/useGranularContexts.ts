import { DateEnv } from '@full-ui/headless-calendar'
import { useContext } from 'react'
import {
  CalendarCore,
  CalendarCoreContext,
  DateEnvContext,
  PluginHooksContext,
  ViewOptionsContext,
  ViewSpecContext,
  ViewSpecContextValue,
} from '../granular-contexts'
import { ViewOptionsRefined } from '../options'
import { PluginHooks } from '../plugin-system-struct'

/*
Narrow reads of the view context (see granular-contexts.ts). A consumer re-renders only when the
part it reads changes. useViewContext() is the facade over all of them
*/

// the calendar's API, dispatch, emitter, now manager and hit-target registry. practically constant
export function useCalendarCore(): CalendarCore {
  return useContext(CalendarCoreContext)
}

export function usePluginHooks(): PluginHooks {
  return useContext(PluginHooksContext)
}

export function useDateEnv(): DateEnv {
  return useContext(DateEnvContext)
}

export function useViewSpec(): ViewSpecContextValue {
  return useContext(ViewSpecContext)
}

export function useViewOptions(): ViewOptionsRefined {
  return useContext(ViewOptionsContext)
}
