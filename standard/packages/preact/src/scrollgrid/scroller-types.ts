// a scroll container's API, and a syncer's, which keeps several scrolled together


export interface ScrollerInterface {
  x: number
  y: number
  scrollTo(options: { x?: number, y?: number }): void
  addScrollStartListener(handler: () => void): void
  removeScrollStartListener(handler: () => void): void
  addScrollEndListener(handler: (isDevice: boolean) => void): void
  removeScrollEndListener(handler: (isDevice: boolean) => void): void
}

export interface ScrollerSyncerClass {
  new(horizontal?: boolean): ScrollerSyncerInterface
}

export interface ScrollerSyncerInterface extends ScrollerInterface {
  handleChildren(scrollers: ScrollerInterface[]): void
  destroy(): void
  addScrollStartListener(handler: (isDevice: boolean) => void): void
  removeScrollStartListener(handler: (isDevice: boolean) => void): void
  addScrollListener(handler: (isDevice: boolean, scroll: number) => void): void
  removeScrollListener(handler: (isDevice: boolean, scroll: number) => void): void
}
