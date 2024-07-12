import { OrderSpec } from '@fullcalendar/core/internal'
import { Resource, ResourceHash } from '../structs/resource.js'
import { GroupSpec } from './resource-spec.js'
import { ResourceApi } from '../public-types.js'

export interface Group {
  spec: GroupSpec
  value: any
}

export interface ParentNode<Entity> {
  entity: Entity
  children: ParentNode<Entity>[]
}

export function buildResourceHierarchy(
  resourceStore: ResourceHash,
  groupSpecs: GroupSpec[],
  orderSpecs: OrderSpec<ResourceApi>[],
): ParentNode<Resource | Group>[] {
  return null as any
}

export function isEntityGroup(entity: Resource | Group): entity is Group {
  return Boolean((entity as Group).spec)
}

export function createGroupId(group: Group): string { // TODO: kill
  return group.spec.field + ':' + group.value
}
