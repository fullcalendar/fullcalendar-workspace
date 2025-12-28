
export interface ScrollerInterface {
  x: number
  y: number
  scrollTo(options: { x?: number, y?: number }): void
  addScrollStartListener(handler: (isUser: boolean) => void): void
  removeScrollStartListener(handler: (isUser: boolean) => void): void
  addScrollEndListener(handler: (isUser: boolean) => void): void
  removeScrollEndListener(handler: (isUser: boolean) => void): void
}
