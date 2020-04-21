import { ResourceFetcher } from './resource-source'


export interface ResourceSourceDef {
  ignoreRange?: boolean
  parseMeta: (raw: any) => object | null
  fetch: ResourceFetcher
}

let defs: ResourceSourceDef[] = [] // TODO: use plugin system

export function registerResourceSourceDef(def: ResourceSourceDef) {
  defs.push(def)
}

export function getResourceSourceDef(id: number): ResourceSourceDef {
  return defs[id]
}

export function getResourceSourceDefs(): ResourceSourceDef[] {
  return defs
}
