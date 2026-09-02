import { Group, GenericNode, ResourceNode, GroupNode, createGroupId } from '../resource/common/resource-hierarchy'
import { Resource } from '../resource/structs/resource'
import { ResourceEntityExpansions } from '../resource/reducers/resourceEntityExpansions'

export interface ResourcePrintLayout {
  type: 'resource'
  entity: Resource
  resourceFields: any // !!!
  colGroups: Group[]

  isExpanded: boolean
  hasChildren: boolean
  indent: number
}

export interface GroupRowPrintLayout {
  type: 'group'
  entity: Group

  isExpanded: boolean
  hasChildren: boolean
  indent: number
}

export interface ResourcePrintColGroupCell {
  group: Group
  rowSpan: number
}

export type ResourcePrintColGroupCells = (ResourcePrintColGroupCell | null)[]

export interface ResourcePrintTableRow extends ResourcePrintLayout {
  colGroupCells: ResourcePrintColGroupCells
}

export type PrintLayout = ResourcePrintLayout | GroupRowPrintLayout
export type PrintTableRow = ResourcePrintTableRow | GroupRowPrintLayout

/*
TODO: test multiple levels of group-col nesting
*/
export function buildPrintLayouts(
  hierarchy: GenericNode[],
  hasNesting: boolean,
  expansions: ResourceEntityExpansions,
  expansionDefault: boolean,
): PrintLayout[] {
  const layouts: PrintLayout[] = []

  function processNodes(nodes: GenericNode[], indent: number, colGroups: Group[]): void {
    for (const node of nodes) {
      if ((node as ResourceNode).resourceFields) { // resource
        const isExpanded = expansions[(node as ResourceNode).entity.id] ?? expansionDefault
        const hasChildren = Boolean(node.children.length)

        layouts.push({
          type: 'resource',
          entity: (node as ResourceNode).entity,
          resourceFields: (node as ResourceNode).resourceFields,
          colGroups,
          isExpanded,
          hasChildren,
          indent,
        })

        processNodes(node.children, indent + 1, colGroups)

      } else if ((node as GroupNode).pooledHeight) { // column-group
        processNodes(
          node.children,
          indent,
          colGroups.concat((node as GroupNode).entity),
        )

      } else { // row-group (FYI, can't be within a column-group)
        const isExpanded = expansions[createGroupId((node as GroupNode).entity)] ?? expansionDefault
        const hasChildren = Boolean(node.children.length)

        layouts.push({
          type: 'group',
          entity: (node as GroupNode).entity,
          isExpanded,
          hasChildren,
          indent,
        })

        processNodes(node.children, indent + 1, colGroups)
      }
    }
  }

  processNodes(hierarchy, hasNesting ? 1 : 0, [])
  return layouts
}

// Computes real table row spans after print truncation so spans never extend past a rendered row.
export function buildPrintTableRows(
  layouts: PrintLayout[],
  groupColCnt: number,
): PrintTableRow[] {
  const rows: PrintTableRow[] = layouts.map((layout) => layout.type === 'resource' ? {
    ...layout,
    colGroupCells: Array.from({ length: groupColCnt }, () => null),
  } : layout)

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]

    if (row.type !== 'resource') {
      continue
    }

    for (let colIndex = 0; colIndex < groupColCnt; colIndex += 1) {
      const group = row.colGroups[colIndex]
      const prevRow = rows[rowIndex - 1]

      if (
        !group ||
        (prevRow?.type === 'resource' && prevRow.colGroups[colIndex] === group)
      ) {
        continue
      }

      let rowSpan = 1

      while (rowIndex + rowSpan < rows.length) {
        const nextRow = rows[rowIndex + rowSpan]

        if (nextRow.type !== 'resource' || nextRow.colGroups[colIndex] !== group) {
          break
        }

        rowSpan += 1
      }

      row.colGroupCells[colIndex] = {
        group,
        rowSpan,
      }
    }
  }

  return rows
}
