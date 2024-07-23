
export interface ScrollerInterface {
  x: number
  y: number
  scrollTo(options: { x?: number, y?: number }): void
  addScrollListener(handler: () => void): void
}
