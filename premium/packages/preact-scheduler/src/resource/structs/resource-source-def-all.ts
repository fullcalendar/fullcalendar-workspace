import { ResourceSourceDef } from './resource-source-def'
import { arrayResourceSource } from '../resource-sources/resource-array'
import { jsonFeedResourceSource } from '../resource-sources/resource-json-feed'
import { funcResourceSource } from '../resource-sources/resource-func'

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
