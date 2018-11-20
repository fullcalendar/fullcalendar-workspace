import { EventDef, refineProps } from 'fullcalendar'

declare module 'fullcalendar/src/structs/event' {
  interface EventDef {
    resourceIds: string[]
  }
}

const RESOURCE_RELATED_PROPS = {
  resourceId: String,
  resourceIds: (items) => {
    return (items || []).map(function(item) {
      return String(item)
    })
  }
}

export function parseEventDef(def: EventDef, props, leftovers) {
  let resourceRelatedProps = refineProps(props, RESOURCE_RELATED_PROPS, {}, leftovers)
  let resourceIds = resourceRelatedProps.resourceIds

  if (resourceRelatedProps.resourceId) {
    resourceIds.push(resourceRelatedProps.resourceId)
  }

  def.resourceIds = resourceIds
}
