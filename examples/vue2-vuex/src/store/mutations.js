import * as Mutation from './mutation-types'
import { getEventIndexById } from './utils'

export default {
  [Mutation.CREATE_EVENT] (state, event) {
    return state.events.push(event)
  },
  [Mutation.UPDATE_EVENT] (state, updatedEvent) {
    const index = getEventIndexById(state, updatedEvent.id)

    if (index === -1) {
      return console.warn(`Unable to update event (id ${updatedEvent.id})`)
    }
    
    return state.events.splice(index, 1, {
      ...state.events[index],
      title: updatedEvent.title,
      start: updatedEvent.start,
      end: updatedEvent.end,
      date: updatedEvent.date
    })
  },
  [Mutation.DELETE_EVENT] (state, eventId) {
    const index = getEventIndexById(state, eventId)

    if (index === -1) {
      return console.warn(`Unable to delete event (id ${eventId})`)
    }
    
    return state.events.splice(index, 1)
  },
  [Mutation.SET_WEEKENDS_ENABLED] (state, enabled) {
    state.weekendsVisible = enabled
  }
}
