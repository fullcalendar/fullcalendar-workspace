import { DateProfile, rangesEqual, DateRange, guid, CalendarContext } from '@fullcalendar/common'
import { ResourceSource } from '../structs/resource-source'
import { parseResourceSource } from '../structs/resource-source-parse'
import { getResourceSourceDef } from '../structs/resource-source-def'
import { ResourceAction } from './resource-action'

export function reduceResourceSource(
  source: ResourceSource<any> | null,
  action: ResourceAction | null,
  context: CalendarContext & { dateProfile: DateProfile },
): ResourceSource<any> {
  let { options, dateProfile } = context

  if (!source || !action) {
    return createSource(
      options.initialResources || options.resources,
      dateProfile.activeRange,
      options.refetchResourcesOnNavigate,
      context,
    )
  }

  switch (action.type) {
    case 'RESET_RESOURCE_SOURCE':
      return createSource(action.resourceSourceInput, dateProfile.activeRange, options.refetchResourcesOnNavigate, context)

    case 'PREV': // TODO: how do we track all actions that affect dateProfile :(
    case 'NEXT':
    case 'CHANGE_DATE':
    case 'CHANGE_VIEW_TYPE':
      return handleRangeChange(source, dateProfile.activeRange, options.refetchResourcesOnNavigate, context)

    case 'RECEIVE_RESOURCES':
    case 'RECEIVE_RESOURCE_ERROR':
      return receiveResponse(source, action.fetchId, action.fetchRange)

    case 'REFETCH_RESOURCES':
      return fetchSource(source, dateProfile.activeRange, context)

    default:
      return source
  }
}

function createSource(input, activeRange: DateRange, refetchResourcesOnNavigate, context: CalendarContext) {
  if (input) {
    let source = parseResourceSource(input)
    source = fetchSource(source, refetchResourcesOnNavigate ? activeRange : null, context)
    return source
  }

  return null
}

function handleRangeChange(
  source: ResourceSource<any>,
  activeRange: DateRange,
  refetchResourcesOnNavigate,
  context: CalendarContext,
): ResourceSource<any> {
  if (
    refetchResourcesOnNavigate &&
    !doesSourceIgnoreRange(source) &&
    (!source.fetchRange || !rangesEqual(source.fetchRange, activeRange))
  ) {
    return fetchSource(source, activeRange, context)
  }
  return source
}

function doesSourceIgnoreRange(source: ResourceSource<any>) {
  return Boolean(getResourceSourceDef(source.sourceDefId).ignoreRange)
}

function fetchSource(source: ResourceSource<any>, fetchRange: DateRange | null, context: CalendarContext): ResourceSource<any> {
  let sourceDef = getResourceSourceDef(source.sourceDefId)
  let fetchId = guid()

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

  return {
    ...source,
    isFetching: true,
    latestFetchId: fetchId,
  }
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
