import { Calendar, DateProfile, assignTo, rangesEqual, DateRange } from 'fullcalendar'
import { ResourceSource, parseResourceSource, getResourceSourceDef, doesSourceIgnoreRange } from '../structs/resource-source'
import { ResourceAction } from './resources'

export default function(
  source: ResourceSource | undefined,
  action: ResourceAction,
  dateProfile: DateProfile,
  calendar: Calendar
): ResourceSource | null {
  switch(action.type) {

    case 'INIT':
      return createInitialSource(calendar)

    case 'SET_DATE_PROFILE':
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

function createInitialSource(calendar: Calendar) {
  let input = calendar.opt('resources')

  if (input) {
    let source = parseResourceSource(input, calendar)

    if (!calendar.opt('refetchResourcesOnNavigate')) {
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

  return assignTo({}, source, {
    isFetching: true,
    latestFetchId: fetchId
  })
}

function receiveResponse(source: ResourceSource, fetchId: string, fetchRange: DateRange) {

  if (fetchId === source.latestFetchId) {
    return assignTo({}, source, {
      isFetching: false,
      fetchRange
    })
  }

  return source
}
