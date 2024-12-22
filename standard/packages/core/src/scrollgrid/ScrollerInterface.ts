
export interface ScrollerInterface {
  x: number
  y: number
  scrollTo(options: { x?: number, y?: number }): void
  addScrollEndListener(handler: (arg: { x: number, y: number, isUser: boolean }) => void): void
  removeScrollEndListener(handler: (arg: { x: number, y: number, isUser: boolean }) => void): void
}
