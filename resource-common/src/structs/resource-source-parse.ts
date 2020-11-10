import { guid, identity, Identity, RefinedOptionsFromRefiners, refineProps, RawOptionsFromRefiners, Dictionary } from '@fullcalendar/common'
import { ResourceInput } from './resource'
import { ResourceFunc } from '../resource-sources/resource-func'
import { ResourceSource } from './resource-source'
import { getResourceSourceDefs } from './resource-source-def'

// TODO: make this a plugin-able parser
// TODO: success/failure
export const RESOURCE_SOURCE_REFINERS = {
  id: String,

  // for array. TODO: move to resource-array
  resources: identity as Identity<ResourceInput[] | ResourceFunc>,

  // for json feed. TODO: move to resource-json-feed
  url: String,
  method: String,
  startParam: String,
  endParam: String,
  timeZoneParam: String,
  extraParams: identity as Identity<Dictionary | (() => Dictionary)>,
}

export type ResourceSourceInputObject = RawOptionsFromRefiners<typeof RESOURCE_SOURCE_REFINERS>
export type ResourceSourceRefined = RefinedOptionsFromRefiners<typeof RESOURCE_SOURCE_REFINERS>

export type ResourceSourceInput =
  ResourceSourceInputObject |
  ResourceInput[] |
  ResourceFunc |
  string // url

export function parseResourceSource(input: ResourceSourceInput): ResourceSource<any> {
  let inputObj: ResourceSourceInputObject

  if (typeof input === 'string') {
    inputObj = { url: input }
  } else if (typeof input === 'function' || Array.isArray(input)) {
    inputObj = { resources: input }
  } else if (typeof input === 'object' && input) { // non-null object
    inputObj = input
  }

  if (inputObj) {
    let { refined, extra } = refineProps(inputObj, RESOURCE_SOURCE_REFINERS)

    warnUnknownProps(extra)

    let metaRes = buildResourceSourceMeta(refined)

    if (metaRes) {
      return {
        _raw: input,
        sourceId: guid(),
        sourceDefId: metaRes.sourceDefId,
        meta: metaRes.meta,
        publicId: refined.id || '',
        isFetching: false,
        latestFetchId: '',
        fetchRange: null,
      }
    }
  }

  return null
}

function buildResourceSourceMeta(refined: ResourceSourceRefined) {
  let defs = getResourceSourceDefs()

  for (let i = defs.length - 1; i >= 0; i -= 1) { // later-added plugins take precedence
    let def = defs[i]
    let meta = def.parseMeta(refined)

    if (meta) {
      return { meta, sourceDefId: i }
    }
  }

  return null
}

function warnUnknownProps(props) {
  for (let propName in props) {
    console.warn(`Unknown resource prop '${propName}'`)
  }
}
