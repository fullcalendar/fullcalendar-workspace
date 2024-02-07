export const getEventIndexById = (state, eventId) => state.events.findIndex(event => event.id.toString() === eventId.toString())
