import { ResourceFetcher } from './resource-source'
import { ResourceSourceRefined } from './resource-source-parse'

export interface ResourceSourceDef<ResourceSourceMeta> {
  ignoreRange?: boolean
  parseMeta: (refined: ResourceSourceRefined) => ResourceSourceMeta | null
  fetch: ResourceFetcher<ResourceSourceMeta>
}
