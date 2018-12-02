import { Splitter, EventDef } from 'fullcalendar'

export default class ResourceEventSplitter extends Splitter {

  getKeysForEventDef(eventDef: EventDef): string[] {
    let resourceIds = eventDef.resourceIds

    if (!resourceIds.length) {
      if (this.ensuredKeys.length) {
        resourceIds = this.ensuredKeys
      } else {
        resourceIds = [ '' ]
      }
    }

    return resourceIds
  }

}
