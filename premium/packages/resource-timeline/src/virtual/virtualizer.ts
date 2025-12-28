
export type VirtualizerItem<Entity> = {
  entity: Entity
}

export type VirtualizerItemPosition<Entity> = {
  item: VirtualizerItem<Entity>
  key: string
  index: number
  start: number | undefined
  size: number | undefined
}

const overscan = 1

export class Virtualizer<Entity> {
  private viewportSize = 0
  private scroll = 0
  private items: VirtualizerItem<Entity>[] = []
  private entityStarts: Map<string, number>
  private entitySizes: Map<string, number>
  private itemPositionsInRange: VirtualizerItemPosition<Entity>[]

  constructor(
    private getEntityKey: (entity: Entity) => string,
    private requestRerender: () => void,
  ) {}

  process(
    items: VirtualizerItem<Entity>[],
    entityStarts: Map<string, number>,
    entitySizes: Map<string, number>,
    forcedScroll?: number,
  ): VirtualizerItemPosition<Entity>[] {
    this.items = items
    this.entityStarts = entityStarts
    this.entitySizes = entitySizes
    if (forcedScroll !== undefined) {
      this.scroll = forcedScroll
    }
    if (!this.viewportSize) {
      return []
    }
    return (
      this.itemPositionsInRange = this.computeItemPositionsInRange(items)
    )
  }

  handleViewportSize(size: number) {
    if (size !== this.viewportSize) {
      this.viewportSize = size
      this._handleViewportChange()
    }
  }

  handleScroll(scroll: number) {
    if (scroll !== this.scroll) {
      this.scroll = scroll
      this._handleViewportChange()
    }
  }

  _handleViewportChange() {
    if (this.itemPositionsInRange) {
      const testItemPositions = this.computeItemPositionsInRange(this.items)
      if (
        testItemPositions.length !== this.itemPositionsInRange.length || (
          testItemPositions.length &&
          testItemPositions[0].index !== this.itemPositionsInRange[0].index
        )
      ) {
        this.requestRerender()
      }
    }
  }

  computeItemPositionsInRange(items: VirtualizerItem<Entity>[]) {
    const { scroll, viewportSize, entityStarts, entitySizes } = this
    const count = items.length
    let itemPositions: VirtualizerItemPosition<Entity>[] = []
    let index = 0

    while (index < count) {
      const item = items[index]
      const key = this.getEntityKey(item.entity)
      const position = entityStarts.get(key)
      const size = entitySizes.get(key)
      if (position + size > scroll) {
        break
      }
      index++
    }

    index = Math.max(index - overscan, 0)

    while (index < count) {
      const item = items[index]
      const key = this.getEntityKey(item.entity)
      const start = entityStarts.get(key)
      const size = entitySizes.get(key)
      if (start >= scroll + viewportSize) {
        break
      }
      itemPositions.push({
        item,
        key,
        index,
        start,
        size,
      })
      index++
    }

    const indexEnd = Math.min(index + overscan, count)

    while (index < indexEnd) {
      const item = items[index]
      const key = this.getEntityKey(item.entity)
      const start = entityStarts.get(key)
      const size = entitySizes.get(key)
      itemPositions.push({
        item,
        key,
        index,
        start,
        size,
      })
      index++
    }

    return itemPositions
  }
}
