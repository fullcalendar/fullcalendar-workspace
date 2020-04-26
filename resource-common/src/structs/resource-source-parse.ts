import { refineProps, guid } from '@fullcalendar/common'
import { ResourceInput } from '../structs/resource'
import { ResourceFunc } from '../resource-sources/resource-func'
import { ResourceSource } from './resource-source'
import { getResourceSourceDefs } from './resource-source-def'


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


const RESOURCE_SOURCE_PROPS = {
  id: String
}

export function parseResourceSource(input: ResourceSourceInput): ResourceSource {
  let defs = getResourceSourceDefs()

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
