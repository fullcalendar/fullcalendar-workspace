import { Calendar, CalendarState, Action } from 'fullcalendar'

export default function(state: CalendarState, action: Action, calendar: Calendar) {
  console.log('resourcesReducer', action)
  return state
}
