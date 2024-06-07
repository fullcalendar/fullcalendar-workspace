import { GroupNode, ResourceNode } from '@fullcalendar/resource/internal'
import { RowSyncer } from './RowSyncer.js'

export const resourcePrefix = 'resource:'
export const groupPrefix = 'group:'

export function assignOrderedRowKeys(
  rowSyncer: RowSyncer,
  rowNodes: (GroupNode | ResourceNode)[],
): void {
  const keys: string[] = []

  for (const rowNode of rowNodes) {
    if ((rowNode as GroupNode).group) {
      keys.push(
        (rowNode as GroupNode).group
          ? groupPrefix + (rowNode as GroupNode).group.value
          : resourcePrefix + (rowNode as ResourceNode).resource.id
      )
    }
  }

  rowSyncer.orderedKeys = keys
}
