import { EventRefined, identity, Identity } from '@fullcalendar/common'


const EVENT_REFINERS = { // TODO: hook this up!!!
  resourceId: String,
  resourceIds: identity as Identity<string[]>,
  resourceEditable: Boolean
}


// TODO: put in separate file!!!
type ExtraEventRefiners = typeof EVENT_REFINERS
declare module '@fullcalendar/common' {
  interface EventRefiners extends ExtraEventRefiners {}
}


export function generateEventDefResourceMembers(refined: EventRefined) {
  return {
    resourceIds: ensureStringArray(refined.resourceIds)
      .concat(refined.resourceId ? [ refined.resourceId ] : []),
    resourceEditable: refined.resourceEditable
  }
}


function ensureStringArray(items: any[]) {
  return (items || []).map(function(item) {
    return String(item)
  })
}
