import { DateProfile, rangesEqual, DateRange, guid, CalendarContext, Effect, ReduceEffects } from '@fullcalendar/preact/protected-api'
import { ResourceSource } from '../structs/resource-source'
import { parseResourceSource } from '../structs/resource-source-parse'
import { getResourceSourceDef } from '../structs/resource-source-def-all'
import { ResourceAction } from './resource-action'

export function reduceResourceSource(
  source: ResourceSource<any> | null,
  action: ResourceAction | null,
  context: CalendarContext & { dateProfile: DateProfile },
  effects: ReduceEffects,
): ResourceSource<any> {
  let { options, dateProfile } = context

  if (!source || !action) {
    return createSource(
      options.initialResources || options.resources,
      dateProfile.activeRange,
      options.refetchResourcesOnNavigate,
      context,
      effects,
    )
  }

  switch (action.type) {
    case 'RESET_RESOURCE_SOURCE':
      return createSource(action.resourceSourceInput, dateProfile.activeRange, options.refetchResourcesOnNavigate, context, effects)

    case 'PREV': // TODO: how do we track all actions that affect dateProfile :(
    case 'NEXT':
    case 'CHANGE_DATE':
    case 'CHANGE_VIEW_TYPE':
      return handleRangeChange(source, dateProfile.activeRange, options.refetchResourcesOnNavigate, context, effects)

    case 'RECEIVE_RESOURCES':
    case 'RECEIVE_RESOURCE_ERROR':
      return receiveResponse(source, action.fetchId, action.fetchRange)

    case 'REFETCH_RESOURCES':
      return fetchSource(source, dateProfile.activeRange, context, effects)

    default:
      return source
  }
}

function createSource(
  input,
  activeRange: DateRange,
  refetchResourcesOnNavigate,
  context: CalendarContext,
  effects: ReduceEffects,
) {
  if (input) {
    let source = parseResourceSource(input)
    source = fetchSource(source, refetchResourcesOnNavigate ? activeRange : null, context, effects)
    return source
  }

  return null
}

function handleRangeChange(
  source: ResourceSource<any>,
  activeRange: DateRange,
  refetchResourcesOnNavigate,
  context: CalendarContext,
  effects: ReduceEffects,
): ResourceSource<any> {
  if (
    refetchResourcesOnNavigate &&
    !doesSourceIgnoreRange(source) &&
    (!source.fetchRange || !rangesEqual(source.fetchRange, activeRange))
  ) {
    return fetchSource(source, activeRange, context, effects)
  }
  return source
}

function doesSourceIgnoreRange(source: ResourceSource<any>) {
  return Boolean(getResourceSourceDef(source.sourceDefId).ignoreRange)
}

export interface FetchResourceSourceEffect extends Effect {
  type: 'fetchResourceSource'
  resourceSource: ResourceSource<any> // as it was before the reduction marked it fetching
  fetchId: string
  range: DateRange | null
  context: CalendarContext
}

// allocate the fetch id, fetch (synchronous results queue right here), then mark it. see effects in core
function fetchSource(
  source: ResourceSource<any>,
  fetchRange: DateRange | null,
  context: CalendarContext,
  effects: ReduceEffects,
): ResourceSource<any> {
  let fetchId = guid()

  effects.run({
    type: 'fetchResourceSource',
    resourceSource: source,
    fetchId,
    range: fetchRange,
    context,
  } as FetchResourceSourceEffect)

  return {
    ...source,
    isFetching: true,
    latestFetchId: fetchId,
  }
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

function receiveResponse(source: ResourceSource<any>, fetchId: string, fetchRange: DateRange) {
  if (fetchId === source.latestFetchId) {
    return {
      ...source,
      isFetching: false,
      fetchRange,
    }
  }

  return source
}
