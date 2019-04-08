import { DateRange, Calendar, requestJson } from '@fullcalendar/core'
import { registerResourceSourceDef, ResourceSourceInput, ExtendedResourceSourceInput } from '../structs/resource-source'
import { __assign } from 'tslib'

interface JsonFeedMeta {
  url: string
  method: string
  extraParams?: any
}

registerResourceSourceDef({

  parseMeta(raw: ResourceSourceInput): JsonFeedMeta | null {
    if (typeof raw === 'string') {
      raw = { url: raw }
    } else if (!raw || typeof raw !== 'object' || !(raw as ExtendedResourceSourceInput).url) {
      return null
    }

    return {
      url: (raw as ExtendedResourceSourceInput).url,
      method: ((raw as ExtendedResourceSourceInput).method || 'GET').toUpperCase(),
      extraParams: (raw as ExtendedResourceSourceInput).extraParams
    }
  },

  fetch(arg, successCallback, failureCallback) {
    let meta: JsonFeedMeta = arg.resourceSource.meta
    let requestParams = buildRequestParams(meta, arg.range, arg.calendar)

    requestJson(meta.method, meta.url, requestParams, function(rawResources, xhr) {
      successCallback({ rawResources, xhr })
    }, function(message, xhr) {
      failureCallback({ message, xhr })
    })
  }

})

// TODO: somehow consolidate with event json feed
function buildRequestParams(meta: JsonFeedMeta, range: DateRange | null, calendar: Calendar) {
  const dateEnv = calendar.dateEnv
  let startParam
  let endParam
  let timeZoneParam
  let customRequestParams
  let params = {}

  if (range) {
    // startParam = meta.startParam
    // if (startParam == null) {
    startParam = calendar.opt('startParam')
    // }

    // endParam = meta.endParam
    // if (endParam == null) {
    endParam = calendar.opt('endParam')
    // }

    // timeZoneParam = meta.timeZoneParam
    // if (timeZoneParam == null) {
    timeZoneParam = calendar.opt('timeZoneParam')
    // }

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
