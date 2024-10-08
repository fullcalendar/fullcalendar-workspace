
export interface ScrollerInterface {
  x: number
  y: number
  scrollTo(options: { x?: number, y?: number }): void
  addScrollEndListener(handler: (x: number, y: number) => void): void
  removeScrollEndListener(handler: (x: number, y: number) => void): void
}
