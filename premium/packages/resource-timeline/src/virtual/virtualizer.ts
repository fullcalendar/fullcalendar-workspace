
export type VirtualizerItem<Entity> = {
  entity: Entity
}

export type VirtualizerItemPosition<Entity> = {
  item: VirtualizerItem<Entity>
  position: number | undefined
  size: number | undefined
}

export class Virtualizer<Entity> {
  constructor(
    private getEntityKey: (entity: Entity) => string,
    private requestRerender: () => void,
  ) {}

  handleViewportSize(size: number) {
    this.requestRerender
    console.log('viewport size', size)
  }

  handleScroll(scroll: number) {
    console.log('scroll', scroll)
  }

  process(
    items: VirtualizerItem<Entity>[],
    entityPositions: Map<string, number>,
    entitySizes: Map<string, number>,
  ): [
    itemPositions: VirtualizerItemPosition<Entity>[],
    scrollSize: number,
  ] {
    const itemPositions = items.map((item) => {
      const key = this.getEntityKey(item.entity)
      return {
        item,
        position: entityPositions.get(key),
        size: entitySizes.get(key),
      }
    })
    const len = itemPositions.length
    return [
      itemPositions,
      len ? itemPositions[len - 1].position + itemPositions[len - 1].size : 0
    ]
  }
}
