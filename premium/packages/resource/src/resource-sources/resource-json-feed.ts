import { DateRange, CalendarContext, requestJson, Dictionary } from '@fullcalendar/core/internal'
import { ResourceInput } from '../public-types.js'
import { registerResourceSourceDef } from '../structs/resource-source-def.js'
import { ResourceSourceRefined } from '../structs/resource-source-parse.js'

interface JsonFeedMeta {
  url: string
  method: string
  startParam?: string
  endParam?: string
  timeZoneParam?: string
  extraParams?: Dictionary | (() => Dictionary)
}

registerResourceSourceDef<JsonFeedMeta>({

  parseMeta(refined: ResourceSourceRefined) {
    if (refined.url) {
      return {
        url: refined.url,
        method: (refined.method || 'GET').toUpperCase(),
        extraParams: refined.extraParams,
      }
    }
    return null
  },

  fetch(arg, successCallback, errorCallback) {
    const meta = arg.resourceSource.meta
    const requestParams = buildRequestParams(meta, arg.range, arg.context)

    requestJson(
      meta.method,
      meta.url,
      requestParams,
    ).then(
      ([rawResources, response]: [ResourceInput[], Response]) => {
        successCallback({ rawResources, response })
      },
      errorCallback,
    )
  },

})

// TODO: somehow consolidate with event json feed
function buildRequestParams(meta: JsonFeedMeta, range: DateRange | null, context: CalendarContext) {
  let { dateEnv, options } = context
  let startParam
  let endParam
  let timeZoneParam
  let customRequestParams
  let params = {}

  if (range) {
    startParam = meta.startParam
    if (startParam == null) {
      startParam = options.startParam
    }

    endParam = meta.endParam
    if (endParam == null) {
      endParam = options.endParam
    }

    timeZoneParam = meta.timeZoneParam
    if (timeZoneParam == null) {
      timeZoneParam = options.timeZoneParam
    }

    params[startParam] = dateEnv.formatIso(range.start)
    params[endParam] = dateEnv.formatIso(range.end)

    if (dateEnv.timeZone !== 'local') {
      params[timeZoneParam] = dateEnv.timeZone
    }
  }

  // retrieve any outbound GET/POST data from the options
  if (typeof meta.extraParams === 'function') {
    // supplied as a function that returns a key/value object
    customRequestParams = meta.extraParams()
  } else {
    // probably supplied as a straight key/value object
    customRequestParams = meta.extraParams || {}
  }

  Object.assign(params, customRequestParams)

  return params
}
