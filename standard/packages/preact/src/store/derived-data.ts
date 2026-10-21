import { mapHash } from '../util/object'
import { CalendarContext } from '../context/CalendarContext'
import { EventDefHash } from '../events/event-def'
import { EventUi, EventUiHash, createEventUi } from '../events/event-ui'
import { parseBusinessHours } from '../events/business-hours'
import { EventSourceHash } from '../event-sources/event-source'
import { CalendarDataManagerState } from './data-types'

/*
What each reduction derives from the state and options (memoized by the store): the event UI bases,
the view's UI props and business hours, and whether anything is loading
*/

export function buildEventUiBySource(eventSources: EventSourceHash): EventUiHash {
  return mapHash(eventSources, (eventSource) => eventSource.ui)
}

/*
The result of this is processed by compileEventUi
*/
export function buildEventUiBases(
  eventDefs: EventDefHash,
  eventUiSingleBase: EventUi,
  eventUiBySource: EventUiHash,
) {
  let eventUiBases: EventUiHash = {
    '': eventUiSingleBase, // fallback
  }

  for (let defId in eventDefs) {
    let def = eventDefs[defId]

    if (def.sourceId && eventUiBySource[def.sourceId]) {
      eventUiBases[defId] = eventUiBySource[def.sourceId]
    }
  }

  return eventUiBases
}

export function buildViewUiProps(calendarContext: CalendarContext) {
  const { options } = calendarContext

  return {
    eventUiSingleBase: createEventUi(
      {
        display: options.eventDisplay,
        editable: options.editable, // without "event" at start
        startEditable: options.eventStartEditable,
        durationEditable: options.eventDurationEditable,
        constraint: options.eventConstraint,
        overlap: typeof options.eventOverlap === 'boolean' ? options.eventOverlap : undefined,
        allow: options.eventAllow,
        // color: options.eventColor, // event components/BgEvent will handle this
        // contrastColor: options.eventContrastColor, // event components/BgEvent will handle this
        // className: options.eventClass // render hook will handle this
      },
      calendarContext,
    ),
    selectionConfig: createEventUi(
      {
        constraint: options.selectConstraint,
        overlap: typeof options.selectOverlap === 'boolean' ? options.selectOverlap : undefined,
        allow: options.selectAllow,
      },
      calendarContext,
    ),
  }
}

export function parseContextBusinessHours(calendarContext: CalendarContext) {
  return parseBusinessHours(calendarContext.options.businessHours, calendarContext)
}

export function computeIsLoading(state: CalendarDataManagerState, context: CalendarContext) {
  for (let isLoadingFunc of context.pluginHooks.isLoadingFuncs) {
    if (isLoadingFunc(state)) {
      return true
    }
  }

  return false
}
