
export type VirtualizerItem<Entity> = {
  entity: Entity
}

export type VirtualizerItemPosition<Entity> = {
  item: VirtualizerItem<Entity>
  position: number | undefined
  size: number | undefined
  // TODO: give key as well?
}

export class Virtualizer<Entity> {
  private viewportSize = 0
  private scroll = 0

  constructor(
    private getEntityKey: (entity: Entity) => string,
    private requestRerender: () => void,
  ) {}

  handleViewportSize(size: number) {
    if (size !== this.viewportSize) {
      this.viewportSize = size
      this.requestRerender
      console.log('viewport size', size)
    }
  }

  handleScroll(scroll: number) {
    if (scroll !== this.scroll) {
      this.scroll = scroll
      console.log('scroll', scroll)
    }
  }

  process(
    items: VirtualizerItem<Entity>[],
    entityPositions: Map<string, number>,
    entitySizes: Map<string, number>,
  ): VirtualizerItemPosition<Entity>[] {
    return items.map((item) => {
      const key = this.getEntityKey(item.entity)
      return {
        item,
        position: entityPositions.get(key),
        size: entitySizes.get(key),
      }
    })
  }
}
