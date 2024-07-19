
export interface NewScrollerInterface {
  x: number
  y: number
  scrollTo(options: { x?: number, y?: number }): void
  addScrollListener(handler: () => void): void
}
