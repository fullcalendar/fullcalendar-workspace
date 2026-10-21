import { Action } from './actions'
import { PluginHooks } from '../plugins/plugin-types'
import { DateEnv, DateMarker } from '@full-ui/headless-calendar'
import { CalendarApiImpl } from '../api/CalendarApiImpl'
import { EventSourceHash } from '../event-sources/event-source'
import { ViewSpecHash, ViewSpec } from '../views/view-spec'
import { DateProfileGenerator, DateProfile } from '../date-profile/DateProfileGenerator'
import { Emitter } from '../util/Emitter'
import { EventUiHash, EventUi } from '../events/event-ui'
import { ViewImpl } from '../api/ViewImpl'
import { EventStore } from '../events/event-store'
import { DateSpan } from '../events/date-span'
import { EventInteractionState } from '../interactions/event-interaction-state'
import { CalendarOptionsRefined, ViewOptionsRefined, CalendarOptions, CalendarListeners } from '../options/options'
import { ToolbarModel } from '../toolbar/toolbar-types'
import { CalendarNowManager } from '../now/CalendarNowManager'
import { CalendarController } from '../calendar/CalendarController'

// the slices (store.getState()). plugins' slices are merged in
export interface CalendarDataManagerState {
  dynamicOptionOverrides: CalendarOptions
  currentViewType: string
  currentDate: DateMarker
  dateProfile: DateProfile
  eventSources: EventSourceHash
  eventStore: EventStore
  renderableEventStore: EventStore
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  nowDate: DateMarker // whole-day
}

// memoized derivations of the options and the slices, in CalendarData (and given to plugin reducers)
export interface CalendarDerivedData {
  businessHours: EventStore
  eventUiBases: EventUiHash
  selectionConfig: EventUi
}

export interface CalendarToolbarProps {
  title: string
  selectedButton: string
  navUnit: string
  isTodayEnabled: boolean
  isPrevEnabled: boolean
  isNextEnabled: boolean
}

export interface CalendarOptionsData {
  localeDefaults: CalendarOptions
  calendarOptions: CalendarOptionsRefined
  toolbarConfig: { [toolbarName: string]: ToolbarModel }
  availableRawLocales: any
  dateEnv: DateEnv
  pluginHooks: PluginHooks
  viewSpecs: ViewSpecHash
}

export interface CalendarCurrentViewData {
  viewSpec: ViewSpec
  options: ViewOptionsRefined
  viewApi: ViewImpl
  dateProfileGenerator: DateProfileGenerator
}

type CalendarDataBase = CalendarOptionsData & CalendarCurrentViewData & CalendarDataManagerState & CalendarDerivedData

// needs to be an interface so we can ambient-extend
// is a superset of CalendarContext
export interface CalendarData extends CalendarDataBase {
  nowManager: CalendarNowManager
  viewTitle: string // based on current date
  calendarApi: CalendarApiImpl // TODO: try to remove this
  dispatch: (action: Action) => void
  // binds the committed controller option. see CalendarStore
  syncController: (controller: CalendarController | undefined) => void
  emitter: Emitter<Required<CalendarListeners>>
  getCurrentData(): CalendarData // TODO: try to remove
  toolbarProps: CalendarToolbarProps
}
