import { Component } from '@fullcalendar/core/preact'
import { Resource, Group, ParentNode, GroupNode, ResourceNode } from '@fullcalendar/resource/internal'

export type RowSyncerEntity = Resource | Group | GroupNode | ResourceNode // ahhhh

export interface RowSyncerOptions {
  rowHierarchy: ParentNode[]
  rowNodes: (ResourceNode | GroupNode)[]
  expandToHeight: number | string
}

/*
TODO: rename
*/
export class RowSyncer {
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

  update(options: RowSyncerOptions) {
    this.rowHierarchy = options.rowHierarchy
    this.rowNodes = options.rowNodes
    this.expandToHeight = options.expandToHeight
  }

  clearCell(component: Component): void {

  }

  updateCell(component: Component, entity: RowSyncerEntity, size: number | undefined) {

  }

  addSizeListener(entity: RowSyncerEntity, func: (size: number) => void) {

  }

  removeSizeListener(entity: RowSyncerEntity, func: (size: number) => void) {

  }

  addTotalSizeListener(func: (size: number) => void) {

  }

  removeTotalSizeListener(func: (size: number) => void) {

  }

  getPosition(entity: RowSyncerEntity): number {
    return 0
  }

  getSize(entity: RowSyncerEntity): number {
    return 0
  }

  positionToIndex(position: number): number {
    return 0
  }

  indexToRowKey(index: number): any {

  }
}
