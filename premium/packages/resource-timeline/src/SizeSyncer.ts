import { Component } from '@fullcalendar/core/preact'
import { Resource, Group, ParentNode, GroupNode, ResourceNode } from '@fullcalendar/resource/internal'

export type SizeSyncerEntity = // ahhhh
  Resource | Group |
  GroupNode | ResourceNode |
  { children?: SizeSyncerEntity } |
  number |
  string

export interface SizeSyncerOptions {
  rowHierarchy: ParentNode[]
  rowNodes: (ResourceNode | GroupNode)[]
}

export class SizeSyncer {
  private rowHierarchy: ParentNode[]
  private rowNodes: (ResourceNode | GroupNode)[]
  private expandToHeight: number | undefined

  setOptions(options: SizeSyncerOptions) {
    this.rowHierarchy = options.rowHierarchy
    this.rowNodes = options.rowNodes
  }

  release(expandToHeight?: number) {
    this.expandToHeight = expandToHeight

    console.log(
      this.rowHierarchy,
      this.rowNodes,
      this.expandToHeight,
    )
  }

  clearCell(component: Component): void {

  }

  updateCell(component: Component, entity: SizeSyncerEntity, size: number | undefined) {

  }

  addSizeListener(entity: SizeSyncerEntity, func: (size: number) => void) {

  }

  removeSizeListener(entity: SizeSyncerEntity, func: (size: number) => void) {

  }

  addTotalSizeListener(func: (size: number) => void) {

  }

  removeTotalSizeListener(func: (size: number) => void) {

  }

  getPosition(entity: SizeSyncerEntity): number {
    return 0
  }

  getSize(entity: SizeSyncerEntity): number {
    return 0
  }

  positionToIndex(position: number): number {
    return 0
  }

  indexToEntity(index: number): SizeSyncerEntity {
    return null as any
  }
}
