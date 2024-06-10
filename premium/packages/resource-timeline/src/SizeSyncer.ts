import { Component } from '@fullcalendar/core/preact'
import { Resource, Group, ParentNode, GroupNode, ResourceNode } from '@fullcalendar/resource/internal'

export type SizeSyncerEntity = Resource | Group | GroupNode | ResourceNode // ahhhh

export interface SizeSyncerOptions {
  rowHierarchy: ParentNode[]
  rowNodes: (ResourceNode | GroupNode)[]
  expandToHeight: number | string
}

export class SizeSyncer {
  private rowHierarchy: ParentNode[]
  private rowNodes: (ResourceNode | GroupNode)[]
  private expandToHeight: number | string

  preupdate() {
    console.log(
      this.rowHierarchy,
      this.rowNodes,
      this.expandToHeight,
    )
  }

  update(options: SizeSyncerOptions) {
    this.rowHierarchy = options.rowHierarchy
    this.rowNodes = options.rowNodes
    this.expandToHeight = options.expandToHeight
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
