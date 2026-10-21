import { DateRange, CalendarContext, Effect } from '@fullcalendar/preact/protected-api'
import { ResourceSource } from '../resource-sources/resource-source'
import { getResourceSourceDef } from '../resource-sources/resource-source-defs'

export interface FetchResourceSourceEffect extends Effect {
  type: 'fetchResourceSource'
  resourceSource: ResourceSource<any> // as it was before the reduction marked it fetching
  fetchId: string
  range: DateRange | null
  context: CalendarContext
}

// runs a resource source's fetch. results come back as actions, as they always have
export function runResourceSourceFetch(effect: FetchResourceSourceEffect): void {
  let { resourceSource: source, fetchId, range: fetchRange, context } = effect
  let sourceDef = getResourceSourceDef(source.sourceDefId)

  sourceDef.fetch(
    {
      resourceSource: source,
      range: fetchRange,
      context,
    },
    (res) => {
      context.dispatch({
        type: 'RECEIVE_RESOURCES',
        fetchId,
        fetchRange,
        rawResources: res.rawResources,
      })
    },
    (error) => {
      context.dispatch({
        type: 'RECEIVE_RESOURCE_ERROR',
        fetchId,
        fetchRange,
        error,
      })
    },
  )
}
