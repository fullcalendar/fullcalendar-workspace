import { DateRange, ReducerContext, refineProps, guid } from '@fullcalendar/core'
import { ResourceInput } from '../structs/resource'
import { ResourceFunc } from '../resource-sources/resource-func'

export type ResourceSourceError = { // TODO: converge with EventSourceError
  message: string
  xhr?: XMLHttpRequest
  [otherProp: string]: any
}

export type ResourceFetcher = (
  arg: {
    resourceSource: ResourceSource
    range: DateRange | null
    context: ReducerContext
  },
  success: (res: { rawResources: ResourceInput[], xhr?: XMLHttpRequest }) => void,
  failure: (error: ResourceSourceError) => void
) => void // what about Promise?

export interface ExtendedResourceSourceInput {
  id?: string

  // for array. TODO: move to resource-array
  resources?: ResourceInput[]

  // for json feed. TODO: move to resource-json-feed
  url?: string
  method?: string
  startParam?: string
  endParam?: string
  timeZoneParam?: string
  extraParams?: object | (() => object)

  // TODO: event props
  // TODO: success/failure
}

export type ResourceSourceInput =
  ResourceInput[] |
  ExtendedResourceSourceInput |
  ResourceFunc |
  string // url

export interface ResourceSource {
  _raw: any
  sourceId: string
  sourceDefId: number // one of the few IDs that's a NUMBER not a string
  meta: any
  publicId: string
  isFetching: boolean
  latestFetchId: string
  fetchRange: DateRange | null
}

export interface ResourceSourceDef {
  ignoreRange?: boolean
  parseMeta: (raw: ResourceSourceInput) => object | null
  fetch: ResourceFetcher
}

const RESOURCE_SOURCE_PROPS = {
  id: String
}

let defs: ResourceSourceDef[] = []

export function registerResourceSourceDef(def: ResourceSourceDef) {
  defs.push(def)
}

export function getResourceSourceDef(id: number): ResourceSourceDef {
  return defs[id]
}

export function doesSourceIgnoreRange(source: ResourceSource) {
  return Boolean(defs[source.sourceDefId].ignoreRange)
}

export function parseResourceSource(input: ResourceSourceInput): ResourceSource {
  for (let i = defs.length - 1; i >= 0; i--) { // later-added plugins take precedence
    let def = defs[i]
    let meta = def.parseMeta(input)

    if (meta) {
      let res = parseResourceSourceProps(
        (typeof input === 'object' && input) ? (input as ExtendedResourceSourceInput) : {},
        meta,
        i
      )

      res._raw = input
      return res
    }
  }

  return null
}

function parseResourceSourceProps(input: ExtendedResourceSourceInput, meta: object, sourceDefId: number): ResourceSource {
  let props = refineProps(input, RESOURCE_SOURCE_PROPS)

  props.sourceId = guid()
  props.sourceDefId = sourceDefId
  props.meta = meta
  props.publicId = props.id
  props.isFetching = false
  props.latestFetchId = ''
  props.fetchRange = null

  delete props.id

  return props as ResourceSource
}
