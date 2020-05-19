import { EventRefined, identity, Identity } from '@fullcalendar/common'


export const EVENT_REFINERS = {
  resourceId: String,
  resourceIds: identity as Identity<string[]>,
  resourceEditable: Boolean
}


export function generateEventDefResourceMembers(refined: EventRefined) {
  return {
    resourceIds: (refined.resourceIds || []).concat(refined.resourceId),
    resourceEditable: refined.resourceEditable
  }
}
