import { EventRefined, identity, Identity } from '@fullcalendar/common'

export const EVENT_REFINERS = {
  resourceId: String,
  resourceIds: identity as Identity<string[]>,
  resourceEditable: Boolean,
}

export function generateEventDefResourceMembers(refined: EventRefined) {
  return {
    resourceIds: ensureStringArray(refined.resourceIds)
      .concat(refined.resourceId ? [refined.resourceId] : []),
    resourceEditable: refined.resourceEditable,
  }
}

function ensureStringArray(items: any[]) {
  return (items || []).map((item) => String(item))
}
