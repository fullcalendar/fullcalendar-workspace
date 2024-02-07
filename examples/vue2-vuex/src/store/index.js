import actions from './actions'
import mutations from './mutations'

import { addDays } from 'date-fns'

const state = {
  events: [
    { id: 10, title: 'All day event', date: new Date(), allDay: true },
    { id: 20, title: 'Timed event', start: addDays(new Date(), 1) },
    { id: 30, title: 'Timed event', start: addDays(new Date(), 2) }
  ],
  weekendsVisible: true
}

const getters = {
  events: state => state.events,
  weekendsVisible: state => state.weekendsVisible
}

export default {
  state,
  getters,
  mutations,
  actions
}
