import { Action } from './Action.js'
import { PluginHooks } from '../plugin-system-struct.js'
import { DateEnv } from '../datelib/env.js'
import { CalendarImpl } from '../api/CalendarImpl.js'
import { EventSourceHash } from '../structs/event-source.js'
import { ViewSpecHash, ViewSpec } from '../structs/view-spec.js'
import { DateProfileGenerator, DateProfile } from '../DateProfileGenerator.js'
import { Emitter } from '../common/Emitter.js'
import { EventUiHash, EventUi } from '../component-util/event-ui.js'
import { DateMarker } from '../datelib/marker.js'
import { ViewImpl } from '../api/ViewImpl.js'
import { EventStore } from '../structs/event-store.js'
import { DateSpan } from '../structs/date-span.js'
import { EventInteractionState } from '../interactions/event-interaction-state.js'
import { CalendarOptionsRefined, ViewOptionsRefined, CalendarOptions, CalendarListeners } from '../options.js'
import { ToolbarModel } from '../toolbar-struct.js'

export interface CalendarDataManagerState {
  dynamicOptionOverrides: CalendarOptions
  currentViewType: string
  currentDate: DateMarker
  dateProfile: DateProfile
  businessHours: EventStore
  eventSources: EventSourceHash
  eventUiBases: EventUiHash
  eventStore: EventStore
  renderableEventStore: EventStore
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  selectionConfig: EventUi
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

type CalendarDataBase = CalendarOptionsData & CalendarCurrentViewData & CalendarDataManagerState

// needs to be an interface so we can ambient-extend
// is a superset of CalendarContext
export interface CalendarData extends CalendarDataBase {
  viewTitle: string // based on current date
  calendarApi: CalendarImpl // TODO: try to remove this
  dispatch: (action: Action) => void
  emitter: Emitter<CalendarListeners>
  getCurrentData(): CalendarData // TODO: try to remove
}
