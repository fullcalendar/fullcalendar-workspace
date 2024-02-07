import { combineReducers } from 'redux'
import { hashById } from './utils'

export default combineReducers({
  weekendsVisible,
  eventsById
})

function weekendsVisible(weekendsVisible = true, action) {
  switch (action.type) {

    case 'TOGGLE_WEEKENDS':
      return !weekendsVisible

    default:
      return weekendsVisible
  }
}

function eventsById(eventsById = {}, action) {
  switch (action.type) {

    case 'RECEIVE_EVENTS':
      return hashById(action.plainEventObjects)

    case 'CREATE_EVENT':
    case 'UPDATE_EVENT':
      return {
        ...eventsById,
        [action.plainEventObject.id]: action.plainEventObject
      }

    case 'DELETE_EVENT':
      eventsById = {...eventsById} // copy
      delete eventsById[action.eventId]
      return eventsById

    default:
      return eventsById
  }
}
