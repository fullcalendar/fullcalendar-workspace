import { EventInput } from '@fullcalendar/core';
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { INITIAL_EVENTS } from './event-utils';
import * as CalendarActions from './actions';

interface State {
  calendarVisible: boolean,
  events: EventInput[]
}

const initialState: State = {
  calendarVisible: true,
  events: INITIAL_EVENTS
}

export const CalendarFeature = createFeature({
  name: 'calendar',
  reducer: createReducer(
    initialState,
    on(CalendarActions.toggleCalendar, state => ({ ...state, calendarVisible: !state.calendarVisible })),
    on(CalendarActions.createEvent, (state, { event }) => ({ ...state, events: [...state.events, event] })),
    on(CalendarActions.deleteEvent, (state, { id }) => ({ ...state, events: state.events.filter(e => e.id !== id) }))
  )
});

export const {
  name,
  reducer,
  selectCalendarState,
  selectCalendarVisible,
  selectEvents
} = CalendarFeature;

export const selectEventsCount = createSelector(
  CalendarFeature.selectEvents,
  events => events.length
);
