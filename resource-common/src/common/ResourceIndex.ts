import { Resource } from '../structs/resource'

export class ResourceIndex {
  indicesById: { [resourceId: string]: number }
  ids: string[]
  length: number

  constructor(resources: Resource[]) {
    let indicesById = {}
    let ids = []

    for (let i = 0; i < resources.length; i += 1) {
      let id = resources[i].id

      ids.push(id)
      indicesById[id] = i
    }

    this.ids = ids
    this.indicesById = indicesById
    this.length = resources.length
  }
}
