import { Calendar, DateProfile, rangesEqual, DateRange } from '@fullcalendar/core'
import { ResourceSource, parseResourceSource, getResourceSourceDef, doesSourceIgnoreRange } from '../structs/resource-source'
import { ResourceAction } from './resources'

export default function(
  source: ResourceSource | undefined,
  action: ResourceAction,
  dateProfile: DateProfile,
  calendar: Calendar
): ResourceSource | null {
  switch (action.type) {

    case 'INIT':
      return createSource(calendar.opt('resources'), calendar)

    case 'RESET_RESOURCE_SOURCE':
      return createSource(action.resourceSourceInput, calendar, true)

    case 'PREV': // TODO: how do we track all actions that affect dateProfile :(
    case 'NEXT':
    case 'SET_DATE':
    case 'SET_VIEW_TYPE':
      return handleRange(source, dateProfile.activeRange, calendar)

    case 'RECEIVE_RESOURCES':
    case 'RECEIVE_RESOURCE_ERROR':
      return receiveResponse(source, action.fetchId, action.fetchRange)

    case 'REFETCH_RESOURCES':
      return fetchSource(source, dateProfile.activeRange, calendar)

    default:
      return source
  }
}

let uid = 0

function createSource(input, calendar: Calendar, forceFetch?: boolean) {

  if (input) {
    let source = parseResourceSource(input)

    if (forceFetch || !calendar.opt('refetchResourcesOnNavigate')) { // because assumes handleRange will do it later
      source = fetchSource(source, null, calendar)
    }

    return source
  }

  return null
}

function handleRange(source: ResourceSource, activeRange: DateRange, calendar: Calendar): ResourceSource {
  if (
    calendar.opt('refetchResourcesOnNavigate') &&
    !doesSourceIgnoreRange(source) &&
    (!source.fetchRange || !rangesEqual(source.fetchRange, activeRange))
  ) {
    return fetchSource(source, activeRange, calendar)
  } else {
    return source
  }
}

function fetchSource(source: ResourceSource, fetchRange: DateRange | null, calendar: Calendar): ResourceSource {
  let sourceDef = getResourceSourceDef(source.sourceDefId)
  let fetchId = String(uid++)

  sourceDef.fetch(
    {
      resourceSource: source,
      calendar,
      range: fetchRange
    },
    function(res) {

      // HACK
      // do before calling dispatch in case dispatch renders synchronously
      calendar.afterSizingTriggers._resourcesRendered = [ null ] // fire once

      calendar.dispatch({
        type: 'RECEIVE_RESOURCES',
        fetchId,
        fetchRange,
        rawResources: res.rawResources
      })
    },
    function(error) {
      calendar.dispatch({
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
