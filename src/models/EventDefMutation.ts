import { EventDefMutation } from 'fullcalendar'

declare module 'fullcalendar/EventDefMutation' {
  interface Default {
    oldResourceId: any
    newResourceId: any
  }
}

const oldMutateSingle = EventDefMutation.prototype.mutateSingle

// either both will be set, or neither will be set
EventDefMutation.prototype.oldResourceId = null
EventDefMutation.prototype.newResourceId = null


EventDefMutation.prototype.mutateSingle = function(eventDef) {
  const undo = oldMutateSingle.apply(this, arguments)
  let savedResourceIds = null

  if (this.oldResourceId && eventDef.hasResourceId(this.oldResourceId)) {
    savedResourceIds = eventDef.getResourceIds()
    eventDef.removeResourceId(this.oldResourceId)
    eventDef.addResourceId(this.newResourceId)
  }

  return () => { // return value
    undo()

    if (savedResourceIds) {
      eventDef.resourceIds = savedResourceIds
    }
  }
}
