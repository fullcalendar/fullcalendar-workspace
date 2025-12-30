
export type ItemPosition<Item> = {
  item: Item
  key: string
  index: number
  start: number | undefined
  size: number | undefined
}

const overscan = 1

export class Virtualizer<Item> {
  private viewportSize = 0
  private scroll = 0
  private items: Item[] = []
  private itemPositions: ItemPosition<Item>[]

  constructor(
    private getItemKey: (item: Item) => string,
    private getItemStart: (key: string) => number,
    private getItemSize: (key: string) => number,
    private requestRerender: () => void,
  ) {}

  computePositions(items: Item[], forcedScroll?: number): ItemPosition<Item>[] {
    this.items = items
    if (forcedScroll !== undefined) {
      this.scroll = forcedScroll
    }
    if (!this.viewportSize) {
      return []
    }
    return (
      this.itemPositions = this.computePositionsInRange(items)
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

  private _handleViewportChange() {
    if (this.itemPositions) {
      const testItemPositions = this.computePositionsInRange(this.items)
      if (
        testItemPositions.length !== this.itemPositions.length || (
          testItemPositions.length &&
          testItemPositions[0].index !== this.itemPositions[0].index
        )
      ) {
        this.requestRerender()
      }
    }
  }

  private computePositionsInRange(items: Item[]): ItemPosition<Item>[] {
    const { scroll, viewportSize } = this
    const count = items.length
    let itemPositions: ItemPosition<Item>[] = []
    let index = 0

    while (index < count) {
      const item = items[index]
      const key = this.getItemKey(item)
      const start = this.getItemStart(key)
      const size = this.getItemSize(key)
      if (start + size > scroll) {
        break
      }
      index++
    }

    index = Math.max(index - overscan, 0)

    while (index < count) {
      const item = items[index]
      const key = this.getItemKey(item)
      const start = this.getItemStart(key)
      const size = this.getItemSize(key)
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
      const key = this.getItemKey(item)
      const start = this.getItemStart(key)
      const size = this.getItemSize(key)
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

export function computeShift(itemPositions: ItemPosition<unknown>[]): [
  start: number,
  end: number,
  firstIndex: number,
] {
  const count = itemPositions.length
  if (!count) {
    return [0, 0, 0]
  }
  const start = itemPositions[0].start
  const end = itemPositions[count - 1].start + itemPositions[count - 1].size
  return [start, end, itemPositions[0].index]
}
