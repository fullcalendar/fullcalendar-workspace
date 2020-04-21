import { DateRange, ReducerContext, requestJson } from '@fullcalendar/core'
import { registerResourceSourceDef } from '../structs/resource-source-def'
import { __assign } from 'tslib'

interface JsonFeedMeta {
  url: string
  method: string
  startParam?: string
  endParam?: string
  timeZoneParam?: string
  extraParams?: any
}

registerResourceSourceDef({

  parseMeta(raw: any): JsonFeedMeta | null {
    if (typeof raw === 'string') {
      raw = { url: raw }
    } else if (!raw || typeof raw !== 'object' || !raw.url) {
      return null
    }

    return {
      url: raw.url,
      method: (raw.method || 'GET').toUpperCase(),
      extraParams: raw.extraParams
    }
  },

  fetch(arg, successCallback, failureCallback) {
    let meta: JsonFeedMeta = arg.resourceSource.meta
    let requestParams = buildRequestParams(meta, arg.range, arg.context)

    requestJson(meta.method, meta.url, requestParams, function(rawResources, xhr) {
      successCallback({ rawResources, xhr })
    }, function(message, xhr) {
      failureCallback({ message, xhr })
    })
  }

})

// TODO: somehow consolidate with event json feed
function buildRequestParams(meta: JsonFeedMeta, range: DateRange | null, context: ReducerContext) {
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

  __assign(params, customRequestParams)

  return params
}
