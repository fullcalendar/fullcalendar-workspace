import { ResourceSourceDef } from './resource-source-def'
import { arrayResourceSource } from './array-resource-source'
import { jsonFeedResourceSource } from './json-feed-resource-source'
import { funcResourceSource } from './func-resource-source'

let defs: ResourceSourceDef<any>[] = [
  arrayResourceSource,
  jsonFeedResourceSource,
  funcResourceSource,
]

export function getResourceSourceDef(id: number): ResourceSourceDef<any> {
  return defs[id]
}

export function getResourceSourceDefs(): ResourceSourceDef<any>[] {
  return defs
}
