
export interface ScrollerInterface {
  x: number
  y: number
  scrollTo(options: { x?: number, y?: number }): void
  addScrollEndListener(handler: (isUser: boolean) => void): void
  removeScrollEndListener(handler: (isUser: boolean) => void): void
}
