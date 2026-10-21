import { createDuration } from '@full-ui/headless-calendar'
import { parseDateSpan } from '../structs/date-span'
import { parseEventSource } from '../structs/event-source-parse'
import { parseEvent } from '../structs/event-parse'
import { eventTupleToStore } from '../structs/event-store'
import { ViewSpec } from '../structs/view-spec'
import { PointerDragEvent } from '../interactions/pointer'
import { triggerDateSelect, triggerDateUnselect } from '../calendar-utils'
import { hashValuesToArray } from '../util/object'
import { EventSource } from '../structs/event-source'
import { eventApiToStore, EventImpl } from './EventImpl'
import { EventSourceImpl } from './EventSourceImpl'
import { warn } from '../util/warn'
import type { CalendarApiImpl } from './CalendarApiImpl'
import type { CalendarStore } from '../reducers/store'
import {
  CalendarOptions,
  DateInput,
  DurationInput,
  DateSpanInput,
  DateRangeInput,
  EventSourceInput,
  EventInput,
} from './structs'

/*
What changes a calendar: navigation, options, selection, events and event sources. Built once per store
(store.actions), with what were CalendarApiImpl's method bodies, which now delegate here. They read the
store's data and dispatch to it. Methods a driver may override (batchRendering) are still called
through the API. See planning/phase-9-store.md
*/
export interface CalendarActions {
  // navigation
  changeView(viewType: string, dateOrRange?: DateRangeInput | DateInput): void
  zoomTo(dateMarker: Date, viewType?: string): void
  prev(): void
  next(): void
  prevYear(): void
  nextYear(): void
  today(): void
  gotoDate(zonedDateInput: DateInput): void
  incrementDate(deltaInput: DurationInput): void

  // options
  setOption<OptionName extends keyof CalendarOptions>(name: OptionName, val: CalendarOptions[OptionName]): void
  resetOptions(optionOverrides: CalendarOptions, changedOptionNames?: string[]): void

  // selection
  select(dateOrObj: DateInput | any, endDate?: DateInput): void
  unselect(pev?: PointerDragEvent): void

  // events
  addEvent(eventInput: EventInput, sourceInput?: EventSourceImpl | string | boolean): EventImpl | null
  removeAllEvents(): void

  // event sources
  addEventSource(sourceInput: EventSourceInput): EventSourceImpl
  removeAllEventSources(): void
  refetchEvents(): void

  // scroll
  scrollToTime(timeInput: DurationInput): void
}

export function createCalendarActions(store: CalendarStore, calendarApi: CalendarApiImpl): CalendarActions {
  const { dispatch } = store
  const getCurrentData = () => store.getData()

  const actions: CalendarActions = {
    changeView(viewType, dateOrRange) {
      calendarApi.batchRendering(() => {
        actions.unselect()

        if (dateOrRange) {
          if ((dateOrRange as DateRangeInput).start && (dateOrRange as DateRangeInput).end) { // a range
            dispatch({
              type: 'CHANGE_VIEW_TYPE',
              viewType,
            })
            dispatch({ // not very efficient to do two dispatches
              type: 'SET_OPTION',
              optionName: 'visibleRange',
              rawOptionValue: dateOrRange,
            })
          } else {
            let { dateEnv } = getCurrentData()

            dispatch({
              type: 'CHANGE_VIEW_TYPE',
              viewType,
              dateMarker: dateEnv.createMarker(dateOrRange as DateInput),
            })
          }
        } else {
          dispatch({
            type: 'CHANGE_VIEW_TYPE',
            viewType,
          })
        }
      })
    },

    // Forces navigation to a view for the given date.
    // `viewType` can be a specific view name or a generic one like "week" or "day".
    // needs to change
    zoomTo(dateMarker, viewType) {
      let state = getCurrentData()
      let spec

      viewType = viewType || 'day' // day is default zoom
      spec = state.viewSpecs[viewType] || getUnitViewSpec(store, viewType)

      actions.unselect()

      if (spec) {
        dispatch({
          type: 'CHANGE_VIEW_TYPE',
          viewType: spec.type,
          dateMarker,
        })
      } else {
        dispatch({
          type: 'CHANGE_DATE',
          dateMarker,
        })
      }
    },

    prev() {
      actions.unselect()
      dispatch({ type: 'PREV' })
    },

    next() {
      actions.unselect()
      dispatch({ type: 'NEXT' })
    },

    prevYear() {
      let state = getCurrentData()
      actions.unselect()
      dispatch({
        type: 'CHANGE_DATE',
        dateMarker: state.dateEnv.addYears(state.currentDate, -1),
      })
    },

    nextYear() {
      let state = getCurrentData()

      actions.unselect()
      dispatch({
        type: 'CHANGE_DATE',
        dateMarker: state.dateEnv.addYears(state.currentDate, 1),
      })
    },

    today() {
      let state = getCurrentData()

      actions.unselect()
      dispatch({
        type: 'CHANGE_DATE',
        dateMarker: state.nowManager.getDateMarker(),
      })
    },

    gotoDate(zonedDateInput) {
      let state = getCurrentData()

      actions.unselect()
      dispatch({
        type: 'CHANGE_DATE',
        dateMarker: state.dateEnv.createMarker(zonedDateInput),
      })
    },

    incrementDate(deltaInput) {
      let state = getCurrentData()
      let delta = createDuration(deltaInput)

      if (delta) { // else, warn about invalid input?
        actions.unselect()
        dispatch({
          type: 'CHANGE_DATE',
          dateMarker: state.dateEnv.add(state.currentDate, delta),
        })
      }
    },

    setOption(name, val) {
      dispatch({
        type: 'SET_OPTION',
        optionName: name,
        rawOptionValue: val,
      })
    },

    // the overrides and the invalidation update now, then the action is dispatched
    resetOptions(optionOverrides, changedOptionNames) {
      store.resetOptions(optionOverrides, changedOptionNames)
    },

    select(dateOrObj, endDate) {
      let selectionInput: DateSpanInput

      if (endDate == null) {
        if (dateOrObj.start != null) {
          selectionInput = dateOrObj as DateSpanInput
        } else {
          selectionInput = {
            start: dateOrObj,
            end: null,
          }
        }
      } else {
        selectionInput = {
          start: dateOrObj,
          end: endDate,
        } as DateSpanInput
      }

      let state = getCurrentData()
      let selection = parseDateSpan(
        selectionInput,
        state.dateEnv,
        createDuration({ days: 1 }), // TODO: cache this?
      )

      if (selection) { // throw parse error otherwise?
        dispatch({ type: 'SELECT_DATES', selection })
        triggerDateSelect(selection, null, state)
      }
    },

    unselect(pev) {
      let state = getCurrentData()

      if (state.dateSelection) {
        dispatch({ type: 'UNSELECT_DATES' })
        triggerDateUnselect(pev, state)
      }
    },

    addEvent(eventInput, sourceInput) {
      if (eventInput instanceof EventImpl) {
        let def = eventInput._def
        let instance = eventInput._instance
        let currentData = getCurrentData()

        // not already present? don't want to add an old snapshot
        if (!currentData.eventStore.defs[def.defId]) {
          dispatch({
            type: 'ADD_EVENTS',
            eventStore: eventTupleToStore({ def, instance }), // TODO: better util for two args?
          })
          triggerEventAdd(eventInput)
        }

        return eventInput
      }

      let state = getCurrentData()
      let eventSource: EventSource<any>

      if (sourceInput instanceof EventSourceImpl) {
        eventSource = sourceInput.internalEventSource
      } else if (typeof sourceInput === 'boolean') {
        if (sourceInput) { // true. part of the first event source
          [eventSource] = hashValuesToArray(state.eventSources)
        }
      } else if (sourceInput != null) { // an ID. accepts a number too
        let sourceApi = calendarApi.getEventSourceById(sourceInput) // TODO: use an internal function

        if (!sourceApi) {
          warn(`Unknown event source ID \`${sourceInput}\`.`) // TODO: test
          return null
        }
        eventSource = sourceApi.internalEventSource
      }

      let tuple = parseEvent(eventInput, eventSource, state, false)

      if (tuple) {
        let newEventApi = new EventImpl(
          state,
          tuple.def,
          tuple.def.recurringDef ? null : tuple.instance,
        )
        dispatch({
          type: 'ADD_EVENTS',
          eventStore: eventTupleToStore(tuple),
        })
        triggerEventAdd(newEventApi)

        return newEventApi
      }

      return null
    },

    removeAllEvents() {
      dispatch({ type: 'REMOVE_ALL_EVENTS' })
    },

    addEventSource(sourceInput) {
      let state = getCurrentData()

      if (sourceInput instanceof EventSourceImpl) {
        // not already present? don't want to add an old snapshot
        if (!state.eventSources[sourceInput.internalEventSource.sourceId]) {
          dispatch({
            type: 'ADD_EVENT_SOURCES',
            sources: [sourceInput.internalEventSource],
          })
        }

        return sourceInput
      }

      let eventSource = parseEventSource(sourceInput, state)

      if (eventSource) { // TODO: error otherwise?
        dispatch({ type: 'ADD_EVENT_SOURCES', sources: [eventSource] })

        return new EventSourceImpl(state, eventSource)
      }

      return null
    },

    removeAllEventSources() {
      dispatch({ type: 'REMOVE_ALL_EVENT_SOURCES' })
    },

    refetchEvents() {
      dispatch({ type: 'FETCH_EVENT_SOURCES', isRefetch: true })
    },

    scrollToTime(timeInput) {
      let time = createDuration(timeInput)

      if (time) {
        store.emitter.trigger('_timeScrollRequest', time)
      }
    },
  }

  function triggerEventAdd(eventApi: EventImpl): void {
    let { emitter } = getCurrentData()

    emitter.trigger('eventAdd', {
      event: eventApi,
      relatedEvents: [],
      revert: () => {
        dispatch({
          type: 'REMOVE_EVENTS',
          eventStore: eventApiToStore(eventApi),
        })
      },
    })
  }

  return actions
}

// Given a duration singular unit, like "week" or "day", finds a matching view spec.
// Preference is given to views that have corresponding buttons.
function getUnitViewSpec(store: CalendarStore, unit: string): ViewSpec | null {
  let { viewSpecs, toolbarConfig } = store.getData()
  let viewTypes = [].concat(
    toolbarConfig.header ? toolbarConfig.header.viewsWithButtons : [],
    toolbarConfig.footer ? toolbarConfig.footer.viewsWithButtons : [],
  )
  let i
  let spec

  for (let viewType in viewSpecs) {
    viewTypes.push(viewType)
  }

  for (i = 0; i < viewTypes.length; i += 1) {
    spec = viewSpecs[viewTypes[i]]
    if (spec) {
      if (spec.singleUnit === unit) {
        return spec
      }
    }
  }

  return null
}
