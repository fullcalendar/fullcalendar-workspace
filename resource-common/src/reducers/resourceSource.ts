import { DateProfile, rangesEqual, DateRange, guid, ReducerContext } from '@fullcalendar/core'
import { ResourceSource, parseResourceSource, getResourceSourceDef, doesSourceIgnoreRange } from '../structs/resource-source'
import { ResourceAction } from './resources'

export function reduceResourceSource(
  source: ResourceSource | undefined,
  action: ResourceAction,
  dateProfile: DateProfile,
  context: ReducerContext
): ResourceSource | null {
  let { options } = context

  switch (action.type) {
    case 'INIT':
      return createSource(options.resources, options.refetchResourcesOnNavigate, context)

    case 'RESET_RESOURCE_SOURCE':
      return createSource(action.resourceSourceInput, options.refetchResourcesOnNavigate, context, true)

    case 'PREV': // TODO: how do we track all actions that affect dateProfile :(
    case 'NEXT':
    case 'SET_DATE':
    case 'SET_VIEW_TYPE':
      return handleRange(source, dateProfile.activeRange, options.refetchResourcesOnNavigate, context)

    case 'RECEIVE_RESOURCES':
    case 'RECEIVE_RESOURCE_ERROR':
      return receiveResponse(source, action.fetchId, action.fetchRange)

    case 'REFETCH_RESOURCES':
      return fetchSource(source, dateProfile.activeRange, context)

    default:
      return source
  }
}


function createSource(input, refetchResourcesOnNavigate, context: ReducerContext, forceFetch?: boolean) {

  if (input) {
    let source = parseResourceSource(input)

    if (forceFetch || !refetchResourcesOnNavigate) { // because assumes handleRange will do it later
      source = fetchSource(source, null, context)
    }

    return source
  }

  return null
}


function handleRange(source: ResourceSource, activeRange: DateRange, refetchResourcesOnNavigate, context: ReducerContext): ResourceSource {
  if (
    refetchResourcesOnNavigate &&
    !doesSourceIgnoreRange(source) &&
    (!source.fetchRange || !rangesEqual(source.fetchRange, activeRange))
  ) {
    return fetchSource(source, activeRange, context)
  } else {
    return source
  }
}


function fetchSource(source: ResourceSource, fetchRange: DateRange | null, context: ReducerContext): ResourceSource {
  let sourceDef = getResourceSourceDef(source.sourceDefId)
  let fetchId = guid()

  sourceDef.fetch(
    {
      resourceSource: source,
      range: fetchRange,
      context
    },
    function(res) {
      context.dispatch({
        type: 'RECEIVE_RESOURCES',
        fetchId,
        fetchRange,
        rawResources: res.rawResources
      })
    },
    function(error) {
      context.dispatch({
        type: 'RECEIVE_RESOURCE_ERROR',
        fetchId,
        fetchRange,
        error
      })
    }
  )

  return {
    ...source,
    isFetching: true,
    latestFetchId: fetchId
  }
}


function receiveResponse(source: ResourceSource, fetchId: string, fetchRange: DateRange) {

  if (fetchId === source.latestFetchId) {
    return {
      ...source,
      isFetching: false,
      fetchRange
    }
  }

  return source
}
