import { ResourceFetcher } from './resource-source'
import { ResourceSourceRefined } from './resource-source-parse'

export interface ResourceSourceDef<ResourceSourceMeta> {
  ignoreRange?: boolean
  parseMeta: (refined: ResourceSourceRefined) => ResourceSourceMeta | null
  fetch: ResourceFetcher<ResourceSourceMeta>
}

let defs: ResourceSourceDef<any>[] = [] // TODO: use plugin system

export function registerResourceSourceDef<ResourceSourceMeta>(def: ResourceSourceDef<ResourceSourceMeta>) {
  defs.push(def)
}

export function getResourceSourceDef(id: number): ResourceSourceDef<any> {
  return defs[id]
}

export function getResourceSourceDefs(): ResourceSourceDef<any>[] {
  return defs
}
