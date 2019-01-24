import { EventDef, refineProps } from '@fullcalendar/core'

declare module '@fullcalendar/core' {
  interface EventDef {
    resourceIds: string[]
    resourceEditable: boolean
  }
}

const RESOURCE_RELATED_PROPS = {
  resourceId: String,
  resourceIds: (items) => {
    return (items || []).map(function(item) {
      return String(item)
    })
  },
  resourceEditable: Boolean
}

export function parseEventDef(def: EventDef, props, leftovers) {
  let resourceRelatedProps = refineProps(props, RESOURCE_RELATED_PROPS, {}, leftovers)
  let resourceIds = resourceRelatedProps.resourceIds

  if (resourceRelatedProps.resourceId) {
    resourceIds.push(resourceRelatedProps.resourceId)
  }

  def.resourceIds = resourceIds
  def.resourceEditable = resourceRelatedProps.resourceEditable
}
