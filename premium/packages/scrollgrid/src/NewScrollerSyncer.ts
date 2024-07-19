import { NewScrollerInterface, NewScrollerSyncerInterface } from "@fullcalendar/core/internal"

export class NewScrollerSyncer implements NewScrollerSyncerInterface {
  x: number
  y: number

  constructor(
    public horizontal = false,
  ) {
  }

  scrollTo(options: { x?: number, y?: number }): void {
  }

  // TODO: move to having this debounce, like scrollEnd
  addScrollListener(listener: () => void): void {
  }

  handleChildren(scrollers: NewScrollerInterface[]): void {
    // TODO
  }

  destroy() {
    // TODO
  }
}
