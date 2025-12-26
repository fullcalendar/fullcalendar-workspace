
export type VirtualizerItem<Entity> = {
  entity: Entity
}

export type VirtualizerItemPosition<Entity> = {
  item: VirtualizerItem<Entity>
  position: number | undefined
  size: number | undefined
}

/*
TODO: needs ability to rerender component
*/
export class Virtualizer<Entity> {
  constructor(
    private getEntityKey: (entity: Entity) => string
  ) {}

  handleViewportSize(size: number) {
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
