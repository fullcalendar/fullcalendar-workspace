
export type ItemPosition<Item> = {
  item: Item
  key: string
  index: number
  start: number | undefined
  size: number | undefined
}

export class Virtualizer<Item> {
  // left exposed so they can be prepopulated :(
  viewportSize = 0
  scroll = 0

  private items: Item[] = []
  private itemPositions: ItemPosition<Item>[]

  constructor(
    private getItemKey: (item: Item) => string,
    private getItemStart: undefined | ((key: string, index: number, item: Item) => number),
    private getItemSize: (key: string, index: number, item: Item) => number,
    private requestRerender: () => void,
    private overscan = 1,
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
    const { scroll, viewportSize, getItemKey, getItemStart, getItemSize, overscan } = this
    const count = items.length
    let itemPositions: ItemPosition<Item>[] = []
    let index = 0
    let runningStart = 0

    while (index < count) {
      const item = items[index]
      const key = getItemKey(item)
      const start = getItemStart ? getItemStart(key, index, item) : runningStart
      const size = getItemSize(key, index, item)
      if (start + size > scroll) {
        break
      }
      index++
      runningStart += size
    }

    // back up for underscan
    const startIndex = Math.max(index - overscan, 0)
    while (index > startIndex) {
      const item = items[index - 1]
      const key = getItemKey(item)
      const size = getItemSize(key, index - 1, item)
      index--
      runningStart -= size
    }

    while (index < count) {
      const item = items[index]
      const key = getItemKey(item)
      const start = getItemStart ? getItemStart(key, index, item) : runningStart
      const size = getItemSize(key, index, item)
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
      runningStart += size
    }

    const endIndex = Math.min(index + overscan, count)

    // overshoot for overscan
    while (index < endIndex) {
      const item = items[index]
      const key = getItemKey(item)
      const start = getItemStart ? getItemStart(key, index, item) : runningStart
      const size = getItemSize(key, index, item)
      itemPositions.push({
        item,
        key,
        index,
        start,
        size,
      })
      index++
      runningStart += size
    }

    return itemPositions
  }
}

export function computeShift(itemPositions: ItemPosition<unknown>[]): [
  start: number,
  end: number,
  firstIndex: number,
] | undefined {
  const count = itemPositions.length
  if (count) {
    const start = itemPositions[0].start
    const end = itemPositions[count - 1].start + itemPositions[count - 1].size
    return [start, end, itemPositions[0].index]
  }
}
