import { ScrollerInterface } from "./ScrollerInterface.js";

export interface ScrollerSyncerClass {
  new(horizontal?: boolean): ScrollerSyncerInterface
}

export interface ScrollerSyncerInterface extends ScrollerInterface {
  handleChildren(scrollers: ScrollerInterface[]): void
  destroy(): void
  addScrollListener(handler: (isUser: boolean, scroll: number) => void): void
  removeScrollListener(handler: (isUser: boolean, scroll: number) => void): void
}
